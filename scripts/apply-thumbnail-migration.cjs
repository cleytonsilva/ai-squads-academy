require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function applyThumbnailMigration() {
  console.log('🔧 Aplicando migração para adicionar coluna thumbnail_url...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // SQL da migração
    const migrationSQL = `
      -- Adicionar coluna thumbnail_url se não existir
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'courses' AND column_name = 'thumbnail_url'
        ) THEN
          ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
          COMMENT ON COLUMN courses.thumbnail_url IS 'Campo de compatibilidade - sincronizado com cover_image_url';
        END IF;
      END $$;
      
      -- Sincronizar dados existentes
      UPDATE courses 
      SET thumbnail_url = cover_image_url 
      WHERE cover_image_url IS NOT NULL AND thumbnail_url IS NULL;
      
      -- Criar índice se não existir
      CREATE INDEX IF NOT EXISTS idx_courses_thumbnail_url ON courses(thumbnail_url);
      
      -- Recriar função de sincronização
      CREATE OR REPLACE FUNCTION sync_course_image_fields()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Sincronização bidirecional entre cover_image_url e thumbnail_url
        IF NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url THEN
          NEW.thumbnail_url = NEW.cover_image_url;
        ELSIF NEW.thumbnail_url IS DISTINCT FROM OLD.thumbnail_url THEN
          NEW.cover_image_url = NEW.thumbnail_url;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Recriar trigger
      DROP TRIGGER IF EXISTS sync_course_image_fields_trigger ON courses;
      CREATE TRIGGER sync_course_image_fields_trigger
        BEFORE UPDATE ON courses
        FOR EACH ROW
        EXECUTE FUNCTION sync_course_image_fields();
    `;
    
    console.log('📝 Verificando se a coluna thumbnail_url existe...');
    
    // Tentar fazer uma query que use a coluna thumbnail_url para verificar se existe
    const { data: testData, error: testError } = await supabase
      .from('courses')
      .select('thumbnail_url')
      .limit(1);
    
    if (testError && testError.code === '42703') {
      // Erro 42703 = coluna não existe
      console.log('⚠️  A coluna thumbnail_url não existe e precisa ser adicionada.');
      console.log('\n📋 Execute o seguinte SQL no SQL Editor do Supabase:');
      console.log('\n' + migrationSQL);
      console.log('\n🔗 Acesse: https://supabase.com/dashboard/project/ncrlojjfkhevjotchhxi/sql/new');
      console.log('\n📝 Após executar o SQL, execute este script novamente para verificar.');
      return;
    } else if (testError) {
      console.error('❌ Erro inesperado ao verificar coluna:', testError);
      return;
    } else {
      console.log('✅ Coluna thumbnail_url já existe!');
    }
    
    console.log('✅ Migração aplicada com sucesso!');
    
    // Verificar se a coluna foi criada
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'courses')
      .in('column_name', ['cover_image_url', 'thumbnail_url'])
      .order('column_name');
    
    if (verifyError) {
      console.error('❌ Erro ao verificar colunas:', verifyError);
    } else {
      console.log('📋 Colunas de imagem na tabela courses:');
      console.table(columns);
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

applyThumbnailMigration();