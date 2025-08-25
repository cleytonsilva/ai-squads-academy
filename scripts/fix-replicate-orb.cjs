const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Script para corrigir o erro ERR_BLOCKED_BY_ORB
 * Faz download das imagens do Replicate e re-upload para Supabase Storage
 */
async function fixReplicateORB() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não configuradas');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🔧 CORREÇÃO DO ERRO ERR_BLOCKED_BY_ORB');
  console.log('=' .repeat(50));

  try {
    // 1. Buscar todas as URLs do Replicate
    console.log('\n1️⃣ BUSCANDO URLs DO REPLICATE...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, cover_image_url, thumbnail_url')
      .or('cover_image_url.like.%replicate.delivery%,thumbnail_url.like.%replicate.delivery%');

    if (coursesError) {
      console.error('❌ Erro ao buscar cursos:', coursesError.message);
      return;
    }

    console.log(`✅ Encontrados ${courses.length} cursos com URLs do Replicate`);

    // 2. Processar cada curso
    for (const course of courses) {
      console.log(`\n🔄 Processando curso: ${course.title}`);
      
      let newCoverUrl = course.cover_image_url;
      let newThumbnailUrl = course.thumbnail_url;
      let updated = false;

      // Processar cover_image_url
      if (course.cover_image_url?.includes('replicate.delivery')) {
        console.log('   📥 Fazendo download da cover_image_url...');
        const localUrl = await downloadAndUploadImage(
          supabase, 
          course.cover_image_url, 
          course.id, 
          'cover'
        );
        
        if (localUrl) {
          newCoverUrl = localUrl;
          updated = true;
          console.log('   ✅ Cover image migrada para Storage local');
        } else {
          console.log('   ❌ Falha ao migrar cover image');
        }
      }

      // Processar thumbnail_url
      if (course.thumbnail_url?.includes('replicate.delivery')) {
        console.log('   📥 Fazendo download da thumbnail_url...');
        
        // Se for a mesma URL da cover, usar a mesma URL local
        if (course.thumbnail_url === course.cover_image_url && newCoverUrl !== course.cover_image_url) {
          newThumbnailUrl = newCoverUrl;
          updated = true;
          console.log('   ✅ Thumbnail URL sincronizada com cover image');
        } else {
          const localUrl = await downloadAndUploadImage(
            supabase, 
            course.thumbnail_url, 
            course.id, 
            'thumbnail'
          );
          
          if (localUrl) {
            newThumbnailUrl = localUrl;
            updated = true;
            console.log('   ✅ Thumbnail image migrada para Storage local');
          } else {
            console.log('   ❌ Falha ao migrar thumbnail image');
          }
        }
      }

      // 3. Atualizar banco de dados
      if (updated) {
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
          console.log('   ✅ Curso atualizado com sucesso!');
          console.log(`      Nova cover_image_url: ${newCoverUrl}`);
          console.log(`      Nova thumbnail_url: ${newThumbnailUrl}`);
        }
      } else {
        console.log('   ℹ️  Nenhuma atualização necessária');
      }
    }

    // 4. Verificar resultado final
    console.log('\n4️⃣ VERIFICAÇÃO FINAL...');
    const { data: updatedCourses, error: verifyError } = await supabase
      .from('courses')
      .select('id, title, cover_image_url, thumbnail_url')
      .or('cover_image_url.like.%replicate.delivery%,thumbnail_url.like.%replicate.delivery%');

    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError.message);
    } else {
      console.log(`📊 Cursos ainda com URLs do Replicate: ${updatedCourses.length}`);
      if (updatedCourses.length === 0) {
        console.log('🎉 Todos os cursos foram migrados com sucesso!');
      } else {
        console.log('⚠️  Alguns cursos ainda precisam ser processados:');
        updatedCourses.forEach(course => {
          console.log(`   - ${course.title} (${course.id})`);
        });
      }
    }

    console.log('\n✅ PROCESSO DE CORREÇÃO CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro durante correção:', error.message);
  }
}

/**
 * Faz download de uma imagem e upload para o Supabase Storage
 * @param {Object} supabase - Cliente Supabase
 * @param {string} imageUrl - URL da imagem para download
 * @param {string} courseId - ID do curso
 * @param {string} type - Tipo da imagem (cover, thumbnail)
 * @returns {string|null} URL pública da imagem no Storage ou null se falhar
 */
async function downloadAndUploadImage(supabase, imageUrl, courseId, type) {
  try {
    console.log(`      🌐 Fazendo download de: ${imageUrl}`);
    
    // Fazer download da imagem
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log(`      ❌ Erro no download: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      console.log(`      ❌ Tipo de conteúdo inválido: ${contentType}`);
      return null;
    }

    // Converter para buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`      📦 Imagem baixada: ${buffer.length} bytes`);

    // Gerar nome do arquivo
    const timestamp = Date.now();
    const extension = getExtensionFromContentType(contentType) || 'webp';
    const fileName = `courses/${courseId}/${type}-${timestamp}.${extension}`;

    console.log(`      📤 Fazendo upload para: ${fileName}`);

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-images')
      .upload(fileName, buffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.log(`      ❌ Erro no upload: ${error.message}`);
      return null;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl(data.path);

    console.log(`      ✅ Upload concluído: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.log(`      ❌ Erro inesperado: ${error.message}`);
    return null;
  }
}

/**
 * Obtém a extensão do arquivo baseada no Content-Type
 * @param {string} contentType - Content-Type da resposta
 * @returns {string} Extensão do arquivo
 */
function getExtensionFromContentType(contentType) {
  const typeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };
  
  return typeMap[contentType.toLowerCase()] || 'webp';
}

fixReplicateORB();