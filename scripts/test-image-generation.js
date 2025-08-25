/**
 * Script de teste end-to-end para o sistema de geração de imagens
 * Testa todo o fluxo: geração → webhook → salvamento → exibição
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Cria um curso de teste
 */
async function createTestCourse() {
  console.log('📝 Criando curso de teste...');
  
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title: 'Curso de Teste - Geração de Imagens',
      description: 'Curso criado automaticamente para testar o sistema de geração de imagens com IA. Este curso aborda programação, design e tecnologia.',
      is_published: false,
      status: 'draft'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar curso: ${error.message}`);
  }

  console.log(`✅ Curso criado: ${data.id}`);
  return data;
}

/**
 * Testa a geração de capa
 */
async function testCoverGeneration(courseId, engine = 'flux') {
  console.log(`🎨 Testando geração de capa com engine: ${engine}`);
  
  const { data, error } = await supabase.functions.invoke('generate-course-cover', {
    body: {
      courseId,
      engine,
      regenerate: true
    }
  });

  if (error) {
    throw new Error(`Erro na geração: ${error.message}`);
  }

  if (!data?.success && !data?.predictionId) {
    throw new Error(`Resposta inesperada: ${JSON.stringify(data)}`);
  }

  console.log(`✅ Geração iniciada: ${data.predictionId}`);
  return data.predictionId;
}

/**
 * Monitora o progresso da predição
 */
async function monitorPrediction(predictionId, maxWaitTime = 300000) { // 5 minutos
  console.log(`⏳ Monitorando predição: ${predictionId}`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const { data, error } = await supabase
      .from('replicate_predictions')
      .select('*')
      .eq('prediction_id', predictionId)
      .single();

    if (error) {
      console.warn(`⚠️ Erro ao buscar predição: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }

    console.log(`📊 Status: ${data.status}`);

    if (data.status === 'succeeded') {
      console.log(`✅ Predição concluída com sucesso!`);
      console.log(`🖼️ Output: ${data.output}`);
      return data;
    }

    if (data.status === 'failed') {
      throw new Error(`Predição falhou: ${data.error}`);
    }

    // Aguardar antes da próxima verificação
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
  }

  throw new Error('Timeout: Predição não foi concluída no tempo esperado');
}

/**
 * Verifica se a capa foi atualizada no curso
 */
async function verifyCourseUpdate(courseId, originalCoverUrl) {
  console.log('🔍 Verificando atualização da capa no curso...');
  
  const { data, error } = await supabase
    .from('courses')
    .select('cover_image_url, thumbnail_url')
    .eq('id', courseId)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar curso: ${error.message}`);
  }

  if (!data.cover_image_url) {
    throw new Error('Capa não foi atualizada no curso');
  }

  if (data.cover_image_url === originalCoverUrl) {
    throw new Error('Capa não foi alterada');
  }

  console.log(`✅ Capa atualizada: ${data.cover_image_url}`);
  return data.cover_image_url;
}

/**
 * Testa o acesso à imagem
 */
async function testImageAccess(imageUrl) {
  console.log('🌐 Testando acesso à imagem...');
  
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error(`Tipo de conteúdo inválido: ${contentType}`);
    }

    console.log(`✅ Imagem acessível (${contentType})`);
    return true;
  } catch (error) {
    throw new Error(`Erro ao acessar imagem: ${error.message}`);
  }
}

/**
 * Limpa dados de teste
 */
async function cleanup(courseId) {
  console.log('🧹 Limpando dados de teste...');
  
  // Remover predições relacionadas
  await supabase
    .from('replicate_predictions')
    .delete()
    .eq('course_id', courseId);

  // Remover eventos relacionados
  await supabase
    .from('generation_events')
    .delete()
    .match({ 'event_data->>course_id': courseId });

  // Remover curso
  await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  console.log('✅ Limpeza concluída');
}

/**
 * Função principal de teste
 */
async function runTests() {
  console.log('🚀 Iniciando teste end-to-end do sistema de geração de imagens\n');
  
  let course = null;
  
  try {
    // 1. Criar curso de teste
    course = await createTestCourse();
    const originalCoverUrl = course.cover_image_url;
    
    // 2. Testar geração com Flux
    console.log('\n--- Testando com engine Flux ---');
    const fluxPredictionId = await testCoverGeneration(course.id, 'flux');
    const fluxResult = await monitorPrediction(fluxPredictionId);
    const fluxCoverUrl = await verifyCourseUpdate(course.id, originalCoverUrl);
    await testImageAccess(fluxCoverUrl);
    
    // 3. Testar geração com Recraft
    console.log('\n--- Testando com engine Recraft ---');
    const recraftPredictionId = await testCoverGeneration(course.id, 'recraft');
    const recraftResult = await monitorPrediction(recraftPredictionId);
    const recraftCoverUrl = await verifyCourseUpdate(course.id, fluxCoverUrl);
    await testImageAccess(recraftCoverUrl);
    
    // 4. Verificar estatísticas
    console.log('\n--- Verificando estatísticas ---');
    const { data: stats } = await supabase.rpc('get_generation_stats');
    console.log(`📊 Estatísticas:`, stats);
    
    console.log('\n🎉 Todos os testes passaram com sucesso!');
    console.log('\n📋 Resumo:');
    console.log(`   • Curso criado: ${course.id}`);
    console.log(`   • Flux - Predição: ${fluxPredictionId}`);
    console.log(`   • Flux - Capa: ${fluxCoverUrl}`);
    console.log(`   • Recraft - Predição: ${recraftPredictionId}`);
    console.log(`   • Recraft - Capa: ${recraftCoverUrl}`);
    
  } catch (error) {
    console.error(`\n❌ Teste falhou: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (course) {
      await cleanup(course.id);
    }
  }
}

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };