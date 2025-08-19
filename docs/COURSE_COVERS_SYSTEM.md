# Sistema de Geração Automática de Capas de Cursos

## Visão Geral

O Sistema de Geração Automática de Capas de Cursos é uma solução completa que permite criar, gerenciar e atualizar capas de cursos usando inteligência artificial. O sistema integra as APIs do Replicate (Flux-1.1-Pro e Recraft-V3) com o Supabase para fornecer uma experiência seamless de geração de imagens.

## Arquitetura do Sistema

### Componentes Principais

1. **Edge Functions**
   - `generate-course-cover`: Função principal para geração de capas
   - `replicate-webhook`: Processa callbacks do Replicate

2. **Componentes Frontend**
   - `CoverImageUpload`: Gerenciamento de capas no AdminCourseEditor
   - `CourseCoverManager`: Interface avançada de gerenciamento
   - `ImageGenerationWrapper`: Wrapper para geração automática

3. **Banco de Dados**
   - `course_covers`: Tabela principal para armazenar capas
   - `replicate_predictions`: Rastreamento de predições
   - `generation_jobs`: Jobs de geração em lote

4. **Storage**
   - Bucket `course-images` no Supabase Storage
   - Políticas RLS para controle de acesso

## Configuração Inicial

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Replicate
REPLICATE_API_TOKEN=r8_your_replicate_token
REPLICATE_WEBHOOK_SECRET=whsec_your_webhook_secret

# URLs de Webhook (configurar no Replicate Dashboard)
REPLICATE_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/replicate-webhook
```

### 2. Configuração do Replicate

1. Acesse [Replicate Dashboard](https://replicate.com/account)
2. Gere um API Token
3. Configure o webhook URL apontando para sua Edge Function
4. Anote o webhook secret

### 3. Deploy Automático

Execute o script de deploy:

```bash
node scripts/deploy-course-covers.js
```

Ou execute manualmente:

```bash
# 1. Aplicar migrações
supabase db push

# 2. Deploy das Edge Functions
supabase functions deploy generate-course-cover
supabase functions deploy replicate-webhook

# 3. Configurar storage (se necessário)
# Já incluído nas migrações
```

## Uso do Sistema

### Geração Automática de Capas

#### No AdminDashboard

1. Acesse o painel administrativo
2. Localize um curso sem capa
3. Clique no botão "Gerar capa com IA"
4. Aguarde o processamento (1-3 minutos)

#### No AdminCourseEditor

1. Abra um curso para edição
2. Na seção "Capa do Curso", clique em "Adicionar Capa" ou "Alterar Capa"
3. Escolha "Gerar Capa com IA"
4. Selecione o engine (Flux ou Recraft)
5. Confirme a geração

### Upload Manual de Capas

1. No AdminCourseEditor, clique em "Adicionar Capa"
2. Escolha "Upload de Arquivo"
3. Selecione uma imagem (JPEG, PNG, WebP, GIF)
4. A imagem será automaticamente redimensionada e otimizada

### Inserção de URL Externa

1. No AdminCourseEditor, clique em "Adicionar Capa"
2. Escolha "URL Externa"
3. Cole a URL da imagem
4. Clique em "Salvar"

## API Reference

### Edge Function: generate-course-cover

**Endpoint:** `POST /functions/v1/generate-course-cover`

**Headers:**
```
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
```

**Body:**
```json
{
  "courseId": "uuid-do-curso",
  "engine": "flux", // ou "recraft"
  "regenerate": false // força nova geração
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "predictionId": "replicate-prediction-id",
  "message": "Geração iniciada com sucesso",
  "estimatedTime": "2-3 minutos"
}
```

**Resposta de Erro:**
```json
{
  "error": "Descrição do erro",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Edge Function: replicate-webhook

**Endpoint:** `POST /functions/v1/replicate-webhook`

**Headers:**
```
Replicate-Signature: sha256=signature
Content-Type: application/json
```

**Body:** (Enviado automaticamente pelo Replicate)
```json
{
  "id": "prediction-id",
  "status": "succeeded",
  "output": "https://url-da-imagem-gerada.jpg",
  "input": {},
  "metrics": {}
}
```

## Estrutura do Banco de Dados

### Tabela: course_covers

```sql
CREATE TABLE course_covers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type VARCHAR(20) DEFAULT 'generated' CHECK (image_type IN ('generated', 'uploaded', 'url')),
  engine_used VARCHAR(20), -- 'flux', 'recraft', null para uploads
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela: replicate_predictions

```sql
CREATE TABLE replicate_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id TEXT NOT NULL UNIQUE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('course_cover', 'module_image')),
  status TEXT NOT NULL DEFAULT 'starting',
  input JSONB,
  output TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

## Segurança e Permissões

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com as seguintes políticas:

