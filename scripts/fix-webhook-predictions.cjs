const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixWebhookPredictions() {
  console.log('🔧 Corrigindo predições pendentes do webhook...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  
  if (!supabaseUrl || !supabaseKey || !replicateToken) {
    console.error('❌ Variáveis de ambiente não encontradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Buscar predições pendentes
    console.log('\n📊 Buscando predições pendentes...');
    const { data: predictions, error } = await supabase
      .from('replicate_predictions')
      .select('*')
      .eq('status', 'starting')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('❌ Erro ao buscar predições:', error);
      return;
    }
    
    console.log(`✅ Encontradas ${predictions.length} predições pendentes`);
    
    // 2. Verificar status no Replicate e processar
    for (const pred of predictions) {
      console.log(`\n🔍 Verificando predição: ${pred.prediction_id}`);
      
      try {
        // Buscar status atual no Replicate
        const response = await fetch(`https://api.replicate.com/v1/predictions/${pred.prediction_id}`, {
          headers: {
            'Authorization': `Token ${replicateToken}`
          }
        });
        
        if (!response.ok) {
          console.log(`   ❌ Erro ${response.status} ao buscar no Replicate`);
          continue;
        }
        
        const replicateData = await response.json();
        console.log(`   📊 Status no Replicate: ${replicateData.status}`);
        console.log(`   📊 Status local: ${pred.status}`);
        
        // Se o status mudou, atualizar localmente
        if (replicateData.status !== pred.status) {
          console.log(`   🔄 Atualizando status local...`);
          
          const updateData = {
            status: replicateData.status,
            updated_at: new Date().toISOString()
          };
          
          if (replicateData.status === 'succeeded' && replicateData.output) {
            updateData.output_data = Array.isArray(replicateData.output) ? replicateData.output[0] : replicateData.output;
            
            console.log(`   🎯 Imagem gerada: ${updateData.output_data}`);
            
            // Atualizar curso com a nova imagem
            if (pred.course_id) {
              console.log(`   📝 Atualizando curso ${pred.course_id}...`);
              
              const { error: courseError } = await supabase
                .from('courses')
                .update({
                  cover_image_url: updateData.output_data,
                  thumbnail_url: updateData.output_data,
                  updated_at: new Date().toISOString()
                })
                .eq('id', pred.course_id);
                
              if (courseError) {
                console.error(`   ❌ Erro ao atualizar curso:`, courseError);
              } else {
                console.log(`   ✅ Curso atualizado com sucesso`);
              }
            }
          } else if (replicateData.status === 'failed') {
            updateData.error_message = replicateData.error || 'Erro desconhecido';
            console.log(`   ❌ Predição falhou: ${updateData.error_message}`);
          }
          
          // Atualizar predição
          const { error: updateError } = await supabase
            .from('replicate_predictions')
            .update(updateData)
            .eq('prediction_id', pred.prediction_id);
            
          if (updateError) {
            console.error(`   ❌ Erro ao atualizar predição:`, updateError);
          } else {
            console.log(`   ✅ Predição atualizada: ${pred.status} → ${replicateData.status}`);
          }
        } else {
          console.log(`   ℹ️  Status já sincronizado`);
        }
        
      } catch (error) {
        console.error(`   ❌ Erro ao processar predição:`, error.message);
      }
    }
    
    // 3. Verificar se há predições muito antigas para marcar como falha
    console.log('\n🧹 Limpando predições muito antigas...');
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutos atrás
    
    const { data: oldPredictions, error: oldError } = await supabase
      .from('replicate_predictions')
      .select('*')
      .eq('status', 'starting')
      .lt('created_at', cutoffTime);
      
    if (oldError) {
      console.error('❌ Erro ao buscar predições antigas:', oldError);
    } else if (oldPredictions.length > 0) {
      console.log(`📊 Encontradas ${oldPredictions.length} predições antigas`);
      
      for (const oldPred of oldPredictions) {
        console.log(`   🗑️  Marcando como falha: ${oldPred.prediction_id}`);
        
        const { error: failError } = await supabase
          .from('replicate_predictions')
          .update({
            status: 'failed',
            error_message: 'Timeout - webhook não recebido',
            updated_at: new Date().toISOString()
          })
          .eq('prediction_id', oldPred.prediction_id);
          
        if (failError) {
          console.error(`   ❌ Erro ao marcar como falha:`, failError);
        } else {
          console.log(`   ✅ Marcada como falha`);
        }
      }
    }
    
    console.log('\n🎉 Correção concluída!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Verifique se o webhook está configurado no Replicate Dashboard');
    console.log('   2. URL do webhook: https://ncrlojjfkhevjotchhxi.supabase.co/functions/v1/replicate-webhook');
    console.log('   3. Eventos: predictions.*');
    console.log('   4. Secret: whsec_2lFI4Fz2hirUC9LscDnQuEn6NwVSABG4');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixWebhookPredictions().catch(console.error);