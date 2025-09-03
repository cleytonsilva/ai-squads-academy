/**
 * Script para debugar a persistência do conteúdo estendido
 * Verifica se o content_jsonb está sendo salvo e carregado corretamente
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Função para buscar um módulo específico e analisar seu content_jsonb
 */
async function analyzeModuleContent(moduleId) {
  try {
    console.log(`🔍 Analisando módulo: ${moduleId}`);
    
    const { data: module, error } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('id', moduleId)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar módulo:', error);
      return;
    }
    
    console.log('📄 Dados do módulo:');
    console.log('  ID:', module.id);
    console.log('  Título:', module.title);
    console.log('  Content_jsonb tipo:', typeof module.content_jsonb);
    console.log('  Content_jsonb:', JSON.stringify(module.content_jsonb, null, 2));
    
    if (module.content_jsonb && typeof module.content_jsonb === 'object') {
      const html = module.content_jsonb.html || '';
      console.log('  HTML extraído:');
      console.log('    Comprimento:', html.length);
      console.log('    Preview:', html.substring(0, 200) + '...');
      
      // Verificar se há conteúdo estendido (procurar por padrões típicos)
      const hasExtendedContent = html.includes('IA') || html.includes('estendido') || html.length > 1000;
      console.log('  Possível conteúdo estendido:', hasExtendedContent);
      
      if (module.content_jsonb.last_saved) {
        console.log('  Última modificação:', module.content_jsonb.last_saved);
      }
      
      if (module.content_jsonb.version) {
        console.log('  Versão:', module.content_jsonb.version);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

/**
 * Função para listar todos os módulos e identificar possíveis problemas
 */
async function listAllModules() {
  try {
    console.log('📋 Listando todos os módulos...');
    
    const { data: modules, error } = await supabase
      .from('modules')
      .select('id, title, content_jsonb, course_id')
      .order('course_id, order_index');
    
    if (error) {
      console.error('❌ Erro ao buscar módulos:', error);
      return;
    }
    
    console.log(`📊 Total de módulos encontrados: ${modules.length}`);
    
    modules.forEach((module, index) => {
      const html = module.content_jsonb?.html || '';
      const hasContent = html.length > 0;
      const isLongContent = html.length > 1000;
      
      console.log(`${index + 1}. ${module.title} (${module.id})`);
      console.log(`   Curso: ${module.course_id}`);
      console.log(`   Conteúdo: ${hasContent ? 'Sim' : 'Não'} (${html.length} chars)`);
      console.log(`   Conteúdo longo: ${isLongContent ? 'Sim' : 'Não'}`);
      
      if (module.content_jsonb?.last_saved) {
        console.log(`   Última modificação: ${module.content_jsonb.last_saved}`);
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar módulos:', error);
  }
}

/**
 * Função para simular uma extensão de conteúdo
 */
async function simulateContentExtension(moduleId) {
  try {
    console.log(`🤖 Simulando extensão de conteúdo para módulo: ${moduleId}`);
    
    // Primeiro, buscar o conteúdo atual
    const { data: currentModule, error: fetchError } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('id', moduleId)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar módulo atual:', fetchError);
      return;
    }
    
    const currentHtml = currentModule.content_jsonb?.html || '';
    const extendedHtml = `\n\n<h3>Conteúdo Estendido com IA - ${new Date().toISOString()}</h3><p>Este é um conteúdo adicional gerado para teste de persistência. O conteúdo original tinha ${currentHtml.length} caracteres.</p>`;
    const newHtml = currentHtml + extendedHtml;
    
    console.log('📝 Dados da extensão:');
    console.log('  Conteúdo original:', currentHtml.length, 'chars');
    console.log('  Conteúdo estendido:', extendedHtml.length, 'chars');
    console.log('  Novo conteúdo total:', newHtml.length, 'chars');
    
    // Atualizar o módulo com o novo conteúdo
    const updateData = {
      content_jsonb: {
        html: newHtml,
        last_saved: new Date().toISOString(),
        word_count: newHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length,
        version: Date.now(),
        extended: true
      }
    };
    
    console.log('💾 Salvando conteúdo estendido...');
    
    const { error: updateError } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', moduleId);
    
    if (updateError) {
      console.error('❌ Erro ao salvar conteúdo estendido:', updateError);
      return;
    }
    
    console.log('✅ Conteúdo estendido salvo com sucesso!');
    
    // Verificar se foi salvo corretamente
    setTimeout(async () => {
      console.log('🔍 Verificando se o conteúdo foi salvo corretamente...');
      await analyzeModuleContent(moduleId);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando debug de persistência de conteúdo...');
  console.log('');
  
  // Listar todos os módulos primeiro
  await listAllModules();
  
  console.log('\n' + '='.repeat(50));
  console.log('Digite o ID de um módulo para análise detalhada:');
  
  // Para teste, vamos usar o primeiro módulo encontrado
  const { data: firstModule } = await supabase
    .from('modules')
    .select('id')
    .limit(1)
    .single();
  
  if (firstModule) {
    console.log(`\n🎯 Usando módulo de teste: ${firstModule.id}`);
    await analyzeModuleContent(firstModule.id);
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 Testando extensão de conteúdo...');
    await simulateContentExtension(firstModule.id);
  }
}

// Executar o script
main().catch(console.error);