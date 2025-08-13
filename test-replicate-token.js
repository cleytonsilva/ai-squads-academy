// Script para testar o token do Replicate
import { execSync } from 'child_process';

console.log('=== Diagnóstico do Token Replicate ===\n');

try {
  // 1. Verificar se o secret existe no Supabase
  console.log('1. Verificando secrets no Supabase:');
  const secretsList = execSync('npx supabase secrets list --project-ref ncrlojjfkhevjotchhxi', { encoding: 'utf8' });
  console.log(secretsList);
  
  // 2. Testar a API do Replicate com um comando simples
  console.log('\n2. Testando autenticação na API do Replicate...');
  console.log('Para testar manualmente, execute:');
  console.log('curl -H "Authorization: Bearer SEU_TOKEN_AQUI" https://api.replicate.com/v1/models');
  
  console.log('\n3. Possíveis soluções para o erro 401:');
  console.log('a) Verificar se o token é válido no dashboard do Replicate');
  console.log('b) Reconfigurar o token no Supabase:');
  console.log('   npx supabase secrets set REPLICATE_API_TOKEN=r8_seu_token_aqui --project-ref ncrlojjfkhevjotchhxi');
  console.log('c) Fazer redeploy da Edge Function:');
  console.log('   npx supabase functions deploy generate-course-images --project-ref ncrlojjfkhevjotchhxi');
  
  console.log('\n4. Verificando se o problema pode estar no código...');
  console.log('O código da Edge Function parece correto:');
  console.log('- Usa Deno.env.get("REPLICATE_API_TOKEN")');
  console.log('- Adiciona o cabeçalho Authorization: Bearer ${token}');
  console.log('- Faz a requisição para https://api.replicate.com/v1/predictions');
  
} catch (error) {
  console.error('Erro ao executar diagnóstico:', error.message);
}

console.log('\n=== Próximos passos recomendados ===');
console.log('1. Obter um novo token do Replicate em: https://replicate.com/account/api-tokens');
console.log('2. Reconfigurar o secret no Supabase');
console.log('3. Fazer redeploy da função');
console.log('4. Testar novamente a geração de imagem');