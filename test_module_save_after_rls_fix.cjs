const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testModuleSaveAfterRLSFix() {
  try {
    console.log('🔍 Testando salvamento do módulo após correção das políticas RLS...');
    
    const moduleId = '84cbbe22-ec35-4137-8008-dbde567cd60a';
    
    // 1. Buscar o módulo atual
    console.log('\n📖 1. Buscando módulo atual...');
    const { data: currentModule, error: fetchError } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('id', moduleId)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar módulo:', fetchError);
      return;
    }
    
    console.log('✅ Módulo encontrado:', {
      id: currentModule.id,
      title: currentModule.title,
      hasContentJsonb: !!currentModule.content_jsonb
    });
    
    // 2. Extrair HTML atual
    let currentHtml = '';
    if (currentModule.content_jsonb) {
      if (typeof currentModule.content_jsonb === 'string') {
        const parsed = JSON.parse(currentModule.content_jsonb);
        currentHtml = parsed.html || parsed.content || '';
      } else {
        currentHtml = currentModule.content_jsonb.html || currentModule.content_jsonb.content || '';
      }
    }
    
    console.log('📝 HTML atual (tamanho):', currentHtml.length, 'caracteres');
    console.log('🔍 Contém "teste"?', currentHtml.includes('teste'));
    
    // 3. Adicionar a palavra "teste" ao final do último parágrafo
    let modifiedHtml = currentHtml;
    if (currentHtml.includes('</p>')) {
      // Encontrar o último </p> e inserir "teste" antes dele
      const lastPIndex = currentHtml.lastIndexOf('</p>');
      modifiedHtml = currentHtml.slice(0, lastPIndex) + ' teste' + currentHtml.slice(lastPIndex);
    } else {
      // Se não há parágrafos, adicionar ao final
      modifiedHtml = currentHtml + ' teste';
    }
    
    console.log('\n✏️ 2. Modificando conteúdo...');
    console.log('📝 HTML modificado (tamanho):', modifiedHtml.length, 'caracteres');
    console.log('🔍 Contém "teste"?', modifiedHtml.includes('teste'));
    
    // 4. Preparar o content_jsonb atualizado
    const updatedContentJsonb = {
      html: modifiedHtml,
      last_saved: new Date().toISOString(),
      word_count: modifiedHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length,
      version: 1
    };
    
    // 5. Tentar salvar com ANON_KEY
    console.log('\n💾 3. Tentando salvar com ANON_KEY...');
    const { data: updateResult, error: updateError } = await supabase
      .from('modules')
      .update({ content_jsonb: updatedContentJsonb })
      .eq('id', moduleId)
      .select('id, title, content_jsonb');
    
    if (updateError) {
      console.error('❌ Erro ao atualizar módulo:', updateError);
      return;
    }
    
    console.log('✅ Módulo atualizado com sucesso!');
    console.log('📊 Resultado:', {
      id: updateResult[0]?.id,
      title: updateResult[0]?.title,
      hasContentJsonb: !!updateResult[0]?.content_jsonb
    });
    
    // 6. Verificar se a atualização persistiu
    console.log('\n🔍 4. Verificando persistência...');
    const { data: verifyModule, error: verifyError } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('id', moduleId)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar módulo:', verifyError);
      return;
    }
    
    // Extrair HTML verificado
    let verifiedHtml = '';
    if (verifyModule.content_jsonb) {
      if (typeof verifyModule.content_jsonb === 'string') {
        const parsed = JSON.parse(verifyModule.content_jsonb);
        verifiedHtml = parsed.html || parsed.content || '';
      } else {
        verifiedHtml = verifyModule.content_jsonb.html || verifyModule.content_jsonb.content || '';
      }
    }
    
    console.log('📝 HTML verificado (tamanho):', verifiedHtml.length, 'caracteres');
    console.log('🔍 Contém "teste"?', verifiedHtml.includes('teste'));
    
    if (verifiedHtml.includes('teste')) {
      console.log('\n🎉 SUCESSO! A palavra "teste" foi salva e persistiu no banco de dados!');
      console.log('✅ As políticas RLS foram corrigidas com sucesso!');
      
      // Mostrar contexto da palavra "teste"
      const testeIndex = verifiedHtml.indexOf('teste');
      if (testeIndex !== -1) {
        const start = Math.max(0, testeIndex - 50);
        const end = Math.min(verifiedHtml.length, testeIndex + 50);
        const context = verifiedHtml.slice(start, end);
        console.log('📍 Contexto da palavra "teste":', context);
      }
    } else {
      console.log('\n❌ FALHA! A palavra "teste" não foi encontrada no banco de dados.');
      console.log('🔍 Pode haver ainda algum problema com as políticas RLS ou outro fator.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testModuleSaveAfterRLSFix();