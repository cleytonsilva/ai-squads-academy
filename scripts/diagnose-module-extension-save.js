/**
 * Script de Diagnóstico - Problema de Salvamento de Conteúdo Estendido
 * 
 * Este script investiga o problema onde o conteúdo estendido com IA
 * não está sendo persistido após salvar e recarregar a página.
 * 
 * Fluxo de teste:
 * 1. Simular extensão de módulo com IA
 * 2. Verificar concatenação no estado
 * 3. Testar salvamento no banco
 * 4. Verificar persistência após reload
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configurações do teste
const TEST_CONFIG = {
  // ID de um módulo existente para teste (será buscado dinamicamente)
  moduleId: null,
  // Conteúdo original simulado
  originalContent: '<p>Este é o conteúdo original do módulo.</p>',
  // Conteúdo estendido simulado (como se viesse da IA)
  extendedContent: '<p>Este é o conteúdo adicional gerado pela IA com exemplos práticos e exercícios.</p>',
  // Título do módulo para teste
  moduleTitle: 'Módulo de Teste - Diagnóstico'
};

/**
 * Função para adicionar logs com timestamp
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Buscar um módulo existente para teste
 */
async function findTestModule() {
  try {
    log('Buscando módulo existente para teste...');
    
    const { data: modules, error } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .limit(1);
    
    if (error) throw error;
    
    if (!modules || modules.length === 0) {
      log('Nenhum módulo encontrado. Criando módulo de teste...', 'warning');
      return await createTestModule();
    }
    
    const module = modules[0];
    TEST_CONFIG.moduleId = module.id;
    TEST_CONFIG.moduleTitle = module.title;
    
    // Extrair conteúdo HTML atual
    if (module.content_jsonb && module.content_jsonb.html) {
      TEST_CONFIG.originalContent = module.content_jsonb.html;
    }
    
    log(`Módulo encontrado: ${module.title} (ID: ${module.id})`, 'success');
    return module;
    
  } catch (error) {
    log(`Erro ao buscar módulo: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Criar um módulo de teste se necessário
 */
async function createTestModule() {
  try {
    log('Criando módulo de teste...');
    
    // Primeiro, buscar um curso existente
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (courseError) throw courseError;
    
    if (!courses || courses.length === 0) {
      throw new Error('Nenhum curso encontrado. Crie um curso primeiro.');
    }
    
    const courseId = courses[0].id;
    
    const { data: module, error } = await supabase
      .from('modules')
      .insert({
        course_id: courseId,
        title: TEST_CONFIG.moduleTitle,
        content_jsonb: { html: TEST_CONFIG.originalContent },
        order_index: 999 // Colocar no final
      })
      .select()
      .single();
    
    if (error) throw error;
    
    TEST_CONFIG.moduleId = module.id;
    log(`Módulo de teste criado: ${module.id}`, 'success');
    
    return module;
    
  } catch (error) {
    log(`Erro ao criar módulo de teste: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Simular o processo de extensão com IA
 */
function simulateAIExtension() {
  log('Simulando extensão com IA...');
  
  // Simular o que acontece no AIModuleExtendDialog
  const currentHtml = TEST_CONFIG.originalContent;
  const extendedHtml = TEST_CONFIG.extendedContent;
  
  // Simular a concatenação que acontece no onExtended callback
  const combinedContent = `${currentHtml}\n${extendedHtml}`;
  
  log(`Conteúdo original: ${currentHtml}`, 'debug');
  log(`Conteúdo estendido: ${extendedHtml}`, 'debug');
  log(`Conteúdo combinado: ${combinedContent}`, 'debug');
  
  return combinedContent;
}

/**
 * Testar o salvamento no banco de dados
 */
async function testSaveToDatabase(content) {
  try {
    log('Testando salvamento no banco de dados...');
    
    // Simular o que acontece no handleSaveModule
    const { error } = await supabase
      .from('modules')
      .update({ 
        title: TEST_CONFIG.moduleTitle,
        content_jsonb: { html: content }
      })
      .eq('id', TEST_CONFIG.moduleId);
    
    if (error) throw error;
    
    log('Salvamento realizado com sucesso', 'success');
    return true;
    
  } catch (error) {
    log(`Erro no salvamento: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Verificar se o conteúdo foi persistido corretamente
 */
async function verifyPersistence() {
  try {
    log('Verificando persistência dos dados...');
    
    const { data: module, error } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('id', TEST_CONFIG.moduleId)
      .single();
    
    if (error) throw error;
    
    const savedContent = module.content_jsonb?.html || '';
    
    log(`Conteúdo salvo no banco: ${savedContent}`, 'debug');
    
    // Verificar se o conteúdo estendido está presente
    const hasOriginalContent = savedContent.includes(TEST_CONFIG.originalContent.replace(/<[^>]*>/g, '').trim());
    const hasExtendedContent = savedContent.includes(TEST_CONFIG.extendedContent.replace(/<[^>]*>/g, '').trim());
    
    log(`Contém conteúdo original: ${hasOriginalContent}`, hasOriginalContent ? 'success' : 'error');
    log(`Contém conteúdo estendido: ${hasExtendedContent}`, hasExtendedContent ? 'success' : 'error');
    
    return {
      hasOriginalContent,
      hasExtendedContent,
      savedContent
    };
    
  } catch (error) {
    log(`Erro na verificação: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Simular o processo de reload/refetch
 */
async function simulateReload() {
  try {
    log('Simulando reload da página (refetch dos dados)...');
    
    // Simular o que acontece quando a página é recarregada
    // e os dados são buscados novamente
    const { data: module, error } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('id', TEST_CONFIG.moduleId)
      .single();
    
    if (error) throw error;
    
    // Simular a função getHtml
    function getHtml(payload) {
      try {
        if (payload && typeof payload === 'object' && payload !== null && 'html' in payload) {
          return payload.html || '';
        }
        return typeof payload === 'string' ? payload : '';
      } catch {
        return '';
      }
    }
    
    const reloadedContent = getHtml(module.content_jsonb);
    
    log(`Conteúdo após reload: ${reloadedContent}`, 'debug');
    
    return reloadedContent;
    
  } catch (error) {
    log(`Erro no reload: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Analisar possíveis problemas
 */
function analyzeIssues(results) {
  log('\n=== ANÁLISE DE PROBLEMAS ===');
  
  const issues = [];
  
  if (!results.persistence.hasOriginalContent) {
    issues.push('❌ Conteúdo original foi perdido durante o salvamento');
  }
  
  if (!results.persistence.hasExtendedContent) {
    issues.push('❌ Conteúdo estendido não foi salvo corretamente');
  }
  
  if (results.combinedContent !== results.reloadedContent) {
    issues.push('❌ Conteúdo após reload difere do conteúdo combinado');
    log(`Esperado: ${results.combinedContent}`, 'debug');
    log(`Obtido: ${results.reloadedContent}`, 'debug');
  }
  
  if (issues.length === 0) {
    log('✅ Nenhum problema detectado! O fluxo está funcionando corretamente.', 'success');
  } else {
    log('Problemas detectados:', 'error');
    issues.forEach(issue => log(issue, 'error'));
  }
  
  return issues;
}

/**
 * Sugestões de correção
 */
function provideSuggestions(issues) {
  if (issues.length === 0) return;
  
  log('\n=== SUGESTÕES DE CORREÇÃO ===');
  
  log('1. Verificar se o estado moduleHtml está sendo atualizado corretamente no AdminCourseEditor', 'warning');
  log('2. Confirmar se a função setModuleHtml está concatenando o conteúdo adequadamente', 'warning');
  log('3. Verificar se não há problemas de encoding/escaping no conteúdo HTML', 'warning');
  log('4. Confirmar se o handleSaveModule está usando o estado mais recente', 'warning');
  log('5. Verificar se há problemas de timing (race conditions) entre extensão e salvamento', 'warning');
  log('6. Confirmar se a estrutura content_jsonb está sendo mantida corretamente', 'warning');
}

/**
 * Limpeza - remover módulo de teste se foi criado
 */
async function cleanup() {
  try {
    if (TEST_CONFIG.moduleTitle === 'Módulo de Teste - Diagnóstico') {
      log('Removendo módulo de teste...');
      
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', TEST_CONFIG.moduleId);
      
      if (error) throw error;
      
      log('Módulo de teste removido', 'success');
    }
  } catch (error) {
    log(`Erro na limpeza: ${error.message}`, 'warning');
  }
}

/**
 * Função principal de diagnóstico
 */
async function runDiagnosis() {
  try {
    log('🚀 Iniciando diagnóstico do problema de salvamento de conteúdo estendido\n');
    
    // 1. Encontrar ou criar módulo de teste
    await findTestModule();
    
    // 2. Simular extensão com IA
    const combinedContent = simulateAIExtension();
    
    // 3. Testar salvamento
    const saveSuccess = await testSaveToDatabase(combinedContent);
    
    if (!saveSuccess) {
      log('Falha no salvamento. Abortando diagnóstico.', 'error');
      return;
    }
    
    // 4. Verificar persistência
    const persistence = await verifyPersistence();
    
    if (!persistence) {
      log('Falha na verificação de persistência. Abortando diagnóstico.', 'error');
      return;
    }
    
    // 5. Simular reload
    const reloadedContent = await simulateReload();
    
    // 6. Compilar resultados
    const results = {
      combinedContent,
      persistence,
      reloadedContent
    };
    
    // 7. Analisar problemas
    const issues = analyzeIssues(results);
    
    // 8. Fornecer sugestões
    provideSuggestions(issues);
    
    log('\n=== DIAGNÓSTICO CONCLUÍDO ===', 'success');
    
    // 9. Limpeza
    await cleanup();
    
  } catch (error) {
    log(`Erro fatal no diagnóstico: ${error.message}`, 'error');
    console.error(error);
  }
}

// Executar diagnóstico
runDiagnosis();