const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ncrlojjfkhevjotchhxi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5NzcyMywiZXhwIjoyMDY5NzczNzIzfQ.LMdGQjXhKLzixtVu4MQ5An7qytDtB9ylbZFYks_cJro'
);

async function compareCourses() {
  try {
    console.log('=== COMPARAÇÃO DOS CURSOS ===\n');
    
    // Buscar os dois cursos específicos
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .in('id', ['8816aa6b-b5e5-4757-92af-ec2de1d89111', 'fddbc02b-e27c-45fb-a35c-b6fed692db7a']);
    
    if (error) {
      console.error('Erro ao buscar cursos:', error);
      return;
    }
    
    if (!courses || courses.length === 0) {
      console.log('Nenhum curso encontrado');
      return;
    }
    
    courses.forEach(course => {
      console.log(`--- CURSO: ${course.title} (${course.id}) ---`);
      console.log('cover_image_url:', course.cover_image_url);
      console.log('status:', course.status);
      console.log('is_published:', course.is_published);
      console.log('created_at:', course.created_at);
      console.log('updated_at:', course.updated_at);
      console.log('ai_generated:', course.ai_generated);
      console.log('description:', course.description ? course.description.substring(0, 100) + '...' : 'null');
      console.log('');
    });
    
    // Verificar também a tabela course_covers
    console.log('=== VERIFICANDO TABELA COURSE_COVERS ===\n');
    
    const { data: covers, error: coversError } = await supabase
      .from('course_covers')
      .select('*')
      .in('course_id', ['8816aa6b-b5e5-4757-92af-ec2de1d89111', 'fddbc02b-e27c-45fb-a35c-b6fed692db7a']);
    
    if (coversError) {
      console.error('Erro ao buscar capas:', coversError);
    } else if (covers && covers.length > 0) {
      covers.forEach(cover => {
        console.log(`--- CAPA PARA CURSO: ${cover.course_id} ---`);
        console.log('id:', cover.id);
        console.log('image_url:', cover.image_url);
        console.log('is_active:', cover.is_active);
        console.log('created_at:', cover.created_at);
        console.log('created_by:', cover.created_by);
        console.log('');
      });
    } else {
      console.log('Nenhuma capa encontrada na tabela course_covers');
    }
    
  } catch (err) {
    console.error('Erro geral:', err);
  }
}

compareCourses();