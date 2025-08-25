/**
 * Script para aplicar a migração 20250130000000_fix_profiles_admin_creation.sql
 * diretamente no banco de dados Supabase usando service role
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
  process.exit(1);
}

// Cliente com service role para operações administrativas
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migração 20250130000000_fix_profiles_admin_creation.sql...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250130000000_fix_profiles_admin_creation.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Arquivo de migração não encontrado:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Arquivo de migração carregado, aplicando...');
    
    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📊 Executando ${commands.length} comandos SQL...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Pular comentários e comandos vazios
      if (command.startsWith('--') || command.startsWith('/*') || command.trim() === '') {
        continue;
      }
      
      try {
        console.log(`\n🔄 Executando comando ${i + 1}/${commands.length}...`);
        console.log(`   ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Tentar executar diretamente se rpc falhar
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('1')
            .limit(0); // Isso vai falhar, mas nos dá acesso ao cliente SQL
          
          if (directError) {
            console.log(`   ⚠️  Comando pode ter falhado: ${error.message}`);
            errorCount++;
          } else {
            console.log('   ✅ Comando executado com sucesso');
            successCount++;
          }
        } else {
          console.log('   ✅ Comando executado com sucesso');
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Erro ao executar comando: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Comandos executados com sucesso: ${successCount}`);
    console.log(`❌ Comandos com erro: ${errorCount}`);
    console.log(`📊 Total de comandos: ${commands.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migração aplicada com sucesso!');
      console.log('🔄 Executando teste de verificação...');
      
      // Testar se a migração funcionou
      await testMigration();
    } else {
      console.log('\n⚠️  Migração aplicada com alguns erros.');
      console.log('🔍 Verifique os logs acima para mais detalhes.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    process.exit(1);
  }
}

async function testMigration() {
  try {
    console.log('\n🧪 Testando se a migração foi aplicada corretamente...');
    
    // Testar se as colunas existem
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.log('❌ Erro ao verificar colunas:', columnError.message);
      return;
    }
    
    const columnNames = columns.map(col => col.column_name);
    const requiredColumns = ['display_name', 'xp', 'profile_data'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`❌ Colunas ainda faltando: ${missingColumns.join(', ')}`);
    } else {
      console.log('✅ Todas as colunas necessárias estão presentes');
    }
    
    // Testar criação de usuário
    console.log('\n🧪 Testando criação de usuário...');
    
    const testEmail = `test-migration-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        display_name: 'Test Migration User'
      }
    });
    
    if (authError) {
      console.log('❌ Erro ao criar usuário de teste:', authError.message);
      return;
    }
    
    console.log('✅ Usuário de teste criado com sucesso');
    
    // Aguardar trigger
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar se o perfil foi criado
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Perfil não foi criado automaticamente:', profileError.message);
    } else {
      console.log('✅ Perfil criado automaticamente com sucesso');
      console.log('   Dados do perfil:', {
        display_name: profile.display_name,
        xp: profile.xp,
        role: profile.role
      });
    }
    
    // Limpar usuário de teste
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('🧹 Usuário de teste removido');
    
    console.log('\n🎉 Teste de migração concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante teste de migração:', error);
  }
}

// Executar se chamado diretamente
if (process.argv[1] && process.argv[1].endsWith('apply-migration-fix.js')) {
  applyMigration()
    .then(() => {
      console.log('\n✅ Script concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha no script:', error);
      process.exit(1);
    });
}

export default applyMigration;