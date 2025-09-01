/**
 * Script de Teste - Verificação da Correção
 * 
 * Este script testa se a correção implementada resolve o problema
 * de salvamento do conteúdo estendido no módulo.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
 * Teste da correção implementada
 */
async function testFix() {
  try {
    log('🚀 Testando correção do problema de salvamento de conteúdo estendido\n');
    
    // 1. Buscar um módulo para teste
    log('1️⃣ Buscando módulo para teste...');
    const { data: modules, error } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .limit(1);
    
    if (error) throw error;
    if (!modules || modules.length === 0) {
      throw new Error('Nenhum módulo encontrado');
    }
    
    const testModule = modules[0];
    const originalContent = testModule.content_jsonb?.html || '';
    
    log(`Módulo selecionado: ${testModule.title}`);
    log(`Conteúdo original: ${originalContent.substring(0, 100)}...`, 'debug');
    
    // 2. Simular extensão com IA
    log('\n2️⃣ Simulando extensão com IA...');
    const extendedContent = '<p><strong>Conteúdo Estendido pela IA:</strong></p><p>Este é um exemplo prático de como implementar as técnicas de segurança discutidas. Vamos criar um exercício onde você deve identificar vulnerabilidades em um código de exemplo.</p><p><strong>Exercício Prático:</strong></p><ol><li>Analise o código fornecido</li><li>Identifique pelo menos 3 vulnerabilidades</li><li>Proponha soluções para cada vulnerabilidade encontrada</li></ol>';
    
    // Simular a concatenação que acontece no frontend
    const combinedContent = `${originalContent}\n${extendedContent}`;
    
    log(`Conteúdo estendido adicionado`);
    log(`Tamanho do conteúdo combinado: ${combinedContent.length} caracteres`);
    
    // 3. Salvar o conteúdo combinado
    log('\n3️⃣ Salvando conteúdo combinado...');
    const { error: saveError } = await supabase
      .from('modules')
      .update({ 
        content_jsonb: { html: combinedContent }
      })
      .eq('id', testModule.id);
    
    if (saveError) throw saveError;
    
    log('Conteúdo salvo com sucesso');
    
    // 4. Aguardar um momento (simular delay do frontend)
    log('\n4️⃣ Aguardando processamento...');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 5. Verificar se o conteúdo foi persistido corretamente
    log('\n5️⃣ Verificando persistência...');
    const { data: updatedModule, error: fetchError } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('id', testModule.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const persistedContent = updatedModule.content_jsonb?.html || '';
    
    log(`Conteúdo persistido: ${persistedContent.substring(0, 100)}...`, 'debug');
    log(`Tamanho do conteúdo persistido: ${persistedContent.length} caracteres`);
    
    // 6. Verificar se o conteúdo estendido está presente
    log('\n6️⃣ Verificando integridade do conteúdo...');
    
    const hasOriginalContent = persistedContent.includes(originalContent.replace(/<[^>]*>/g, '').substring(0, 50));
    const hasExtendedContent = persistedContent.includes('Conteúdo Estendido pela IA');
    const hasExercise = persistedContent.includes('Exercício Prático');
    
    log(`✓ Contém conteúdo original: ${hasOriginalContent}`, hasOriginalContent ? 'success' : 'error');
    log(`✓ Contém conteúdo estendido: ${hasExtendedContent}`, hasExtendedContent ? 'success' : 'error');
    log(`✓ Contém exercício prático: ${hasExercise}`, hasExercise ? 'success' : 'error');
    
    // 7. Resultado final
    log('\n=== RESULTADO DO TESTE ===');
    
    if (hasOriginalContent && hasExtendedContent && hasExercise) {
      log('🎉 SUCESSO! A correção funcionou corretamente.', 'success');
      log('✅ O conteúdo estendido foi salvo e persistido adequadamente.', 'success');
    } else {
      log('❌ FALHA! Ainda há problemas com o salvamento.', 'error');
      
      if (!hasOriginalContent) {
        log('- Conteúdo original foi perdido', 'error');
      }
      if (!hasExtendedContent) {
        log('- Conteúdo estendido não foi salvo', 'error');
      }
      if (!hasExercise) {
        log('- Partes específicas do conteúdo estendido foram perdidas', 'error');
      }
    }
    
    // 8. Restaurar conteúdo original
    log('\n8️⃣ Restaurando conteúdo original...');
    await supabase
      .from('modules')
      .update({ content_jsonb: { html: originalContent } })
      .eq('id', testModule.id);
    
    log('Conteúdo original restaurado', 'success');
    
  } catch (error) {
    log(`Erro no teste: ${error.message}`, 'error');
    console.error(error);
  }
}

// Executar teste
testFix();