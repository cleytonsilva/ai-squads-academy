import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractJsonArray(text: string): any[] | null {
  try {
    // Try direct parse first
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {}

  // Try fenced code block
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeMatch) {
    try {
      const parsed = JSON.parse(codeMatch[1]);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {}
  }

  // Try to locate the first JSON array in the text
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {}
  }

  return null;
}

// --- Validation Functions ---
function validateMission(item: any): boolean {
  return (
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    typeof item.points === 'number' &&
    Array.isArray(item.requirements)
  );
}

function validateQuiz(item: any): boolean {
  if (
    typeof item.title !== 'string' ||
    !Array.isArray(item.questions) ||
    item.questions.length === 0
  ) {
    return false;
  }
  for (const q of item.questions) {
    if (
      typeof q.question !== 'string' ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      typeof q.correct_answer !== 'string'
    ) {
      return false;
    }
  }
  return true;
}


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

    if (type === 'missions') {
      systemPrompt = `Você é um especialista em criação de missões de certificação. Sua resposta deve ser apenas um array JSON válido, sem nenhum texto adicional.
A estrutura de cada objeto no array deve ser:
{
  "title": "string (obrigatório)",
  "description": "string (obrigatório)",
  "points": "number (obrigatório)",
  "status": "string (opcional, padrão 'available')",
  "order_index": "number (opcional)",
  "requirements": "array de strings (obrigatório)"
}
Siga esta estrutura estritamente.`;
      userPrompt = `Crie ${count} missões de certificação com dificuldade ${difficulty} baseadas no conteúdo abaixo. Tipo: ${missionType}. Pontos base: ${basePoints}.
\nConteúdo:\n${contextContent}`
    } else if (type === 'quizzes') {
      systemPrompt = `Você é um especialista em criação de quizzes. Sua resposta deve ser apenas um array JSON válido, sem nenhum texto adicional.
A estrutura de cada objeto no array deve ser:
{
  "title": "string (obrigatório)",
  "description": "string (opcional)",
  "is_active": "boolean (opcional, padrão 'true')",
  "questions": [
    {
      "question": "string (obrigatório)",
      "type": "string (opcional, padrão 'multiple_choice')",
      "options": "array de strings (obrigatório, mínimo 2)",
      "correct_answer": "string (obrigatório, deve corresponder a um item em 'options')",
      "explanation": "string (opcional)"
    }
  ]
}
Siga esta estrutura estritamente.`;
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
      }),
    })

    if (!aiRes.ok) {
      const txt = await aiRes.text()
      console.error('[ai-gen] OpenAI error', aiRes.status, txt)
      return new Response(JSON.stringify({ error: 'Falha ao gerar conteúdo com IA' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiJson = await aiRes.json()
    const content: string = aiJson.choices?.[0]?.message?.content ?? ''
    const parsed = extractJsonArray(content)

    if (!parsed) {
      console.error('[ai-gen] Failed to parse JSON from AI response.', { content });
      return new Response(JSON.stringify({ error: 'Não foi possível interpretar a resposta da IA.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- Validate the structure of the AI's response ---
    const validationFn = type === 'missions' ? validateMission : validateQuiz;
    const isValid = parsed.every(validationFn);

    if (!isValid) {
      console.error('[ai-gen] AI response failed validation.', {
        type,
        response: content, // Log the original, problematic content
      });
      return new Response(JSON.stringify({ error: 'A resposta da IA falhou na validação da estrutura.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Prepare inserts, replicating the generated items for each target course
    let totalInserted = 0

    if (type === 'missions') {
      const all: any[] = []
      for (const cid of targetCourseIds) {
        parsed.forEach((m: any, idx: number) => {
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
        parsed.forEach((q: any) => {
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