const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifyThumbnailColumn() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente não configuradas');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('🔍 Verificando coluna thumbnail_url na tabela courses...');
    
    // Buscar alguns cursos para verificar se a coluna existe
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, cover_image_url, thumbnail_url')
      .limit(3);

    if (error) {
      console.error('❌ Erro ao consultar tabela courses:', error.message);
      return;
    }

    console.log('✅ Coluna thumbnail_url verificada com sucesso!');
    console.log('📊 Dados encontrados:');
    
    if (data && data.length > 0) {
      data.forEach((course, index) => {
        console.log(`\n${index + 1}. Curso: ${course.title}`);
        console.log(`   ID: ${course.id}`);
        console.log(`   cover_image_url: ${course.cover_image_url || 'null'}`);
        console.log(`   thumbnail_url: ${course.thumbnail_url || 'null'}`);
      });
    } else {
      console.log('ℹ️  Nenhum curso encontrado na tabela.');
    }

    console.log('\n🎉 Migração da coluna thumbnail_url aplicada com sucesso!');
    
  } catch (err) {
    console.error('❌ Erro durante verificação:', err.message);
  }
}

verifyThumbnailColumn();