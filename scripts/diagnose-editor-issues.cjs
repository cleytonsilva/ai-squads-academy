/**
 * Script de diagnóstico para problemas do AdminCourseEditor
 * Identifica problemas de sincronização de conteúdo e estado
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

async function diagnoseEditorIssues() {
  console.log('🔍 Iniciando diagnóstico dos problemas do AdminCourseEditor...');
  
  try {
    // 1. Verificar módulos com conteúdo duplicado
    console.log('\n📋 1. Verificando conteúdo duplicado entre módulos...');
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, title, course_id, order_index, content_jsonb')
      .order('course_id, order_index');
    
    if (modulesError) {
      console.error('❌ Erro ao buscar módulos:', modulesError);
      return;
    }
    
    // Agrupar por curso
    const modulesByCourse = modules.reduce((acc, module) => {
      if (!acc[module.course_id]) {
        acc[module.course_id] = [];
      }
      acc[module.course_id].push(module);
      return acc;
    }, {});
    
    let duplicateContentFound = false;
    
    for (const [courseId, courseModules] of Object.entries(modulesByCourse)) {
      console.log(`\n📚 Curso ${courseId}:`);
      
      // Verificar conteúdo duplicado dentro do curso
      const contentMap = new Map();
      
      for (const module of courseModules) {
        const content = module.content_jsonb?.html || '';
        const contentHash = content.trim();
        
        if (contentHash && contentMap.has(contentHash)) {
          console.log(`⚠️  CONTEÚDO DUPLICADO ENCONTRADO:`);
          console.log(`   Módulo 1: ${contentMap.get(contentHash).title} (ID: ${contentMap.get(contentHash).id})`);
          console.log(`   Módulo 2: ${module.title} (ID: ${module.id})`);
          console.log(`   Conteúdo: ${contentHash.substring(0, 100)}...`);
          duplicateContentFound = true;
        } else if (contentHash) {
          contentMap.set(contentHash, module);
        }
        
        console.log(`   📄 ${module.title} (#${module.order_index}) - ${content.length} chars`);
      }
    }
    
    if (!duplicateContentFound) {
      console.log('✅ Nenhum conteúdo duplicado encontrado');
    }
    
    // 2. Verificar módulos com conteúdo vazio ou inválido
    console.log('\n📋 2. Verificando módulos com problemas de conteúdo...');
    
    const problematicModules = modules.filter(module => {
      const content = module.content_jsonb?.html || '';
      return (
        !content || 
        content.trim() === '' || 
        content === '<p></p>' ||
        content.includes('undefined') ||
        content.includes('null')
      );
    });
    
    if (problematicModules.length > 0) {
      console.log(`⚠️  ${problematicModules.length} módulos com problemas de conteúdo:`);
      problematicModules.forEach(module => {
        console.log(`   - ${module.title} (ID: ${module.id}) - Conteúdo: "${module.content_jsonb?.html || 'VAZIO'}"`);        
      });
    } else {
      console.log('✅ Todos os módulos têm conteúdo válido');
    }
    
    // 3. Verificar estrutura do content_jsonb
    console.log('\n📋 3. Verificando estrutura do content_jsonb...');
    
    const invalidStructures = modules.filter(module => {
      const content = module.content_jsonb;
      return (
        !content ||
        typeof content !== 'object' ||
        !content.hasOwnProperty('html')
      );
    });
    
    if (invalidStructures.length > 0) {
      console.log(`⚠️  ${invalidStructures.length} módulos com estrutura inválida:`);
      invalidStructures.forEach(module => {
        console.log(`   - ${module.title} (ID: ${module.id}) - Estrutura: ${JSON.stringify(module.content_jsonb)}`);
      });
    } else {
      console.log('✅ Todas as estruturas content_jsonb são válidas');
    }
    
    // 4. Verificar módulos órfãos (sem curso)
    console.log('\n📋 4. Verificando módulos órfãos...');
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id');
    
    if (coursesError) {
      console.error('❌ Erro ao buscar cursos:', coursesError);
      return;
    }
    
    const courseIds = new Set(courses.map(c => c.id));
    const orphanModules = modules.filter(module => !courseIds.has(module.course_id));
    
    if (orphanModules.length > 0) {
      console.log(`⚠️  ${orphanModules.length} módulos órfãos encontrados:`);
      orphanModules.forEach(module => {
        console.log(`   - ${module.title} (ID: ${module.id}) - Curso inexistente: ${module.course_id}`);
      });
    } else {
      console.log('✅ Nenhum módulo órfão encontrado');
    }
    
    // 5. Verificar ordem dos módulos
    console.log('\n📋 5. Verificando ordem dos módulos...');
    
    let orderIssues = false;
    
    for (const [courseId, courseModules] of Object.entries(modulesByCourse)) {
      const sortedModules = courseModules.sort((a, b) => a.order_index - b.order_index);
      
      // Verificar se há gaps ou duplicatas na ordem
      for (let i = 0; i < sortedModules.length; i++) {
        const expectedIndex = i;
        const actualIndex = sortedModules[i].order_index;
        
        if (actualIndex !== expectedIndex) {
          console.log(`⚠️  Problema de ordem no curso ${courseId}:`);
          console.log(`   Módulo "${sortedModules[i].title}" tem order_index ${actualIndex}, esperado ${expectedIndex}`);
          orderIssues = true;
        }
      }
    }
    
    if (!orderIssues) {
      console.log('✅ Ordem dos módulos está correta');
    }
    
    // 6. Gerar relatório de resumo
    console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
    console.log(`   Total de módulos: ${modules.length}`);
    console.log(`   Total de cursos: ${Object.keys(modulesByCourse).length}`);
    console.log(`   Módulos com problemas de conteúdo: ${problematicModules.length}`);
    console.log(`   Módulos com estrutura inválida: ${invalidStructures.length}`);
    console.log(`   Módulos órfãos: ${orphanModules.length}`);
    console.log(`   Conteúdo duplicado: ${duplicateContentFound ? 'SIM' : 'NÃO'}`);
    console.log(`   Problemas de ordem: ${orderIssues ? 'SIM' : 'NÃO'}`);
    
    // Salvar relatório detalhado
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalModules: modules.length,
        totalCourses: Object.keys(modulesByCourse).length,
        problematicModules: problematicModules.length,
        invalidStructures: invalidStructures.length,
        orphanModules: orphanModules.length,
        duplicateContent: duplicateContentFound,
        orderIssues: orderIssues
      },
      details: {
        problematicModules,
        invalidStructures,
        orphanModules
      }
    };
    
    const fs = require('fs');
    const reportPath = './scripts/editor-diagnosis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnoseEditorIssues().then(() => {
  console.log('\n✅ Diagnóstico concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});