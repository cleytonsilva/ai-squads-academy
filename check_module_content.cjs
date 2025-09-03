const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl ? 'Carregada' : 'Não encontrada');
console.log('Service Key:', supabaseServiceKey ? 'Carregada' : 'Não encontrada');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkModuleContent() {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('title, content_jsonb')
      .eq('id', '84cbbe22-ec35-4137-8008-dbde567cd60a')
      .single();

    if (error) {
      console.error('Erro ao buscar módulo:', error);
      return;
    }

    console.log('\n=== CONTEÚDO DO MÓDULO ===');
    console.log('Título:', data.title);
    console.log('\nContent JSONB:', JSON.stringify(data.content_jsonb, null, 2));
    
    if (data.content_jsonb && data.content_jsonb.html) {
      const containsTest = data.content_jsonb.html.includes('teste');
      console.log('\nHTML contém "teste":', containsTest);
      
      if (containsTest) {
        const testIndex = data.content_jsonb.html.indexOf('teste');
        const contextStart = Math.max(0, testIndex - 50);
        const contextEnd = Math.min(data.content_jsonb.html.length, testIndex + 50);
        console.log('Contexto ao redor de "teste":');
        console.log(data.content_jsonb.html.substring(contextStart, contextEnd));
      }
    } else {
      console.log('\nNenhum HTML encontrado no content_jsonb');
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

checkModuleContent();