const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function diagnoseImageDisplay() {
  // Usar variáveis hardcoded para teste rápido
  const supabaseUrl = 'https://ncrlojjfkhevjotchhxi.supabase.co';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5NzcyMywiZXhwIjoyMDY5NzczNzIzfQ.LMdGQjXhKLzixtVu4MQ5An7qytDtB9ylbZFYks_cJro';
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const courseId = 'fddbc02b-e27c-45fb-a35c-b6fed692db7a'; // Blue Team Fundamentos

  console.log('🔍 DIAGNÓSTICO RÁPIDO - PROBLEMA DA IMAGEM VAZIA');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar dados do curso
    console.log('\n1️⃣ VERIFICANDO DADOS DO CURSO...');
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, cover_image_url, thumbnail_url, updated_at')
      .eq('id', courseId)
      .single();

    if (courseError) {
      console.error('❌ Erro ao buscar curso:', courseError.message);
      return;
    }

    console.log('✅ Dados do curso:');
    console.log(`   Título: ${course.title}`);
    console.log(`   cover_image_url: ${course.cover_image_url}`);
    console.log(`   thumbnail_url: ${course.thumbnail_url}`);
    console.log(`   Atualizado em: ${course.updated_at}`);

    // 2. Verificar predições recentes
    console.log('\n2️⃣ VERIFICANDO PREDIÇÕES RECENTES...');
    const { data: predictions, error: predError } = await supabase
      .from('replicate_predictions')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (predError) {
      console.error('❌ Erro ao buscar predições:', predError.message);
    } else {
      console.log(`✅ Encontradas ${predictions.length} predições:`);
      predictions.forEach((pred, index) => {
        console.log(`   ${index + 1}. ID: ${pred.prediction_id}`);
        console.log(`      Status: ${pred.status}`);
        console.log(`      Output: ${pred.output || 'null'}`);
        console.log(`      Criado: ${pred.created_at}`);
        console.log(`      Atualizado: ${pred.updated_at}`);
        if (pred.error) {
          console.log(`      Erro: ${pred.error}`);
        }
        console.log('');
      });
    }

    // 3. Verificar capas na tabela course_covers
    console.log('\n3️⃣ VERIFICANDO TABELA COURSE_COVERS...');
    const { data: covers, error: coversError } = await supabase
      .from('course_covers')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (coversError) {
      console.error('❌ Erro ao buscar capas:', coversError.message);
    } else {
      console.log(`✅ Encontradas ${covers.length} capas:`);
      covers.forEach((cover, index) => {
        console.log(`   ${index + 1}. ID: ${cover.id}`);
        console.log(`      URL: ${cover.image_url}`);
        console.log(`      Ativa: ${cover.is_active}`);
        console.log(`      Criada: ${cover.created_at}`);
        console.log('');
      });
    }

    // 4. Testar acessibilidade da imagem
    if (course.cover_image_url) {
      console.log('\n4️⃣ TESTANDO ACESSIBILIDADE DA IMAGEM...');
      try {
        const response = await fetch(course.cover_image_url, { method: 'HEAD' });
        console.log(`✅ Status HTTP: ${response.status}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')}`);
        
        if (response.status === 200) {
          console.log('✅ Imagem acessível via HTTP');
        } else {
          console.log('❌ Imagem não acessível - Status:', response.status);
        }
      } catch (fetchError) {
        console.error('❌ Erro ao acessar imagem:', fetchError.message);
      }
    } else {
      console.log('\n4️⃣ ❌ NENHUMA URL DE IMAGEM DEFINIDA NO CURSO');
    }

    // 5. Verificar eventos de geração
    console.log('\n5️⃣ VERIFICANDO EVENTOS DE GERAÇÃO...');
    const { data: events, error: eventsError } = await supabase
      .from('generation_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (eventsError) {
      console.error('❌ Erro ao buscar eventos:', eventsError.message);
    } else {
      console.log(`✅ Últimos ${events.length} eventos:`);
      events.forEach((event, index) => {
        console.log(`   ${index + 1}. Tipo: ${event.event_type}`);
        console.log(`      Data: ${JSON.stringify(event.event_data, null, 2)}`);
        console.log(`      Criado: ${event.created_at}`);
        console.log('');
      });
    }

    // 6. Verificar logs das Edge Functions
    console.log('\n6️⃣ VERIFICANDO LOGS DAS EDGE FUNCTIONS...');
    try {
      const { data: logs, error: logsError } = await supabase.functions.invoke('get-function-logs', {
        body: { function_name: 'generate-course-cover', limit: 5 }
      });
      
      if (logsError) {
        console.log('⚠️  Não foi possível obter logs das Edge Functions');
      } else {
        console.log('✅ Logs obtidos com sucesso');
      }
    } catch (error) {
      console.log('⚠️  Função de logs não disponível');
    }

    // 7. Análise e recomendações
    console.log('\n7️⃣ ANÁLISE E RECOMENDAÇÕES...');
    
    if (!course.cover_image_url) {
      console.log('❌ PROBLEMA: Nenhuma URL de imagem definida no curso');
      console.log('💡 SOLUÇÃO: Executar geração de capa ou fazer upload manual');
    } else if (course.cover_image_url === 'https://example.com/test-image.png') {
      console.log('❌ PROBLEMA: URL de teste ainda presente');
      console.log('💡 SOLUÇÃO: Substituir por URL real de imagem');
    } else {
      console.log('✅ URL de imagem parece válida');
      console.log('💡 POSSÍVEIS CAUSAS:');
      console.log('   - Cache do navegador');
      console.log('   - Problema de CORS');
      console.log('   - Imagem corrompida');
      console.log('   - Problema de rede');
    }

    // 8. Verificar sincronização entre campos
    if (course.cover_image_url !== course.thumbnail_url) {
      console.log('\n⚠️  AVISO: Campos cover_image_url e thumbnail_url não sincronizados');
      console.log('💡 RECOMENDAÇÃO: Executar sincronização manual');
    }

    console.log('\n🎯 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('1. Verificar se a imagem carrega em uma nova aba do navegador');
    console.log('2. Limpar cache do navegador (Ctrl+F5)');
    console.log('3. Verificar console do navegador para erros de CORS');
    console.log('4. Tentar gerar nova capa se a atual estiver corrompida');
    console.log('5. Verificar se o webhook do Replicate está funcionando');

  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error.message);
  }
}

diagnoseImageDisplay();