# Guia de Troubleshooting - Sistema de Geração de Capas

## Problemas Comuns e Soluções

### 🔐 Problemas de Autenticação

#### "Invalid API token" ou "Authentication failed"

**Sintomas:**
- Erro 401 ao chamar APIs do Replicate
- Mensagem "Token inválido" nos logs
- Edge Function retorna erro de autenticação

**Diagnóstico:**
```bash
# Verificar se o token está configurado
echo $REPLICATE_API_TOKEN

# Testar autenticação diretamente
curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
     https://api.replicate.com/v1/account
```

**Soluções:**
1. **Token não configurado:**
   ```bash
   # Adicionar ao .env
   REPLICATE_API_TOKEN=r8_seu_token_aqui
   ```

2. **Token expirado ou inválido:**
   - Gere um novo token em [Replicate Account](https://replicate.com/account)
   - Substitua no arquivo `.env`
   - Redeploy das Edge Functions

3. **Token com permissões insuficientes:**
   - Verifique se a conta tem créditos
   - Confirme que o billing está configurado

---

### 🌐 Problemas de Webhook

#### "Webhook signature invalid" ou "Webhook não recebido"

**Sintomas:**
- Predições ficam "stuck" em processing
- Logs mostram erro de assinatura inválida
- Capas não são atualizadas após geração

**Diagnóstico:**
```bash
# Testar conectividade do webhook
curl -X POST https://seu-projeto.supabase.co/functions/v1/replicate-webhook \
     -H "Content-Type: application/json" \
     -H "Replicate-Signature: sha256=test" \
     -d '{"test": true}'
```

**Soluções:**
1. **URL do webhook incorreta:**
   ```bash
   # URL correta deve ser:
   https://SEU-PROJETO.supabase.co/functions/v1/replicate-webhook
   ```
   - Configure no [Replicate Webhooks](https://replicate.com/account/webhooks)

2. **Secret do webhook incorreto:**
   ```bash
   # Verificar secret no .env
   REPLICATE_WEBHOOK_SECRET=whsec_seu_secret_aqui
   ```
   - Deve começar com `whsec_`
   - Copie exatamente do Replicate Dashboard

3. **Edge Function não deployada:**
   ```bash
   supabase functions deploy replicate-webhook
   ```

4. **Firewall ou proxy bloqueando:**
   - Verifique se o Supabase pode receber requisições externas
   - Confirme que não há proxy corporativo interferindo

---

### 🖼️ Problemas de Geração de Imagens

#### "Model not found" ou "Prediction failed"

**Sintomas:**
- Erro ao iniciar predição
- Modelos Flux ou Recraft indisponíveis
- Predições falham imediatamente

**Diagnóstico:**
```bash
# Verificar disponibilidade dos modelos
curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
     https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro

curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
     https://api.replicate.com/v1/models/recraft-ai/recraft-v3
```

**Soluções:**
1. **Modelos temporariamente indisponíveis:**
   - Aguarde alguns minutos e tente novamente
   - Use o engine alternativo (Flux ↔ Recraft)

2. **Conta sem créditos:**
   - Verifique saldo em [Replicate Billing](https://replicate.com/account/billing)
   - Adicione créditos ou configure auto-recharge

3. **Parâmetros inválidos:**
   ```javascript
   // Verificar parâmetros no código
   const validParams = {
     flux: {
       prompt: "string",
       aspect_ratio: "16:9", // ou outros válidos
       output_quality: 90 // 1-100
     },
     recraft: {
       prompt: "string",
       style: "realistic_image",
       size: "1920x1080"
     }
   };
   ```

---

### 💾 Problemas de Storage

#### "Permission denied" ou "Bucket not found"

**Sintomas:**
- Erro ao fazer upload de imagens
- Bucket course-images não encontrado
- Políticas RLS bloqueando acesso

**Diagnóstico:**
```sql
-- Verificar se bucket existe
SELECT * FROM storage.buckets WHERE id = 'course-images';

-- Verificar políticas
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

**Soluções:**
1. **Bucket não existe:**
   ```sql
   -- Criar bucket
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('course-images', 'course-images', true);
   ```

2. **Políticas RLS incorretas:**
   ```sql
   -- Recriar políticas
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

3. **Usuário sem permissão:**
   - Verificar se o usuário tem role 'admin' ou 'instructor'
   - Confirmar autenticação no frontend

---

### 🔄 Problemas de Performance

#### "Timeout" ou "Geração muito lenta"

**Sintomas:**
- Predições demoram mais de 5 minutos
- Timeouts nas Edge Functions
- Interface trava durante geração

**Diagnóstico:**
```javascript
// Verificar logs de performance
console.log('Tempo de geração:', endTime - startTime);

// Monitorar status das predições
SELECT 
  prediction_id,
  status,
  created_at,
  completed_at,
  EXTRACT(EPOCH FROM (completed_at - created_at)) as duration_seconds
FROM replicate_predictions 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Soluções:**
1. **Sobrecarga na API do Replicate:**
   - Implementar retry com backoff exponencial
   - Usar horários de menor demanda
   - Considerar cache para prompts similares

2. **Timeout nas Edge Functions:**
   ```javascript
   // Aumentar timeout
   const TIMEOUT_MS = 300000; // 5 minutos
   
   // Implementar polling em vez de espera síncrona
   const pollPrediction = async (predictionId) => {
     // Implementação de polling
   };
   ```

3. **Interface não responsiva:**
   ```javascript
   // Usar loading states
   const [isGenerating, setIsGenerating] = useState(false);
   
   // Implementar feedback visual
   const showProgress = (message) => {
     toast.info(message);
   };
   ```

---

### 🗄️ Problemas de Banco de Dados

#### "Table does not exist" ou "Column not found"

**Sintomas:**
- Erro ao inserir dados em course_covers
- Tabelas de predições não encontradas
- Colunas cover_image_url ausentes

**Diagnóstico:**
```sql
-- Verificar tabelas existentes
\dt public.*;

-- Verificar estrutura da tabela courses
\d courses;

-- Verificar se migrações foram aplicadas
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version LIKE '%course_covers%';
```

**Soluções:**
1. **Migrações não aplicadas:**
   ```bash
   # Aplicar migrações
   supabase db push
   
   # Ou aplicar migração específica
   supabase db reset
   ```

2. **Tabela course_covers não existe:**
   ```sql
   -- Criar tabela manualmente
   CREATE TABLE IF NOT EXISTS course_covers (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
     image_url TEXT NOT NULL,
     image_type VARCHAR(20) DEFAULT 'generated',
     engine_used VARCHAR(20),
     is_active BOOLEAN DEFAULT true,
     created_by UUID REFERENCES profiles(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Coluna cover_image_url ausente:**
   ```sql
   -- Adicionar coluna
   ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
   ```

---

### 🔧 Ferramentas de Diagnóstico

#### Script de Diagnóstico Completo

```bash
#!/bin/bash
# diagnostic.sh - Diagnóstico completo do sistema

echo "🔍 Diagnóstico do Sistema de Geração de Capas"
echo "============================================="

# 1. Verificar variáveis de ambiente
echo "\n📋 Variáveis de Ambiente:"
echo "REPLICATE_API_TOKEN: ${REPLICATE_API_TOKEN:+Configurado}"
echo "REPLICATE_WEBHOOK_SECRET: ${REPLICATE_WEBHOOK_SECRET:+Configurado}"
echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:+Configurado}"

# 2. Testar conectividade
echo "\n🌐 Testando Conectividade:"
curl -s -o /dev/null -w "Replicate API: %{http_code}\n" \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  https://api.replicate.com/v1/account

curl -s -o /dev/null -w "Supabase: %{http_code}\n" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  "$VITE_SUPABASE_URL/rest/v1/"

# 3. Verificar Edge Functions
echo "\n⚡ Testando Edge Functions:"
curl -s -o /dev/null -w "generate-course-cover: %{http_code}\n" \
  -X POST \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  "$VITE_SUPABASE_URL/functions/v1/generate-course-cover"

echo "\n✅ Diagnóstico concluído"
```

#### Logs Úteis

```javascript
// Habilitar logs detalhados no frontend
localStorage.setItem('debug-course-covers', 'true');

// Logs nas Edge Functions
console.log('[COURSE_COVERS]', {
  timestamp: new Date().toISOString(),
  action: 'generate_cover',
  courseId,
  engine,
  userId: user?.id
});

// Monitorar predições
SELECT 
  prediction_id,
  status,
  error,
  logs,
  created_at,
  updated_at
FROM replicate_predictions 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

### 📊 Monitoramento Proativo

#### Alertas Recomendados

1. **Taxa de Erro Alta:**
   ```sql
   -- Query para monitorar taxa de erro
   SELECT 
     DATE_TRUNC('hour', created_at) as hour,
     COUNT(*) as total_predictions,
     COUNT(*) FILTER (WHERE status = 'failed') as failed_predictions,
     ROUND(
       COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*), 
       2
     ) as error_rate_percent
   FROM replicate_predictions 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY hour
   ORDER BY hour DESC;
   ```

2. **Tempo de Geração Elevado:**
   ```sql
   -- Monitorar tempos de geração
   SELECT 
     prediction_type,
     AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds,
     MAX(EXTRACT(EPOCH FROM (completed_at - created_at))) as max_duration_seconds
   FROM replicate_predictions 
   WHERE status = 'succeeded'
   AND completed_at > NOW() - INTERVAL '24 hours'
   GROUP BY prediction_type;
   ```

3. **Uso de Créditos:**
   ```javascript
   // Monitorar uso de créditos via API
   const checkCredits = async () => {
     const response = await fetch('https://api.replicate.com/v1/account', {
       headers: {
         'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
       }
     });
     const account = await response.json();
     console.log('Créditos restantes:', account.balance);
   };
   ```

#### Dashboard de Métricas

```sql
-- View para dashboard de métricas
CREATE OR REPLACE VIEW course_covers_metrics AS
SELECT 
  DATE_TRUNC('day', rp.created_at) as date,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE rp.status = 'succeeded') as successful_generations,
  COUNT(*) FILTER (WHERE rp.status = 'failed') as failed_generations,
  AVG(EXTRACT(EPOCH FROM (rp.completed_at - rp.created_at))) as avg_duration_seconds,
  COUNT(DISTINCT rp.course_id) as unique_courses,
  COUNT(*) FILTER (WHERE rp.input->>'engine' = 'flux') as flux_generations,
  COUNT(*) FILTER (WHERE rp.input->>'engine' = 'recraft') as recraft_generations
FROM replicate_predictions rp
WHERE rp.prediction_type = 'course_cover'
GROUP BY date
ORDER BY date DESC;
```

---

### 🆘 Suporte e Escalação

#### Quando Escalar

1. **Taxa de erro > 20% por mais de 1 hora**
2. **Tempo de geração > 10 minutos consistentemente**
3. **Webhooks não funcionando por > 30 minutos**
4. **Storage inacessível**
5. **Edge Functions retornando 500 errors**

#### Informações para Coleta

```bash
# Script para coletar informações de debug
#!/bin/bash
echo "📋 Coletando informações para suporte..."

# Versões
echo "Node.js: $(node --version)"
echo "Supabase CLI: $(supabase --version)"

# Logs recentes
echo "\n📄 Logs das Edge Functions (últimas 50 linhas):"
supabase functions logs generate-course-cover --limit 50

# Status das predições
echo "\n📊 Status das predições (última hora):"
psql $DATABASE_URL -c "
  SELECT status, COUNT(*) 
  FROM replicate_predictions 
  WHERE created_at > NOW() - INTERVAL '1 hour' 
  GROUP BY status;
"

# Configuração
echo "\n⚙️ Configuração (sem secrets):"
echo "Supabase URL: ${VITE_SUPABASE_URL}"
echo "Webhook configurado: ${REPLICATE_WEBHOOK_SECRET:+Sim}"
echo "Token configurado: ${REPLICATE_API_TOKEN:+Sim}"
```

#### Contatos de Suporte

- **GitHub Issues:** [Reportar Bug](https://github.com/your-org/ai-squads-academy/issues)
- **Email:** suporte@esquads.com
- **Slack:** #dev-course-covers
- **Documentação:** [docs.esquads.com](https://docs.esquads.com)

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0  
**Compatibilidade:** Supabase v2.39+, Replicate API v1