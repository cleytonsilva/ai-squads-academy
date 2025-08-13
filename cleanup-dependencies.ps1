# Script de Limpeza de Dependências
# Remove dependências não utilizadas identificadas pelo depcheck

Write-Host "🧹 Iniciando limpeza de dependências não utilizadas..." -ForegroundColor Green

# Dependências não utilizadas identificadas pelo depcheck
$unusedDependencies = @(
    "@hookform/resolvers",
    "next-themes", 
    "replicate",
    "zod"
)

# DevDependencies não utilizadas
$unusedDevDependencies = @(
    "@tailwindcss/typography",
    "autoprefixer",
    "postcss"
)

# Função para confirmar remoção
function Confirm-Removal {
    param([string]$packageName, [string]$type)
    
    $confirmation = Read-Host "Remover $type '$packageName'? (y/N)"
    return $confirmation -eq 'y' -or $confirmation -eq 'Y'
}

# Remover dependências não utilizadas
Write-Host "\n📦 Analisando dependências principais..." -ForegroundColor Yellow
foreach ($dep in $unusedDependencies) {
    if (Confirm-Removal $dep "dependência") {
        Write-Host "Removendo $dep..." -ForegroundColor Red
        npm uninstall $dep
    } else {
        Write-Host "Mantendo $dep" -ForegroundColor Gray
    }
}

# Remover devDependencies não utilizadas
Write-Host "\n🛠️ Analisando dependências de desenvolvimento..." -ForegroundColor Yellow
foreach ($dep in $unusedDevDependencies) {
    if (Confirm-Removal $dep "devDependency") {
        Write-Host "Removendo $dep..." -ForegroundColor Red
        npm uninstall $dep
    } else {
        Write-Host "Mantendo $dep" -ForegroundColor Gray
    }
}

# Verificar se há componentes UI não utilizados
Write-Host "\n🎨 Analisando componentes UI..." -ForegroundColor Yellow

$uiComponents = Get-ChildItem -Path "src\components\ui" -Filter "*.tsx" | ForEach-Object { $_.BaseName }
$unusedComponents = @()

foreach ($component in $uiComponents) {
    # Buscar uso do componente no código (excluindo a pasta ui)
    $usage = Select-String -Path "src\**\*.tsx", "src\**\*.ts" -Pattern "import.*$component" -Exclude "src\components\ui\*" -ErrorAction SilentlyContinue
    
    if (-not $usage) {
        $unusedComponents += $component
        Write-Host "❌ Componente não utilizado: $component" -ForegroundColor Red
    } else {
        Write-Host "✅ Componente em uso: $component" -ForegroundColor Green
    }
}

if ($unusedComponents.Count -gt 0) {
    Write-Host "\n⚠️ Encontrados $($unusedComponents.Count) componentes UI não utilizados" -ForegroundColor Yellow
    Write-Host "Componentes: $($unusedComponents -join ', ')" -ForegroundColor Gray
    
    $removeComponents = Read-Host "Deseja remover os componentes não utilizados? (y/N)"
    if ($removeComponents -eq 'y' -or $removeComponents -eq 'Y') {
        foreach ($component in $unusedComponents) {
            $filePath = "src\components\ui\$component.tsx"
            if (Test-Path $filePath) {
                Remove-Item $filePath
                Write-Host "Removido: $filePath" -ForegroundColor Red
            }
        }
    }
}

# Executar build para verificar se tudo ainda funciona
Write-Host "\n🔨 Executando build para verificar integridade..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "\n✅ Build executado com sucesso! Limpeza concluída." -ForegroundColor Green
} else {
    Write-Host "\n❌ Erro no build. Verifique as dependências removidas." -ForegroundColor Red
}

Write-Host "\n📊 Para analisar o tamanho do bundle, execute: npm run build && npx vite-bundle-analyzer dist" -ForegroundColor Cyan