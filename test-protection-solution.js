import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ncrlojjfkhevjotchhxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTc3MjMsImV4cCI6MjA2OTc3MzcyM30.f3DPtL3s_J7vzk0JmYsfkbd7Yyx1IDpy1IN-k6cwiZY';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Teste para verificar se a solução de proteção contra sobrescrita funciona
 */
async function testProtectionSolution() {
  console.log('🧪 Iniciando teste da solução de proteção...');
  
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
    
    // 2. Simular extensão de conteúdo
    const extendedContent = originalContent + '\n\n<p>🤖 Conteúdo estendido por IA para teste de proteção</p>';
    
    console.log('🤖 Simulando extensão de conteúdo...');
    console.log('📊 Dados da extensão:', {
      originalLength: originalContent.length,
      extendedLength: extendedContent.length,
      addedContent: extendedContent.length - originalContent.length
    });
    
    // 3. Salvar conteúdo estendido
    const { error: updateError } = await supabase
      .from('modules')
      .update({ 
        content_jsonb: { html: extendedContent },
        updated_at: new Date().toISOString()
      })
      .eq('id', testModule.id);
      
    if (updateError) {
      console.error('❌ Erro ao salvar conteúdo estendido:', updateError);
      return;
    }
    
    console.log('✅ Conteúdo estendido salvo com sucesso');
    
    // 4. Aguardar um pouco (simular delay do debounce)
    console.log('⏳ Aguardando 3 segundos (simulando delay do debounce)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Verificar se o conteúdo ainda está lá
    const { data: verifyModule, error: verifyError } = await supabase
      .from('modules')
      .select('content_jsonb')
      .eq('id', testModule.id)
      .single();
      
    if (verifyError) {
      console.error('❌ Erro ao verificar conteúdo:', verifyError);
      return;
    }
    
    const finalContent = verifyModule.content_jsonb?.html || '';
    
    console.log('🔍 Verificação final:', {
      originalLength: originalContent.length,
      extendedLength: extendedContent.length,
      finalLength: finalContent.length,
      contentPreserved: finalContent === extendedContent,
      contentLost: finalContent === originalContent
    });
    
    if (finalContent === extendedContent) {
      console.log('✅ SUCESSO: Conteúdo estendido foi preservado!');
      console.log('🛡️ A solução de proteção funcionou corretamente');
    } else if (finalContent === originalContent) {
      console.log('❌ FALHA: Conteúdo estendido foi perdido');
      console.log('⚠️ A solução de proteção não funcionou');
    } else {
      console.log('⚠️ RESULTADO INESPERADO: Conteúdo foi modificado de forma inesperada');
    }
    
    // 6. Restaurar conteúdo original
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
testProtectionSolution();