1. **Leitura Pública**: Usuários podem ver capas de cursos publicados
2. **Escrita Restrita**: Apenas admins e instrutores podem modificar capas
3. **Isolamento de Dados**: Usuários só veem dados relevantes ao seu contexto

### Validação de Entrada

- **Tipos de Arquivo**: Apenas JPEG, PNG, WebP, GIF
- **Tamanho Máximo**: 10MB por arquivo
- **URLs**: Validação de formato e protocolo HTTPS
- **Autenticação**: Verificação de role antes de operações

## Monitoramento e Logs

### Logs das Edge Functions

Acesse os logs no Supabase Dashboard:

1. Vá para "Edge Functions"
2. Selecione a função desejada
3. Visualize logs em tempo real

### Métricas de Performance

O sistema coleta métricas automáticas:

- Tempo de geração por engine
- Taxa de sucesso/falha
- Uso de recursos
- Frequência de uso

### Alertas Recomendados

- Taxa de erro > 10%
- Tempo de resposta > 5 minutos
- Falhas de webhook consecutivas
- Uso excessivo de storage

## Troubleshooting

### Problemas Comuns

#### 1. "Erro de autenticação"

**Causa:** Token do Replicate inválido ou expirado

**Solução:**
```bash
# Verificar token no .env
echo $REPLICATE_API_TOKEN

# Testar token
curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
     https://api.replicate.com/v1/models
```

#### 2. "Webhook não recebido"

**Causa:** URL do webhook incorreta ou inacessível

**Solução:**
1. Verificar URL no Replicate Dashboard
2. Testar conectividade:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/replicate-webhook \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
```

#### 3. "Permissão negada para storage"

**Causa:** Políticas RLS mal configuradas

**Solução:**
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Recriar políticas se necessário
DROP POLICY IF EXISTS "Admins can upload course images" ON storage.objects;
CREATE POLICY "Admins can upload course images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'course-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  )
);
```

#### 4. "Geração muito lenta"

**Causa:** Sobrecarga na API do Replicate

**Solução:**
- Implementar retry com backoff exponencial
- Usar cache para prompts similares
- Considerar horários de menor uso

### Logs de Debug

Para habilitar logs detalhados:

```javascript
// No frontend
localStorage.setItem('debug-course-covers', 'true');

// Nas Edge Functions
console.log('[DEBUG]', { courseId, engine, timestamp: new Date().toISOString() });
```

### Verificação de Saúde do Sistema

Script para verificar status geral:

```bash
#!/bin/bash
# health-check.sh

echo "🔍 Verificando saúde do sistema..."

# 1. Testar Edge Functions
echo "📡 Testando Edge Functions..."
curl -f https://your-project.supabase.co/functions/v1/generate-course-cover/health || echo "❌ generate-course-cover offline"

# 2. Verificar banco de dados
echo "🗄️ Verificando banco de dados..."
psql $DATABASE_URL -c "SELECT COUNT(*) FROM course_covers;" || echo "❌ Banco inacessível"

# 3. Testar storage
echo "💾 Verificando storage..."
curl -f https://your-project.supabase.co/storage/v1/bucket/course-images || echo "❌ Storage inacessível"

echo "✅ Verificação concluída"
```

## Otimizações e Melhorias Futuras

### Performance

1. **Cache de Imagens**
   - Implementar CDN para imagens geradas
   - Cache local de prompts similares
   - Pré-geração para cursos populares

2. **Processamento em Lote**
   - Geração simultânea para múltiplos cursos
   - Fila de prioridades
   - Agendamento de geração

### Funcionalidades

1. **Personalização Avançada**
   - Templates de design
   - Cores personalizadas por instituição
   - Logos e marcas d'água

2. **Analytics**
   - Métricas de engajamento por tipo de capa
   - A/B testing de designs
   - Relatórios de performance

3. **Integração com IA**
   - Análise automática de conteúdo do curso
   - Sugestões de melhorias
   - Geração baseada em tendências

## Suporte e Contribuição

### Reportar Problemas

1. Verifique os logs das Edge Functions
2. Reproduza o erro em ambiente de desenvolvimento
3. Colete informações relevantes:
   - ID do curso
   - Timestamp do erro
   - Mensagens de erro completas
   - Screenshots se aplicável

### Contribuir com o Projeto

1. Fork do repositório
2. Crie uma branch para sua feature
3. Implemente testes para novas funcionalidades
4. Submeta um Pull Request com descrição detalhada

### Contato

Para suporte técnico ou dúvidas:
- Email: suporte@esquads.com
- Slack: #dev-course-covers
- Documentação: https://docs.esquads.com/course-covers

---

**Última atualização:** Janeiro 2025  
**Versão do sistema:** 1.0.0  
**Compatibilidade:** Supabase v2.39+, Replicate API v1