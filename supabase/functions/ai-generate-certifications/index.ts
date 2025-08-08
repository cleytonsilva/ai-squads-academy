import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      type, 
      trackId, 
      courseId, 
      count, 
      difficulty, 
      missionType, 
      questionTypes,
      basePoints 
    } = await req.json();

    // Get user profile
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: profile } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get course content for context
    let contextContent = '';
    if (courseId) {
      const { data: course } = await supabaseServiceClient
        .from('courses')
        .select('title, description')
        .eq('id', courseId)
        .single()

      const { data: modules } = await supabaseServiceClient
        .from('modules')
        .select('title, content_jsonb')
        .eq('course_id', courseId)
        .order('order_index')

      contextContent = `Curso: ${course?.title}\nDescrição: ${course?.description}\n\nMódulos:\n${modules?.map(m => `- ${m.title}`).join('\n')}`;
    } else if (trackId) {
      const { data: track } = await supabaseServiceClient
        .from('tracks')
        .select('title, description')
        .eq('id', trackId)
        .single()

      const { data: trackCourses } = await supabaseServiceClient
        .from('track_courses')
        .select('course_id, courses(title, description)')
        .eq('track_id', trackId)
        .order('order_index')

      contextContent = `Trilha: ${track?.title}\nDescrição: ${track?.description}\n\nCursos:\n${trackCourses?.map(tc => `- ${tc.courses?.title}: ${tc.courses?.description}`).join('\n')}`;
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'missions') {
      systemPrompt = `Você é um especialista em criação de missões de certificação para plataformas de ensino. Crie missões práticas que testem o conhecimento aplicado dos estudantes.

Retorne um JSON array com o seguinte formato:
[
  {
    "title": "Título da missão",
    "description": "Descrição detalhada da missão",
    "points": pontos_numericos,
    "status": "available",
    "order_index": indice_numerico,
    "requirements": ["Requisito 1", "Requisito 2"]
  }
]

Tipos de missão disponíveis: ${missionType}
- "practical": Exercícios práticos e implementações
- "theoretical": Análise e estudos de caso  
- "project": Projetos completos e portfólio`;

      userPrompt = `Crie ${count} missões de certificação com dificuldade ${difficulty} baseadas no seguinte conteúdo:

${contextContent}

Tipo de missões: ${missionType}
Pontuação base: ${basePoints} pontos

As missões devem:
- Ser progressivas em dificuldade
- Testar conhecimento prático aplicado
- Incluir requisitos claros e mensuráveis
- Ser relevantes ao conteúdo do curso/trilha`;

    } else if (type === 'quizzes') {
      systemPrompt = `Você é um especialista em criação de quizzes de certificação. Crie quizzes abrangentes que testem o conhecimento teórico e prático dos estudantes.

Retorne um JSON array com o seguinte formato:
[
  {
    "title": "Título do Quiz",
    "description": "Descrição do quiz",
    "is_active": true,
    "questions": [
      {
        "question": "Pergunta aqui?",
        "type": "multiple_choice",
        "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
        "correct_answer": "Opção correta",
        "explanation": "Explicação da resposta correta"
      }
    ]
  }
]

Tipos de questão disponíveis: ${questionTypes.join(', ')}
- "multiple_choice": Múltipla escolha (4 opções)
- "true_false": Verdadeiro ou Falso
- "essay": Dissertativa (texto livre)`;

      userPrompt = `Crie ${count} quizzes de certificação com dificuldade ${difficulty} baseados no seguinte conteúdo:

${contextContent}

Tipos de questão: ${questionTypes.join(', ')}

Cada quiz deve:
- Ter 5-10 questões variadas
- Cobrir diferentes aspectos do conteúdo
- Incluir explicações para as respostas
- Ser apropriado para certificação profissional`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content;

    // Parse AI response
    let parsedContent;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = generatedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
      parsedContent = JSON.parse(jsonString.trim());
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Insert generated content into database
    if (type === 'missions') {
      const missions = parsedContent.map((mission: any) => ({
        ...mission,
        course_id: courseId,
        track_id: trackId,
        requirements: JSON.stringify(mission.requirements || [])
      }));

      const { error } = await supabaseServiceClient
        .from('missions')
        .insert(missions);

      if (error) throw error;
    } else if (type === 'quizzes') {
      const quizzes = parsedContent.map((quiz: any) => ({
        ...quiz,
        course_id: courseId,
        track_id: trackId,
        questions: JSON.stringify(quiz.questions || [])
      }));

      const { error } = await supabaseServiceClient
        .from('quizzes')
        .insert(quizzes);

      if (error) throw error;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      generated: parsedContent.length,
      type 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-generate-certifications:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});