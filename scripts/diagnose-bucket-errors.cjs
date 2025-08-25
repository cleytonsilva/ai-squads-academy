const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function diagnoseBucketErrors() {
  console.log('🔍 Diagnosticando erros de bucket course-images...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || !anonKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    return;
  }
  
  // Cliente com service role (admin)
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
  
  // Cliente com anon key (usuário não autenticado)
  const supabaseAnon = createClient(supabaseUrl, anonKey);
  
  try {
    console.log('\n📊 1. Verificando existência do bucket...');
    
    // Verificar se o bucket existe
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   ❌ Erro ao listar buckets:', bucketsError);
      return;
    }
    
    const courseImagesBucket = buckets.find(b => b.id === 'course-images');
    
    if (!courseImagesBucket) {
      console.log('   ❌ Bucket course-images não encontrado!');
      console.log('   🔧 Criando bucket...');
      
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('course-images', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (createError) {
        console.error('   ❌ Erro ao criar bucket:', createError);
        return;
      }
      
      console.log('   ✅ Bucket criado com sucesso');
    } else {
      console.log('   ✅ Bucket course-images encontrado');
      console.log(`      Público: ${courseImagesBucket.public}`);
      console.log(`      Tamanho máximo: ${courseImagesBucket.file_size_limit} bytes`);
      console.log(`      Tipos permitidos: ${courseImagesBucket.allowed_mime_types?.join(', ') || 'Não definido'}`);
    }
    
    console.log('\n🔒 2. Verificando políticas RLS...');
    
    // Verificar políticas existentes
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('storage.policies')
      .select('*')
      .eq('bucket_id', 'course-images');
      
    if (policiesError) {
      console.error('   ❌ Erro ao verificar políticas:', policiesError);
    } else {
      console.log(`   📋 Encontradas ${policies.length} políticas para course-images:`);
      policies.forEach((policy, index) => {
        console.log(`      ${index + 1}. ${policy.name} (${policy.operation})`);
        console.log(`         Definição: ${policy.definition}`);
      });
    }
    
    console.log('\n🧪 3. Testando acesso público (leitura)...');
    
    try {
      const { data: publicList, error: publicError } = await supabaseAnon.storage
        .from('course-images')
        .list('', { limit: 1 });
        
      if (publicError) {
        console.log(`   ❌ Erro no acesso público: ${publicError.message}`);
      } else {
        console.log('   ✅ Acesso público funcionando');
      }
    } catch (error) {
      console.log(`   ❌ Erro no teste público: ${error.message}`);
    }
    
    console.log('\n📤 4. Testando upload com service role...');
    
    // Criar arquivo de teste
    const testContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testFile = new Blob([Buffer.from(testContent.split(',')[1], 'base64')], { type: 'image/png' });
    const testFileName = `test-${Date.now()}.png`;
    
    try {
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('course-images')
        .upload(testFileName, testFile);
        
      if (uploadError) {
        console.log(`   ❌ Erro no upload (service role): ${uploadError.message}`);
      } else {
        console.log('   ✅ Upload com service role funcionando');
        console.log(`      Arquivo: ${uploadData.path}`);
        
        // Limpar arquivo de teste
        await supabaseAdmin.storage
          .from('course-images')
          .remove([testFileName]);
      }
    } catch (error) {
      console.log(`   ❌ Erro no teste de upload: ${error.message}`);
    }
    
    console.log('\n🔧 5. Verificando configurações necessárias...');
    
    // Verificar se as políticas necessárias existem
    const requiredPolicies = [
      { name: 'course_images_select_policy', operation: 'SELECT' },
      { name: 'course_images_insert_policy', operation: 'INSERT' },
      { name: 'course_images_update_policy', operation: 'UPDATE' },
      { name: 'course_images_delete_policy', operation: 'DELETE' }
    ];
    
    const missingPolicies = [];
    
    for (const required of requiredPolicies) {
      const exists = policies?.some(p => p.name === required.name && p.operation === required.operation);
      if (!exists) {
        missingPolicies.push(required);
      }
    }
    
    if (missingPolicies.length > 0) {
      console.log('   ⚠️  Políticas faltando:');
      missingPolicies.forEach(policy => {
        console.log(`      - ${policy.name} (${policy.operation})`);
      });
      
      console.log('\n🔧 Criando políticas faltando...');
      
      // Criar políticas via SQL
      const policyQueries = [
        // Política de leitura pública
        `
        CREATE POLICY IF NOT EXISTS "course_images_select_policy" ON storage.objects
        FOR SELECT USING (bucket_id = 'course-images');
        `,
        // Política de upload para usuários autenticados
        `
        CREATE POLICY IF NOT EXISTS "course_images_insert_policy" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'course-images' AND 
          (auth.role() = 'authenticated' OR auth.jwt() ->> 'role' = 'service_role')
        );
        `,
        // Política de atualização
        `
        CREATE POLICY IF NOT EXISTS "course_images_update_policy" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'course-images' AND 
          (auth.role() = 'authenticated' OR auth.jwt() ->> 'role' = 'service_role')
        );
        `,
        // Política de exclusão
        `
        CREATE POLICY IF NOT EXISTS "course_images_delete_policy" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'course-images' AND 
          (auth.role() = 'authenticated' OR auth.jwt() ->> 'role' = 'service_role')
        );
        `
      ];
      
      for (const query of policyQueries) {
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
          if (error) {
            console.log(`   ❌ Erro ao criar política: ${error.message}`);
          } else {
            console.log('   ✅ Política criada');
          }
        } catch (error) {
          // Tentar método alternativo
          try {
            const { error: altError } = await supabaseAdmin
              .from('storage.policies')
              .insert({
                name: 'course_images_policy',
                bucket_id: 'course-images',
                operation: 'SELECT',
                definition: "bucket_id = 'course-images'"
              });
              
            if (altError) {
              console.log(`   ⚠️  Não foi possível criar políticas automaticamente`);
              console.log('   💡 Configure manualmente no Supabase Dashboard:');
              console.log('      1. Acesse Storage > Policies');
              console.log('      2. Crie política de SELECT: bucket_id = \'course-images\'');
              console.log('      3. Crie política de INSERT: bucket_id = \'course-images\' AND auth.role() = \'authenticated\'');
            }
          } catch (altError) {
            console.log('   ⚠️  Configuração manual necessária');
          }
        }
      }
    } else {
      console.log('   ✅ Todas as políticas necessárias estão configuradas');
    }
    
    console.log('\n📋 6. Resumo e recomendações:');
    
    if (!courseImagesBucket) {
      console.log('   🔧 Bucket foi criado');
    }
    
    if (missingPolicies.length > 0) {
      console.log('   🔧 Configure as políticas RLS manualmente se necessário');
    }
    
    console.log('   💡 Para testar upload manual:');
    console.log('      1. Faça login na aplicação');
    console.log('      2. Acesse o AdminCourseEditor');
    console.log('      3. Tente fazer upload de uma imagem');
    
    console.log('\n✅ Diagnóstico concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

diagnoseBucketErrors().catch(console.error);