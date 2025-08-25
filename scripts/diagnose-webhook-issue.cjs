const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function diagnoseWebhookIssue() {
  console.log('🔍 Diagnosticando problema do webhook do Replicate...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  
  if (!supabaseUrl || !supabaseKey || !replicateToken) {
    console.error('❌ Variáveis de ambiente não encontradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('\n📋 1. Verificando configuração do webhook...');
    
    // Verificar se a URL do webhook está correta
    const expectedWebhookUrl = `${supabaseUrl}/functions/v1/replicate-webhook`;
    console.log(`   URL esperada do webhook: ${expectedWebhookUrl}`);
    
    // Verificar se a Edge Function está ativa
    console.log('\n🔧 2. Testando Edge Function do webhook...');
    try {
      const testResponse = await fetch(expectedWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'replicate-signature': 'sha256=test'
        },
        body: JSON.stringify({
          id: 'test-prediction',
          status: 'starting'
        })
      });
      
      console.log(`   Status da resposta: ${testResponse.status}`);
      if (testResponse.status === 401) {
        console.log('   ✅ Edge Function está ativa (erro 401 esperado para assinatura inválida)');
      } else {
        console.log(`   ⚠️  Resposta inesperada: ${testResponse.status}`);
      }
    } catch (error) {
      console.error('   ❌ Erro ao testar Edge Function:', error.message);
    }
    
    console.log('\n🔍 3. Verificando predições pendentes...');
    
    // Buscar predições que estão há muito tempo em 'starting'
    const { data: oldPredictions, error: oldError } = await supabase
      .from('replicate_predictions')
      .select('*')
      .eq('status', 'starting')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Mais de 10 minutos
      .order('created_at', { ascending: false });
      
    if (oldError) {
      console.error('   ❌ Erro ao buscar predições antigas:', oldError);
    } else {
      console.log(`   📊 Encontradas ${oldPredictions.length} predições antigas em 'starting'`);
      
      if (oldPredictions.length > 0) {
        console.log('   🔍 Verificando status no Replicate...');
        
        for (const pred of oldPredictions.slice(0, 3)) { // Verificar apenas as 3 mais recentes
          try {
            const replicateResponse = await fetch(`https://api.replicate.com/v1/predictions/${pred.prediction_id}`, {
              headers: {
                'Authorization': `Token ${replicateToken}`
              }
            });
            
            if (replicateResponse.ok) {
              const replicateData = await replicateResponse.json();
              console.log(`      ${pred.prediction_id}: ${replicateData.status} (local: ${pred.status})`);
              
              if (replicateData.status !== pred.status) {
                console.log(`      ⚠️  Dessincronia detectada! Replicate: ${replicateData.status}, Local: ${pred.status}`);
                
                // Se a predição foi concluída no Replicate mas não localmente
                if (replicateData.status === 'succeeded' && replicateData.output) {
                  console.log(`      🎯 Predição concluída no Replicate mas não processada localmente`);
                  console.log(`      📸 Output: ${replicateData.output}`);
                  
                  // Simular chamada do webhook
                  console.log(`      🔄 Tentando processar manualmente...`);
                  try {
                    const webhookResponse = await fetch(expectedWebhookUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'replicate-signature': await generateTestSignature(JSON.stringify(replicateData))
                      },
                      body: JSON.stringify(replicateData)
                    });
                    
                    console.log(`      📡 Resposta do webhook manual: ${webhookResponse.status}`);
                  } catch (webhookError) {
                    console.error(`      ❌ Erro no webhook manual:`, webhookError.message);
                  }
                }
              }
            } else {
              console.log(`      ${pred.prediction_id}: Erro ${replicateResponse.status}`);
            }
          } catch (error) {
            console.error(`      ❌ Erro ao verificar ${pred.prediction_id}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n📊 4. Verificando configuração do webhook no Replicate...');
    
    // Verificar webhooks configurados
    try {
      const webhooksResponse = await fetch('https://api.replicate.com/v1/webhooks', {
        headers: {
          'Authorization': `Token ${replicateToken}`
        }
      });
      
      if (webhooksResponse.ok) {
        const webhooks = await webhooksResponse.json();
        console.log(`   📋 Webhooks configurados: ${webhooks.results?.length || 0}`);
        
        const ourWebhook = webhooks.results?.find(w => w.url === expectedWebhookUrl);
        if (ourWebhook) {
          console.log('   ✅ Webhook encontrado no Replicate');
          console.log(`      Status: ${ourWebhook.status || 'ativo'}`);
          console.log(`      Eventos: ${ourWebhook.events?.join(', ') || 'todos'}`);
        } else {
          console.log('   ❌ Webhook NÃO encontrado no Replicate!');
          console.log('   💡 Solução: Configure o webhook no dashboard do Replicate:');
          console.log(`      URL: ${expectedWebhookUrl}`);
          console.log('      Eventos: predictions.*');
          console.log('      Secret: whsec_2lFI4Fz2hirUC9LscDnQuEn6NwVSABG4');
        }
      } else {
        console.log(`   ⚠️  Erro ao verificar webhooks: ${webhooksResponse.status}`);
      }
    } catch (error) {
      console.error('   ❌ Erro ao verificar webhooks:', error.message);
    }
    
    console.log('\n🎯 5. Recomendações:');
    
    if (oldPredictions && oldPredictions.length > 0) {
      console.log('   🔧 Há predições pendentes que precisam ser processadas');
      console.log('   💡 Execute o script de correção para processar manualmente');
    }
    
    console.log('   📋 Verifique se o webhook está configurado no dashboard do Replicate');
    console.log('   🔍 Monitore os logs da Edge Function replicate-webhook');
    console.log('   ⚡ Considere recriar predições muito antigas');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Função auxiliar para gerar assinatura de teste
async function generateTestSignature(body) {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET || 'whsec_2lFI4Fz2hirUC9LscDnQuEn6NwVSABG4';
  const cleanSecret = secret.replace('whsec_', '');
  
  // Simular assinatura (não será válida, mas serve para teste)
  return 'sha256=test_signature';
}

diagnoseWebhookIssue().catch(console.error);