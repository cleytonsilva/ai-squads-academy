const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Script para limpar URLs inválidas do Replicate e gerar novas imagens
 */
async function cleanInvalidReplicateUrls() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não configuradas');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🧹 LIMPEZA DE URLs INVÁLIDAS DO REPLICATE');
  console.log('=' .repeat(50));

  try {
    // 1. Buscar URLs do Replicate que retornam 404
    console.log('\n1️⃣ VERIFICANDO URLs INVÁLIDAS...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, cover_image_url, thumbnail_url')
      .or('cover_image_url.like.%replicate.delivery%,thumbnail_url.like.%replicate.delivery%');

    if (coursesError) {
      console.error('❌ Erro ao buscar cursos:', coursesError.message);
      return;
    }

    console.log(`✅ Encontrados ${courses.length} cursos com URLs do Replicate`);

    // 2. Verificar cada URL e limpar as inválidas
    for (const course of courses) {
      console.log(`\n🔍 Verificando curso: ${course.title}`);
      
      let needsUpdate = false;
      let newCoverUrl = course.cover_image_url;
      let newThumbnailUrl = course.thumbnail_url;

      // Verificar cover_image_url
      if (course.cover_image_url?.includes('replicate.delivery')) {
        const isValid = await checkUrlValidity(course.cover_image_url);
        if (!isValid) {
          console.log('   ❌ cover_image_url inválida (404) - removendo...');
          newCoverUrl = null;
          needsUpdate = true;
        } else {
          console.log('   ✅ cover_image_url válida');
        }
      }

      // Verificar thumbnail_url
      if (course.thumbnail_url?.includes('replicate.delivery')) {
        const isValid = await checkUrlValidity(course.thumbnail_url);
        if (!isValid) {
          console.log('   ❌ thumbnail_url inválida (404) - removendo...');
          newThumbnailUrl = null;
          needsUpdate = true;
        } else {
          console.log('   ✅ thumbnail_url válida');
        }
      }

      // 3. Atualizar banco de dados se necessário
      if (needsUpdate) {
        console.log('   💾 Atualizando banco de dados...');
        const { error: updateError } = await supabase
          .from('courses')
          .update({
            cover_image_url: newCoverUrl,
            thumbnail_url: newThumbnailUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', course.id);

        if (updateError) {
          console.error('   ❌ Erro ao atualizar curso:', updateError.message);
        } else {
          console.log('   ✅ URLs inválidas removidas do banco de dados');
          
          // 4. Gerar nova imagem para o curso
          console.log('   🎨 Gerando nova imagem para o curso...');
          await generateNewCourseImage(supabase, course.id, course.title);
        }
      } else {
        console.log('   ℹ️  Nenhuma atualização necessária');
      }
    }

    console.log('\n✅ LIMPEZA CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error.message);
  }
}

/**
 * Verifica se uma URL é válida (não retorna 404)
 * @param {string} url - URL para verificar
 * @returns {boolean} True se a URL é válida
 */
async function checkUrlValidity(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Gera uma nova imagem para o curso usando a Edge Function
 * @param {Object} supabase - Cliente Supabase
 * @param {string} courseId - ID do curso
 * @param {string} courseTitle - Título do curso
 */
async function generateNewCourseImage(supabase, courseId, courseTitle) {
  try {
    console.log(`      🚀 Iniciando geração de nova capa para: ${courseTitle}`);
    
    const { data, error } = await supabase.functions.invoke('generate-course-cover', {
      body: {
        courseId: courseId,
        engine: 'flux',
        regenerate: true
      }
    });

    if (error) {
      console.log(`      ❌ Erro na geração: ${error.message}`);
    } else if (data?.success || data?.predictionId) {
      console.log(`      ✅ Geração iniciada! Prediction ID: ${data.predictionId || 'N/A'}`);
      console.log('      ⏳ A nova imagem será processada em breve pelo webhook');
    } else {
      console.log('      ⚠️  Resposta inesperada da Edge Function');
    }
  } catch (error) {
    console.log(`      ❌ Erro inesperado na geração: ${error.message}`);
  }
}

cleanInvalidReplicateUrls();