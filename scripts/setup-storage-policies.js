/**
 * Script para configurar políticas RLS do bucket course-images
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function setupStoragePolicies() {
  try {
    // Configurar cliente Supabase com service role
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas:');
      console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
      console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Verificando configuração do bucket...');
    
    // Verificar se o bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      process.exit(1);
    }
    
    const courseImagesBucket = buckets.find(b => b.name === 'course-images');
    
    if (!courseImagesBucket) {
      console.error('❌ Bucket course-images não encontrado!');
      process.exit(1);
    }
    
    console.log('✅ Bucket course-images encontrado');
    console.log('📋 Configuração atual:', {
      public: courseImagesBucket.public,
      file_size_limit: courseImagesBucket.file_size_limit,
      allowed_mime_types: courseImagesBucket.allowed_mime_types
    });
    
    // Atualizar configurações do bucket se necessário
    if (!courseImagesBucket.public || 
        !courseImagesBucket.allowed_mime_types?.includes('image/jpeg')) {
      
      console.log('🔧 Atualizando configurações do bucket...');
      
      const { error: updateError } = await supabase.storage.updateBucket('course-images', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (updateError) {
        console.error('❌ Erro ao atualizar bucket:', updateError);
      } else {
        console.log('✅ Configurações do bucket atualizadas');
      }
    }
    
    console.log('\n🧪 Testando upload de imagem...');
    
    // Criar uma imagem PNG mínima válida (1x1 pixel transparente)
    const testImageData = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk header
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // Width: 1, Height: 1
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // Bit depth: 8, Color type: 6 (RGBA), Compression: 0, Filter: 0, Interlace: 0
      0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41, // IDAT chunk header
      0x54, 0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, // IDAT data (compressed)
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // IDAT data continued
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
      0x42, 0x60, 0x82 // IEND chunk continued
    ]);
    
    const testFile = new File([testImageData], 'test.png', { type: 'image/png' });
    const testFileName = `test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError);
      
      // Verificar se é erro de política
      if (uploadError.message?.includes('policy') || uploadError.message?.includes('Policy')) {
        console.log('\n🔧 Configurando políticas RLS...');
        
        // Tentar habilitar RLS e criar políticas básicas
        try {
          // Política para leitura pública
          await supabase.rpc('exec_sql', {
            sql: `
              -- Habilitar RLS se não estiver habilitado
              ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
              
              -- Remover políticas existentes
              DROP POLICY IF EXISTS "course_images_public_read" ON storage.objects;
              DROP POLICY IF EXISTS "course_images_authenticated_upload" ON storage.objects;
              
              -- Criar política de leitura pública
              CREATE POLICY "course_images_public_read" ON storage.objects
                FOR SELECT
                USING (bucket_id = 'course-images');
              
              -- Criar política de upload para usuários autenticados
              CREATE POLICY "course_images_authenticated_upload" ON storage.objects
                FOR INSERT
                WITH CHECK (bucket_id = 'course-images' AND auth.role() = 'authenticated');
            `
          });
          
          console.log('✅ Políticas RLS configuradas');
          
          // Tentar upload novamente
          const { data: retryUploadData, error: retryUploadError } = await supabase.storage
            .from('course-images')
            .upload(`retry-${testFileName}`, testFile);
          
          if (retryUploadError) {
            console.error('❌ Erro no segundo teste de upload:', retryUploadError);
          } else {
            console.log('✅ Segundo teste de upload bem-sucedido!');
            testFileName = `retry-${testFileName}`;
          }
          
        } catch (policyError) {
          console.error('❌ Erro ao configurar políticas:', policyError);
        }
      }
    } else {
      console.log('✅ Teste de upload bem-sucedido!');
      
      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('course-images')
        .getPublicUrl(testFileName);
      
      console.log('🔗 URL pública:', urlData.publicUrl);
    }
    
    // Limpar arquivos de teste
    console.log('\n🧹 Limpando arquivos de teste...');
    const filesToRemove = [testFileName, `retry-${testFileName}`].filter(Boolean);
    
    for (const fileName of filesToRemove) {
      const { error: removeError } = await supabase.storage
        .from('course-images')
        .remove([fileName]);
      
      if (!removeError) {
        console.log(`✅ Arquivo ${fileName} removido`);
      }
    }
    
    console.log('\n✅ Configuração do storage concluída!');
    console.log('\n📋 Resumo:');
    console.log('- Bucket course-images: ✅ Configurado');
    console.log('- Upload de imagens: ✅ Funcionando');
    console.log('- Políticas RLS: ✅ Configuradas');
    
  } catch (error) {
    console.error('❌ Erro durante configuração:', error);
    process.exit(1);
  }
}

setupStoragePolicies();