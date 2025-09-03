/**
 * Teste específico para extensão de conteúdo
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testContentExtension() {
  try {
    // Buscar o primeiro módulo
    const { data: module, error: fetchError } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .limit(1)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar módulo:', fetchError);
      return;
    }
    
    console.log('📄 Módulo encontrado:', module.title, '(', module.id, ')');
    
    const originalHtml = module.content_jsonb?.html || '';
    console.log('📝 Conteúdo original:', originalHtml.length, 'caracteres');
    console.log('📝 Preview original:', originalHtml.substring(0, 100) + '...');
    
    // Simular extensão
    const timestamp = new Date().toISOString();
    const extendedContent = `\n\n<h3>🤖 Conteúdo Estendido - ${timestamp}</h3><p>Este é um teste de extensão de conteúdo. O conteúdo foi estendido automaticamente para verificar a persistência.</p><p>Dados do teste:</p><ul><li>Timestamp: ${timestamp}</li><li>Conteúdo original: ${originalHtml.length} chars</li><li>Status: Teste de persistência</li></ul>`;
    
    const newHtml = originalHtml + extendedContent;
    
    console.log('🚀 Estendendo conteúdo...');
    console.log('📝 Novo conteúdo:', newHtml.length, 'caracteres');
    console.log('📝 Extensão adicionada:', extendedContent.length, 'caracteres');
    
    // Salvar conteúdo estendido
    const { error: updateError } = await supabase
      .from('modules')
      .update({
        content_jsonb: {
          html: newHtml,
          last_saved: timestamp,
          word_count: newHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length,
          version: Date.now(),
          extended: true,
          test_extension: true
        }
      })
      .eq('id', module.id);
    
    if (updateError) {
      console.error('❌ Erro ao salvar:', updateError);
      return;
    }
    
    console.log('✅ Conteúdo estendido salvo!');
    
    // Aguardar um pouco e verificar se foi salvo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Verificando se foi salvo corretamente...');
    
    const { data: updatedModule, error: verifyError } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('id', module.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar:', verifyError);
      return;
    }
    
    const savedHtml = updatedModule.content_jsonb?.html || '';
    console.log('📄 Conteúdo após salvamento:', savedHtml.length, 'caracteres');
    
    if (savedHtml.includes('🤖 Conteúdo Estendido')) {
      console.log('✅ SUCESSO: Conteúdo estendido foi salvo e recuperado corretamente!');
      console.log('📝 Preview do conteúdo salvo:', savedHtml.substring(savedHtml.length - 200));
    } else {
      console.log('❌ FALHA: Conteúdo estendido não foi encontrado após salvamento!');
      console.log('📝 Conteúdo recuperado:', savedHtml.substring(0, 200) + '...');
    }
    
    // Verificar metadados
    if (updatedModule.content_jsonb?.extended) {
      console.log('✅ Flag de extensão encontrada');
    } else {
      console.log('❌ Flag de extensão não encontrada');
    }
    
    if (updatedModule.content_jsonb?.test_extension) {
      console.log('✅ Flag de teste encontrada');
    } else {
      console.log('❌ Flag de teste não encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

console.log('🧪 Iniciando teste de extensão de conteúdo...');
testContentExtension();