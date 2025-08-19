import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Zod Schemas for Validation ---

const quizQuestionSchema = z.object({
  q: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.number().min(0),
  explanation: z.string().optional(),
}).refine(data => data.answer < data.options.length, {
  message: "Answer index must be within the bounds of the options array",
  path: ["answer"],
});

const moduleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  content_html: z.string(),
  quiz: z.object({
    title: z.string(),
    description: z.string().optional(),
    questions: z.array(quizQuestionSchema),
  }).optional(),
});

const courseSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimated_minutes: z.number().optional(),
  modules: z.array(moduleSchema),
});

const finalExamQuestionSchema = z.object({
    question: z.string(),
    options: z.array(z.string()).min(2),
    correct_answer: z.string(),
    explanation: z.string().optional(),
}).refine(data => data.options.includes(data.correct_answer), {
    message: "correct_answer must be one of the provided options",
    path: ["correct_answer"],
});

const finalExamSchema = z.object({
  questions: z.array(finalExamQuestionSchema),
});


// --- Helpers ---

const safeJsonParse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      try { return JSON.parse(match[1]); } catch { /* ignore */ }
    }
    return null;
  }
};

// OpenAI helper
async function callOpenAI(messages: any[], temperature: number = 0.6): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "OpenAI request failed");
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");
  return content;
}

