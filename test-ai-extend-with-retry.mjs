// Script de teste para Edge Function ai-extend-module com retry
// Usando fetch nativo do Node.js 18+

// Configuração
const SUPABASE_URL = 'http://127.0.0.1:54321';
const FUNCTION_NAME = 'ai-extend-module';
const MAX_RETRIES = 10;
const RETRY_DELAY = 3000; // 3 segundos

// HTML de teste
const testHTML = `
<div class="course-module">
  <h2>Introdução à Programação</h2>
  <p>Este módulo apresenta os conceitos básicos de programação.</p>
  <ul>
    <li>Variáveis e tipos de dados</li>
    <li>Estruturas de controle</li>
    <li>Funções</li>
  </ul>
</div>
`;

// Prompt para extensão
const prompt = 'Adicione mais conteúdo educativo sobre tecnologia e programação. Mantenha o estilo HTML.';

// Função para aguardar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para testar se o Supabase está disponível
async function checkSupabaseHealth() {
  try {
    const response = await fetch(`${SUPABASE_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Função principal de teste
async function testAIExtendWithRetry() {
  console.log('🧪 Testando Edge Function ai-extend-module com retry...');
  console.log(`📋 HTML de entrada: ${testHTML.length} caracteres`);
  console.log(`💭 Prompt: ${prompt}`);
  console.log('\n============================================================\n');

  // Verificar se o Supabase está disponível
  console.log('🔍 Verificando se o Supabase está disponível...');
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`⏳ Tentativa ${attempt}/${MAX_RETRIES}...`);
    
    const isHealthy = await checkSupabaseHealth();
    
    if (isHealthy) {
      console.log('✅ Supabase está disponível!');
      break;
    }
    
    if (attempt === MAX_RETRIES) {
      console.log('❌ Supabase não está disponível após todas as tentativas.');
      console.log('💡 Verifique se o comando "npx supabase start" foi executado com sucesso.');
      return;
    }
    
    console.log(`⏸️ Aguardando ${RETRY_DELAY/1000} segundos antes da próxima tentativa...`);
    await sleep(RETRY_DELAY);
  }

  // Testar a Edge Function
  console.log('\n🔄 Enviando requisição para a Edge Function...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        html: testHTML,
        prompt: prompt
      }),
      timeout: 30000 // 30 segundos
    });

    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erro na requisição: ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log('✅ Resposta recebida com sucesso!');
    console.log(`📝 HTML estendido: ${result.extendedHTML?.length || 0} caracteres`);
    
    if (result.extendedHTML) {
      console.log('\n📄 Conteúdo estendido:');
      console.log('----------------------------------------');
      console.log(result.extendedHTML);
      console.log('----------------------------------------');
    }
    
    if (result.error) {
      console.log(`⚠️ Erro retornado pela função: ${result.error}`);
    }

  } catch (error) {
    console.log(`❌ Erro durante o teste: ${error.message}`);
    console.log(`🔍 Detalhes do erro: ${error}`);
  }

  console.log('\n✨ Teste concluído!');
}

// Executar o teste
testAIExtendWithRetry().catch(console.error);