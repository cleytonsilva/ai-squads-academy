import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

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

/**
 * Endpoint GET /courses
 * Retorna lista de cursos ativos e publicados do Supabase
 */
export default async function handler(req: any, res: any) {
  // Permitir apenas método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔍 Buscando cursos no Supabase...');
    
    // Buscar cursos ativos e publicados
    const { data: courses, error } = await supabase
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
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error.message 
      });
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

    return res.status(200).json({
      success: true,
      data: coursesWithStats,
      total: coursesWithStats.length,
      message: 'Cursos carregados com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}