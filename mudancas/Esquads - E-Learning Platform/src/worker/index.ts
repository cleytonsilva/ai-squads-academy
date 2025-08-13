import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import {
  authMiddleware,
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import OpenAI from "openai";
import {
  CreateUserSchema,
  CreateCourseSchema,
  CreateBadgeSchema,
  CreateCertificateSchema,
  CreateChallengeSchema,
  GenerateCourseRequest,
} from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Initialize OpenAI client
function getOpenAIClient(apiKey: string) {
  return new OpenAI({
    apiKey: apiKey,
  });
}

// Authentication routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();
  const code = body.code;

  if (!code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const mochaUser = c.get("user");
  
  if (!mochaUser) {
    return c.json({ error: "User not found" }, 401);
  }
  
  // Check if user exists in our database
  const existingUser = await c.env.DB.prepare(
    "SELECT * FROM users WHERE mocha_user_id = ?"
  ).bind(mochaUser.id).first();

  if (!existingUser) {
    // Create user in our database
    const result = await c.env.DB.prepare(`
      INSERT INTO users (mocha_user_id, email, name, role, subscription_level)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      mochaUser.id,
      mochaUser.email,
      mochaUser.google_user_data.name || mochaUser.email,
      'admin', // Default to admin for now
      'pro'
    ).run();

    const newUser = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json(newUser);
  }

  return c.json(existingUser);
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Dashboard stats
app.get("/api/dashboard/stats", authMiddleware, async (c) => {
  const [users, courses, badges, certificates, challenges] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM courses").first(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM badges WHERE is_active = 1").first(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM certificates WHERE is_active = 1").first(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM challenges WHERE is_active = 1").first(),
  ]);

  const stats = {
    total_users: users?.count || 0,
    total_courses: courses?.count || 0,
    total_badges: badges?.count || 0,
    total_certificates: certificates?.count || 0,
    active_challenges: challenges?.count || 0,
    recent_enrollments: 0, // TODO: Implement this
  };

  return c.json(stats);
});

// AI Course Generation
app.post("/api/courses/generate", authMiddleware, zValidator("json", GenerateCourseRequest), async (c) => {
  const { title, description, target_audience, difficulty_level, modules_count } = c.req.valid("json");

  if (!c.env.OPENAI_API_KEY) {
    return c.json({ error: "OpenAI API key not configured" }, 500);
  }

  const openai = getOpenAIClient(c.env.OPENAI_API_KEY);

  try {
    const prompt = `Crie um curso completo de e-learning em português brasileiro com as seguintes especificações:

Título: ${title}
Descrição: ${description}
Público-alvo: ${target_audience}
Nível: ${difficulty_level}
Número de módulos: ${modules_count}

Para cada módulo, inclua:
- Título descritivo
- Conteúdo educacional completo (mínimo 500 palavras)
- Duração estimada em minutos
- Quiz com 5 questões de múltipla escolha com 4 alternativas cada

Também crie uma prova final com 20 questões de múltipla escolha.

Use um tom profissional mas acessível. O conteúdo deve ser prático e aplicável ao dia a dia do público-alvo.`;

    const completion = await openai.chat.completions.create({
      model: 'o4-mini',
      messages: [
        { 
          role: 'system', 
          content: 'Você é um especialista em design instrucional e criação de cursos online. Crie conteúdo educacional de alta qualidade em português brasileiro.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'course_content',
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              target_audience: { type: 'string' },
              modules: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    duration_minutes: { type: 'number' },
                    quiz: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        questions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              question_text: { type: 'string' },
                              options: {
                                type: 'array',
                                items: { type: 'string' }
                              },
                              correct_answer: { type: 'string' },
                              points: { type: 'number' }
                            },
                            required: ['question_text', 'options', 'correct_answer', 'points'],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ['title', 'questions'],
                      additionalProperties: false
                    }
                  },
                  required: ['title', 'content', 'duration_minutes', 'quiz'],
                  additionalProperties: false
                }
              },
              final_exam: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question_text: { type: 'string' },
                        options: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        correct_answer: { type: 'string' },
                        points: { type: 'number' }
                      },
                      required: ['question_text', 'options', 'correct_answer', 'points'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['title', 'questions'],
                additionalProperties: false
              }
            },
            required: ['title', 'description', 'target_audience', 'modules', 'final_exam'],
            additionalProperties: false
          },
          strict: true
        }
      },
      temperature: 0.7,
    });

    const courseContent = JSON.parse(completion.choices[0].message.content);

    return c.json({
      success: true,
      course_content: courseContent,
    });

  } catch (error) {
    console.error('AI course generation error:', error);
    return c.json({ error: 'Failed to generate course content' }, 500);
  }
});

// Courses CRUD
app.get("/api/courses", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM courses ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.post("/api/courses", authMiddleware, zValidator("json", CreateCourseSchema), async (c) => {
  const user = c.get("user");
  const courseData = c.req.valid("json");

  if (!user) {
    return c.json({ error: "User not authenticated" }, 401);
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO courses (title, description, target_audience, difficulty_level, cover_image_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    courseData.title,
    courseData.description || null,
    courseData.target_audience || null,
    courseData.difficulty_level,
    courseData.cover_image_url || null,
    user.id
  ).run();

  const newCourse = await c.env.DB.prepare(
    "SELECT * FROM courses WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(newCourse, 201);
});

// Users CRUD
app.get("/api/users", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM users ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.post("/api/users", authMiddleware, zValidator("json", CreateUserSchema), async (c) => {
  const userData = c.req.valid("json");

  const result = await c.env.DB.prepare(`
    INSERT INTO users (mocha_user_id, email, name, role, subscription_level)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    `manual-${Date.now()}`, // Temporary ID for manually created users
    userData.email,
    userData.name || null,
    userData.role,
    userData.subscription_level
  ).run();

  const newUser = await c.env.DB.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(newUser, 201);
});

app.delete("/api/users/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

  return c.json({ success: true });
});

