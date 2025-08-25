import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Interface para definir a estrutura de um curso
 */
interface Course {
  id: string;
  title: string;
  description: string;
  instructor?: string;
  duration?: number;
  level?: string;
  category?: string;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  thumbnail?: string;
  price?: number;
  rating?: number;
  students_count?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Buscando cursos no Supabase...');
    
    // Buscar cursos ativos e publicados
    const { data: courses, error } = await supabaseClient
      .from('courses')
      .select(`
        id,
        title,
        description,
        instructor,
        duration,
        level,
        category,
        is_published,
        is_active,
        created_at,
        updated_at,
        thumbnail,
        price,
        rating,
        students_count
      `)
      .eq('is_published', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar cursos:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar cursos',
          details: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ ${courses?.length || 0} cursos encontrados`);
    
    // Retornar cursos com informações adicionais
    const coursesWithStats = courses?.map((course: Course) => ({
      ...course,
      // Adicionar campos padrão se não existirem
      instructor: course.instructor || 'Instrutor não definido',
      duration: course.duration || 0,
      level: course.level || 'Iniciante',
      category: course.category || 'Geral',
      rating: course.rating || 0,
      students_count: course.students_count || 0,
      price: course.price || 0
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        data: coursesWithStats,
        total: coursesWithStats.length,
        message: 'Cursos carregados com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});