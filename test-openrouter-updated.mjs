import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ler a OPENROUTER_API_KEY do arquivo .env
let OPENROUTER_API_KEY;
try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf8');
  const envLines = envContent.split('\n');
  const keyLine = envLines.find(line => line.startsWith('OPENROUTER_API_KEY='));
  if (keyLine) {
    OPENROUTER_API_KEY = keyLine.split('=')[1].trim();
    console.log('✅ OPENROUTER_API_KEY encontrada no .env');
  } else {
    throw new Error('OPENROUTER_API_KEY não encontrada no .env');
  }
} catch (error) {
  console.error('❌ Erro ao ler .env:', error.message);
  process.exit(1);
}

// Lista de modelos gratuitos atualizados (Janeiro 2025)
const freeModels = [
  'meta-llama/llama-4-maverick:free',
  'meta-llama/llama-4-scout:free', 
  'deepseek/deepseek-chat-v3-0324:free',
  'deepseek/deepseek-r1:free',
  'deepseek/deepseek-r1-zero:free',
  'google/gemini-2.5-pro-exp-03-25:free',
  'google/gemini-2.0-flash-thinking-exp:free',
  'google/gemini-2.0-flash-exp:free',
  'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
  'google/gemma-3-27b-it:free',
  'qwen/qwq-32b:free',
  'meta-llama/llama-3.3-70b-instruct:free'
];

console.log('🧪 Testando modelos gratuitos do OpenRouter...');
console.log(`📋 Total de modelos para testar: ${freeModels.length}`);
console.log('\n' + '='.repeat(60) + '\n');

// Função para testar um modelo
async function testModel(model) {
  try {
    console.log(`🔄 Testando: ${model}`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:8080',
        'X-Title': 'AI Squads Academy Test'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Responda apenas "OK" se você está funcionando.'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ ${model}: ${response.status} - ${errorText}`);
      return { model, status: 'error', error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Sem resposta';
    console.log(`✅ ${model}: ${content.trim()}`);
    return { model, status: 'success', response: content.trim() };
    
  } catch (error) {
    console.log(`❌ ${model}: Erro de conexão - ${error.message}`);
    return { model, status: 'error', error: error.message };
  }
}

// Testar todos os modelos
async function testAllModels() {
  const results = [];
  
  for (const model of freeModels) {
    const result = await testModel(model);
    results.push(result);
    
    // Pequena pausa entre requisições para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Resumo dos resultados
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES:');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'error');
  
  console.log(`\n✅ Modelos funcionando: ${successful.length}/${results.length}`);
  successful.forEach(r => console.log(`   - ${r.model}`));
  
  console.log(`\n❌ Modelos com erro: ${failed.length}/${results.length}`);
  failed.forEach(r => console.log(`   - ${r.model}: ${r.error}`));
  
  if (successful.length > 0) {
    console.log('\n🎉 Modelos recomendados para usar na Edge Function:');
    console.log('const openRouterModels = [');
    successful.slice(0, 5).forEach(r => {
      console.log(`  '${r.model}',`);
    });
    console.log('];');
  } else {
    console.log('\n⚠️  Nenhum modelo está funcionando. Verifique:');
    console.log('   1. Se a OPENROUTER_API_KEY está válida');
    console.log('   2. Se há créditos disponíveis na conta');
    console.log('   3. Se os modelos ainda estão disponíveis');
  }
}

// Executar os testes
testAllModels().catch(console.error);