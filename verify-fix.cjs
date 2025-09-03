const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyModuleContent() {
  try {
    console.log('🔍 Verificando conteúdo dos módulos após correção...');
    
    // Buscar todos os módulos com seus cursos
    const { data: modules, error } = await supabase
      .from('modules')
      .select(`
        id,
        course_id,
        title,
        content_jsonb,
        order_index,
        courses!inner(title)
      `)
      .order('course_id')
      .order('order_index');

    if (error) {
      console.error('❌ Erro ao buscar módulos:', error);
      return;
    }

    console.log(`📊 Total de módulos encontrados: ${modules.length}`);
    
    // Agrupar por curso
    const modulesByCourse = modules.reduce((acc, module) => {
      const courseId = module.course_id;
      if (!acc[courseId]) {
        acc[courseId] = {
          courseTitle: module.courses.title,
          modules: []
        };
      }
      acc[courseId].modules.push(module);
      return acc;
    }, {});

    // Verificar cada curso
    for (const [courseId, courseData] of Object.entries(modulesByCourse)) {
      console.log(`\n📚 Curso: ${courseData.courseTitle} (ID: ${courseId})`);
      console.log(`   Módulos: ${courseData.modules.length}`);
      
      // Verificar se há conteúdo duplicado
      const contentHashes = new Set();
      let hasDuplicates = false;
      
      for (const module of courseData.modules) {
        const content = module.content_jsonb?.html || '';
        const contentHash = content.replace(/\s+/g, ' ').trim();
        
        if (contentHashes.has(contentHash) && contentHash.length > 10) {
          hasDuplicates = true;
          console.log(`   ⚠️  Módulo "${module.title}" tem conteúdo duplicado`);
        } else {
          contentHashes.add(contentHash);
          console.log(`   ✅ Módulo "${module.title}" - ${content.length} chars`);
        }
      }
      
      if (!hasDuplicates) {
        console.log(`   🎉 Todos os módulos têm conteúdo único!`);
      }
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

verifyModuleContent();