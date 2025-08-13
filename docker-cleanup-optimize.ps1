# Script de Limpeza e Otimização Docker para Supabase
# Criado para resolver problemas de performance e espaço em disco

Write-Host "Iniciando limpeza e otimização do ambiente Docker Supabase..." -ForegroundColor Cyan

# 1. Parar todos os containers do Supabase se estiverem rodando
Write-Host "`nParando serviços Supabase..." -ForegroundColor Yellow
try {
    npx supabase stop
    Write-Host "Supabase parado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "Supabase já estava parado ou erro ao parar" -ForegroundColor Yellow
}

# 2. Remover containers órfãos
Write-Host "`nRemovendo containers órfãos..." -ForegroundColor Yellow
$containers = docker ps -aq --filter "name=supabase"
if ($containers) {
    docker rm -f $containers
    Write-Host "Containers removidos: $($containers.Count)" -ForegroundColor Green
} else {
    Write-Host "Nenhum container órfão encontrado" -ForegroundColor Green
}

# 3. Remover volumes órfãos (mantendo apenas o projeto atual)
Write-Host "`nLimpando volumes órfãos..." -ForegroundColor Yellow
$currentProject = Split-Path -Leaf (Get-Location)
$allVolumes = docker volume ls -q --filter "name=supabase"
$volumesToKeep = @()
$volumesToRemove = @()

foreach ($volume in $allVolumes) {
    if ($volume -like "*$currentProject*" -or $volume -like "*ai-squads-academy*") {
        $volumesToKeep += $volume
    } else {
        $volumesToRemove += $volume
    }
}

if ($volumesToRemove.Count -gt 0) {
    Write-Host "Removendo volumes órfãos: $($volumesToRemove -join ', ')" -ForegroundColor Red
    docker volume rm $volumesToRemove
    Write-Host "Volumes órfãos removidos: $($volumesToRemove.Count)" -ForegroundColor Green
} else {
    Write-Host "Nenhum volume órfão encontrado" -ForegroundColor Green
}

Write-Host "Volumes mantidos: $($volumesToKeep -join ', ')" -ForegroundColor Blue

# 4. Remover imagens duplicadas e antigas
Write-Host "`nLimpando imagens duplicadas..." -ForegroundColor Yellow

# Listar imagens do Supabase
$supabaseImages = docker images --filter "reference=*supabase*" --format "{{.Repository}}:{{.Tag}} {{.ID}}"

if ($supabaseImages) {
    # Manter apenas postgres-meta v0.91.4 (mais recente)
    $imagesToRemove = @()
    foreach ($imageInfo in $supabaseImages) {
        $parts = $imageInfo -split ' '
        $imageTag = $parts[0]
        $imageId = $parts[1]
        
        # Remover versões antigas do postgres-meta
        if ($imageTag -like "*postgres-meta*" -and $imageTag -notlike "*v0.91.4*") {
            $imagesToRemove += $imageId
        }
    }
    
    if ($imagesToRemove.Count -gt 0) {
        Write-Host "Removendo imagens antigas: $($imagesToRemove.Count)" -ForegroundColor Red
        docker rmi $imagesToRemove -f
        Write-Host "Imagens antigas removidas" -ForegroundColor Green
    } else {
        Write-Host "Nenhuma imagem duplicada encontrada" -ForegroundColor Green
    }
} else {
    Write-Host "Nenhuma imagem do Supabase encontrada" -ForegroundColor Yellow
}

# 5. Limpeza geral do sistema Docker
Write-Host "`nExecutando limpeza geral do sistema..." -ForegroundColor Yellow
docker system prune -f
Write-Host "Limpeza geral concluída" -ForegroundColor Green

# 6. Mostrar estatísticas finais
Write-Host "`nEstatísticas finais:" -ForegroundColor Cyan
docker system df

Write-Host "`nLimpeza e otimização concluída!" -ForegroundColor Green
Write-Host "Agora você pode iniciar o Supabase com: npx supabase start" -ForegroundColor Cyan

# 7. Perguntar se deseja iniciar o Supabase
$startSupabase = Read-Host "`nDeseja iniciar o Supabase agora? (s/n)"
if ($startSupabase -eq 's' -or $startSupabase -eq 'S') {
    Write-Host "`nIniciando Supabase..." -ForegroundColor Cyan
    npx supabase start
}