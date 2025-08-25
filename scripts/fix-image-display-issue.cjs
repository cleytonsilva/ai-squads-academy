const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixImageDisplayIssue() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não configuradas');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const courseId = 'fddbc02b-e27c-45fb-a35c-b6fed692db7a'; // Blue Team Fundamentos

  console.log('🔧 CORREÇÃO DO PROBLEMA DA IMAGEM VAZIA');
  console.log('=' .repeat(50));

  try {
    // 1. Marcar predições antigas como failed (timeout)
    console.log('\n1️⃣ LIMPANDO PREDIÇÕES ANTIGAS...');
    
    const { data: oldPredictions, error: fetchError } = await supabase
      .from('replicate_predictions')
      .select('*')
      .eq('course_id', courseId)
      .eq('status', 'starting')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Mais de 10 minutos

    if (fetchError) {
      console.error('❌ Erro ao buscar predições antigas:', fetchError.message);
    } else {
      console.log(`✅ Encontradas ${oldPredictions.length} predições antigas para limpar`);
      
      if (oldPredictions.length > 0) {
        const { error: updateError } = await supabase
          .from('replicate_predictions')
          .update({
            status: 'failed',
            error_message: 'Timeout - Predição não processada pelo webhook',
            updated_at: new Date().toISOString()
          })
          .eq('course_id', courseId)
          .eq('status', 'starting')
          .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

        if (updateError) {
          console.error('❌ Erro ao atualizar predições:', updateError.message);
        } else {
          console.log('✅ Predições antigas marcadas como failed');
        }
      }
    }

    // 2. Remover URL de teste do curso
    console.log('\n2️⃣ REMOVENDO URL DE TESTE...');
    
    const { error: removeTestUrlError } = await supabase
      .from('courses')
      .update({
        cover_image_url: null,
        thumbnail_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .eq('cover_image_url', 'https://example.com/test-image.png');

    if (removeTestUrlError) {
      console.error('❌ Erro ao remover URL de teste:', removeTestUrlError.message);
    } else {
      console.log('✅ URL de teste removida');
    }

    // 3. Gerar nova capa
    console.log('\n3️⃣ GERANDO NOVA CAPA...');
    
    try {
      const { data: generateData, error: generateError } = await supabase.functions.invoke('generate-course-cover', {
        body: {
          courseId,
          engine: 'flux',
          regenerate: true
        }
      });

      if (generateError) {
        console.error('❌ Erro na geração:', generateError.message);
      } else if (generateData?.success || generateData?.predictionId) {
        console.log('✅ Nova geração iniciada!');
        console.log(`   Prediction ID: ${generateData.predictionId}`);
        console.log('   ⏳ Aguarde 2-3 minutos para a imagem ser processada');
        
        // 4. Monitorar progresso
        console.log('\n4️⃣ MONITORANDO PROGRESSO...');
        await monitorPrediction(supabase, generateData.predictionId);
        
      } else {
        console.error('❌ Resposta inesperada:', generateData);
      }
    } catch (error) {
      console.error('❌ Erro inesperado na geração:', error.message);
    }

    // 5. Verificar resultado final
    console.log('\n5️⃣ VERIFICANDO RESULTADO...');
    
    const { data: finalCourse, error: finalError } = await supabase
      .from('courses')
      .select('cover_image_url, thumbnail_url, updated_at')
      .eq('id', courseId)
      .single();

    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log('✅ Estado final do curso:');
      console.log(`   cover_image_url: ${finalCourse.cover_image_url}`);
      console.log(`   thumbnail_url: ${finalCourse.thumbnail_url}`);
      console.log(`   Atualizado: ${finalCourse.updated_at}`);
    }

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Aguardar 2-3 minutos para a nova predição completar');
    console.log('2. Recarregar a página do AdminCourseEditor (F5)');
    console.log('3. Verificar se a nova imagem aparece');
    console.log('4. Se não funcionar, verificar webhook do Replicate');

  } catch (error) {
    console.error('❌ Erro durante correção:', error.message);
  }
}

/**
 * Monitora o progresso de uma predição
 */
async function monitorPrediction(supabase, predictionId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { data: prediction, error } = await supabase
        .from('replicate_predictions')
        .select('*')
        .eq('prediction_id', predictionId)
        .single();

      if (error) {
        console.log(`   ⚠️  Tentativa ${i + 1}: Erro ao buscar predição`);
      } else {
        console.log(`   📊 Tentativa ${i + 1}: Status = ${prediction.status}`);
        
        if (prediction.status === 'succeeded') {
          console.log('   ✅ Predição completada com sucesso!');
          console.log(`   🖼️  Output: ${prediction.output}`);
          return true;
        } else if (prediction.status === 'failed') {
          console.log('   ❌ Predição falhou');
          console.log(`   💥 Erro: ${prediction.error}`);
          return false;
        }
      }
      
      // Aguardar 15 segundos antes da próxima verificação
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    } catch (error) {
      console.log(`   ⚠️  Tentativa ${i + 1}: Erro inesperado`);
    }
  }
  
  console.log('   ⏰ Timeout no monitoramento - continue verificando manualmente');
  return false;
}

fixImageDisplayIssue();