// Gemini helper
async function callGemini(messages: any[], temperature: number = 0.6): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
  const user = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: user }] }],
      generationConfig: { temperature },
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Gemini request failed");
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "Missing Supabase server configuration/secrets" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "No AI provider configured (OpenAI or Gemini)" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const input = await req.json().catch(() => ({}));
    const {
      topic,
      title,
      difficulty = "beginner",
      num_modules = 12,
      audience = "estudantes e profissionais de TI no Brasil",
      include_final_exam = true,
      final_exam_difficulty,
      final_exam_options = 4,
      final_exam_questions = 20,
      description,
      tone = "profissional",
      target_audience = [],
      module_length_min = 2200,
      module_length_max = 3200,
    } = input || {};

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve current user and profile id
    const { data: authData } = await anonClient.auth.getUser();
    const authUserId = authData?.user?.id || null;
    let profileId: string | null = null;
    if (authUserId) {
      const { data: prof } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("user_id", authUserId)
        .maybeSingle();
      profileId = prof?.id || null;
    }

    // Create a generation job row
    const { data: jobRow, error: jobErr } = await serviceClient
      .from("generation_jobs")
      .insert({
        type: "ai_generate_course",
        status: "queued",
        input: { topic, title, difficulty, num_modules, audience, include_final_exam, final_exam_difficulty, final_exam_options, final_exam_questions, description, tone, target_audience, module_length_min, module_length_max },
        created_by: profileId,
      })
      .select("id")
      .single();

    if (jobErr) {
      console.error("Failed to create job:", jobErr);
      return new Response(JSON.stringify({ error: "Falha ao iniciar geração" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobId = jobRow.id as string;

    const backgroundTask = async () => {
      const updateJob = async (patch: Record<string, unknown>) => {
        await serviceClient.from("generation_jobs").update(patch).eq("id", jobId);
      };

      try {
        console.log("[AI-GEN] Processing job", jobId);
        await updateJob({ status: "processing" });

        // Initialize in-memory progress log that we persist on each step
        let jobOutput: any = { events: [], progress_modules: [] };
        const logEvent = async (message: string) => {
          try {
            jobOutput.events.push({ message, at: new Date().toISOString() });
            await updateJob({ output: jobOutput });
          } catch (_) { /* noop */ }
        };
        await logEvent("Processamento iniciado");

        const promptTitle = title || (topic ? `Curso: ${topic}` : "Curso de Cibersegurança");

        const system = `Você é um gerador de cursos da plataforma Esquads. Gere um JSON válido e conciso em pt-BR.
Sua resposta DEVE ser apenas o objeto JSON, sem nenhum texto ou formatação extra.
A estrutura do JSON deve ser:
{
  "title": "string",
  "description": "string",
  "estimated_minutes": "number (opcional)",
  "modules": [
    {
      "title": "string",
      "summary": "string",
      "content_html": "string (HTML simples com <p>, <ul>, <ol>, <code>)",
      "quiz": {
        "title": "string",
        "description": "string (opcional)",
        "questions": [
          {"q": "string", "options": ["string", "string", ...], "answer": "number (índice da resposta correta)", "explanation": "string (opcional)" }
        ]
      }
    }
  ]
}
- Número de módulos: mínimo 8, máximo ${Math.max(8, Math.min(20, Number(num_modules) || 12))}.
- Para content_html: produza de ${module_length_min} a ${module_length_max} caracteres.`;

        const ta = Array.isArray(target_audience) && target_audience.length > 0 ? target_audience.join(", ") : audience;
        const extraDesc = description ? `Descrição do curso (admin): ${description}\n` : "";
        const userMsg = `${extraDesc}Gere um curso completo para o público: ${ta}.\nTítulo sugerido: ${promptTitle}\nTom do curso: ${tone}\nNível: ${difficulty}.\nCada módulo deve conter:\n- summary conciso\n- content_html no intervalo de ${module_length_min}-${module_length_max} caracteres\n- quiz com 5 questões de múltipla escolha (4 opções).\nRespeite o JSON estrito.`;

        let contentText: string | null = null;
        try {
          contentText = await callOpenAI([
            { role: "system", content: system },
            { role: "user", content: userMsg },
          ], 0.6);
        } catch (e1) {
          await logEvent("OpenAI falhou, tentando Gemini...");
          contentText = await callGemini([
            { role: "system", content: system },
            { role: "user", content: userMsg },
          ], 0.6);
        }

        const json = safeJsonParse(contentText);
        const validationResult = courseSchema.safeParse(json);

        if (!validationResult.success) {
          console.error("AI course response failed validation:", validationResult.error.flatten());
          throw new Error("A resposta da IA para o curso principal falhou na validação do schema.");
        }

        const courseData = validationResult.data;
        await logEvent(`Conteúdo IA recebido e validado: ${courseData.modules.length} módulos`);

        const estimated_minutes = Number(courseData.estimated_minutes || courseData.modules.length * 15);

        // Create course (draft)
        const { data: courseRow, error: courseErr } = await serviceClient
          .from("courses")
          .insert({
            title: courseData.title,
            description: courseData.description,
            ai_generated: true,
            is_published: false,
            status: "draft",
            difficulty_level: difficulty,
            estimated_duration: estimated_minutes,
          })
          .select("id")
          .single();

        if (courseErr || !courseRow?.id) {
          console.error("DB error creating course", courseErr);
          throw new Error("Falha ao criar curso no banco de dados");
        }

        const courseId = courseRow.id as string;
        await logEvent(`Curso criado: ${courseId}`);

        // Insert modules and quizzes
        for (let i = 0; i < courseData.modules.length; i++) {
          const m = courseData.modules[i];
          const modPayload = {
            course_id: courseId,
            title: m.title,
            order_index: i,
            content_jsonb: {
              html: m.content_html,
              summary: m.summary,
            },
          };

          const { data: modRow, error: modErr } = await serviceClient
            .from("modules")
            .insert(modPayload)
            .select("id")
            .single();

          if (modErr || !modRow?.id) {
            console.error("DB error creating module", modErr);
            throw new Error(`Falha ao criar módulo: ${m.title}`);
          }

          const moduleId = modRow.id as string;

          // Update job progress with the module title
          jobOutput.progress_modules.push({ index: i, title: m.title });
          await updateJob({ output: jobOutput });
          await logEvent(`Módulo ${i + 1} criado: ${m.title}`);

          if (m.quiz) {
            const { error: quizErr } = await serviceClient
              .from("quizzes")
              .insert({
                course_id: courseId,
                module_id: moduleId,
                title: m.quiz.title,
                description: m.quiz.description,
                questions: m.quiz.questions,
              });

            if (quizErr) {
              console.error("DB error creating quiz", quizErr);
              await logEvent(`Falha ao criar quiz para o módulo ${m.title}. Continuando...`);
            }
          }
        }

        // Final exam generation (optional)
        if (include_final_exam) {
          try {
            await logEvent("Gerando prova final...");
            const fed = (typeof final_exam_difficulty === "string" && final_exam_difficulty) ? final_exam_difficulty : difficulty;
            const optCount = Math.max(2, Math.min(6, Number(final_exam_options) || 4));
            const qCount = Math.max(5, Math.min(50, Number(final_exam_questions) || 20));

            const system2 = `Gere apenas um objeto JSON para uma prova final com a estrutura: { "questions": [ { "question": "string", "options": ["string"], "correct_answer": "string", "explanation": "string" } ] }. A 'correct_answer' DEVE corresponder exatamente a um dos valores em 'options'.`;
            const topics = courseData.modules.map((m: any) => m.title).join("; ");
            const user2 = `Crie ${qCount} questões de múltipla escolha (nível: ${fed}) para a prova final do curso "${courseData.title}".\n- Cada questão deve ter ${optCount} opções.\n- A resposta em 'correct_answer' deve ser idêntica a um dos itens em 'options'.\n- Inclua uma explicação curta.\n- Use pt-BR.\n- Foco nos tópicos: ${topics}`;

            let contentText2: string | null = null;
            try {
              contentText2 = await callOpenAI(
                [ { role: "system", content: system2 }, { role: "user", content: user2 } ],
                0.4,
              );
            } catch (e1) {
              await logEvent("OpenAI falhou na prova final, tentando Gemini...");
              contentText2 = await callGemini(
                [ { role: "system", content: system2 }, { role: "user", content: user2 } ],
                0.4,
              );
            }

            const finalExamJson = safeJsonParse(contentText2);
            const examValidation = finalExamSchema.safeParse(finalExamJson);

            if (!examValidation.success) {
              await logEvent("O conteúdo do curso foi gerado, mas a prova final falhou na validação do schema e será descartada.");
              console.error("[AI-GEN] Final exam validation failed.", {
                error: examValidation.error.flatten(),
                raw_content: contentText2
              });
            } else {
              // Create final exam module
              const { data: finalMod, error: fModErr } = await serviceClient
                .from("modules")
                .insert({
                  course_id: courseId,
                  title: "Prova Final",
                  order_index: courseData.modules.length,
                  module_type: "final_exam",
                  content_jsonb: { html: `<h2>Prova Final</h2><p>Responda às questões a seguir para concluir o curso.</p>` },
                })
                .select("id")
                .single();
              if (fModErr || !finalMod?.id) throw new Error("Falha ao criar módulo de prova final");

              // Insert final exam quiz
              const { error: fQuizErr } = await serviceClient
                .from("quizzes")
                .insert({
                  course_id: courseId,
                  module_id: finalMod.id,
                  title: "Prova final do curso",
                  description: `Nível: ${fed}. Você precisa atingir a nota de corte definida pelo curso para obter o certificado.`,
                  questions: examValidation.data.questions,
                });
              if (fQuizErr) throw fQuizErr;
              await logEvent("Prova final criada com sucesso.");
            }
          } catch (e) {
            console.error("[AI-GEN] Final exam generation failed:", e);
            await logEvent(`O conteúdo do curso foi gerado, mas a prova final falhou com uma exceção: ${e.message}`);
          }
        }

        await updateJob({ status: "completed", output: { ...jobOutput, course_id: courseId } });
        console.log("[AI-GEN] Job completed", jobId, courseId);
      } catch (err: any) {
        console.error("[AI-GEN] Job failed", jobId, err?.message || err);
        await (async () => {
          try { await serviceClient.from("generation_jobs").update({ status: "failed", error: String(err?.message || err) }).eq("id", jobId); } catch {}
        })();
      }
    };

    const w = (globalThis as any).EdgeRuntime?.waitUntil;
    if (typeof w === "function") {
      w(backgroundTask());
    } else {
      // Fallback: fire-and-forget
      backgroundTask();
    }

    return new Response(JSON.stringify({ job_id: jobId, message: "Geração iniciada" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[AI-GEN] Handler error:", error?.message || error);
    return new Response(JSON.stringify({ error: error?.message || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
