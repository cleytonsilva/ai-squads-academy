# Script de Otimização de Configuração Supabase
# Melhora performance de inicialização e reduz uso de recursos

Write-Host "⚡ Otimizando configuração do Supabase para melhor performance..." -ForegroundColor Cyan

# 1. Backup da configuração atual
Write-Host "\n💾 Fazendo backup da configuração atual..." -ForegroundColor Yellow
if (Test-Path "supabase/config.toml") {
    Copy-Item "supabase/config.toml" "supabase/config.toml.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Host "✅ Backup criado" -ForegroundColor Green
}

# 2. Criar configuração otimizada
Write-Host "\n⚙️ Criando configuração otimizada..." -ForegroundColor Yellow

$optimizedConfig = @'
# Configuração Otimizada do Supabase
# Focada em performance e redução de recursos

project_id = "ai-squads-academy"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
major_version = 17
# Otimizações de memória
shared_preload_libraries = "pg_stat_statements"
max_connections = 100
shared_buffers = "128MB"
effective_cache_size = "512MB"
work_mem = "4MB"
maintenance_work_mem = "64MB"
wal_buffers = "16MB"
checkpoint_completion_target = 0.9
random_page_cost = 1.1
effective_io_concurrency = 200

[studio]
enabled = true
port = 54323
api_url = "http://127.0.0.1:54321"
openapi_port = 54321

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
port = 54327
file_size_limit = "50MiB"

[auth]
enabled = true
port = 54328
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["https://127.0.0.1:3000"]
jwt_expiry = 3600
enable_signup = true
enable_confirmations = false

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[realtime]
enabled = true
port = 54329
ip_version = "ipv4"

[functions]
enabled = true
port = 54330
# Otimizações para Edge Functions
verify_jwt = false
import_map = "./supabase/functions/import_map.json"

[analytics]
enabled = false
port = 54327
vector_port = 54328
# Desabilitar analytics para economizar recursos

[db.pooler]
enabled = false
# Desabilitar pooler para desenvolvimento local

[experimental]
oriole_db_version = ""
webhooks = false
'@

# 3. Escrever configuração otimizada
$optimizedConfig | Out-File -FilePath "supabase/config.toml" -Encoding UTF8
Write-Host "✅ Configuração otimizada aplicada" -ForegroundColor Green

# 4. Criar arquivo de variáveis de ambiente otimizado
Write-Host "\n🔧 Criando variáveis de ambiente otimizadas..." -ForegroundColor Yellow

$envOptimized = @'
# Variáveis de Ambiente Otimizadas para Supabase
# Performance e recursos otimizados

# Configurações Docker
DOCKER_DEFAULT_PLATFORM=linux/amd64
COMPOSE_PARALLEL_LIMIT=4

# Configurações de memória
SUPABASE_DB_MAX_CONNECTIONS=50
SUPABASE_DB_SHARED_BUFFERS=128MB
SUPABASE_DB_EFFECTIVE_CACHE_SIZE=512MB

# Configurações de performance
SUPABASE_STUDIO_LOAD_BALANCER_TIMEOUT=30s
SUPABASE_API_MAX_ROWS=1000

# Desabilitar recursos desnecessários em desenvolvimento
SUPABASE_ANALYTICS_ENABLED=false
SUPABASE_POOLER_ENABLED=false

# Configurações de rede
SUPABASE_NETWORK_MODE=bridge
SUPABASE_RESTART_POLICY=unless-stopped
'@

$envOptimized | Out-File -FilePath ".env.supabase.optimized" -Encoding UTF8
Write-Host "✅ Arquivo .env.supabase.optimized criado" -ForegroundColor Green

# 5. Criar script de inicialização rápida
Write-Host "\n🚀 Criando script de inicialização rápida..." -ForegroundColor Yellow

$quickStartScript = @'
#!/bin/bash
# Script de Inicialização Rápida do Supabase
# Otimizado para desenvolvimento local

echo "🚀 Iniciando Supabase com configurações otimizadas..."

# Carregar variáveis de ambiente otimizadas
if [ -f ".env.supabase.optimized" ]; then
    export $(cat .env.supabase.optimized | grep -v "#" | xargs)
fi

# Iniciar com configurações otimizadas
npx supabase start \
    --workdir . \
    --debug \
    --ignore-health-check

echo "✅ Supabase iniciado com configurações otimizadas!"
echo "📊 URLs disponíveis:"
echo "   - API: http://127.0.0.1:54321"
echo "   - Studio: http://127.0.0.1:54323"
echo "   - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
'@

$quickStartScript | Out-File -FilePath "supabase-quick-start.sh" -Encoding UTF8
Write-Host "✅ Script supabase-quick-start.sh criado" -ForegroundColor Green

# 6. Criar script PowerShell equivalente
$quickStartPS = @'
# Script de Inicialização Rápida do Supabase (PowerShell)
# Otimizado para desenvolvimento local no Windows

Write-Host "🚀 Iniciando Supabase com configurações otimizadas..." -ForegroundColor Cyan

# Carregar variáveis de ambiente otimizadas
if (Test-Path ".env.supabase.optimized") {
    Get-Content ".env.supabase.optimized" | Where-Object { $_ -notmatch "^#" -and $_ -ne "" } | ForEach-Object {
        $key, $value = $_ -split "=", 2
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
    Write-Host "✅ Variáveis de ambiente carregadas" -ForegroundColor Green
}

# Iniciar com configurações otimizadas
Write-Host "\n⚡ Iniciando Supabase..." -ForegroundColor Yellow
npx supabase start --debug

Write-Host "\n✅ Supabase iniciado com configurações otimizadas!" -ForegroundColor Green
Write-Host "\n📊 URLs disponíveis:" -ForegroundColor Cyan
Write-Host "   - API: http://127.0.0.1:54321" -ForegroundColor White
Write-Host "   - Studio: http://127.0.0.1:54323" -ForegroundColor White
Write-Host "   - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres" -ForegroundColor White
'@

$quickStartPS | Out-File -FilePath "supabase-quick-start.ps1" -Encoding UTF8
Write-Host "✅ Script supabase-quick-start.ps1 criado" -ForegroundColor Green

Write-Host "\n🎉 Otimização concluída!" -ForegroundColor Green
Write-Host "\n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Execute: .\docker-cleanup-optimize.ps1" -ForegroundColor White
Write-Host "   2. Execute: .\supabase-quick-start.ps1" -ForegroundColor White
Write-Host "\n💡 Benefícios da otimização:" -ForegroundColor Yellow
Write-Host "   ✅ Inicialização mais rápida" -ForegroundColor Green
Write-Host "   ✅ Menor uso de memória" -ForegroundColor Green
Write-Host "   ✅ Recursos desnecessários desabilitados" -ForegroundColor Green
Write-Host "   ✅ Configurações otimizadas para desenvolvimento" -ForegroundColor Green