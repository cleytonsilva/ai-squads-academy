# Script de Inicialização Rápida do Supabase
# Otimizado para desenvolvimento local

Write-Host "🚀 Iniciando Supabase com configurações otimizadas..." -ForegroundColor Cyan

# Carregar variáveis de ambiente otimizadas
if (Test-Path ".env.supabase.optimized") {
    Get-Content ".env.supabase.optimized" | ForEach-Object {
        if ($_ -match "^([^#][^=]*)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "✅ Variáveis de ambiente otimizadas carregadas" -ForegroundColor Green
}

# Verificar se o Docker está rodando
try {
    docker info | Out-Null
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando. Inicie o Docker Desktop primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "⚡ Iniciando Supabase..." -ForegroundColor Yellow

# Iniciar com configurações otimizadas
try {
    npx supabase start --workdir . --debug
    
    Write-Host "`n✅ Supabase iniciado com configurações otimizadas!" -ForegroundColor Green
    Write-Host "`n🌊 URLs disponíveis:" -ForegroundColor Cyan
    Write-Host "   - API: http://127.0.0.1:54321" -ForegroundColor White
    Write-Host "   - Studio: http://127.0.0.1:54323" -ForegroundColor White
    Write-Host "   - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres" -ForegroundColor White
    
    Write-Host "`n💡 Dicas de performance:" -ForegroundColor Yellow
    Write-Host "   - Analytics desabilitado para economia de recursos" -ForegroundColor Gray
    Write-Host "   - Pooler desabilitado para desenvolvimento local" -ForegroundColor Gray
    Write-Host "   - Configurações de memória otimizadas" -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ Erro ao iniciar Supabase: $_" -ForegroundColor Red
    Write-Host "💡 Tente executar: docker system prune -f" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🎉 Pronto para desenvolvimento!" -ForegroundColor Green