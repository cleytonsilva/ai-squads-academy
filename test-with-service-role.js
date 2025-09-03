import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase com service role
const supabaseUrl = 'https://ncrlojjfkhevjotchhxi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5NzcyMywiZXhwIjoyMDY5NzczNzIzfQ.LMdGQjXhKLzixtVu4MQ5An7qytDtB9ylbZFYks_cJro';
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Teste com service role para verificar se o problema está nas permissões RLS
 */
async function testWithServiceRole() {
  console.log('🔑 Testando com service role key (bypass RLS)...');
  
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
      originalContentLength: originalContent.length
    });
    
    // 2. Criar conteúdo estendido com timestamp único
    const timestamp = new Date().toISOString();
    const uniqueMarker = `SERVICE_ROLE_TEST_${Date.now()}`;
    const extendedContent = originalContent + `\n\n<p>🔑 ${uniqueMarker} - Teste com service role - ${timestamp}</p>`;
    
    console.log('🤖 Criando conteúdo estendido...');
    console.log('📊 Dados da extensão:', {
      originalLength: originalContent.length,
      extendedLength: extendedContent.length,
      addedContent: extendedContent.length - originalContent.length,
      uniqueMarker
    });
    
    // 3. Salvar conteúdo estendido
    const updateData = {
      content_jsonb: { 
        html: extendedContent,
        last_saved: timestamp,
        word_count: extendedContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length,
        version: Date.now(),
        test_marker: uniqueMarker,
        extended: true,
        service_role_test: true
      },
      updated_at: timestamp
    };
    
    console.log('💾 Salvando com service role...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', testModule.id)
      .select();
      
    if (updateError) {
      console.error('❌ Erro ao salvar conteúdo estendido:', updateError);
      return;
    }
    
    console.log('✅ Conteúdo estendido salvo com sucesso');
    console.log('📄 Resultado do update:', updateResult);
    
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
      contentJsonbKeys: Object.keys(immediateCheck.content_jsonb || {})
    });
    
    if (hasMarker) {
      console.log('✅ SUCESSO: Marcador único encontrado com service role!');
      console.log('🎯 O problema pode estar nas permissões RLS');
    } else {
      console.log('❌ FALHA: Marcador único não encontrado mesmo com service role');
      console.log('⚠️ O problema não está nas permissões RLS');
    }
    
    // 5. Aguardar e verificar novamente
    console.log('⏳ Aguardando 3 segundos para verificar persistência...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
      updatedAt: finalCheck.updated_at
    });
    
    if (finalContent === extendedContent && finalHasMarker) {
      console.log('✅ SUCESSO TOTAL: Conteúdo persistiu com service role!');
      console.log('🔑 Confirma que o problema está nas permissões RLS');
    } else if (finalContent === originalContent) {
      console.log('❌ FALHA: Conteúdo foi revertido mesmo com service role');
      console.log('⚠️ Há outro processo sobrescrevendo o conteúdo');
    } else {
      console.log('⚠️ RESULTADO PARCIAL: Conteúdo foi modificado');
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
testWithServiceRole();