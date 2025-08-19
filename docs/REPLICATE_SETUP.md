# Configuração da API Replicate FLUX 1.1 Pro para Geração de Imagens

## Visão Geral

A API Replicate com o modelo FLUX 1.1 Pro está integrada na plataforma AI Squads Academy para gerar automaticamente:
- **Capas de cursos** - Imagens temáticas de alta qualidade para os cursos
- **Imagens de capítulos** - Imagens inseridas automaticamente no início de cada módulo
- **Imagens do Ideogram V3 Turbo** - Modelo alternativo para geração de imagens com texto

## Sobre o FLUX 1.1 Pro

### Características Principais
- **6x mais rápido** que o FLUX.1 Pro anterior
- **Qualidade superior** de imagem
- **Melhor aderência ao prompt** 
- **Maior diversidade** de outputs
- **Modelo híbrido** com 12B parâmetros
- **Líder no ranking** da Artificial Analysis Arena

### Vantagens
- ✅ Geração mais rápida e eficiente
- ✅ Qualidade de imagem excepcional
- ✅ Melhor interpretação de prompts complexos
- ✅ Ideal para conteúdo profissional e educacional
- ✅ Suporte a diferentes aspect ratios
- ✅ Controle de qualidade e formato de saída

## Autenticação da API Replicate

### Formato do Token
A API Replicate utiliza **Bearer tokens** para autenticação. O formato correto é:
```
Authorization: Bearer r8_xxxxxxxxxxxxx
```

**Importante:** A partir de abril de 2024, o Replicate migrou para o padrão Bearer token, substituindo o formato anterior `Token r8_...`. Ambos os formatos ainda funcionam, mas recomenda-se usar Bearer.

## Como Obter a Chave da API Replicate

### 1. Acesse o Replicate
- Visite: https://replicate.com
- Faça login ou crie uma conta

### 2. Obtenha sua API Token
- No dashboard, vá em **Account Settings**
- Procure pela seção **API Tokens**
- Copie seu token (formato: `r8_xxxxxxxxxxxxx`)
- **Teste seu token:**
```bash
curl https://api.replicate.com/v1/account -H "Authorization: Bearer $REPLICATE_API_TOKEN"
```

### 3. Configure no Projeto

#### Ambiente Local (.env)
```bash
# Configurações de IA (Replicate)
# Obtenha seu token em: https://replicate.com/account/api-tokens
REPLICATE_API_TOKEN=r8_seu_token_aqui
```

#### Ambiente de Produção (Supabase)
1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá em **Settings** > **Edge Functions**
3. Adicione a variável de ambiente:
   - **Nome:** `REPLICATE_API_TOKEN`
   - **Valor:** Seu token da API Replicate

## Como Funciona a Integração

### Função Edge: `generate-course-images`

Localizada em: `supabase/functions/generate-course-images/index.ts`

#### Funcionalidades:
- ✅ Gera capa do curso baseada no título usando FLUX 1.1 Pro
- ✅ Gera imagens temáticas para cada módulo/capítulo
- ✅ Insere automaticamente as imagens no HTML dos módulos
- ✅ Suporte a múltiplos provedores (Replicate, Corcel, OpenAI, Gemini)
- ✅ Tratamento de erros e polling automático
- ✅ Configuração flexível de parâmetros

#### Seleção Automática do Provedor:
O sistema detecta automaticamente qual provedor usar baseado no engine selecionado:
- `flux-1.1-pro` → Replicate FLUX 1.1 Pro
- `replicate` → Replicate FLUX 1.1 Pro
- `ideogram` ou `v3-turbo` → Replicate Ideogram V3 Turbo
- `openai` ou `dall-e` → OpenAI DALL-E
- `gemini` ou `imagen` → Google Gemini
- Outros → Corcel (padrão)

### Como Usar no Frontend

#### 1. Dashboard Administrativo
- Acesse `/admin/dashboard`
- Encontre um curso sem capa
- Clique em "Gerar capa com IA"
- Selecione uma das opções disponíveis:
  - **FLUX 1.1 Pro** - Para imagens fotorrealistas de alta qualidade
  - **Ideogram V3 Turbo** - Para imagens com texto e design gráfico
- A função será executada automaticamente

#### 2. Programaticamente
```typescript
// Exemplo de chamada da função
const { data, error } = await supabase.functions.invoke("generate-course-images", {
  body: { 
    courseId: "uuid-do-curso",
    engine: "flux-1.1-pro" // Usa Replicate FLUX 1.1 Pro
  },
});

if (error) {
  console.error("Erro na geração:", error);
} else {
  console.log("Imagens geradas:", data);
}
```

