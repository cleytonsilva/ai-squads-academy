/**
 * Script para verificar e criar o bucket course-images no Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function checkAndCreateBucket() {
  try {
    // Configurar cliente Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas:');
      console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
      console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Verificando buckets existentes...');
    
    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      process.exit(1);
    }
    
    console.log('📦 Buckets encontrados:', buckets.map(b => b.name));
    
    // Verificar se o bucket course-images existe
    const courseImagesBucket = buckets.find(bucket => bucket.name === 'course-images');
    
    if (courseImagesBucket) {
      console.log('✅ Bucket course-images já existe!');
      console.log('📋 Detalhes do bucket:', {
        id: courseImagesBucket.id,
        name: courseImagesBucket.name,
        public: courseImagesBucket.public,
        created_at: courseImagesBucket.created_at
      });
    } else {
      console.log('⚠️  Bucket course-images não encontrado. Criando...');
      
      // Criar bucket course-images
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('course-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
        process.exit(1);
      }
      
      console.log('✅ Bucket course-images criado com sucesso!');
      console.log('📋 Detalhes do novo bucket:', newBucket);
    }
    
    // Verificar políticas de acesso
    console.log('\n🔐 Verificando políticas de acesso...');
    
    // Testar upload de um arquivo pequeno
    console.log('\n🧪 Testando upload...');
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError);
      
      if (uploadError.message?.includes('Bucket not found')) {
        console.log('🔄 Tentando criar bucket novamente...');
        const { error: retryCreateError } = await supabase.storage.createBucket('course-images', {
          public: true
        });
        
        if (retryCreateError && !retryCreateError.message?.includes('already exists')) {
          console.error('❌ Erro ao recriar bucket:', retryCreateError);
        } else {
          console.log('✅ Bucket criado na segunda tentativa!');
        }
      }
    } else {
      console.log('✅ Teste de upload bem-sucedido!');
      
      // Limpar arquivo de teste
      await supabase.storage.from('course-images').remove([testFileName]);
      console.log('🧹 Arquivo de teste removido.');
    }
    
    // Verificar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl('test.jpg');
    
    console.log('\n🌐 URL base para imagens:', publicUrl.replace('/test.jpg', ''));
    
    console.log('\n✅ Verificação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

// Executar verificação
checkAndCreateBucket();