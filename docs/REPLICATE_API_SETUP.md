# Guia de Configuração - APIs do Replicate

## Visão Geral

Este guia detalha como configurar e integrar as APIs do Replicate para geração automática de capas de cursos. O sistema utiliza dois modelos principais:

- **Flux-1.1-Pro**: Para geração de imagens realistas e detalhadas
- **Recraft-V3**: Para designs mais estilizados e gráficos

## Pré-requisitos

- Conta no [Replicate](https://replicate.com)
- Projeto Supabase configurado
- Edge Functions deployadas

## Passo 1: Configuração da Conta Replicate

### 1.1 Criar Conta e Obter API Token

1. Acesse [replicate.com](https://replicate.com) e crie uma conta
2. Vá para [Account Settings](https://replicate.com/account)
3. Na seção "API tokens", clique em "Create token"
4. Dê um nome descritivo (ex: "Esquads Course Covers")
5. Copie o token gerado (formato: `r8_...`)

### 1.2 Configurar Billing

1. Acesse [Billing](https://replicate.com/account/billing)
2. Adicione um método de pagamento
3. Configure limites de gasto (recomendado: $50-100/mês para início)

**Custos Estimados:**
- Flux-1.1-Pro: ~$0.055 por imagem
- Recraft-V3: ~$0.040 por imagem
- Estimativa mensal: $20-50 para 500-1000 capas

## Passo 2: Configuração de Webhooks

### 2.1 Obter URL do Webhook

Sua URL do webhook será:
```
https://[SEU-PROJETO].supabase.co/functions/v1/replicate-webhook
```

Substitua `[SEU-PROJETO]` pelo ID do seu projeto Supabase.

### 2.2 Configurar Webhook no Replicate

1. Acesse [Webhooks](https://replicate.com/account/webhooks)
2. Clique em "Create webhook"
3. Configure:
   - **URL**: Sua URL do webhook
   - **Events**: Selecione "predictions"
   - **Secret**: Gere um secret seguro (será usado no .env)

### 2.3 Testar Webhook

```bash
# Teste básico do webhook
curl -X POST https://[SEU-PROJETO].supabase.co/functions/v1/replicate-webhook \
  -H "Content-Type: application/json" \
  -H "Replicate-Signature: sha256=test" \
  -d '{"test": true}'
```

## Passo 3: Configuração das Variáveis de Ambiente

### 3.1 Atualizar .env

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Replicate API Configuration
REPLICATE_API_TOKEN=r8_seu_token_aqui
REPLICATE_WEBHOOK_SECRET=whsec_seu_secret_aqui

# URLs dos modelos (opcional - já configurado no código)
REPLICATE_FLUX_MODEL=black-forest-labs/flux-1.1-pro
REPLICATE_RECRAFT_MODEL=recraft-ai/recraft-v3

# Configurações de timeout (opcional)
REPLICATE_TIMEOUT_MS=300000
REPLICATE_MAX_RETRIES=3
```

### 3.2 Validar Configuração

Execute o script de validação:

```bash
node scripts/validate-replicate-config.js
```

Ou teste manualmente:

```bash
# Testar autenticação
curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
     https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro
```

## Passo 4: Configuração dos Modelos

### 4.1 Flux-1.1-Pro

**Características:**
- Melhor para imagens fotorrealistas
- Suporte a aspectos ratio variados
- Tempo de geração: 30-60 segundos
- Qualidade superior para cenários complexos

**Parâmetros Recomendados:**
```json
{
  "prompt": "Professional course cover for [COURSE_TITLE]...",
  "aspect_ratio": "16:9",
  "output_quality": 90,
  "safety_tolerance": 2,
  "prompt_upsampling": true
}
```

### 4.2 Recraft-V3

**Características:**
- Ideal para designs gráficos e ilustrações
- Estilos consistentes
- Tempo de geração: 15-30 segundos
- Melhor para elementos tipográficos

**Parâmetros Recomendados:**
```json
{
  "prompt": "Modern educational course thumbnail for [COURSE_TITLE]...",
  "style": "realistic_image",
  "size": "1920x1080",
  "output_format": "webp",
  "quality": 90
}
```

## Passo 5: Otimização de Prompts

### 5.1 Estrutura de Prompt Eficaz

```
[TIPO_DE_IMAGEM] + [DESCRIÇÃO_DO_CURSO] + [ESTILO] + [ESPECIFICAÇÕES_TÉCNICAS]
```

**Exemplo para Flux:**
```
Professional course cover image for "Cybersecurity Fundamentals". 
Modern, clean educational design with cybersecurity icons and blue color scheme. 
High quality, 16:9 aspect ratio, suitable for online learning platform. 
No text overlay needed.
```

**Exemplo para Recraft:**
```
Educational course thumbnail for "Data Science Basics". 
Minimalist design with data visualization elements, charts and graphs. 
Professional color palette with good contrast. 
1920x1080 pixels, web-optimized.
```

### 5.2 Palavras-chave Eficazes

**Para Qualidade:**
- "professional", "high quality", "detailed", "sharp"
- "modern", "clean", "minimalist", "elegant"

**Para Estilo Educacional:**
- "educational", "academic", "learning", "course"
- "tutorial", "training", "instructional"

**Para Especificações Técnicas:**
- "16:9 aspect ratio", "web-optimized", "thumbnail"
- "no text overlay", "suitable for online platform"

### 5.3 Prompts por Categoria de Curso

**Tecnologia:**
```
Modern tech course cover with circuit patterns, code elements, and digital aesthetics. 
Blue and green color scheme, professional layout, 16:9 format.
```

**Negócios:**
```
Professional business course thumbnail with corporate elements, charts, and clean typography. 
Navy blue and gold color palette, executive style, web-ready format.
```

**Design:**
```
Creative design course cover with artistic elements, color swatches, and modern layout. 
Vibrant colors, contemporary style, suitable for creative professionals.
```

## Passo 6: Monitoramento e Debugging

### 6.1 Logs do Replicate

Acesse os logs em:
1. [Replicate Dashboard](https://replicate.com/predictions)
2. Filtre por data e status
3. Analise tempos de execução e erros

### 6.2 Métricas Importantes

**Performance:**
- Tempo médio de geração
- Taxa de sucesso/falha
- Uso de créditos

**Qualidade:**
- Feedback dos usuários
- Necessidade de regeneração
- Adequação ao conteúdo

### 6.3 Alertas Recomendados

```javascript
// Configurar alertas para:
- Taxa de erro > 10%
- Tempo de geração > 5 minutos
- Uso de créditos > limite mensal
- Falhas de webhook consecutivas
```

## Passo 7: Troubleshooting

### 7.1 Erros Comuns

#### "Invalid API token"
```bash
# Verificar token
echo $REPLICATE_API_TOKEN

# Testar autenticação
curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
     https://api.replicate.com/v1/account
```

#### "Model not found"
```bash
# Verificar disponibilidade do modelo
curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
     https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro
```

#### "Webhook signature invalid"
```javascript
// Verificar secret no código
const expectedSignature = crypto
  .createHmac('sha256', process.env.REPLICATE_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');
```

#### "Prediction failed"
```javascript
// Analisar logs da predição
const prediction = await replicate.predictions.get(predictionId);
console.log('Error details:', prediction.error);
console.log('Logs:', prediction.logs);
```

### 7.2 Otimizações de Performance

#### Cache de Prompts
```sql
-- Implementar cache para prompts similares
CREATE TABLE prompt_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash TEXT UNIQUE,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Retry com Backoff
```javascript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
};
```

## Passo 8: Segurança e Boas Práticas

### 8.1 Proteção de API Keys

- ✅ Armazenar tokens apenas em variáveis de ambiente
- ✅ Usar diferentes tokens para dev/staging/prod
- ✅ Rotacionar tokens regularmente
- ❌ Nunca commitar tokens no código
- ❌ Não expor tokens no frontend

### 8.2 Validação de Webhooks

```javascript
// Sempre validar assinatura do webhook
const isValidSignature = (body, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return signature === `sha256=${expectedSignature}`;
};
```

### 8.3 Rate Limiting

```javascript
// Implementar rate limiting
const rateLimiter = {
  requests: new Map(),
  limit: 10, // requests per minute
  window: 60000, // 1 minute
  
  isAllowed(userId) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove requests outside window
    const validRequests = userRequests.filter(
      time => now - time < this.window
    );
    
    if (validRequests.length >= this.limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    return true;
  }
};
```

## Passo 9: Testes e Validação

### 9.1 Script de Teste Completo

```javascript
// test-replicate-integration.js
const { createClient } = require('@supabase/supabase-js');

async function testReplicateIntegration() {
  console.log('🧪 Testando integração com Replicate...');
  
  // 1. Testar autenticação
  console.log('1. Testando autenticação...');
  const authResponse = await fetch('https://api.replicate.com/v1/account', {
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
    }
  });
  
  if (!authResponse.ok) {
    throw new Error('Falha na autenticação');
  }
  console.log('✅ Autenticação OK');
  
  // 2. Testar modelos
  console.log('2. Testando disponibilidade dos modelos...');
  const models = ['black-forest-labs/flux-1.1-pro', 'recraft-ai/recraft-v3'];
  
  for (const model of models) {
    const response = await fetch(`https://api.replicate.com/v1/models/${model}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
      }
    });
    
    if (response.ok) {
      console.log(`✅ Modelo ${model} disponível`);
    } else {
      console.log(`❌ Modelo ${model} indisponível`);
    }
  }
  
  // 3. Testar Edge Function
  console.log('3. Testando Edge Function...');
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  
  const { data, error } = await supabase.functions.invoke('generate-course-cover', {
    body: {
      courseId: 'test-course-id',
      engine: 'flux',
      test: true
    }
  });
  
  if (error) {
    console.log('❌ Edge Function com erro:', error);
  } else {
    console.log('✅ Edge Function respondeu:', data);
  }
  
  console.log('🎉 Testes concluídos!');
}

// Executar testes
if (require.main === module) {
  testReplicateIntegration().catch(console.error);
}
```

### 9.2 Executar Testes

```bash
# Executar teste completo
node test-replicate-integration.js

# Teste específico de geração
node scripts/test-course-cover-generation.js

# Validar configuração
node scripts/validate-replicate-config.js
```

## Recursos Adicionais

### Documentação Oficial
- [Replicate API Reference](https://replicate.com/docs/reference/http)
- [Flux-1.1-Pro Model](https://replicate.com/black-forest-labs/flux-1.1-pro)
- [Recraft-V3 Model](https://replicate.com/recraft-ai/recraft-v3)
- [Webhooks Guide](https://replicate.com/docs/topics/webhooks)

### Exemplos de Código
- [Next.js Integration](https://replicate.com/docs/guides/run/nextjs)
- [Node.js Examples](https://replicate.com/docs/get-started/nodejs)
- [Webhook Implementation](https://replicate.com/docs/topics/webhooks#verifying-webhooks)

### Comunidade
- [Discord](https://discord.gg/replicate)
- [GitHub Discussions](https://github.com/replicate/replicate-javascript/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/replicate)

---

**Última atualização:** Janeiro 2025  
**Versão da API:** Replicate v1  
**Compatibilidade:** Node.js 18+, Supabase Edge Runtime