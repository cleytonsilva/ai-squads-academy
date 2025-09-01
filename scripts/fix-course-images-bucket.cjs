/**
 * Script para Corrigir o Bucket course-images
 * 
 * Este script verifica se o bucket course-images existe e o cria se necessário,
 * resolvendo o problema principal identificado no diagnóstico.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

// Cliente com SERVICE_ROLE para operações administrativas
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

/**
 * Verifica se o bucket course-images existe
 */
async function checkBucketExists() {
  console.log('🔍 Verificando se bucket course-images existe...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erro ao listar buckets:', error.message);
      return false;
    }
    
    const courseImagesBucket = buckets.find(bucket => bucket.id === 'course-images');
    
    if (courseImagesBucket) {
      console.log('✅ Bucket course-images encontrado!');
      console.log(`   - Público: ${courseImagesBucket.public}`);
      console.log(`   - Criado em: ${courseImagesBucket.created_at}`);
      return true;
    } else {
      console.log('❌ Bucket course-images NÃO encontrado');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado ao verificar bucket:', error.message);
    return false;
  }
}

/**
 * Cria o bucket course-images
 */
async function createBucket() {
  console.log('\n🔧 Criando bucket course-images...');
  
  try {
    const { data, error } = await supabase.storage.createBucket('course-images', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    });
    
    if (error) {
      console.error('❌ Erro ao criar bucket:', error.message);
      return false;
    }
    
    console.log('✅ Bucket course-images criado com sucesso!');
    console.log('   - ID:', data.name);
    return true;
    
  } catch (error) {
    console.error('❌ Erro inesperado ao criar bucket:', error.message);
    return false;
  }
}

/**
 * Configura políticas RLS básicas para o bucket
 */
async function setupBasicPolicies() {
  console.log('\n🔐 Configurando políticas RLS básicas...');
  
  try {
    // Nota: As políticas RLS para storage são geralmente configuradas via SQL
    // Este script foca apenas na criação do bucket
    console.log('ℹ️  Políticas RLS devem ser configuradas via migração SQL');
    console.log('   Arquivo: supabase/migrations/20250202_setup_course_covers_storage.sql');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao configurar políticas:', error.message);
    return false;
  }
}

/**
 * Testa o bucket criado
 */
async function testBucket() {
  console.log('\n🧪 Testando bucket criado...');
  
  try {
    // Tentar listar arquivos (teste de leitura)
    const { data: files, error: listError } = await supabase.storage
      .from('course-images')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error('❌ Erro ao listar arquivos:', listError.message);
      return false;
    }
    
    console.log('✅ Leitura do bucket funcionando');
    
    // Tentar upload de teste (usando tipo MIME permitido)
    const testFile = new Blob(['test image data'], { type: 'image/png' });
    const testFileName = `test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.log('⚠️  Upload de teste falhou (esperado se RLS não estiver configurado):', uploadError.message);
      return true; // Não é erro crítico, bucket existe
    }
    
    console.log('✅ Upload de teste funcionou!');
    
    // Limpar arquivo de teste
    await supabase.storage
      .from('course-images')
      .remove([testFileName]);
    
    console.log('✅ Limpeza do arquivo de teste concluída');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste do bucket:', error.message);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🔧 CORREÇÃO: Bucket course-images');
  console.log('=' .repeat(40));
  
  try {
    // Verificar se bucket existe
    const bucketExists = await checkBucketExists();
    
    if (!bucketExists) {
      // Criar bucket se não existir
      const created = await createBucket();
      
      if (!created) {
        console.error('❌ Falha ao criar bucket. Verifique permissões e configurações.');
        process.exit(1);
      }
      
      // Configurar políticas básicas
      await setupBasicPolicies();
    }
    
    // Testar bucket
    const testPassed = await testBucket();
    
    if (testPassed) {
      console.log('\n✅ Bucket course-images está funcionando!');
      console.log('\n📋 Próximos passos:');
      console.log('   1. Aplicar migração SQL para políticas RLS:');
      console.log('      supabase db push');
      console.log('   2. Testar upload manual no CourseCoverManager');
      console.log('   3. Verificar se usuário tem role admin/instructor');
    } else {
      console.error('❌ Bucket criado mas com problemas. Verifique configurações.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
    process.exit(1);
  }
}

// Executar correção
main();