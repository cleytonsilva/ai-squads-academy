import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Zod Schemas ---
const missionSchema = z.object({
  title: z.string(),
  description: z.string(),
  points: z.number(),
  status: z.string().optional(),
  order_index: z.number().optional(),
  requirements: z.array(z.string()),
});

const quizQuestionSchema = z.object({
    question: z.string(),
    type: z.string().optional(),
    options: z.array(z.string()).min(2),
    correct_answer: z.string(),
    explanation: z.string().optional(),
}).refine(data => data.options.includes(data.correct_answer), {
    message: "correct_answer must be one of the provided options",
    path: ["correct_answer"],
});

const quizSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
    questions: z.array(quizQuestionSchema),
});

const certificationsSchema = z.array(z.union([missionSchema, quizSchema]));

// --- Helper ---
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''

  const supabaseClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  })
  const admin = createClient(supabaseUrl, serviceKey)

  try {
    const body = await req.json();
    const {
      type, // 'missions' | 'quizzes'
      trackId,
      courseId,
      count = 3,
      difficulty = 'intermediate',
      missionType = 'practical',
      questionTypes = ['multiple_choice'],
      basePoints = 50,
    } = body as Record<string, any>;

    console.log('[ai-gen] input', { type, trackId, courseId, count, difficulty })

    // Try to resolve the caller, but don't block if unavailable
    let userId: string | null = null;
    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      userId = authData?.user?.id ?? null;
    } catch (_) {
      userId = null;
    }

    // Optionally read role (non-blocking)
    let requesterRole: string = 'anonymous';
    if (userId) {
      const { data: prof } = await admin
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      requesterRole = (prof as any)?.role ?? 'authenticated';
    }

    // Determine target course ids
    let targetCourseIds: string[] = []
    let contextContent = ''

    if (courseId) {
      targetCourseIds = [courseId]
      const { data: course } = await admin
        .from('courses')
        .select('title, description')
        .eq('id', courseId)
        .maybeSingle()
      const { data: modules } = await admin
        .from('modules')
        .select('title')
        .eq('course_id', courseId)
        .order('order_index')
      contextContent = `Curso: ${course?.title ?? ''}\nDescrição: ${course?.description ?? ''}\n\nMódulos:\n${(modules ?? []).map(m => `- ${m.title}`).join('\n')}`
    } else if (trackId) {
      const { data: track } = await admin
        .from('tracks')
        .select('title, description')
        .eq('id', trackId)
        .maybeSingle()
      const { data: tcs, error: tcErr } = await admin
        .from('track_courses')
        .select('course_id')
        .eq('track_id', trackId)
        .order('order_index')
      if (tcErr) throw tcErr
      targetCourseIds = (tcs ?? []).map((x: any) => x.course_id)

      // Fetch course titles for context
      let titles: string[] = []
      if (targetCourseIds.length) {
        const { data: crs } = await admin
          .from('courses')
          .select('id, title')
          .in('id', targetCourseIds)
        titles = (crs ?? []).map((c: any) => c.title)
      }
      contextContent = `Trilha: ${track?.title ?? ''}\nDescrição: ${track?.description ?? ''}\n\nCursos:\n${titles.map(t => `- ${t}`).join('\n')}`
    }

    if (targetCourseIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum curso encontrado para gerar conteúdo.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let systemPrompt = ''
    let userPrompt = ''

    let systemPrompt = ''
    let userPrompt = ''
    let schema;

    if (type === 'missions') {
      schema = z.array(missionSchema);
      systemPrompt = `Você é um especialista em criação de missões de certificação. Retorne um array JSON com objetos de missão.
Estrutura de cada objeto:
{
  "title": "string",
  "description": "string",
  "points": "number",
  "requirements": ["string"]
}
Siga esta estrutura estritamente. Não inclua texto ou formatação fora do array JSON.`;
      userPrompt = `Crie ${count} missões de certificação com dificuldade ${difficulty} baseadas no conteúdo abaixo. Tipo: ${missionType}. Pontos base: ${basePoints}.
\nConteúdo:\n${contextContent}`
    } else if (type === 'quizzes') {
      schema = z.array(quizSchema);
      systemPrompt = `Você é um especialista em criação de quizzes. Retorne um array JSON com objetos de quiz.
Estrutura de cada objeto:
{
  "title": "string",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", ...],
      "correct_answer": "string (deve ser um dos valores em 'options')",
      "explanation": "string"
    }
  ]
}
Siga esta estrutura estritamente. Não inclua texto ou formatação fora do array JSON.`;
      const typesList = Array.isArray(questionTypes) && questionTypes.length ? questionTypes.join(', ') : 'multiple_choice'
      userPrompt = `Crie ${count} quizzes de certificação (dificuldade ${difficulty}) com tipos de questão: ${typesList}, baseados no conteúdo abaixo. Inclua explicações para as respostas.
\nConteúdo:\n${contextContent}`
    } else {
      return new Response(JSON.stringify({ error: 'Tipo inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!aiRes.ok) {
      const txt = await aiRes.text()
      console.error('[ai-gen] OpenAI error', aiRes.status, txt)
      return new Response(JSON.stringify({ error: 'Falha ao gerar conteúdo com IA' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiJson = await aiRes.json()
    const content: string = aiJson.choices?.[0]?.message?.content ?? ''
    const parsedJson = safeJsonParse(content);

    const validationResult = schema.safeParse(parsedJson);

    if (!validationResult.success) {
      console.error('[ai-gen] AI response failed validation.', {
        type,
        error: validationResult.error.flatten(),
        response: content,
      });
      return new Response(JSON.stringify({ error: 'A resposta da IA falhou na validação da estrutura.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const validatedData = validationResult.data;

    // Prepare inserts, replicating the generated items for each target course
    let totalInserted = 0

    if (type === 'missions') {
      const all: any[] = []
      for (const cid of targetCourseIds) {
        validatedData.forEach((m: any, idx: number) => {
          all.push({
            title: m.title,
            description: m.description,
            points: m.points,
            status: m.status ?? 'available',
            order_index: m.order_index ?? idx,
            requirements: m.requirements,
            course_id: cid,
            track_id: trackId ?? null,
            module_id: m.module_id ?? null,
          })
        })
      }
      const { error } = await admin.from('missions').insert(all)
      if (error) throw error
      totalInserted = all.length
    } else {
      const all: any[] = []
      for (const cid of targetCourseIds) {
        validatedData.forEach((q: any) => {
          all.push({
            title: q.title,
            description: q.description ?? null,
            is_active: q.is_active ?? true,
            questions: q.questions,
            course_id: cid,
            track_id: trackId ?? null,
            module_id: q.module_id ?? null,
          })
        })
      }
      const { error } = await admin.from('quizzes').insert(all)
      if (error) throw error
      totalInserted = all.length
    }

    return new Response(JSON.stringify({ success: true, inserted: totalInserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Error in ai-generate-certifications:', error)
    return new Response(JSON.stringify({ error: error.message ?? 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})