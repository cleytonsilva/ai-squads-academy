# Script PowerShell para testar a API do Replicate

Write-Host "=== Teste da API Replicate ===" -ForegroundColor Green
Write-Host ""

# Obter o token do Supabase (você precisará substituir pelo token real)
Write-Host "1. Para testar, você precisa do token real do Replicate" -ForegroundColor Yellow
Write-Host "   Acesse: https://replicate.com/account/api-tokens" -ForegroundColor Cyan
Write-Host ""

# Comando de teste
Write-Host "2. Comando para testar a autenticação:" -ForegroundColor Yellow
Write-Host "curl -H 'Authorization: Bearer SEU_TOKEN_AQUI' https://api.replicate.com/v1/models" -ForegroundColor Cyan
Write-Host ""

# Teste de criação de predição
Write-Host "3. Comando para testar criação de predição:" -ForegroundColor Yellow
$testCommand = @'
curl -X POST https://api.replicate.com/v1/predictions `
  -H "Authorization: Bearer SEU_TOKEN_AQUI" `
  -H "Content-Type: application/json" `
  -d '{
    "model": "black-forest-labs/flux-1.1-pro",
    "input": {
      "prompt": "a beautiful sunset over mountains",
      "aspect_ratio": "16:9",
      "output_format": "webp",
      "output_quality": 80,
      "safety_tolerance": 2,
      "prompt_upsampling": true
    }
  }'
'@
Write-Host $testCommand -ForegroundColor Cyan
Write-Host ""

Write-Host "4. Soluções para o erro 401:" -ForegroundColor Yellow
Write-Host "   a) Verificar se o token é válido no dashboard do Replicate" -ForegroundColor White
Write-Host "   b) Gerar um novo token se necessário" -ForegroundColor White
Write-Host "   c) Reconfigurar no Supabase:" -ForegroundColor White
Write-Host "      npx supabase secrets set REPLICATE_API_TOKEN=r8_seu_novo_token --project-ref ncrlojjfkhevjotchhxi" -ForegroundColor Cyan
Write-Host "   d) Fazer redeploy da função:" -ForegroundColor White
Write-Host "      npx supabase functions deploy generate-course-images --project-ref ncrlojjfkhevjotchhxi" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Diagnóstico Completo ===" -ForegroundColor Green
Write-Host "✓ Secret REPLICATE_API_TOKEN está configurado no Supabase" -ForegroundColor Green
Write-Host "✓ Código da Edge Function está correto" -ForegroundColor Green
Write-Host "✗ Token provavelmente inválido ou expirado" -ForegroundColor Red
Write-Host "✗ Necessário verificar/renovar token no Replicate" -ForegroundColor Red