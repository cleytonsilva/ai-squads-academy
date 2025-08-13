import fs from 'fs';

// Função para ler variáveis do arquivo .env
function loadEnvVars() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return envVars;
}

const env = loadEnvVars();
const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY não encontrada no arquivo .env');
  process.exit(1);
}

console.log('🔑 Chave OpenRouter encontrada:', OPENROUTER_API_KEY.substring(0, 20) + '...');

// Modelos gratuitos configurados (atualizados para 2025)
const models = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-r1:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwq-32b:free"
];

async function testOpenRouterModel(model) {
  console.log(`\n🧪 Testando modelo: ${model}`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://esquads.dev',
        'X-Title': 'Esquads Platform'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Responda apenas "OK" se você está funcionando corretamente.'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(`❌ Erro ${response.status}:`, errorData.error?.message || errorData);
      return false;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (content) {
      console.log(`✅ Sucesso! Resposta: "${content}"`);
      return true;
    } else {
      console.log('❌ Resposta vazia ou inválida');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Erro de rede:`, error.message);
    return false;
  }
}

async function testAllModels() {
  console.log('🚀 Iniciando teste dos modelos OpenRouter...');
  
  let successCount = 0;
  
  for (const model of models) {
    const success = await testOpenRouterModel(model);
    if (success) successCount++;
    
    // Pequena pausa entre os testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Resultado final: ${successCount}/${models.length} modelos funcionando`);
  
  if (successCount > 0) {
    console.log('✅ Configuração do OpenRouter está funcionando!');
  } else {
    console.log('❌ Nenhum modelo está funcionando. Verifique a chave da API.');
  }
}

testAllModels().catch(console.error);