const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkWebhookEvents() {
  console.log('🔍 Verificando eventos de webhook e predições...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Verificar predições recentes
    console.log('\n📊 Verificando predições recentes...');
    const { data: predictions, error: predError } = await supabase
      .from('replicate_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (predError) {
      console.error('❌ Erro ao buscar predições:', predError);
    } else {
      console.log(`✅ Encontradas ${predictions.length} predições recentes:`);
      predictions.forEach((pred, index) => {
        console.log(`   ${index + 1}. ID: ${pred.prediction_id}`);
        console.log(`      Status: ${pred.status}`);
        console.log(`      Criado: ${pred.created_at}`);
        console.log(`      Atualizado: ${pred.updated_at}`);
        console.log(`      Output: ${pred.output ? 'Sim' : 'Não'}`);
        console.log('');
      });
    }
    
    // 2. Verificar eventos de geração
    console.log('📋 Verificando eventos de geração...');
    const { data: events, error: eventError } = await supabase
      .from('generation_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (eventError) {
      console.error('❌ Erro ao buscar eventos:', eventError);
    } else {
      console.log(`✅ Encontrados ${events.length} eventos recentes:`);
      events.forEach((event, index) => {
        console.log(`   ${index + 1}. Tipo: ${event.event_type}`);
        console.log(`      Data: ${event.created_at}`);
        console.log(`      Dados: ${JSON.stringify(event.event_data, null, 6)}`);
        console.log('');
      });
    }
    
    // 3. Verificar predições específicas dos logs
    const predictionIds = [
      '49k3166b75rma0crsphtd170tm',
      'qkr2wqxjy1rme0crsph85x20jg', 
      'qxgvcsxavsrmc0crspgvnr6n1c'
    ];
    
    console.log('🎯 Verificando predições específicas dos logs...');
    for (const predId of predictionIds) {
      const { data: pred, error } = await supabase
        .from('replicate_predictions')
        .select('*')
        .eq('prediction_id', predId)
        .single();
        
      if (error) {
        console.log(`   ❌ ${predId}: Não encontrada (${error.message})`);
      } else {
        console.log(`   ✅ ${predId}:`);
        console.log(`      Status: ${pred.status}`);
        console.log(`      Output: ${pred.output || 'Nenhum'}`);
        console.log(`      Erro: ${pred.error || 'Nenhum'}`);
        console.log(`      Atualizado: ${pred.updated_at}`);
      }
    }
    
    // 4. Verificar curso Blue Team Fundamentos
    console.log('\n🎓 Verificando curso Blue Team Fundamentos...');
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, cover_image_url, thumbnail_url, updated_at')
      .eq('id', 'fddbc02b-e27c-45fb-a35c-b6fed692db7a')
      .single();
      
    if (courseError) {
      console.error('❌ Erro ao buscar curso:', courseError);
    } else {
      console.log('✅ Dados do curso:');
      console.log(`   Título: ${course.title}`);
      console.log(`   Cover URL: ${course.cover_image_url || 'Nenhuma'}`);
      console.log(`   Thumbnail URL: ${course.thumbnail_url || 'Nenhuma'}`);
      console.log(`   Atualizado: ${course.updated_at}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkWebhookEvents().catch(console.error);