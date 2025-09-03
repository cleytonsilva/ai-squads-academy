const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkModules() {
  try {
    console.log('🔍 Verificando módulos no banco de dados...');
    
    const { data: modules, error } = await supabase
      .from('modules')
      .select('id, course_id, title, content_jsonb, order_index')
      .order('course_id, order_index');
    
    if (error) {
      console.error('❌ Erro ao buscar módulos:', error);
      return;
    }
    
    console.log(`📊 Total de módulos encontrados: ${modules.length}`);
    
    // Agrupar por curso
    const modulesByCourse = {};
    modules.forEach(module => {
      if (!modulesByCourse[module.course_id]) {
        modulesByCourse[module.course_id] = [];
      }
      modulesByCourse[module.course_id].push(module);
    });
    
    // Analisar cada curso
    for (const [courseId, courseModules] of Object.entries(modulesByCourse)) {
      console.log(`\n📚 Curso ID: ${courseId}`);
      console.log(`   Módulos: ${courseModules.length}`);
      
      // Verificar se todos os módulos têm o mesmo conteúdo
      const contents = courseModules.map(m => {
        const html = m.content_jsonb?.html || '';
        return html.replace(/\s+/g, ' ').trim();
      });
      
      const uniqueContents = [...new Set(contents)];
      
      if (uniqueContents.length === 1 && uniqueContents[0] !== '') {
        console.log('   ⚠️  PROBLEMA: Todos os módulos têm o mesmo conteúdo!');
        console.log(`   📝 Conteúdo duplicado (${uniqueContents[0].length} chars): ${uniqueContents[0].substring(0, 100)}...`);
      } else if (uniqueContents.length === 1 && uniqueContents[0] === '') {
        console.log('   ⚠️  PROBLEMA: Todos os módulos estão vazios!');
      } else {
        console.log('   ✅ Módulos têm conteúdos únicos');
      }
      
      // Mostrar detalhes de cada módulo
      courseModules.forEach((module, index) => {
        const html = module.content_jsonb?.html || '';
        const normalizedHtml = html.replace(/\s+/g, ' ').trim();
        console.log(`   ${index + 1}. ${module.title} (${normalizedHtml.length} chars): ${normalizedHtml.substring(0, 50)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkModules();