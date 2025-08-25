import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ncrlojjfkhevjotchhxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5NzcyMywiZXhwIjoyMDY5NzczNzIzfQ.LMdGQjXhKLzixtVu4MQ5An7qytDtB9ylbZFYks_cJro';

const supabase = createClient(supabaseUrl, supabaseKey);

const PROBLEM_COURSE_ID = '8816aa6b-b5e5-4757-92af-ec2de1d89111';
const WORKING_COURSE_ID = 'fddbc02b-e27c-45fb-a35c-b6fed692db7a';

async function fixCourseCover() {
  console.log('🔧 INICIANDO CORREÇÃO DA CAPA DO CURSO\n');
  
  try {
    // 1. Buscar a capa do curso funcionando
    console.log('📋 1. Buscando dados do curso funcionando...');
    const { data: workingCourse, error: workingError } = await supabase
      .from('courses')
      .select('cover_image_url, title')
      .eq('id', WORKING_COURSE_ID)
      .single();
    
    if (workingError || !workingCourse) {
      console.error('❌ Erro ao buscar curso funcionando:', workingError);
      return;
    }
    
    console.log(`✅ Curso funcionando encontrado: ${workingCourse.title}`);
    console.log(`   Cover URL: ${workingCourse.cover_image_url}`);
    
    // 2. Buscar dados do curso com problema
    console.log('\n📋 2. Buscando dados do curso com problema...');
    const { data: problemCourse, error: problemError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', PROBLEM_COURSE_ID)
      .single();
    
    if (problemError || !problemCourse) {
      console.error('❌ Erro ao buscar curso com problema:', problemError);
      return;
    }
    
    console.log(`✅ Curso com problema encontrado: ${problemCourse.title}`);
    console.log(`   Cover URL atual: ${problemCourse.cover_image_url || 'NULL'}`);
    
    // 3. Verificar predições pendentes
    console.log('\n🤖 3. Verificando predições pendentes...');
    const { data: predictions, error: predictionsError } = await supabase
      .from('replicate_predictions')
      .select('*')
      .eq('course_id', PROBLEM_COURSE_ID)
      .eq('status', 'starting')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (predictionsError) {
      console.error('❌ Erro ao buscar predições:', predictionsError);
    } else if (predictions && predictions.length > 0) {
      console.log(`⚠️  Encontradas ${predictions.length} predições pendentes:`);
      predictions.forEach((pred, index) => {
        console.log(`   ${index + 1}. ID: ${pred.prediction_id} | Status: ${pred.status} | Criada: ${pred.created_at}`);
      });
      
      // Marcar predições antigas como failed
      console.log('\n🧹 4. Limpando predições antigas...');
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 1); // Predições com mais de 1 hora
      
      const { error: cleanupError } = await supabase
        .from('replicate_predictions')
        .update({
          status: 'failed',
          error: 'Timeout - predição cancelada automaticamente',
          updated_at: new Date().toISOString()
        })
        .eq('course_id', PROBLEM_COURSE_ID)
        .eq('status', 'starting')
        .lt('created_at', cutoffDate.toISOString());
      
      if (cleanupError) {
        console.error('❌ Erro ao limpar predições:', cleanupError);
      } else {
        console.log('✅ Predições antigas marcadas como failed');
      }
    } else {
      console.log('✅ Nenhuma predição pendente encontrada');
    }
    
    // 4. Opção 1: Copiar capa do curso funcionando (temporário)
    console.log('\n🎨 5. OPÇÃO 1: Copiar capa do curso funcionando...');
    if (workingCourse.cover_image_url) {
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          cover_image_url: workingCourse.cover_image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', PROBLEM_COURSE_ID);
      
      if (updateError) {
        console.error('❌ Erro ao atualizar capa:', updateError);
      } else {
        console.log('✅ Capa copiada temporariamente do curso funcionando');
        
        // Notificar frontend via realtime
        await supabase
          .channel('course_updates')
          .send({
            type: 'broadcast',
            event: 'cover_updated',
            payload: {
              course_id: PROBLEM_COURSE_ID,
              cover_image_url: workingCourse.cover_image_url,
              timestamp: new Date().toISOString()
            }
          });
        
        console.log('📡 Frontend notificado via realtime');
      }
    }
    
    // 5. Verificar se a correção funcionou
    console.log('\n🔍 6. Verificando se a correção funcionou...');
    const { data: updatedCourse, error: verifyError } = await supabase
      .from('courses')
      .select('cover_image_url, updated_at')
      .eq('id', PROBLEM_COURSE_ID)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar correção:', verifyError);
    } else {
      console.log('✅ Verificação concluída:');
      console.log(`   Nova cover_image_url: ${updatedCourse.cover_image_url}`);
      console.log(`   Atualizado em: ${updatedCourse.updated_at}`);
    }
    
    // 6. Sugestões para correção permanente
    console.log('\n💡 SUGESTÕES PARA CORREÇÃO PERMANENTE:');
    console.log('1. Verificar se o webhook do Replicate está funcionando corretamente');
    console.log('2. Verificar se as predições estão sendo processadas');
    console.log('3. Implementar timeout automático para predições pendentes');
    console.log('4. Adicionar retry automático para predições falhadas');
    console.log('5. Melhorar logs e monitoramento das Edge Functions');
    
    console.log('\n✅ CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('\n🌐 Acesse o admin dashboard para verificar se a capa aparece corretamente.');
    
  } catch (error) {
    console.error('❌ Erro geral na correção:', error);
  }
}

fixCourseCover().then(() => {
  console.log('\n🎯 Script de correção finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});