## Parâmetros da API Replicate

### FLUX 1.1 Pro - Configuração Atual
```typescript
const fluxParams = {
  model: "black-forest-labs/flux-1.1-pro",
  input: {
    prompt: "Prompt gerado automaticamente",
    aspect_ratio: "16:9", // Ideal para capas de curso
    output_format: "webp", // Formato otimizado
    output_quality: 80, // Qualidade balanceada
    safety_tolerance: 2, // Moderação de conteúdo
    prompt_upsampling: true // Melhoria automática do prompt
  }
};
```

### Ideogram V3 Turbo - Configuração Atual
```typescript
const ideogramParams = {
  model: "ideogram-ai/ideogram-v3-turbo",
  input: {
    prompt: "Prompt gerado automaticamente",
    aspect_ratio: "16:9", // Ideal para capas de curso
    resolution: "None", // Resolução automática
    style_type: "None", // Estilo automático
    magic_prompt_option: "Auto" // Melhoria automática do prompt
  }
};
```

### Parâmetros FLUX 1.1 Pro
- **prompt** (obrigatório): Texto para geração da imagem
- **aspect_ratio**: Proporção da imagem (1:1, 16:9, 9:16, etc.)
- **safety_tolerance**: Tolerância de segurança (1-6)
- **prompt_upsampling**: Melhoria automática do prompt
- **output_format**: Formato (webp, jpg, png)
- **output_quality**: Qualidade (0-100)

### Parâmetros Ideogram V3 Turbo
- **prompt** (obrigatório): Texto para geração da imagem
- **aspect_ratio**: Proporção da imagem (1:1, 16:9, 9:16, etc.)
- **resolution**: Resolução da imagem (None para automático)
- **style_type**: Tipo de estilo (None, Design, Render, etc.)
- **magic_prompt_option**: Melhoria do prompt (Auto, On, Off)

### Prompts Utilizados

#### FLUX 1.1 Pro - Para Capas de Curso:
```
Capa realista em alta qualidade para curso de tecnologia e cibersegurança, 
tema: [TÍTULO_DO_CURSO]. Estilo moderno, profissional, clean UI, 
cores tecnológicas, elementos de rede, cadeados, circuitos, data streams. 
Sem texto, sem logotipos. Aspect ratio 16:9.
```

#### FLUX 1.1 Pro - Para Módulos/Capítulos:
```
Imagem realista relacionada a tecnologia e cibersegurança para capítulo: 
[TÍTULO_DO_MÓDULO]. Visual profissional, foco no tema, sem texto. 
Aspect ratio 16:9.
```

#### Ideogram V3 Turbo - Para Capas de Curso:
```
Design gráfico moderno para capa de curso de tecnologia: [TÍTULO_DO_CURSO]. 
Estilo profissional, elementos visuais de tech, ícones de segurança, 
gradientes modernos, tipografia limpa. Layout para curso online. 
Aspect ratio 16:9.
```

#### Ideogram V3 Turbo - Para Módulos/Capítulos:
```
Design gráfico para módulo de curso: [TÍTULO_DO_MÓDULO]. 
Estilo tech moderno, ícones relacionados ao tema, cores profissionais, 
layout clean. Aspect ratio 16:9.
```

## Estrutura de Resposta

### Fluxo de Geração
1. **Criação da Predição**: POST para `/v1/predictions`
2. **Polling**: Verificação periódica do status
3. **Resultado**: URL da imagem quando `status === "succeeded"`

### Formato da Resposta
```json
{
  "id": "prediction-id",
  "status": "succeeded",
  "output": "https://replicate.delivery/.../output.webp"
}
```

### Estados Possíveis
- `starting`: Iniciando processamento
- `processing`: Gerando imagem
- `succeeded`: Concluído com sucesso
- `failed`: Falha na geração
- `canceled`: Cancelado pelo usuário

## Troubleshooting

### Erro 401 - Unauthenticated

**Problema:** `Replicate API error 401: {"title":"Unauthenticated","detail":"You did not pass a valid authentication token","status":401}`

**Soluções:**

1. **Verificar Token da API:**
   ```bash
   # Verificar se o token está configurado
   npx supabase secrets list
   
   # Testar token manualmente
   curl -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
        https://api.replicate.com/v1/models
   ```

