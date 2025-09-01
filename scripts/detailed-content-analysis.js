/**
 * Script detalhado para analisar conteúdo dos módulos
 * Verifica se o conteúdo corresponde ao título e identifica problemas específicos
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Função principal para análise detalhada
 */
async function detailedContentAnalysis() {
  console.log('🔍 Iniciando análise detalhada do conteúdo dos módulos...');
  
  try {
    // Buscar todos os módulos com conteúdo
    const { data: modules, error } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        content_jsonb,
        order_index,
        course_id,
        courses!inner(
          id,
          title,
          is_published
        )
      `)
      .eq('courses.is_published', true)
      .order('course_id, order_index');
    
    if (error) {
      throw new Error(`Erro ao buscar módulos: ${error.message}`);
    }
    
    console.log(`📖 Analisando ${modules.length} módulos...`);
    
    // Analisar cada módulo individualmente
    const analysis = {
      totalModules: modules.length,
      moduleDetails: [],
      contentProblems: [],
      duplications: new Map(),
      courseProblems: new Map()
    };
    
    for (const module of modules) {
      const moduleAnalysis = analyzeModuleContent(module);
      analysis.moduleDetails.push(moduleAnalysis);
      
      // Agrupar por problemas
      if (moduleAnalysis.problems.length > 0) {
        analysis.contentProblems.push(moduleAnalysis);
      }
      
      // Verificar duplicações
      const contentKey = JSON.stringify(module.content_jsonb);
      if (!analysis.duplications.has(contentKey)) {
        analysis.duplications.set(contentKey, []);
      }
      analysis.duplications.get(contentKey).push(moduleAnalysis);
      
      // Agrupar por curso
      const courseId = module.course_id;
      if (!analysis.courseProblems.has(courseId)) {
        analysis.courseProblems.set(courseId, {
          courseTitle: module.courses.title,
          modules: [],
          issues: []
        });
      }
      analysis.courseProblems.get(courseId).modules.push(moduleAnalysis);
    }
    
    // Gerar relatório detalhado
    generateDetailedReport(analysis);
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error.message);
    process.exit(1);
  }
}

/**
 * Analisa o conteúdo de um módulo específico
 */
function analyzeModuleContent(module) {
  const analysis = {
    moduleId: module.id,
    title: module.title,
    courseId: module.course_id,
    courseTitle: module.courses.title,
    orderIndex: module.order_index,
    content: module.content_jsonb,
    problems: [],
    contentSummary: {
      hasHtml: false,
      htmlLength: 0,
      textContent: '',
      wordCount: 0
    }
  };
  
  // Verificar se tem conteúdo
  if (!module.content_jsonb || Object.keys(module.content_jsonb).length === 0) {
    analysis.problems.push('Conteúdo vazio');
    return analysis;
  }
  
  // Analisar conteúdo HTML
  if (module.content_jsonb.html) {
    analysis.contentSummary.hasHtml = true;
    analysis.contentSummary.htmlLength = module.content_jsonb.html.length;
    
    // Extrair texto do HTML
    const textContent = module.content_jsonb.html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    analysis.contentSummary.textContent = textContent;
    analysis.contentSummary.wordCount = textContent.split(' ').filter(word => word.length > 0).length;
    
    // Verificar se o conteúdo é muito genérico
    if (analysis.contentSummary.wordCount < 10) {
      analysis.problems.push('Conteúdo muito curto (menos de 10 palavras)');
    }
    
    // Verificar se o título está relacionado ao conteúdo
    const titleWords = module.title.toLowerCase().split(' ').filter(word => word.length > 3);
    const contentLower = textContent.toLowerCase();
    
    const titleWordsInContent = titleWords.filter(word => contentLower.includes(word));
    
    if (titleWords.length > 0 && titleWordsInContent.length === 0) {
      analysis.problems.push('Título não relacionado ao conteúdo');
    }
    
    // Verificar conteúdo genérico
    const genericPhrases = [
      'responda às questões',
      'complete o módulo',
      'conclua o curso',
      'prova final',
      'teste seus conhecimentos'
    ];
    
    const hasGenericContent = genericPhrases.some(phrase => 
      contentLower.includes(phrase.toLowerCase())
    );
    
    if (hasGenericContent && analysis.contentSummary.wordCount < 50) {
      analysis.problems.push('Conteúdo genérico demais');
    }
    
  } else {
    analysis.problems.push('Sem conteúdo HTML');
  }
  
  return analysis;
}

/**
 * Gera relatório detalhado da análise
 */
function generateDetailedReport(analysis) {
  console.log('\n📊 RELATÓRIO DETALHADO DE ANÁLISE DE CONTEÚDO');
  console.log('=' .repeat(60));
  
  console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
  console.log(`   Total de módulos analisados: ${analysis.totalModules}`);
  console.log(`   Módulos com problemas: ${analysis.contentProblems.length}`);
  
  // Análise de duplicações
  const duplicatedGroups = Array.from(analysis.duplications.entries())
    .filter(([_, modules]) => modules.length > 1);
  
  console.log(`   Grupos de conteúdo duplicado: ${duplicatedGroups.length}`);
  
  // Relatório de problemas por módulo
  if (analysis.contentProblems.length > 0) {
    console.log(`\n⚠️  MÓDULOS COM PROBLEMAS:`);
    analysis.contentProblems.forEach(module => {
      console.log(`\n   📖 ${module.courseTitle} > ${module.title}`);
      console.log(`      ID: ${module.moduleId}`);
      console.log(`      Problemas: ${module.problems.join(', ')}`);
      console.log(`      Palavras: ${module.contentSummary.wordCount}`);
      if (module.contentSummary.textContent) {
        const preview = module.contentSummary.textContent.substring(0, 100);
        console.log(`      Preview: "${preview}${preview.length === 100 ? '...' : '"'}`);
      }
    });
  }
  
  // Relatório de duplicações
  if (duplicatedGroups.length > 0) {
    console.log(`\n🔄 CONTEÚDO DUPLICADO DETALHADO:`);
    duplicatedGroups.forEach((group, index) => {
      const [contentKey, modules] = group;
      console.log(`\n   Grupo ${index + 1} (${modules.length} módulos):`);
      modules.forEach(module => {
        console.log(`     - ${module.courseTitle} > ${module.title}`);
        console.log(`       ID: ${module.moduleId}`);
      });
      
      // Mostrar o conteúdo duplicado
      const firstModule = modules[0];
      if (firstModule.contentSummary.textContent) {
        console.log(`     Conteúdo: "${firstModule.contentSummary.textContent}"`);
      }
    });
  }
  
  // Análise por curso
  console.log(`\n📚 ANÁLISE POR CURSO:`);
  analysis.courseProblems.forEach((courseData, courseId) => {
    console.log(`\n   📖 ${courseData.courseTitle}:`);
    console.log(`      Total de módulos: ${courseData.modules.length}`);
    
    const modulesWithProblems = courseData.modules.filter(m => m.problems.length > 0);
    console.log(`      Módulos com problemas: ${modulesWithProblems.length}`);
    
    courseData.modules.forEach((module, index) => {
      const status = module.problems.length > 0 ? '⚠️' : '✅';
      const problemsText = module.problems.length > 0 ? ` (${module.problems.join(', ')})` : '';
      console.log(`      ${index + 1}. ${status} ${module.title}${problemsText}`);
    });
  });
  
  // Salvar relatório detalhado
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalModules: analysis.totalModules,
      modulesWithProblems: analysis.contentProblems.length,
      duplicatedGroups: duplicatedGroups.length
    },
    moduleDetails: analysis.moduleDetails,
    contentProblems: analysis.contentProblems,
    duplicatedContent: duplicatedGroups.map(([contentKey, modules]) => ({
      modules: modules.map(m => ({
        moduleId: m.moduleId,
        title: m.title,
        courseTitle: m.courseTitle,
        content: m.content
      })),
      contentPreview: modules[0]?.contentSummary.textContent || ''
    })),
    courseAnalysis: Array.from(analysis.courseProblems.entries()).map(([courseId, data]) => ({
      courseId,
      courseTitle: data.courseTitle,
      totalModules: data.modules.length,
      modulesWithProblems: data.modules.filter(m => m.problems.length > 0).length,
      modules: data.modules.map(m => ({
        id: m.moduleId,
        title: m.title,
        problems: m.problems,
        wordCount: m.contentSummary.wordCount,
        orderIndex: m.orderIndex
      }))
    }))
  };
  
  const reportPath = path.join(process.cwd(), 'scripts', 'detailed-content-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`\n💾 Relatório detalhado salvo em: ${reportPath}`);
  
  // Recomendações
  console.log('\n🎯 RECOMENDAÇÕES:');
  
  if (duplicatedGroups.length > 0) {
    console.log('   1. ⚠️  Corrigir conteúdo duplicado encontrado');
  }
  
  if (analysis.contentProblems.length > 0) {
    console.log('   2. 📝 Revisar módulos com problemas de conteúdo');
  }
  
  console.log('   3. 🔍 Verificar se há backup dos dados originais');
  console.log('   4. 🛠️  Planejar estratégia de correção específica');
  console.log('   5. ✅ Validar correções antes de aplicar');
}

// Executar análise
detailedContentAnalysis().catch(console.error);