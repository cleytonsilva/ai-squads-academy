const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Script para analisar o erro ERR_BLOCKED_BY_ORB
 * Identifica URLs do Replicate que estão causando problemas de CORS/ORB
 */
async function analyzeORBError() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não configuradas');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🔍 ANÁLISE DO ERRO ERR_BLOCKED_BY_ORB');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar URLs do Replicate na tabela courses
    console.log('\n1️⃣ VERIFICANDO URLs DO REPLICATE NA TABELA COURSES...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, cover_image_url, thumbnail_url')
      .or('cover_image_url.like.%replicate.delivery%,thumbnail_url.like.%replicate.delivery%');

    if (coursesError) {
      console.error('❌ Erro ao buscar cursos:', coursesError.message);
    } else {
      console.log(`✅ Encontrados ${courses.length} cursos com URLs do Replicate:`);
      courses.forEach((course, index) => {
        console.log(`   ${index + 1}. ${course.title} (${course.id})`);
        if (course.cover_image_url?.includes('replicate.delivery')) {
          console.log(`      cover_image_url: ${course.cover_image_url}`);
        }
        if (course.thumbnail_url?.includes('replicate.delivery')) {
          console.log(`      thumbnail_url: ${course.thumbnail_url}`);
        }
        console.log('');
      });
    }

    // 2. Verificar URLs do Replicate na tabela course_covers
    console.log('\n2️⃣ VERIFICANDO URLs DO REPLICATE NA TABELA COURSE_COVERS...');
    const { data: covers, error: coversError } = await supabase
      .from('course_covers')
      .select('*')
      .like('image_url', '%replicate.delivery%');

    if (coversError) {
      console.error('❌ Erro ao buscar capas:', coversError.message);
    } else {
      console.log(`✅ Encontradas ${covers.length} capas com URLs do Replicate:`);
      covers.forEach((cover, index) => {
        console.log(`   ${index + 1}. ID: ${cover.id}`);
        console.log(`      Course ID: ${cover.course_id}`);
        console.log(`      URL: ${cover.image_url}`);
        console.log(`      Ativa: ${cover.is_active}`);
        console.log('');
      });
    }

    // 3. Verificar predições do Replicate
    console.log('\n3️⃣ VERIFICANDO PREDIÇÕES DO REPLICATE...');
    const { data: predictions, error: predError } = await supabase
      .from('replicate_predictions')
      .select('*')
      .like('output', '%replicate.delivery%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (predError) {
      console.error('❌ Erro ao buscar predições:', predError.message);
    } else {
      console.log(`✅ Últimas ${predictions.length} predições com URLs do Replicate:`);
      predictions.forEach((pred, index) => {
        console.log(`   ${index + 1}. ID: ${pred.prediction_id}`);
        console.log(`      Status: ${pred.status}`);
        console.log(`      Output: ${pred.output}`);
        console.log(`      Course ID: ${pred.course_id}`);
        console.log(`      Criado: ${pred.created_at}`);
        console.log('');
      });
    }

    // 4. Testar acessibilidade das URLs
    console.log('\n4️⃣ TESTANDO ACESSIBILIDADE DAS URLs...');
    const allUrls = new Set();
    
    // Coletar todas as URLs do Replicate
    courses?.forEach(course => {
      if (course.cover_image_url?.includes('replicate.delivery')) {
        allUrls.add(course.cover_image_url);
      }
      if (course.thumbnail_url?.includes('replicate.delivery')) {
        allUrls.add(course.thumbnail_url);
      }
    });
    
    covers?.forEach(cover => {
      if (cover.image_url?.includes('replicate.delivery')) {
        allUrls.add(cover.image_url);
      }
    });

    console.log(`📊 Total de URLs únicas do Replicate: ${allUrls.size}`);
    
    for (const url of allUrls) {
      try {
        console.log(`\n🔗 Testando: ${url}`);
        const response = await fetch(url, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log(`   Content-Length: ${response.headers.get('content-length')}`);
        console.log(`   CORS Headers: ${response.headers.get('access-control-allow-origin')}`);
        
        if (response.status === 200) {
          console.log('   ✅ URL acessível');
        } else {
          console.log(`   ❌ URL com problema - Status: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro ao acessar: ${error.message}`);
      }
    }

    // 5. Análise do problema ORB
    console.log('\n5️⃣ ANÁLISE DO PROBLEMA ORB...');
    console.log('\n📋 SOBRE O ERR_BLOCKED_BY_ORB:');
    console.log('   - ORB (Opaque Response Blocking) é uma política de segurança do navegador');
    console.log('   - Bloqueia respostas opacas (sem CORS) para recursos sensíveis');
    console.log('   - Afeta principalmente imagens, scripts e outros recursos externos');
    console.log('   - URLs do replicate.delivery podem não ter headers CORS adequados');
    
    console.log('\n💡 SOLUÇÕES POSSÍVEIS:');
    console.log('   1. Download e re-upload para Supabase Storage (RECOMENDADO)');
    console.log('   2. Implementar proxy server para contornar CORS');
    console.log('   3. Usar service worker para interceptar requests');
    console.log('   4. Configurar headers CORS no servidor (se possível)');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Implementar sistema de download/re-upload automático');
    console.log('   2. Atualizar webhook do Replicate para processar imagens localmente');
    console.log('   3. Migrar URLs existentes do Replicate para Storage local');
    console.log('   4. Testar solução com curso Blue Team Fundamentos');

    // 6. Estatísticas finais
    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    console.log(`   - Cursos afetados: ${courses?.length || 0}`);
    console.log(`   - Capas afetadas: ${covers?.length || 0}`);
    console.log(`   - URLs únicas: ${allUrls.size}`);
    console.log(`   - Predições recentes: ${predictions?.length || 0}`);

  } catch (error) {
    console.error('❌ Erro durante análise:', error.message);
  }
}

analyzeORBError();