2. **Reconfigurar Token:**
   ```bash
   # Remover token antigo
   npx supabase secrets unset REPLICATE_API_TOKEN
   
   # Adicionar novo token
   npx supabase secrets set REPLICATE_API_TOKEN=r8_seu_token_aqui
   ```

3. **Verificar Formato do Token:**
   - Token deve começar com `r8_`
   - Deve ter 40 caracteres no total
   - Exemplo: `r8_1234567890abcdef1234567890abcdef12345678`

4. **Verificar Implementação:**
   - Usar `Bearer` no cabeçalho de autorização
   - Formato: `Authorization: Bearer ${REPLICATE_API_TOKEN}`
   - Nunca usar `Token` (formato antigo)

### Erro de Modelo Não Encontrado

**Problema:** Modelo especificado não existe ou não está acessível

**Solução:**
- Verificar se o modelo está correto: `black-forest-labs/flux-1.1-pro`
- Verificar se o modelo está disponível na sua conta
- Usar `model` ao invés de `version` na requisição

### Timeout na Geração

**Problema:** Geração demora mais que 5 minutos

**Solução:**
- Aumentar timeout na função
- Verificar status da API do Replicate
- Simplificar prompt se muito complexo

### Erro 402 - Payment Required

**Problema:** Créditos insuficientes na conta Replicate

**Solução:**
- Adicionar créditos em: https://replicate.com/account/billing
- Verificar saldo atual na conta
- Considerar upgrade do plano se necessário

### Links Úteis

- **Documentação FLUX 1.1 Pro:** https://replicate.com/black-forest-labs/flux-1.1-pro/api
- **Documentação Ideogram V3 Turbo:** https://replicate.com/ideogram-ai/ideogram-v3-turbo/api
- **Autenticação Replicate:** https://replicate.com/docs/reference/http#authentication
- **Billing Replicate:** https://replicate.com/account/billing
- **Status da API:** https://status.replicate.com/

### Logs de Debug
Verifique os logs da Edge Function no Supabase Dashboard:
- **Functions** > **generate-course-images** > **Logs**

## Custos e Limites

### Replicate Pricing
- Consulte os preços em: https://replicate.com/pricing
- FLUX 1.1 Pro: ~$0.04 por imagem
- Monitore o uso no dashboard da Replicate
- Configure alertas de limite se necessário

### Otimizações de Custo
- Geração sequencial para evitar desperdício
- Cache de imagens no Supabase Storage (futuro)
- Retry inteligente apenas em falhas temporárias
- Uso de `prompt_upsampling` para melhor qualidade

## Comparação com Outros Provedores

| Provedor | Qualidade | Velocidade | Custo | Facilidade | Especialidade |
|----------|-----------|------------|-------|------------|---------------|
| **FLUX 1.1 Pro** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Fotorrealismo |
| **Ideogram V3 Turbo** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Texto e Design |
| Corcel | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Geral |
| OpenAI DALL-E | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | Criatividade |
| Google Gemini | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Integração Google |

## Próximos Passos

### Melhorias Planejadas
1. **Configuração Avançada**
   - Interface para ajustar parâmetros (quality, safety, etc.)
   
2. **Prompt Templates**
   - Templates personalizáveis por categoria de curso
   
3. **Batch Processing**
   - Gerar imagens para múltiplos cursos simultaneamente
   
4. **A/B Testing**
   - Comparar resultados entre diferentes provedores
   
5. **Cache Inteligente**
   - Armazenar imagens no Supabase Storage
   - Evitar regeneração desnecessária

---

**📝 Notas Importantes:**
- **FLUX 1.1 Pro:** Recomendado para imagens fotorrealistas de alta qualidade
- **Ideogram V3 Turbo:** Ideal para designs gráficos e imagens com texto
- Ambos os modelos estão integrados e funcionais na plataforma
- O sistema seleciona automaticamente o modelo baseado na escolha do usuário

**🔗 Links Úteis:**
- [Replicate FLUX 1.1 Pro](https://replicate.com/black-forest-labs/flux-1.1-pro)
- [Replicate Ideogram V3 Turbo](https://replicate.com/ideogram-ai/ideogram-v3-turbo)
- [Documentação Replicate API](https://replicate.com/docs)
- [Dashboard Replicate](https://replicate.com/account)
- [Pricing Replicate](https://replicate.com/pricing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

**🚀 Status:** ✅ Implementação completa com suporte a FLUX 1.1 Pro e Ideogram V3 Turbo