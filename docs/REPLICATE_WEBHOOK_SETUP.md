# Configuração de Webhooks do Replicate

## Visão Geral

Os webhooks do Replicate permitem receber notificações em tempo real sobre o status das predições, eliminando a necessidade de polling constante e melhorando a experiência do usuário.

## Configuração no Replicate

### 1. Acesse o Dashboard do Replicate
- Visite: https://replicate.com/account/webhooks
- Faça login na sua conta

### 2. Configure o Webhook
- **URL do Webhook:** `https://ncrlojjfkhevjotchhxi.supabase.co/functions/v1/replicate-webhook`
- **Eventos:** Selecione `predictions.*` (todos os eventos de predição)
- **Segredo:** Use a chave `whsec_2lFI4Fz2hirUC9LscDnQuEn6NwVSABG4`

### 3. Teste o Webhook
- Use o botão "Test webhook" no dashboard
- Verifique os logs da Edge Function no Supabase

## Edge Function: replicate-webhook

### Localização
`supabase/functions/replicate-webhook/index.ts`

### Funcionalidades
- ✅ Verificação de assinatura HMAC SHA-256
- ✅ Processamento de eventos de predição
- ✅ Atualização automática de status no banco
- ✅ Atualização de capas de curso
- ✅ Inserção de imagens em módulos
- ✅ Tratamento de erros robusto
- ✅ Logs detalhados para debug

### Eventos Suportados
- `predictions.started` - Predição iniciada
- `predictions.processing` - Predição em processamento
- `predictions.succeeded` - Predição concluída com sucesso
- `predictions.failed` - Predição falhou
- `predictions.canceled` - Predição cancelada

## Banco de Dados

### Tabela: replicate_predictions

```sql
CREATE TABLE replicate_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id TEXT NOT NULL UNIQUE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('course_cover', 'module_image')),
  status TEXT NOT NULL DEFAULT 'starting',
  input JSONB,
  output TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### Como Aplicar a Migração

1. **Via Dashboard do Supabase:**
   - Acesse: https://supabase.com/dashboard/project/ncrlojjfkhevjotchhxi/sql
   - Cole o conteúdo do arquivo `supabase/migrations/20250108_create_replicate_predictions.sql`
   - Execute a query

2. **Via CLI (se configurado):**
   ```bash
   npx supabase db push --linked
   ```

## Integração com generate-course-images

### Modificações Necessárias

A Edge Function `generate-course-images` precisa ser atualizada para:

1. **Registrar predições no banco:**
   ```typescript
   // Após criar a predição no Replicate
   const { error } = await supabase
     .from('replicate_predictions')
     .insert({
       prediction_id: prediction.id,
       course_id: courseId,
       module_id: moduleId, // se aplicável
       prediction_type: 'course_cover', // ou 'module_image'
       status: 'starting',
       input: requestBody.input
     });
   ```

2. **Configurar webhook URL:**
   ```typescript
   const requestBody = {
     model: "black-forest-labs/flux-1.1-pro",
     input: { /* parâmetros */ },
     webhook: "https://ncrlojjfkhevjotchhxi.supabase.co/functions/v1/replicate-webhook",
     webhook_events_filter: ["start", "output", "completed"]
   };
   ```

3. **Remover polling manual:**
   - O webhook cuidará das atualizações
   - Manter apenas verificação de timeout

## Verificação de Assinatura

### Como Funciona

1. **Replicate envia:** Cabeçalho `Replicate-Signature: sha256=<hash>`
2. **Função calcula:** HMAC SHA-256 do corpo usando o segredo
3. **Comparação segura:** Verifica se as assinaturas coincidem

### Implementação

```typescript
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = signature.replace("sha256=", "");
  
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  
  const calculatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  return calculatedSignature === expectedSignature;
}
```

## Monitoramento e Logs

### Logs da Edge Function
- Acesse: https://supabase.com/dashboard/project/ncrlojjfkhevjotchhxi/functions
- Clique em "replicate-webhook" > "Logs"

### Logs Importantes
- `[WEBHOOK] Processando predição {id} com status: {status}`
- `[WEBHOOK] Capa do curso {id} atualizada com sucesso`
- `[WEBHOOK] Imagem do módulo {id} adicionada com sucesso`
- `[WEBHOOK] Erro ao verificar assinatura do webhook`

### Métricas
- Taxa de sucesso dos webhooks
- Tempo de processamento
- Erros de assinatura
- Falhas de atualização no banco

## Troubleshooting

### Webhook não está sendo chamado
1. Verifique a URL no dashboard do Replicate
2. Confirme que a Edge Function está deployada
3. Teste manualmente com curl:
   ```bash
   curl -X POST https://ncrlojjfkhevjotchhxi.supabase.co/functions/v1/replicate-webhook \
     -H "Content-Type: application/json" \
     -H "Replicate-Signature: sha256=test" \
     -d '{"id":"test","status":"succeeded"}'
   ```

### Erro de assinatura inválida
1. Verifique se `REPLICATE_WEBHOOK_SECRET` está configurado
2. Confirme que o segredo no Replicate é o mesmo
3. Verifique se não há caracteres extras (espaços, quebras de linha)

### Predições não são atualizadas
1. Verifique se a tabela `replicate_predictions` existe
2. Confirme que o `prediction_id` está sendo salvo corretamente
3. Verifique os logs para erros de SQL

### Imagens não aparecem nos cursos/módulos
1. Verifique se o `course_id` ou `module_id` estão corretos
2. Confirme que a URL da imagem é válida
3. Verifique permissões de atualização no banco

## Segurança

### Boas Práticas
- ✅ Verificação obrigatória de assinatura
- ✅ Validação de entrada de dados
- ✅ Logs sem exposição de dados sensíveis
- ✅ Rate limiting implícito (Supabase)
- ✅ HTTPS obrigatório

### Configurações de Segurança
- Webhook secret deve ser mantido seguro
- Apenas IPs do Replicate devem acessar (opcional)
- Logs devem ser monitorados para tentativas maliciosas

## Próximos Passos

### Melhorias Planejadas
1. **Retry automático** para falhas temporárias
2. **Dead letter queue** para webhooks falhados
3. **Métricas avançadas** com alertas
4. **Webhook para outros provedores** (OpenAI, Gemini)
5. **Interface de monitoramento** no dashboard admin

### Configuração Adicional
1. **Alertas:** Configurar notificações para falhas
2. **Backup:** Estratégia de backup para predições
3. **Cleanup:** Limpeza automática de predições antigas
4. **Analytics:** Métricas de uso e performance

---

**📝 Status:** ✅ Edge Function criada e deployada
**🔗 URL:** https://ncrlojjfkhevjotchhxi.supabase.co/functions/v1/replicate-webhook
**🔑 Secret:** whsec_2lFI4Fz2hirUC9LscDnQuEn6NwVSABG4
**📊 Monitoramento:** https://supabase.com/dashboard/project/ncrlojjfkhevjotchhxi/functions

**⚠️ Próximo Passo:** Aplicar migração do banco de dados via Dashboard do Supabase