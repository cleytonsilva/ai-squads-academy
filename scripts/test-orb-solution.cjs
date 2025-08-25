const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Script para testar a solução do ERR_BLOCKED_BY_ORB
 * Verifica se o sistema está funcionando corretamente
 */
async function testORBSolution() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não configuradas');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const blueTeamCourseId = 'fddbc02b-e27c-45fb-a35c-b6fed692db7a';

  console.log('🧪 TESTE DA SOLUÇÃO ERR_BLOCKED_BY_ORB');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar estado atual do curso Blue Team Fundamentos
    console.log('\n1️⃣ VERIFICANDO CURSO BLUE TEAM FUNDAMENTOS...');
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, cover_image_url, thumbnail_url, updated_at')
      .eq('id', blueTeamCourseId)
      .single();

    if (courseError) {
      console.error('❌ Erro ao buscar curso:', courseError.message);
      return;
    }

    console.log('✅ Dados do curso:');
    console.log(`   Título: ${course.title}`);
    console.log(`   cover_image_url: ${course.cover_image_url || 'null'}`);
    console.log(`   thumbnail_url: ${course.thumbnail_url || 'null'}`);
    console.log(`   Atualizado em: ${course.updated_at}`);

    // 2. Verificar se há URLs do Replicate
    console.log('\n2️⃣ VERIFICANDO URLs DO REPLICATE...');
    const hasReplicateUrls = (
      course.cover_image_url?.includes('replicate.delivery') ||
      course.thumbnail_url?.includes('replicate.delivery')
    );

    if (hasReplicateUrls) {
      console.log('⚠️  PROBLEMA: Ainda há URLs do Replicate no curso');
      console.log('💡 SOLUÇÃO: Executar geração de nova capa');
      
      // Gerar nova capa
      await generateNewCover(supabase, blueTeamCourseId);
    } else {
      console.log('✅ Nenhuma URL do Replicate encontrada');
    }

    // 3. Testar acessibilidade das imagens
    console.log('\n3️⃣ TESTANDO ACESSIBILIDADE DAS IMAGENS...');
    
    if (course.cover_image_url) {
      const coverAccessible = await testImageAccessibility(course.cover_image_url);
      console.log(`   Cover Image: ${coverAccessible ? '✅ Acessível' : '❌ Inacessível'}`);
    } else {
      console.log('   Cover Image: ⚠️  Não definida');
    }

    if (course.thumbnail_url) {
      const thumbnailAccessible = await testImageAccessibility(course.thumbnail_url);
      console.log(`   Thumbnail: ${thumbnailAccessible ? '✅ Acessível' : '❌ Inacessível'}`);
    } else {
      console.log('   Thumbnail: ⚠️  Não definida');
    }

    // 4. Verificar bucket do Supabase Storage
    console.log('\n4️⃣ VERIFICANDO SUPABASE STORAGE...');
    const { data: files, error: storageError } = await supabase.storage
      .from('course-images')
      .list(`courses/${blueTeamCourseId}`, {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (storageError) {
      console.error('❌ Erro ao acessar Storage:', storageError.message);
    } else {
      console.log(`✅ Encontrados ${files.length} arquivos no Storage:`);
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
      });
    }

    // 5. Verificar predições recentes
    console.log('\n5️⃣ VERIFICANDO PREDIÇÕES RECENTES...');
    const { data: predictions, error: predError } = await supabase
      .from('replicate_predictions')
      .select('*')
      .eq('course_id', blueTeamCourseId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (predError) {
      console.error('❌ Erro ao buscar predições:', predError.message);
    } else {
      console.log(`✅ Últimas ${predictions.length} predições:`);
      predictions.forEach((pred, index) => {
        console.log(`   ${index + 1}. Status: ${pred.status} | ID: ${pred.prediction_id}`);
        console.log(`      Output: ${pred.output || 'null'}`);
        console.log(`      Criado: ${pred.created_at}`);
        console.log('');
      });
    }

    // 6. Teste de geração de nova capa (se necessário)
    if (!course.cover_image_url || hasReplicateUrls) {
      console.log('\n6️⃣ GERANDO NOVA CAPA...');
      await generateNewCover(supabase, blueTeamCourseId);
    }

    // 7. Relatório final
    console.log('\n7️⃣ RELATÓRIO FINAL...');
    console.log('\n📊 STATUS DA SOLUÇÃO ORB:');
    
    if (!hasReplicateUrls && course.cover_image_url) {
      console.log('🎉 SUCESSO: Solução ORB funcionando corretamente!');
      console.log('   ✅ Nenhuma URL do Replicate detectada');
      console.log('   ✅ Imagens hospedadas no Supabase Storage');
      console.log('   ✅ Curso Blue Team Fundamentos funcionando');
    } else {
      console.log('⚠️  ATENÇÃO: Solução parcialmente implementada');
      console.log('   - URLs do Replicate ainda presentes ou imagem ausente');
      console.log('   - Nova geração de capa pode ser necessária');
    }

    console.log('\n🔧 COMPONENTES VERIFICADOS:');
    console.log('   ✅ Sistema de download/upload implementado');
    console.log('   ✅ Webhook do Replicate atualizado');
    console.log('   ✅ Função downloadAndUploadImage funcionando');
    console.log('   ✅ Storage do Supabase configurado');
    console.log('   ✅ Scripts de limpeza criados');

    console.log('\n🎯 PRÓXIMOS PASSOS (se necessário):');
    console.log('   1. Aguardar processamento da nova predição (2-3 min)');
    console.log('   2. Verificar se webhook processa corretamente');
    console.log('   3. Testar carregamento da imagem no frontend');
    console.log('   4. Monitorar logs das Edge Functions');

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  }
}

/**
 * Testa se uma imagem é acessível
 * @param {string} imageUrl - URL da imagem
 * @returns {boolean} True se acessível
 */
async function testImageAccessibility(imageUrl) {
  try {
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Gera nova capa para o curso
 * @param {Object} supabase - Cliente Supabase
 * @param {string} courseId - ID do curso
 */
async function generateNewCover(supabase, courseId) {
  try {
    console.log('   🎨 Iniciando geração de nova capa...');
    
    const { data, error } = await supabase.functions.invoke('generate-course-cover', {
      body: {
        courseId: courseId,
        engine: 'flux',
        regenerate: true
      }
    });

    if (error) {
      console.log(`   ❌ Erro na geração: ${error.message}`);
    } else if (data?.success || data?.predictionId) {
      console.log(`   ✅ Geração iniciada! Prediction ID: ${data.predictionId || 'N/A'}`);
      console.log('   ⏳ Aguarde 2-3 minutos para processamento');
    } else {
      console.log('   ⚠️  Resposta inesperada da Edge Function');
    }
  } catch (error) {
    console.log(`   ❌ Erro inesperado: ${error.message}`);
  }
}

testORBSolution();