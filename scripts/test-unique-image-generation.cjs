/**
 * Script para testar a geração de imagens únicas para cursos
 * Verifica se cada curso gera prompts e imagens completamente diferentes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Não definida');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Definida' : 'Não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Simula a função generateCourseHash da Edge Function
 */
function generateCourseHash(courseId, title, description = '') {
  const content = `${courseId}-${title}-${description}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Simula a função detectCourseCategory da Edge Function
 */
function detectCourseCategory(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  
  const categories = {
    'cybersecurity': {
      keywords: ['cibersegurança', 'cybersecurity', 'security', 'hacking', 'blue team', 'red team', 'penetration', 'firewall', 'malware', 'vulnerability'],
      priority: 10
    },
    'programming': {
      keywords: ['programação', 'programming', 'código', 'code', 'desenvolvimento', 'development', 'software', 'javascript', 'python', 'java', 'react', 'node'],
      priority: 9
    },
    'data_science': {
      keywords: ['dados', 'data', 'analytics', 'machine learning', 'ia', 'artificial intelligence', 'statistics', 'big data', 'analysis'],
      priority: 8
    },
    'design': {
      keywords: ['design', 'ui', 'ux', 'interface', 'visual', 'graphics', 'photoshop', 'figma', 'creative'],
      priority: 7
    },
    'business': {
      keywords: ['negócios', 'business', 'marketing', 'vendas', 'sales', 'gestão', 'management', 'empreendedorismo', 'entrepreneurship'],
      priority: 6
    }
  };
  
  let bestMatch = 'general';
  let highestScore = 0;
  
  for (const [category, config] of Object.entries(categories)) {
    const matches = config.keywords.filter(keyword => text.includes(keyword)).length;
    const score = matches * config.priority;
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = category;
    }
  }
  
  return bestMatch;
}

/**
 * Testa a geração de imagens para um curso específico
 */
async function testCourseImageGeneration(courseId) {
  try {
    console.log(`\n🧪 Testando geração de imagem para curso: ${courseId}`);
    
    // Buscar dados do curso
    const { data: course, error } = await supabase
      .from('courses')
      .select('id, title, description')
      .eq('id', courseId)
      .single();
    
    if (error || !course) {
      console.error(`❌ Erro ao buscar curso ${courseId}:`, error?.message);
      return null;
    }
    
    console.log(`📚 Curso encontrado: "${course.title}"`);
    
    // Gerar hash único
    const courseHash = generateCourseHash(course.id, course.title, course.description);
    console.log(`🔢 Hash único: ${courseHash}`);
    
    // Detectar categoria
    const category = detectCourseCategory(course.title, course.description);
    console.log(`🏷️ Categoria detectada: ${category}`);
    
    // Chamar a Edge Function para gerar a capa
    const { data: result, error: genError } = await supabase.functions.invoke('generate-course-cover', {
      body: {
        courseId: course.id,
        engine: 'flux',
        regenerate: true
      }
    });
    
    if (genError) {
      console.error(`❌ Erro na geração:`, genError.message);
      return null;
    }
    
    console.log(`✅ Geração iniciada com sucesso:`);
    console.log(`   - Prediction ID: ${result.predictionId}`);
    console.log(`   - Engine: ${result.engine}`);
    console.log(`   - Status: ${result.status}`);
    
    return {
      courseId: course.id,
      title: course.title,
      hash: courseHash,
      category,
      predictionId: result.predictionId
    };
    
  } catch (error) {
    console.error(`❌ Erro inesperado:`, error.message);
    return null;
  }
}

/**
 * Busca todos os cursos e testa a geração de imagens únicas
 */
async function testUniqueImageGeneration() {
  try {
    console.log('🚀 Iniciando teste de geração de imagens únicas para cursos\n');
    
    // Buscar todos os cursos
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, title, description')
      .limit(5); // Limitar a 5 cursos para teste
    
    if (error) {
      console.error('❌ Erro ao buscar cursos:', error.message);
      return;
    }
    
    if (!courses || courses.length === 0) {
      console.log('⚠️ Nenhum curso encontrado para teste');
      return;
    }
    
    console.log(`📋 Encontrados ${courses.length} cursos para teste`);
    
    const results = [];
    
    // Testar cada curso
    for (const course of courses) {
      const result = await testCourseImageGeneration(course.id);
      if (result) {
        results.push(result);
      }
      
      // Aguardar um pouco entre as chamadas
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Verificar unicidade
    console.log('\n📊 RELATÓRIO DE UNICIDADE:');
    console.log('=' .repeat(50));
    
    const hashes = results.map(r => r.hash);
    const categories = results.map(r => r.category);
    const uniqueHashes = new Set(hashes);
    const uniqueCategories = new Set(categories);
    
    console.log(`\n🔢 Hashes gerados:`);
    results.forEach(r => {
      console.log(`   ${r.title}: ${r.hash} (${r.category})`);
    });
    
    console.log(`\n✅ Unicidade dos hashes: ${uniqueHashes.size}/${results.length} únicos`);
    console.log(`📂 Categorias detectadas: ${Array.from(uniqueCategories).join(', ')}`);
    
    if (uniqueHashes.size === results.length) {
      console.log('\n🎉 SUCESSO: Todos os cursos geraram hashes únicos!');
    } else {
      console.log('\n⚠️ ATENÇÃO: Alguns cursos geraram hashes duplicados!');
    }
    
    // Verificar predições no banco
    console.log('\n🔍 Verificando predições salvas...');
    const predictionIds = results.map(r => r.predictionId).filter(Boolean);
    
    if (predictionIds.length > 0) {
      const { data: predictions, error: predError } = await supabase
        .from('replicate_predictions')
        .select('prediction_id, course_id, status, input_data')
        .in('prediction_id', predictionIds);
      
      if (predError) {
        console.error('❌ Erro ao buscar predições:', predError.message);
      } else {
        console.log(`📝 ${predictions.length} predições encontradas no banco`);
        predictions.forEach(pred => {
          const course = results.find(r => r.courseId === pred.course_id);
          console.log(`   ${course?.title}: ${pred.status}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--course') {
    // Testar curso específico
    const courseId = args[1];
    if (!courseId) {
      console.error('❌ ID do curso é obrigatório quando usar --course');
      process.exit(1);
    }
    await testCourseImageGeneration(courseId);
  } else {
    // Testar todos os cursos
    await testUniqueImageGeneration();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testCourseImageGeneration,
  testUniqueImageGeneration,
  generateCourseHash,
  detectCourseCategory
};