// Badges CRUD
app.get("/api/badges", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM badges ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.post("/api/badges", authMiddleware, zValidator("json", CreateBadgeSchema), async (c) => {
  const badgeData = c.req.valid("json");

  const result = await c.env.DB.prepare(`
    INSERT INTO badges (name, description, icon_url, criteria, points_required)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    badgeData.name,
    badgeData.description || null,
    badgeData.icon_url || null,
    badgeData.criteria || null,
    badgeData.points_required || null
  ).run();

  const newBadge = await c.env.DB.prepare(
    "SELECT * FROM badges WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(newBadge, 201);
});

// Certificates CRUD
app.get("/api/certificates", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM certificates ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.post("/api/certificates", authMiddleware, zValidator("json", CreateCertificateSchema), async (c) => {
  const certificateData = c.req.valid("json");

  const result = await c.env.DB.prepare(`
    INSERT INTO certificates (name, template_url, course_id, description, requirements)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    certificateData.name,
    certificateData.template_url || null,
    certificateData.course_id || null,
    certificateData.description || null,
    certificateData.requirements || null
  ).run();

  const newCertificate = await c.env.DB.prepare(
    "SELECT * FROM certificates WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(newCertificate, 201);
});

// Challenges CRUD
app.get("/api/challenges", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM challenges ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.post("/api/challenges", authMiddleware, zValidator("json", CreateChallengeSchema), async (c) => {
  const challengeData = c.req.valid("json");

  const result = await c.env.DB.prepare(`
    INSERT INTO challenges (title, description, challenge_type, points_reward, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    challengeData.title,
    challengeData.description || null,
    challengeData.challenge_type,
    challengeData.points_reward,
    challengeData.start_date || null,
    challengeData.end_date || null
  ).run();

  const newChallenge = await c.env.DB.prepare(
    "SELECT * FROM challenges WHERE id = ?"
  ).bind(result.meta.last_row_id).first();

  return c.json(newChallenge, 201);
});

// Rankings
app.get("/api/rankings", authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT id, name, email, total_points, current_rank, subscription_level
    FROM users 
    WHERE is_active = 1 
    ORDER BY total_points DESC 
    LIMIT 50
  `).all();

  return c.json(results);
});

export default app;
