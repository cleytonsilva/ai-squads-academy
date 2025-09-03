require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('URL:', supabaseUrl ? '✅' : '❌');
  console.log('Service Key:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyModuleContent() {
  try {
    console.log('🔍 Verificando conteúdo do módulo "Introdução à Cibersegurança"...');
    
    const { data, error } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('title', 'Introdução à Cibersegurança')
      .single();

    if (error) {
      console.error('❌ Erro ao buscar módulo:', error);
      return;
    }

    if (!data) {
      console.log('❌ Módulo não encontrado');
      return;
    }

    console.log('✅ Módulo encontrado:');
    console.log('ID:', data.id);
    console.log('Título:', data.title);
    
    // Extrair HTML do content_jsonb
    let html = '';
    if (data.content_jsonb && typeof data.content_jsonb === 'object') {
      html = data.content_jsonb.html || data.content_jsonb.content || '';
    } else if (typeof data.content_jsonb === 'string') {
      html = data.content_jsonb;
    }
    
    console.log('\n📄 Conteúdo HTML:');
    console.log('Tamanho:', html.length, 'caracteres');
    console.log('Contém "teste":', html.includes('teste') ? '✅ SIM' : '❌ NÃO');
    
    if (html.includes('teste')) {
      const testeIndex = html.indexOf('teste');
      console.log('Posição da palavra "teste":', testeIndex);
      console.log('Contexto:', html.substring(Math.max(0, testeIndex - 50), testeIndex + 100));
    }
    
    console.log('\n📝 Primeiros 200 caracteres:');
    console.log(html.substring(0, 200) + '...');
    
    console.log('\n📝 Últimos 200 caracteres:');
    console.log('...' + html.substring(html.length - 200));
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

verifyModuleContent();