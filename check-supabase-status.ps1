# Script para verificar status do Supabase
# Monitora containers e serviços

Write-Host "🔍 Verificando status do Supabase..." -ForegroundColor Cyan

# Verificar containers Docker
Write-Host "`n📦 Containers Docker:" -ForegroundColor Yellow
try {
    $containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Where-Object { $_ -match "supabase" }
    if ($containers) {
        $containers | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    } else {
        Write-Host "   ❌ Nenhum container do Supabase encontrado" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Erro ao verificar containers: $_" -ForegroundColor Red
}

# Verificar status do Supabase CLI
Write-Host "`n🌊 Status do Supabase CLI:" -ForegroundColor Yellow
try {
    $status = npx supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Supabase está rodando" -ForegroundColor Green
        Write-Host "$status" -ForegroundColor White
    } else {
        Write-Host "   ❌ Supabase não está rodando" -ForegroundColor Red
        Write-Host "   Erro: $status" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Erro ao verificar status: $_" -ForegroundColor Red
}

# Verificar conectividade
Write-Host "`n🔗 Testando conectividade:" -ForegroundColor Yellow
$endpoints = @(
    @{Name="API"; URL="http://127.0.0.1:54321/health"},
    @{Name="Studio"; URL="http://127.0.0.1:54323"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.URL -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ $($endpoint.Name): OK" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ $($endpoint.Name): Status $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ $($endpoint.Name): Não acessível" -ForegroundColor Red
    }
}

Write-Host "`n📊 Uso de recursos Docker:" -ForegroundColor Yellow
try {
    docker system df --format "table {{.Type}}\t{{.Total}}\t{{.Size}}\t{{.Reclaimable}}"
} catch {
    Write-Host "   ❌ Erro ao verificar uso de recursos" -ForegroundColor Red
}

Write-Host "`n🎯 Verificação concluída!" -ForegroundColor Green