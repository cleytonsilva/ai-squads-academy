/**
 * Script de diagnóstico para verificar módulos com conteúdo duplicado
 * Analisa o campo content_jsonb dos módulos e identifica inconsistências
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.error('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Função principal de diagnóstico
 */
async function diagnoseModules() {
  console.log('🔍 Iniciando diagnóstico dos módulos...');
  
  try {
    // 1. Buscar todos os cursos publicados
    const { data: publishedCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, is_published, status')
      .eq('is_published', true);
    
    if (coursesError) {
      throw new Error(`Erro ao buscar cursos: ${coursesError.message}`);
    }
    
    console.log(`📚 Encontrados ${publishedCourses.length} cursos publicados`);
    
    // 2. Buscar todos os módulos dos cursos publicados
    const courseIds = publishedCourses.map(course => course.id);
    
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, course_id, title, content_jsonb, order_index, is_published')
      .in('course_id', courseIds)
      .order('course_id, order_index');
    
    if (modulesError) {
      throw new Error(`Erro ao buscar módulos: ${modulesError.message}`);
    }
    
    console.log(`📖 Encontrados ${modules.length} módulos`);
    
    // 3. Analisar conteúdo dos módulos
    const analysis = analyzeModules(modules, publishedCourses);
    
    // 4. Gerar relatório
    generateReport(analysis);
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error.message);
    process.exit(1);
  }
}

/**
 * Analisa os módulos em busca de duplicações e inconsistências
 */
function analyzeModules(modules, courses) {
  console.log('\n🔬 Analisando conteúdo dos módulos...');
  
  const analysis = {
    totalModules: modules.length,
    duplicatedContent: [],
    emptyContent: [],
    contentByHash: new Map(),
    modulesByCourse: new Map(),
    inconsistencies: []
  };
  
  // Agrupar módulos por curso
  courses.forEach(course => {
    analysis.modulesByCourse.set(course.id, {
      course,
      modules: modules.filter(m => m.course_id === course.id)
    });
  });
  
  // Analisar cada módulo
  modules.forEach(module => {
    const content = module.content_jsonb;
    
    // Verificar conteúdo vazio
    if (!content || Object.keys(content).length === 0) {
      analysis.emptyContent.push({
        moduleId: module.id,
        title: module.title,
        courseId: module.course_id
      });
      return;
    }
    
    // Gerar hash do conteúdo para detectar duplicações
    const contentStr = JSON.stringify(content);
    const contentHash = generateSimpleHash(contentStr);
    
    if (!analysis.contentByHash.has(contentHash)) {
      analysis.contentByHash.set(contentHash, []);
    }
    
    analysis.contentByHash.get(contentHash).push({
      moduleId: module.id,
      title: module.title,
      courseId: module.course_id,
      content: content
    });
    
    // Verificar se título corresponde ao conteúdo
    if (content.html) {
      const htmlText = content.html.replace(/<[^>]*>/g, '').toLowerCase();
      const titleWords = module.title.toLowerCase().split(' ');
      const hasRelevantContent = titleWords.some(word => 
        word.length > 3 && htmlText.includes(word)
      );
      
      if (!hasRelevantContent && htmlText.length > 50) {
        analysis.inconsistencies.push({
          moduleId: module.id,
          title: module.title,
          courseId: module.course_id,
          issue: 'Conteúdo não parece corresponder ao título',
          contentPreview: htmlText.substring(0, 100) + '...'
        });
      }
    }
  });
  
  // Identificar conteúdo duplicado
  analysis.contentByHash.forEach((modulesList, hash) => {
    if (modulesList.length > 1) {
      analysis.duplicatedContent.push({
        hash,
        count: modulesList.length,
        modules: modulesList
      });
    }
  });
  
  return analysis;
}

/**
 * Gera um hash simples para comparação de conteúdo
 */
function generateSimpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * Gera relatório detalhado do diagnóstico
 */
function generateReport(analysis) {
  console.log('\n📊 RELATÓRIO DE DIAGNÓSTICO DOS MÓDULOS');
  console.log('=' .repeat(50));
  
  console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
  console.log(`   Total de módulos analisados: ${analysis.totalModules}`);
  console.log(`   Módulos com conteúdo vazio: ${analysis.emptyContent.length}`);
  console.log(`   Grupos de conteúdo duplicado: ${analysis.duplicatedContent.length}`);
  console.log(`   Inconsistências encontradas: ${analysis.inconsistencies.length}`);
  
  // Relatório de conteúdo duplicado
  if (analysis.duplicatedContent.length > 0) {
    console.log(`\n🔄 CONTEÚDO DUPLICADO:`);
    analysis.duplicatedContent.forEach((group, index) => {
      console.log(`\n   Grupo ${index + 1} (${group.count} módulos com mesmo conteúdo):`);
      group.modules.forEach(module => {
        console.log(`     - ${module.title} (ID: ${module.moduleId})`);
      });
    });
  }
  
  // Relatório de conteúdo vazio
  if (analysis.emptyContent.length > 0) {
    console.log(`\n📭 MÓDULOS COM CONTEÚDO VAZIO:`);
    analysis.emptyContent.forEach(module => {
      console.log(`   - ${module.title} (ID: ${module.moduleId})`);
    });
  }
  
  // Relatório de inconsistências
  if (analysis.inconsistencies.length > 0) {
    console.log(`\n⚠️  INCONSISTÊNCIAS ENCONTRADAS:`);
    analysis.inconsistencies.forEach(issue => {
      console.log(`   - ${issue.title}:`);
      console.log(`     Problema: ${issue.issue}`);
      console.log(`     Preview: ${issue.contentPreview}`);
    });
  }
  
  // Relatório por curso
  console.log(`\n📚 ANÁLISE POR CURSO:`);
  analysis.modulesByCourse.forEach((courseData, courseId) => {
    const { course, modules } = courseData;
    console.log(`\n   📖 ${course.title}:`);
    console.log(`      Módulos: ${modules.length}`);
    
    modules.forEach((module, index) => {
      const hasContent = module.content_jsonb && Object.keys(module.content_jsonb).length > 0;
      const status = hasContent ? '✅' : '❌';
      console.log(`      ${index + 1}. ${status} ${module.title}`);
    });
  });
  
  // Salvar relatório em arquivo
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalModules: analysis.totalModules,
      emptyContent: analysis.emptyContent.length,
      duplicatedContent: analysis.duplicatedContent.length,
      inconsistencies: analysis.inconsistencies.length
    },
    duplicatedContent: analysis.duplicatedContent,
    emptyContent: analysis.emptyContent,
    inconsistencies: analysis.inconsistencies,
    courseAnalysis: Array.from(analysis.modulesByCourse.entries()).map(([courseId, data]) => ({
      courseId,
      courseTitle: data.course.title,
      moduleCount: data.modules.length,
      modules: data.modules.map(m => ({
        id: m.id,
        title: m.title,
        hasContent: m.content_jsonb && Object.keys(m.content_jsonb).length > 0,
        orderIndex: m.order_index
      }))
    }))
  };
  
  const reportPath = path.join(process.cwd(), 'scripts', 'module-diagnosis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`\n💾 Relatório salvo em: ${reportPath}`);
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('   1. Revisar módulos com conteúdo duplicado');
  console.log('   2. Verificar backup dos dados originais');
  console.log('   3. Planejar estratégia de correção');
  console.log('   4. Executar correções com validação');
}

// Executar diagnóstico
diagnoseModules().catch(console.error);