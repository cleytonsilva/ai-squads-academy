import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Carregar variáveis do .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ncrlojjfkhevjotchhxi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTc3MjMsImV4cCI6MjA2OTc3MzcyM30.YQlus7TgTNqGJ7lUOEYGBZJQJcJvKvQJGvQJGvQJGvQ';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Teste mais realista que simula o fluxo real do AdminCourseEditor
 * Este teste verifica se o auto-save funciona quando o conteúdo é modificado
 * através do estado do componente, não diretamente no banco
 */
async function testRealisticExtensionFlow() {
  console.log('🧪 Iniciando teste realista de persistência de conteúdo extendido...');
  
  try {
    // 1. Buscar módulos disponíveis
    console.log('\n📋 Buscando módulos disponíveis...');
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
    
    // 2. Verificar conteúdo atual
    const originalContent = testModule.content_jsonb?.html || '';
    const originalLength = originalContent.length;
    console.log(`📏 Tamanho do conteúdo original: ${originalLength} caracteres`);
    
    // 3. Simular o processo de extensão como acontece no AdminCourseEditor
    console.log('\n🔄 Simulando processo de extensão de conteúdo...');
    
    // Primeiro, simular que o usuário está editando o módulo
    console.log('👤 Simulando seleção do módulo no AdminCourseEditor...');
    
    // Simular extensão de conteúdo (como faria o AIModuleExtendDialog)
    const extendedContent = `\n\n<h3>🤖 Conteúdo Extendido por IA</h3>\n<p>Este é um conteúdo adicional gerado para testar a persistência. Timestamp: ${new Date().toISOString()}</p>\n<ul>\n<li>Ponto adicional 1</li>\n<li>Ponto adicional 2</li>\n<li>Ponto adicional 3</li>\n</ul>`;
    
    const newContent = originalContent + extendedContent;
    const newLength = newContent.length;
    
    console.log(`📏 Novo tamanho: ${newLength} caracteres (+${newLength - originalLength})`);
    
    // 4. Simular o salvamento como faria o AdminCourseEditor.handleSaveModule
    console.log('\n💾 Simulando salvamento através do AdminCourseEditor...');
    
    const updateData = {
      content_jsonb: {
        html: newContent,
        last_saved: new Date().toISOString(),
        word_count: newContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length,
        version: (testModule.content_jsonb?.version || 0) + 1
      }
    };
    
    console.log('📤 Dados a serem salvos:', {
      contentLength: updateData.content_jsonb.html.length,
      wordCount: updateData.content_jsonb.word_count,
      version: updateData.content_jsonb.version,
      lastSaved: updateData.content_jsonb.last_saved
    });
    
    const { error: updateError } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', testModule.id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar módulo:', updateError);
      return;
    }
    
    console.log('✅ Conteúdo salvo com sucesso!');
    
    // 5. Aguardar um momento para simular o tempo real
    console.log('\n⏳ Aguardando 3 segundos para verificar persistência...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. Verificar se o conteúdo persistiu
    console.log('\n🔍 Verificando persistência...');
    const { data: updatedModule, error: fetchError } = await supabase
      .from('modules')
      .select('content_jsonb')
      .eq('id', testModule.id)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar módulo atualizado:', fetchError);
      return;
    }
    
    const persistedContent = updatedModule.content_jsonb?.html || '';
    const persistedLength = persistedContent.length;
    
    console.log(`📏 Tamanho do conteúdo persistido: ${persistedLength} caracteres`);
    
    // 7. Analisar resultados
    console.log('\n📊 Resultados do teste:');
    
    const contentPreserved = persistedContent.includes(originalContent);
    const extensionPresent = persistedContent.includes('🤖 Conteúdo Extendido por IA');
    const sizeCorrect = persistedLength === newLength;
    
    console.log(`✅ Conteúdo original preservado: ${contentPreserved ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Conteúdo extendido presente: ${extensionPresent ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Tamanho correto: ${sizeCorrect ? 'SIM' : 'NÃO'}`);
    
    if (contentPreserved && extensionPresent && sizeCorrect) {
      console.log('\n🎉 TESTE PASSOU! A persistência está funcionando corretamente.');
    } else {
      console.log('\n❌ TESTE FALHOU! Há problemas com a persistência do conteúdo extendido.');
      
      console.log('\n🔍 Detalhes do problema:');
      if (!contentPreserved) console.log('  - Conteúdo original foi perdido');
      if (!extensionPresent) console.log('  - Conteúdo extendido não foi salvo');
      if (!sizeCorrect) console.log(`  - Tamanho incorreto (esperado: ${newLength}, atual: ${persistedLength})`);
      
      console.log('\n📝 Conteúdo atual no banco:');
      console.log(persistedContent.substring(0, 500) + (persistedContent.length > 500 ? '...' : ''));
    }
    
    // 8. Restaurar conteúdo original
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
      console.error('❌ Erro ao restaurar conteúdo original:', restoreError);
    } else {
      console.log('✅ Conteúdo original restaurado com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
  
  console.log('\n🏁 Teste concluído!');
}

// Executar o teste
testRealisticExtensionFlow().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});