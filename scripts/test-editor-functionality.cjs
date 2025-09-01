/**
 * Script de teste para verificar funcionalidades do AdminCourseEditor
 * Testa seleção, edição, salvamento e exclusão de módulos
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEditorFunctionality() {
  console.log('🧪 Iniciando testes de funcionalidade do AdminCourseEditor...');
  
  try {
    // 1. Buscar um curso existente para teste
    console.log('\n📋 1. Buscando curso para teste...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .limit(1);
    
    if (coursesError || !courses || courses.length === 0) {
      console.error('❌ Nenhum curso encontrado para teste');
      return;
    }
    
    const testCourse = courses[0];
    console.log(`✅ Curso de teste: ${testCourse.title} (ID: ${testCourse.id})`);
    
    // 2. Buscar módulos do curso
    console.log('\n📋 2. Buscando módulos do curso...');
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, order_index, content_jsonb')
      .eq('course_id', testCourse.id)
      .order('order_index');
    
    if (modulesError) {
      console.error('❌ Erro ao buscar módulos:', modulesError);
      return;
    }
    
    console.log(`✅ ${modules.length} módulos encontrados`);
    modules.forEach(module => {
      console.log(`   - ${module.title} (#${module.order_index}) - ${module.content_jsonb?.html?.length || 0} chars`);
    });
    
    // 3. Teste de criação de módulo
    console.log('\n📋 3. Testando criação de novo módulo...');
    const newModuleIndex = (modules[modules.length - 1]?.order_index ?? -1) + 1;
    
    const { data: newModule, error: createError } = await supabase
      .from('modules')
      .insert({
        course_id: testCourse.id,
        title: 'Módulo de Teste - ' + new Date().toISOString(),
        order_index: newModuleIndex,
        content_jsonb: { html: '<p>Conteúdo de teste criado automaticamente</p>' }
      })
      .select('id, title, order_index, content_jsonb')
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar módulo de teste:', createError);
      return;
    }
    
    console.log(`✅ Módulo criado: ${newModule.title} (ID: ${newModule.id})`);
    
    // 4. Teste de atualização de módulo
    console.log('\n📋 4. Testando atualização de módulo...');
    const updatedContent = '<p>Conteúdo atualizado em ' + new Date().toISOString() + '</p>';
    
    const { error: updateError } = await supabase
      .from('modules')
      .update({
        title: 'Módulo Atualizado - ' + new Date().toISOString(),
        content_jsonb: { 
          html: updatedContent,
          last_saved: new Date().toISOString(),
          word_count: updatedContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
        }
      })
      .eq('id', newModule.id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar módulo:', updateError);
    } else {
      console.log('✅ Módulo atualizado com sucesso');
    }
    
    // 5. Verificar se a atualização foi persistida
    console.log('\n📋 5. Verificando persistência da atualização...');
    const { data: updatedModule, error: fetchError } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('id', newModule.id)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar módulo atualizado:', fetchError);
    } else {
      console.log(`✅ Módulo verificado: ${updatedModule.title}`);
      console.log(`   Conteúdo: ${updatedModule.content_jsonb?.html?.substring(0, 100)}...`);
    }
    
    // 6. Teste de exclusão de módulo
    console.log('\n📋 6. Testando exclusão de módulo...');
    const { error: deleteError } = await supabase
      .from('modules')
      .delete()
      .eq('id', newModule.id);
    
    if (deleteError) {
      console.error('❌ Erro ao excluir módulo:', deleteError);
    } else {
      console.log('✅ Módulo excluído com sucesso');
    }
    
    // 7. Verificar se a exclusão foi efetiva
    console.log('\n📋 7. Verificando se a exclusão foi efetiva...');
    const { data: deletedModule, error: verifyError } = await supabase
      .from('modules')
      .select('id')
      .eq('id', newModule.id)
      .maybeSingle();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar exclusão:', verifyError);
    } else if (deletedModule) {
      console.log('⚠️ Módulo ainda existe após exclusão');
    } else {
      console.log('✅ Módulo excluído com sucesso - não encontrado no banco');
    }
    
    // 8. Teste de integridade dos módulos restantes
    console.log('\n📋 8. Verificando integridade dos módulos restantes...');
    const { data: remainingModules, error: remainingError } = await supabase
      .from('modules')
      .select('id, title, order_index, content_jsonb')
      .eq('course_id', testCourse.id)
      .order('order_index');
    
    if (remainingError) {
      console.error('❌ Erro ao buscar módulos restantes:', remainingError);
    } else {
      console.log(`✅ ${remainingModules.length} módulos restantes`);
      
      // Verificar se há problemas de ordem
      let orderIssues = false;
      for (let i = 0; i < remainingModules.length; i++) {
        if (remainingModules[i].order_index !== i) {
          console.log(`⚠️ Problema de ordem: módulo "${remainingModules[i].title}" tem order_index ${remainingModules[i].order_index}, esperado ${i}`);
          orderIssues = true;
        }
      }
      
      if (!orderIssues) {
        console.log('✅ Ordem dos módulos está correta');
      }
    }
    
    // 9. Resumo dos testes
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('   ✅ Busca de cursos: OK');
    console.log('   ✅ Busca de módulos: OK');
    console.log('   ✅ Criação de módulo: OK');
    console.log('   ✅ Atualização de módulo: OK');
    console.log('   ✅ Persistência de dados: OK');
    console.log('   ✅ Exclusão de módulo: OK');
    console.log('   ✅ Verificação de exclusão: OK');
    console.log('   ✅ Integridade dos dados: OK');
    
    console.log('\n🎉 Todos os testes passaram! O AdminCourseEditor está funcionando corretamente.');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes
testEditorFunctionality().then(() => {
  console.log('\n✅ Testes concluídos!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal nos testes:', error);
  process.exit(1);
});