/**
 * Script para testar conflito entre onChange do editor Tiptap e auto-save
 * Este script simula o cenário onde:
 * 1. Conteúdo é estendido via IA
 * 2. Editor Tiptap dispara onChange
 * 3. Auto-save pode sobrescrever o conteúdo estendido
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuração do Supabase
const supabaseUrl = 'https://ncrlojjfkhevjotchhxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTc3MjMsImV4cCI6MjA2OTc3MzcyM30.f3DPtL3s_J7vzk0JmYsfkbd7Yyx1IDpy1IN-k6cwiZY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para simular getHtml
function getHtml(contentJsonb) {
  if (!contentJsonb) return '';
  if (typeof contentJsonb === 'string') return contentJsonb;
  if (contentJsonb.html) return contentJsonb.html;
  if (contentJsonb.content) return contentJsonb.content;
  return JSON.stringify(contentJsonb);
}

// Função para simular setHtml
function setHtml(html) {
  return { html, content: html, type: 'html' };
}

// Simular delay como no debounce
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAutoSaveConflict() {
  console.log('🧪 [AUTOSAVE TEST] Iniciando teste de conflito auto-save...');
  
  try {
    // 1. Buscar um módulo existente
    const { data: modules, error: fetchError } = await supabase
      .from('modules')
      .select('*')
      .limit(1);
      
    if (fetchError) {
      console.error('❌ [AUTOSAVE TEST] Erro ao buscar módulos:', fetchError);
      return;
    }
    
    if (!modules || modules.length === 0) {
      console.log('📭 [AUTOSAVE TEST] Nenhum módulo encontrado');
      return;
    }
    
    const module = modules[0];
    console.log('📝 [AUTOSAVE TEST] Módulo encontrado:', {
      id: module.id,
      title: module.title,
      contentLength: getHtml(module.content_jsonb).length
    });
    
    const originalContent = getHtml(module.content_jsonb);
    console.log('📄 [AUTOSAVE TEST] Conteúdo original:', {
      length: originalContent.length,
      preview: originalContent.substring(0, 200) + '...'
    });
    
    // 2. Simular extensão de conteúdo
    const extendedContent = `${originalContent}\n\n<h3>🤖 Conteúdo Estendido por IA</h3>\n<p>Este é um conteúdo adicional gerado pela IA para testar o conflito de auto-save.</p>\n<p>Timestamp: ${new Date().toISOString()}</p>`;
    
    console.log('🤖 [AUTOSAVE TEST] Conteúdo estendido criado:', {
      originalLength: originalContent.length,
      extendedLength: extendedContent.length,
      addedLength: extendedContent.length - originalContent.length
    });
    
    // 3. Salvar conteúdo estendido (simula ação da extensão IA)
    console.log('💾 [AUTOSAVE TEST] Salvando conteúdo estendido...');
    const { error: saveError } = await supabase
      .from('modules')
      .update({ 
        content_jsonb: setHtml(extendedContent),
        updated_at: new Date().toISOString()
      })
      .eq('id', module.id);
      
    if (saveError) {
      console.error('❌ [AUTOSAVE TEST] Erro ao salvar conteúdo estendido:', saveError);
      return;
    }
    
    console.log('✅ [AUTOSAVE TEST] Conteúdo estendido salvo com sucesso');
    
    // 4. Simular delay do debounce (2000ms)
    console.log('⏳ [AUTOSAVE TEST] Aguardando delay do debounce (2000ms)...');
    await delay(2000);
    
    // 5. Simular auto-save com conteúdo original (simula onChange do editor)
    console.log('🔄 [AUTOSAVE TEST] Simulando auto-save com conteúdo original...');
    const { error: autoSaveError } = await supabase
      .from('modules')
      .update({ 
        content_jsonb: setHtml(originalContent),
        updated_at: new Date().toISOString()
      })
      .eq('id', module.id);
      
    if (autoSaveError) {
      console.error('❌ [AUTOSAVE TEST] Erro no auto-save:', autoSaveError);
      return;
    }
    
    console.log('🔄 [AUTOSAVE TEST] Auto-save executado (simulando sobrescrita)');
    
    // 6. Verificar estado final
    const { data: finalModule, error: finalError } = await supabase
      .from('modules')
      .select('*')
      .eq('id', module.id)
      .single();
      
    if (finalError) {
      console.error('❌ [AUTOSAVE TEST] Erro ao verificar estado final:', finalError);
      return;
    }
    
    const finalContent = getHtml(finalModule.content_jsonb);
    console.log('🔍 [AUTOSAVE TEST] Estado final:', {
      length: finalContent.length,
      preview: finalContent.substring(0, 200) + '...'
    });
    
    // 7. Análise do resultado
    const wasOverwritten = finalContent.length === originalContent.length;
    console.log('📊 [AUTOSAVE TEST] Análise do resultado:', {
      originalLength: originalContent.length,
      extendedLength: extendedContent.length,
      finalLength: finalContent.length,
      wasOverwritten: wasOverwritten,
      contentLost: wasOverwritten ? extendedContent.length - originalContent.length : 0
    });
    
    if (wasOverwritten) {
      console.log('❌ [AUTOSAVE TEST] CONFLITO CONFIRMADO: Conteúdo estendido foi sobrescrito pelo auto-save!');
    } else {
      console.log('✅ [AUTOSAVE TEST] Conteúdo estendido preservado');
    }
    
    // 8. Restaurar conteúdo original
    console.log('🔄 [AUTOSAVE TEST] Restaurando conteúdo original...');
    await supabase
      .from('modules')
      .update({ 
        content_jsonb: setHtml(originalContent),
        updated_at: new Date().toISOString()
      })
      .eq('id', module.id);
    
    console.log('✅ [AUTOSAVE TEST] Teste concluído e conteúdo original restaurado');
    
  } catch (error) {
    console.error('❌ [AUTOSAVE TEST] Erro inesperado:', error);
  }
}

// Executar teste
testAutoSaveConflict().then(() => {
  console.log('🏁 [AUTOSAVE TEST] Teste finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 [AUTOSAVE TEST] Erro fatal:', error);
  process.exit(1);
});