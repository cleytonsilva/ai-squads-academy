const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function applySqlMigration() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('🔌 Conectando ao Supabase...');
    
    // Executar cada comando SQL individualmente
    console.log('📄 Adicionando coluna thumbnail_url...');
    
    // 1. Adicionar coluna se não existir
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (addColumnError && addColumnError.code !== 'PGRST202') {
      throw new Error(`Erro ao adicionar coluna: ${addColumnError.message}`);
    }
    
    console.log('✅ Tentativa de adicionar coluna concluída');
    
    // 2. Verificar se a coluna existe usando uma query direta
    console.log('📋 Verificando se a coluna foi criada...');
    
    const { data: columnCheck, error: checkError } = await supabase
      .from('courses')
      .select('thumbnail_url')
      .limit(1);
    
    if (checkError) {
      if (checkError.code === '42703') {
        console.log('❌ Coluna thumbnail_url ainda não existe.');
        console.log('\n📋 INSTRUÇÕES PARA APLICAR A MIGRAÇÃO MANUALMENTE:');
        console.log('\n1. Acesse o SQL Editor do Supabase:');
        console.log('   https://supabase.com/dashboard/project/ncrlojjfkhevjotchhxi/sql/new');
        console.log('\n2. Execute o seguinte SQL:');
        console.log('\n```sql');
        const sqlContent = fs.readFileSync('./supabase/migrations/add_thumbnail_url_manual.sql', 'utf8');
        console.log(sqlContent);
        console.log('```\n');
        console.log('3. Clique em "Run" para executar a migração');
        console.log('4. Execute novamente o teste: npm run test:complete-flow');
        return;
      } else {
        throw new Error(`Erro ao verificar coluna: ${checkError.message}`);
      }
    }
    
    console.log('✅ Coluna thumbnail_url existe!');
    
    // 3. Sincronizar dados existentes
    console.log('🔄 Sincronizando dados existentes...');
    const { error: syncError } = await supabase
      .from('courses')
      .update({ thumbnail_url: supabase.raw('cover_image_url') })
      .not('cover_image_url', 'is', null)
      .is('thumbnail_url', null);
    
    if (syncError) {
      console.log('⚠️  Erro ao sincronizar dados:', syncError.message);
    } else {
      console.log('✅ Dados sincronizados com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:');
    console.error('Tipo do erro:', typeof error);
    console.error('Mensagem:', error.message || 'Sem mensagem');
    console.error('Stack:', error.stack || 'Sem stack trace');
    console.error('Erro completo:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Operação concluída');
  }
}

applySqlMigration();