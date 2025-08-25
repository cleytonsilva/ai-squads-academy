import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ncrlojjfkhevjotchhxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5NzcyMywiZXhwIjoyMDY5NzczNzIzfQ.LMdGQjXhKLzixtVu4MQ5An7qytDtB9ylbZFYks_cJro';

const supabase = createClient(supabaseUrl, supabaseKey);

const courseIds = [
  '8816aa6b-b5e5-4757-92af-ec2de1d89111', // Curso com problema
  'fddbc02b-e27c-45fb-a35c-b6fed692db7a'  // Curso funcionando (Blue Team)
];

async function compareCourses() {
  console.log('=== ANÁLISE COMPARATIVA DOS CURSOS ===\n');
  
  try {
    // 1. Buscar dados dos cursos
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);
    
    if (coursesError) {
      console.error('❌ Erro ao buscar cursos:', coursesError);
      return;
    }
    
    if (!courses || courses.length === 0) {
      console.log('❌ Nenhum curso encontrado');
      return;
    }
    
    console.log('📚 DADOS DOS CURSOS:');
    courses.forEach((course, index) => {
      const status = course.id === '8816aa6b-b5e5-4757-92af-ec2de1d89111' ? '❌ PROBLEMA' : '✅ FUNCIONANDO';
      console.log(`\n${index + 1}. ${status} - ${course.title}`);
      console.log(`   ID: ${course.id}`);
      console.log(`   cover_image_url: ${course.cover_image_url || 'NULL'}`);
      console.log(`   status: ${course.status}`);
      console.log(`   is_published: ${course.is_published}`);
      console.log(`   ai_generated: ${course.ai_generated}`);
      console.log(`   created_at: ${course.created_at}`);
      console.log(`   updated_at: ${course.updated_at}`);
    });
    
    // 2. Buscar capas na tabela course_covers
    console.log('\n\n🖼️  CAPAS NA TABELA COURSE_COVERS:');
    const { data: covers, error: coversError } = await supabase
      .from('course_covers')
      .select(`
        *,
        courses!inner(title)
      `)
      .in('course_id', courseIds)
      .order('created_at', { ascending: false });
    
    if (coversError) {
      console.error('❌ Erro ao buscar capas:', coversError);
    } else if (covers && covers.length > 0) {
      covers.forEach((cover, index) => {
        const courseTitle = (cover.courses as any)?.title || 'Título não encontrado';
        const status = cover.course_id === '8816aa6b-b5e5-4757-92af-ec2de1d89111' ? '❌ PROBLEMA' : '✅ FUNCIONANDO';
        console.log(`\n${index + 1}. ${status} - ${courseTitle}`);
        console.log(`   Course ID: ${cover.course_id}`);
        console.log(`   Cover ID: ${cover.id}`);
        console.log(`   image_url: ${cover.image_url}`);
        console.log(`   is_active: ${cover.is_active}`);
        console.log(`   created_at: ${cover.created_at}`);
      });
    } else {
      console.log('❌ Nenhuma capa encontrada na tabela course_covers');
    }
    
    // 3. Buscar predições do Replicate
    console.log('\n\n🤖 PREDIÇÕES DO REPLICATE:');
    const { data: predictions, error: predictionsError } = await supabase
      .from('replicate_predictions')
      .select('*')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (predictionsError) {
      console.error('❌ Erro ao buscar predições:', predictionsError);
    } else if (predictions && predictions.length > 0) {
      predictions.forEach((prediction, index) => {
        const status = prediction.course_id === '8816aa6b-b5e5-4757-92af-ec2de1d89111' ? '❌ PROBLEMA' : '✅ FUNCIONANDO';
        console.log(`\n${index + 1}. ${status}`);
        console.log(`   Course ID: ${prediction.course_id}`);
        console.log(`   Prediction ID: ${prediction.prediction_id}`);
        console.log(`   Status: ${prediction.status}`);
        console.log(`   Output URLs: ${prediction.output_urls ? JSON.stringify(prediction.output_urls) : 'NULL'}`);
        console.log(`   Created: ${prediction.created_at}`);
      });
    } else {
      console.log('❌ Nenhuma predição encontrada');
    }
    
    // 4. Análise das diferenças
    console.log('\n\n🔍 ANÁLISE DAS DIFERENÇAS:');
    const problemCourse = courses.find(c => c.id === '8816aa6b-b5e5-4757-92af-ec2de1d89111');
    const workingCourse = courses.find(c => c.id === 'fddbc02b-e27c-45fb-a35c-b6fed692db7a');
    
    if (problemCourse && workingCourse) {
      console.log('\n📊 Comparação direta:');
      console.log(`cover_image_url - Problema: ${problemCourse.cover_image_url || 'NULL'} | Funcionando: ${workingCourse.cover_image_url || 'NULL'}`);
      console.log(`status - Problema: ${problemCourse.status} | Funcionando: ${workingCourse.status}`);
      console.log(`is_published - Problema: ${problemCourse.is_published} | Funcionando: ${workingCourse.is_published}`);
      console.log(`ai_generated - Problema: ${problemCourse.ai_generated} | Funcionando: ${workingCourse.ai_generated}`);
      
      // Verificar se há diferenças significativas
      const differences = [];
      if (problemCourse.cover_image_url !== workingCourse.cover_image_url) {
        differences.push('cover_image_url diferente');
      }
      if (problemCourse.status !== workingCourse.status) {
        differences.push('status diferente');
      }
      if (problemCourse.is_published !== workingCourse.is_published) {
        differences.push('is_published diferente');
      }
      
      if (differences.length > 0) {
        console.log(`\n⚠️  Diferenças encontradas: ${differences.join(', ')}`);
      } else {
        console.log('\n✅ Estruturas dos cursos são similares');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

compareCourses().then(() => {
  console.log('\n✅ Análise concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});