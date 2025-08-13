// Teste da Edge Function ai-extend-module com modelos atualizados

const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Teste AI Extend</title>
</head>
<body>
    <h1>Página de Teste</h1>
    <p>Este é um conteúdo básico para testar a extensão por IA.</p>
    <div class="content">
        <h2>Seção Principal</h2>
        <p>Conteúdo que precisa ser estendido...</p>
    </div>
</body>
</html>
`;

const testData = {
  html: testHTML,
  prompt: "Adicione mais conteúdo educativo sobre tecnologia e programação. Mantenha o estilo HTML."
};

console.log('🧪 Testando Edge Function ai-extend-module...');
console.log('📋 HTML de entrada:', testHTML.length, 'caracteres');
console.log('💭 Prompt:', testData.prompt);
console.log('\n' + '='.repeat(60) + '\n');

async function testAIExtend() {
  try {
    console.log('🔄 Enviando requisição para a Edge Function...');
    
    const response = await fetch('http://127.0.0.1:54321/functions/v1/ai-extend-module', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify(testData)
    });

    console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro na requisição:');
      console.log(errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Resposta recebida com sucesso!');
    console.log('📊 Dados retornados:');
    console.log('   - Tipo:', typeof result);
    
    if (result.extendedHtml) {
      console.log('   - HTML estendido:', result.extendedHtml.length, 'caracteres');
      console.log('   - Modelo usado:', result.model || 'Não informado');
      
      // Mostrar uma prévia do HTML estendido
      const preview = result.extendedHtml.substring(0, 300) + '...';
      console.log('\n📄 Prévia do HTML estendido:');
      console.log(preview);
      
      // Verificar se o conteúdo foi realmente estendido
      if (result.extendedHtml.length > testHTML.length) {
        console.log('\n🎉 Sucesso! O HTML foi estendido com sucesso.');
        console.log(`📈 Aumento de conteúdo: ${result.extendedHtml.length - testHTML.length} caracteres`);
      } else {
        console.log('\n⚠️  O HTML não parece ter sido estendido significativamente.');
      }
    } else {
      console.log('❌ Resposta não contém HTML estendido');
      console.log('📄 Resposta completa:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Erro durante o teste:', error.message);
    console.log('🔍 Detalhes do erro:', error);
  }
}

// Executar o teste
testAIExtend().then(() => {
  console.log('\n✨ Teste concluído!');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
});