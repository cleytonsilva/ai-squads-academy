import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractJsonArray(text: string): any[] | null {
  try { const parsed = JSON.parse(text); return Array.isArray(parsed) ? parsed : [parsed]; } catch {}
  const code = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (code) { try { const parsed = JSON.parse(code[1]); return Array.isArray(parsed) ? parsed : [parsed]; } catch {} }
  const start = text.indexOf('['), end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch {} }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: req.headers.get('Authorization')! } } })
  const admin = createClient(supabaseUrl, serviceKey)

  try {
    const { courseId, count = 2, difficulty = 'intermediate', focus = '' } = await req.json()

    if (!courseId) return new Response(JSON.stringify({ error: 'courseId é obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: { user } } = await client.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: profile } = await admin.from('profiles').select('role').eq('user_id', user.id).maybeSingle()
    if (!profile || !['admin','instructor'].includes(profile.role as string)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: course } = await admin.from('courses').select('title, description').eq('id', courseId).maybeSingle()
    const { data: modules } = await admin.from('modules').select('order_index').eq('course_id', courseId).order('order_index')
    const nextStart = ((modules?.[modules.length - 1]?.order_index) ?? -1) + 1

    if (!openAIApiKey) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const systemPrompt = `Você é um criador de conteúdo técnico para cursos de tecnologia.
Gere módulos adicionais claros e objetivos.
Retorne APENAS JSON válido como um array com o formato:
[
  { "title": "Título do módulo", "html": "<h2>...</h2><p>...</p>" }
]`

    const userPrompt = `Crie ${count} módulos (${difficulty}).
Curso: ${course?.title ?? ''}
Descrição: ${course?.description ?? ''}
Foco extra: ${focus ?? ''}
Regras:
- Produza HTML sem markdown (tags p, h2, ul/li, pre/code quando necessário)
- Não inclua scripts
- Conteúdo em pt-BR`

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [ { role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt } ], temperature: 0.5, max_tokens: 4000 })
    })

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error('[ai-gen-modules] OpenAI error', aiRes.status, txt)
      return new Response(JSON.stringify({ error: 'Falha ao gerar módulos com IA' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiJson = await aiRes.json()
    const content: string = aiJson.choices?.[0]?.message?.content ?? ''
    const parsed = extractJsonArray(content)
    if (!parsed) {
      console.error('[ai-gen-modules] parse failed', content)
      return new Response(JSON.stringify({ error: 'Não foi possível interpretar a resposta da IA.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const rows = parsed.map((m: any, i: number) => ({
      course_id: courseId,
      title: m.title ?? `Módulo ${nextStart + i}`,
      order_index: nextStart + i,
      content_jsonb: { html: m.html ?? m.content ?? '' },
    }))

    const { error } = await admin.from('modules').insert(rows)
    if (error) throw error

    return new Response(JSON.stringify({ success: true, inserted: rows.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('Error in ai-generate-modules:', error)
    return new Response(JSON.stringify({ error: error.message ?? 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})