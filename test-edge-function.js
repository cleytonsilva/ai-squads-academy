import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEdgeFunction() {
  console.log('🧪 Testando edge function ai-extend-module...');
  
  const testData = {
    html: '<p>Este é um conteúdo básico sobre JavaScript.</p>',
    moduleTitle: 'Introdução ao JavaScript',
    prompt: 'Adicione mais informações sobre variáveis e tipos de dados',
    length: 'medium',
    tone: 'educational'
  };
  
  console.log('📤 Enviando dados para a edge function:');
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('ai-extend-module', {
      body: testData
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ Tempo de resposta: ${duration}ms`);
    
    if (error) {
      console.error('❌ Erro na edge function:', error);
      return false;
    }
    
    if (!data) {
      console.error('❌ Nenhum dado retornado pela edge function');
      return false;
    }
    
    console.log('✅ Edge function executada com sucesso!');
    console.log('📥 Resposta recebida:');
    console.log('Tipo de dados:', typeof data);
    console.log('Estrutura:', Object.keys(data));
    
    if (data.extendedHtml) {
      console.log('✅ Conteúdo estendido gerado:');
      console.log('Tamanho original:', testData.html.length, 'caracteres');
      console.log('Tamanho estendido:', data.extendedHtml.length, 'caracteres');
      console.log('Conteúdo estendido (primeiros 200 chars):');
      console.log(data.extendedHtml.substring(0, 200) + '...');
      
      // Verificar se o conteúdo original está presente
      if (data.extendedHtml.includes('Este é um conteúdo básico sobre JavaScript')) {
        console.log('✅ Conteúdo original preservado');
      } else {
        console.log('⚠️ Conteúdo original pode ter sido modificado');
      }
      
      return true;
    } else {
      console.error('❌ Campo extendedHtml não encontrado na resposta');
      console.log('Dados recebidos:', data);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao chamar edge function:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

async function testWithDifferentInputs() {
  console.log('\n🔄 Testando com diferentes tipos de entrada...');
  
  const testCases = [
    {
      name: 'HTML simples',
      html: '<p>Conteúdo básico</p>',
      moduleTitle: 'Teste Básico',
      prompt: 'Expandir conteúdo',
      length: 'short',
      tone: 'casual'
    },
    {
      name: 'HTML complexo',
      html: '<h2>Título</h2><p>Parágrafo com <strong>texto em negrito</strong> e <em>itálico</em>.</p><ul><li>Item 1</li><li>Item 2</li></ul>',
      moduleTitle: 'Teste Complexo',
      prompt: 'Adicionar mais detalhes técnicos',
      length: 'long',
      tone: 'professional'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testando: ${testCase.name}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-extend-module', {
        body: testCase
      });
      
      if (error) {
        console.error(`❌ Erro em ${testCase.name}:`, error);
        continue;
      }
      
      if (data && data.extendedHtml) {
        console.log(`✅ ${testCase.name} - Sucesso`);
        console.log(`Tamanho: ${testCase.html.length} → ${data.extendedHtml.length} caracteres`);
      } else {
        console.error(`❌ ${testCase.name} - Sem conteúdo estendido`);
      }
      
    } catch (error) {
      console.error(`❌ Erro em ${testCase.name}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando teste da edge function ai-extend-module\n');
  
  // Teste básico
  const basicTestSuccess = await testEdgeFunction();
  
  if (basicTestSuccess) {
    // Testes adicionais
    await testWithDifferentInputs();
  }
  
  console.log('\n🏁 Teste da edge function concluído');
}

main().catch(console.error);