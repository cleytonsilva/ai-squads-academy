/**
 * Quick Bucket Check - Verificação rápida do bucket course-images
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.log('ERRO: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function checkBucket() {
  console.log('Verificando bucket course-images...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('ERRO ao listar buckets:', error.message);
      return;
    }
    
    console.log('Buckets encontrados:', buckets.map(b => b.id).join(', '));
    
    const courseImagesBucket = buckets.find(bucket => bucket.id === 'course-images');
    
    if (courseImagesBucket) {
      console.log('SUCESSO: Bucket course-images existe!');
      console.log('Detalhes:', JSON.stringify(courseImagesBucket, null, 2));
    } else {
      console.log('PROBLEMA: Bucket course-images NAO encontrado');
      console.log('Tentando criar...');
      
      const { data, error: createError } = await supabase.storage.createBucket('course-images', {
        public: true,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (createError) {
        console.log('ERRO ao criar bucket:', createError.message);
      } else {
        console.log('SUCESSO: Bucket criado!', data);
      }
    }
    
  } catch (error) {
    console.log('ERRO inesperado:', error.message);
  }
}

checkBucket();