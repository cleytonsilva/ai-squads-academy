const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function monitorPrediction() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não configuradas');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const courseId = 'fddbc02b-e27c-45fb-a35c-b6fed692db7a';

  console.log('📊 MONITORAMENTO DE PREDIÇÃO EM TEMPO REAL');
  console.log('=' .repeat(50));

  try {
    // Buscar predição mais recente
    const { data: predictions, error } = await supabase
      .from('replicate_predictions')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !predictions || predictions.length === 0) {
      console.log('❌ Nenhuma predição encontrada');
      return;
    }

    const prediction = predictions[0];
    console.log('\n🔍 PREDIÇÃO ATUAL:');
    console.log(`   ID: ${prediction.prediction_id}`);
    console.log(`   Status: ${prediction.status}`);
    console.log(`   Criada: ${prediction.created_at}`);
    console.log(`   Atualizada: ${prediction.updated_at}`);
    
    if (prediction.output_data) {
      console.log(`   Output: ${prediction.output_data}`);
    }
    
    if (prediction.error_message) {
      console.log(`   Erro: ${prediction.error_message}`);
    }

    // Monitorar por 5 minutos
    console.log('\n⏰ MONITORANDO POR 5 MINUTOS...');
    console.log('   (Pressione Ctrl+C para parar)');
    
    const startTime = Date.now();
    const maxDuration = 5 * 60 * 1000; // 5 minutos
    let lastStatus = prediction.status;
    let checkCount = 0;

    while (Date.now() - startTime < maxDuration) {
      checkCount++;
      
      try {
        const { data: currentPrediction, error: fetchError } = await supabase
          .from('replicate_predictions')
          .select('*')
          .eq('prediction_id', prediction.prediction_id)
          .single();

        if (fetchError) {
          console.log(`   ⚠️  Check ${checkCount}: Erro ao buscar predição`);
        } else {
          const now = new Date().toLocaleTimeString();
          
          if (currentPrediction.status !== lastStatus) {
            console.log(`   🔄 ${now}: Status mudou de '${lastStatus}' para '${currentPrediction.status}'`);
            lastStatus = currentPrediction.status;
            
            if (currentPrediction.status === 'succeeded') {
              console.log('   ✅ SUCESSO! Predição completada');
              console.log(`   🖼️  Output: ${currentPrediction.output_data}`);
              
              // Verificar se o curso foi atualizado
              await checkCourseUpdate(supabase, courseId);
              break;
            } else if (currentPrediction.status === 'failed') {
              console.log('   ❌ FALHA! Predição falhou');
              console.log(`   💥 Erro: ${currentPrediction.error_message}`);
              break;
            }
          } else {
            // Status não mudou, mostrar apenas a cada 4 checks (1 minuto)
            if (checkCount % 4 === 0) {
              console.log(`   📊 ${now}: Status = ${currentPrediction.status} (${checkCount} checks)`);
            }
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Check ${checkCount}: Erro inesperado`);
      }
      
      // Aguardar 15 segundos
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
    
    console.log('\n⏰ Monitoramento finalizado');
    
  } catch (error) {
    console.error('❌ Erro durante monitoramento:', error.message);
  }
}

/**
 * Verifica se o curso foi atualizado com a nova imagem
 */
async function checkCourseUpdate(supabase, courseId) {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('cover_image_url, thumbnail_url, updated_at')
      .eq('id', courseId)
      .single();

    if (error) {
      console.log('   ⚠️  Erro ao verificar curso');
    } else {
      console.log('\n📋 ESTADO DO CURSO:');
      console.log(`   cover_image_url: ${course.cover_image_url}`);
      console.log(`   thumbnail_url: ${course.thumbnail_url}`);
      console.log(`   Atualizado: ${course.updated_at}`);
      
      if (course.cover_image_url && course.cover_image_url !== 'https://example.com/test-image.png') {
        console.log('   ✅ Curso atualizado com nova imagem!');
        console.log('   🎯 Recarregue a página do AdminCourseEditor para ver a mudança');
      } else {
        console.log('   ⚠️  Curso ainda não foi atualizado');
        console.log('   💡 O webhook pode não estar funcionando corretamente');
      }
    }
  } catch (error) {
    console.log('   ⚠️  Erro inesperado ao verificar curso');
  }
}

// Capturar Ctrl+C para saída limpa
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitoramento interrompido pelo usuário');
  process.exit(0);
});

monitorPrediction();