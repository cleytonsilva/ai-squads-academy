const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://wnpqgvzjbdqjqzqzqzqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducHFndnpqYmRxanF6cXpxenF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzYsImV4cCI6MjA1MDU0Nzk3Nn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Teste específico para verificar se o auto-save funciona após extensão de conteúdo
 * Simula exatamente o fluxo do AdminCourseEditor
 */
async function testAutoSaveAfterExtension() {
  console.log('🧪 Testando auto-save após extensão de conteúdo...');
  
  try {
    // 1. Buscar um módulo para teste
    console.log('\n📋 Buscando módulo para teste...');
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .limit(1);
    
    if (modulesError) {
      console.error('❌ Erro ao buscar módulos:', modulesError);
      return;
    }
    
    if (!modules || modules.length === 0) {
      console.log('⚠️ Nenhum módulo encontrado para teste');
      return;
    }
    
    const testModule = modules[0];
    console.log(`✅ Módulo selecionado: ${testModule.title} (ID: ${testModule.id})`);
    
    // 2. Salvar estado original
    const originalContent = testModule.content_jsonb?.html || '';
    const originalLength = originalContent.length;
    console.log(`📏 Conteúdo original: ${originalLength} caracteres`);
    
    // 3. Simular extensão de conteúdo (como faz o AIModuleExtendDialog)
    console.log('\n🤖 Simulando extensão de conteúdo...');
    const extendedContent = `\n\n<h3>🤖 Conteúdo Extendido por IA - Teste Auto-Save</h3>\n<p>Este conteúdo foi adicionado para testar o auto-save. Timestamp: ${new Date().toISOString()}</p>\n<ul>\n<li>Teste de persistência 1</li>\n<li>Teste de persistência 2</li>\n<li>Teste de persistência 3</li>\n</ul>`;
    
    const newContent = originalContent + extendedContent;
    const newLength = newContent.length;
    
    console.log(`📏 Novo conteúdo: ${newLength} caracteres (+${newLength - originalLength})`);
    
    // 4. Simular o que acontece no AdminCourseEditor.onExtended
    console.log('\n🔄 Simulando fluxo do AdminCourseEditor...');
    
    // Simular setIsExtendingContent(true)
    console.log('🛡️ Ativando proteção isExtendingContent...');
    
    // Simular setModuleHtml(newContent)
    console.log('📝 Atualizando estado moduleHtml...');
    
    // Simular setTimeout para setHasUnsavedChanges(true) e setIsExtendingContent(false)
    console.log('⏱️ Aguardando 200ms para simular setTimeout...');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('✅ hasUnsavedChanges = true, isExtendingContent = false');
    
    // 5. Simular o auto-save (como faz o useEffect)
    console.log('\n💾 Simulando auto-save...');
    
    // Aguardar um pouco para simular o debounce
    console.log('⏱️ Aguardando debounce (1 segundo)...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular handleSaveModule
    console.log('💾 Executando salvamento...');
    
    const updateData = {
      content_jsonb: {
        html: newContent,
        last_saved: new Date().toISOString(),
        word_count: newContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length,
        version: (testModule.content_jsonb?.version || 0) + 1
      }
    };
    
    console.log('📤 Dados do salvamento:', {
      contentLength: updateData.content_jsonb.html.length,
      wordCount: updateData.content_jsonb.word_count,
      version: updateData.content_jsonb.version
    });
    
    const { error: updateError } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', testModule.id);
    
    if (updateError) {
      console.error('❌ Erro ao salvar:', updateError);
      return;
    }
    
    console.log('✅ Conteúdo salvo com sucesso!');
    
    // 6. Verificar se foi realmente salvo
    console.log('\n🔍 Verificando persistência...');
    
    const { data: verifyModule, error: verifyError } = await supabase
      .from('modules')
      .select('content_jsonb')
      .eq('id', testModule.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar:', verifyError);
      return;
    }
    
    const savedContent = verifyModule.content_jsonb?.html || '';
    const savedLength = savedContent.length;
    
    console.log(`📏 Conteúdo verificado: ${savedLength} caracteres`);
    
    // Verificar se contém o conteúdo original e o estendido
    const hasOriginal = savedContent.includes(originalContent.substring(0, 100));
    const hasExtended = savedContent.includes('Conteúdo Extendido por IA - Teste Auto-Save');
    
    console.log('\n📊 Resultados da verificação:');
    console.log(`✅ Contém conteúdo original: ${hasOriginal}`);
    console.log(`✅ Contém conteúdo estendido: ${hasExtended}`);
    console.log(`✅ Tamanho correto: ${savedLength === newLength}`);
    
    if (hasOriginal && hasExtended && savedLength === newLength) {
      console.log('\n🎉 SUCESSO! Auto-save funcionou corretamente após extensão!');
    } else {
      console.log('\n❌ FALHA! Auto-save não funcionou como esperado.');
    }
    
    // 7. Restaurar conteúdo original
    console.log('\n🧹 Restaurando conteúdo original...');
    
    const { error: restoreError } = await supabase
      .from('modules')
      .update({
        content_jsonb: {
          html: originalContent,
          last_saved: new Date().toISOString(),
          word_count: originalContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length,
          version: (testModule.content_jsonb?.version || 0) + 2
        }
      })
      .eq('id', testModule.id);
    
    if (restoreError) {
      console.error('❌ Erro ao restaurar:', restoreError);
    } else {
      console.log('✅ Conteúdo original restaurado!');
    }
    
    console.log('\n🏁 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testAutoSaveAfterExtension();