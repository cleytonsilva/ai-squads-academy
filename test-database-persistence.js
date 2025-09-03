import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ncrlojjfkhevjotchhxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTc3MjMsImV4cCI6MjA2OTc3MzcyM30.f3DPtL3s_J7vzk0JmYsfkbd7Yyx1IDpy1IN-k6cwiZY';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Teste para verificar persistência no banco de dados
 */
async function testDatabasePersistence() {
  console.log('🔍 Testando persistência no banco de dados...');
  
  try {
    // 1. Buscar um módulo para teste
    const { data: modules, error: fetchError } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .limit(1);
      
    if (fetchError) {
      console.error('❌ Erro ao buscar módulos:', fetchError);
      return;
    }
    
    if (!modules || modules.length === 0) {
      console.log('⚠️ Nenhum módulo encontrado para teste');
      return;
    }
    
    const testModule = modules[0];
    const originalContent = testModule.content_jsonb?.html || '';
    
    console.log('📋 Módulo de teste:', {
      id: testModule.id,
      title: testModule.title,
      originalContentLength: originalContent.length,
      originalContentJsonb: testModule.content_jsonb
    });
    
    // 2. Criar conteúdo estendido com timestamp único
    const timestamp = new Date().toISOString();
    const uniqueMarker = `TEST_${Date.now()}`;
    const extendedContent = originalContent + `\n\n<p>🤖 ${uniqueMarker} - Conteúdo estendido por IA para teste de persistência - ${timestamp}</p>`;
    
    console.log('🤖 Criando conteúdo estendido...');
    console.log('📊 Dados da extensão:', {
      originalLength: originalContent.length,
      extendedLength: extendedContent.length,
      addedContent: extendedContent.length - originalContent.length,
      uniqueMarker
    });
    
    // 3. Salvar conteúdo estendido com metadados
    const updateData = {
      content_jsonb: { 
        html: extendedContent,
        last_saved: timestamp,
        word_count: extendedContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length,
        version: Date.now(),
        test_marker: uniqueMarker,
        extended: true
      },
      updated_at: timestamp
    };
    
    console.log('💾 Salvando no banco de dados...');
    console.log('📄 Dados a serem salvos:', updateData);
    
    const { error: updateError } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', testModule.id);
      
    if (updateError) {
      console.error('❌ Erro ao salvar conteúdo estendido:', updateError);
      return;
    }
    
    console.log('✅ Conteúdo estendido salvo com sucesso');
    
    // 4. Verificação imediata
    console.log('🔍 Verificação imediata...');
    const { data: immediateCheck, error: immediateError } = await supabase
      .from('modules')
      .select('content_jsonb, updated_at')
      .eq('id', testModule.id)
      .single();
      
    if (immediateError) {
      console.error('❌ Erro na verificação imediata:', immediateError);
      return;
    }
    
    const immediateContent = immediateCheck.content_jsonb?.html || '';
    const hasMarker = immediateContent.includes(uniqueMarker);
    
    console.log('📊 Verificação imediata:', {
      contentLength: immediateContent.length,
      hasUniqueMarker: hasMarker,
      updatedAt: immediateCheck.updated_at,
      contentJsonb: immediateCheck.content_jsonb
    });
    
    if (!hasMarker) {
      console.log('❌ FALHA IMEDIATA: Marcador único não encontrado!');
      return;
    }
    
    // 5. Aguardar e verificar novamente (simular delay do debounce)
    console.log('⏳ Aguardando 5 segundos para verificar persistência...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 6. Verificação final
    console.log('🔍 Verificação final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('modules')
      .select('content_jsonb, updated_at')
      .eq('id', testModule.id)
      .single();
      
    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError);
      return;
    }
    
    const finalContent = finalCheck.content_jsonb?.html || '';
    const finalHasMarker = finalContent.includes(uniqueMarker);
    
    console.log('📊 Verificação final:', {
      originalLength: originalContent.length,
      extendedLength: extendedContent.length,
      finalLength: finalContent.length,
      hasUniqueMarker: finalHasMarker,
      contentPreserved: finalContent === extendedContent,
      contentLost: finalContent === originalContent,
      updatedAt: finalCheck.updated_at,
      contentJsonb: finalCheck.content_jsonb
    });
    
    if (finalContent === extendedContent && finalHasMarker) {
      console.log('✅ SUCESSO: Conteúdo estendido foi preservado no banco de dados!');
      console.log('🎯 O problema NÃO está na persistência do banco');
    } else if (finalContent === originalContent) {
      console.log('❌ FALHA: Conteúdo foi revertido para o original');
      console.log('⚠️ O problema ESTÁ na persistência do banco ou há sobrescrita');
    } else if (!finalHasMarker) {
      console.log('❌ FALHA: Marcador único foi perdido');
      console.log('⚠️ Conteúdo foi modificado por outro processo');
    } else {
      console.log('⚠️ RESULTADO INESPERADO: Conteúdo foi modificado de forma inesperada');
      console.log('📄 Conteúdo final:', finalContent.substring(0, 500) + '...');
    }
    
    // 7. Restaurar conteúdo original
    console.log('🔄 Restaurando conteúdo original...');
    const { error: restoreError } = await supabase
      .from('modules')
      .update({ 
        content_jsonb: { html: originalContent },
        updated_at: new Date().toISOString()
      })
      .eq('id', testModule.id);
      
    if (restoreError) {
      console.error('❌ Erro ao restaurar conteúdo:', restoreError);
    } else {
      console.log('✅ Conteúdo original restaurado');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado no teste:', error);
  }
}

// Executar o teste
testDatabasePersistence();