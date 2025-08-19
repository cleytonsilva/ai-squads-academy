# Configuração da API Corcel para Geração de Imagens

## Visão Geral

A API Corcel está integrada na plataforma AI Squads Academy para gerar automaticamente:
- **Capas de cursos** - Imagens temáticas para os cursos
- **Imagens de capítulos** - Imagens inseridas automaticamente no início de cada módulo

## Como Obter a Chave da API Corcel

### 1. Acesse o Dashboard da Corcel
- Visite: https://corcel.io/dashboard
- Faça login ou crie uma conta

### 2. Obtenha sua API Key
- No dashboard, procure pela seção "API Keys" ou "Configurações"
- Copie sua chave de API (formato: `corcel_xxxxxxxxxxxxx`)

### 3. Configure no Projeto

#### Ambiente Local (.env)
```bash
# Configurações de IA (Corcel)
# Obtenha sua chave em: https://corcel.io/dashboard
CORCEL_API_KEY=sua_chave_corcel_aqui
```

#### Ambiente de Produção (Supabase)
1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá em **Settings** > **Edge Functions**
3. Adicione a variável de ambiente:
   - **Nome:** `CORCEL_API_KEY`
   - **Valor:** Sua chave da API Corcel

## Como Funciona a Integração

### Função Edge: `generate-course-images`

Localizada em: `supabase/functions/generate-course-images/index.ts`

#### Funcionalidades:
- ✅ Gera capa do curso baseada no título
- ✅ Gera imagens temáticas para cada módulo/capítulo
- ✅ Insere automaticamente as imagens no HTML dos módulos
- ✅ Suporte a múltiplos engines de IA (Proteus, Flux, DreamShaper)
- ✅ Tratamento de erros e rate limiting

#### Engines Disponíveis:
- **proteus** (padrão) - Qualidade balanceada
- **flux-schnell** - Geração rápida
- **dreamshaper** - Estilo artístico

### Como Usar no Frontend

#### 1. Dashboard Administrativo
- Acesse `/admin/dashboard`
- Encontre um curso sem capa
- Clique em "Gerar capa com IA"
- A função será executada automaticamente

#### 2. Programaticamente
```typescript
// Exemplo de chamada da função
const { data, error } = await supabase.functions.invoke("generate-course-images", {
  body: { 
    courseId: "uuid-do-curso",
    engine: "proteus" // opcional
  },
});

if (error) {
  if (data?.requiresSecret) {
    console.log("Chave da API Corcel não configurada");
  } else {
    console.error("Erro na geração:", error);
  }
} else {
  console.log("Imagens geradas:", data);
}
```

## Parâmetros da API Corcel

### Configuração Atual
```typescript
const params = {
  prompt: "Prompt gerado automaticamente",
  engine: "proteus", // ou flux-schnell, dreamshaper
  width: 1024,
  height: 576,
  steps: 8,
  cfgScale: 2
};
```

### Prompts Utilizados

#### Para Capas de Curso:
```
Capa realista em alta qualidade para curso de tecnologia e cibersegurança, 
tema: [TÍTULO_DO_CURSO]. Estilo moderno, profissional, clean UI, 
cores tecnológicas, elementos de rede, cadeados, circuitos, data streams. 
Sem texto, sem logotipos. Aspect ratio 16:9.
```

#### Para Módulos/Capítulos:
```
Imagem realista relacionada a tecnologia e cibersegurança para capítulo: [TÍTULO_DO_MÓDULO]. 
Visual profissional, foco no tema, sem texto. Aspect ratio 16:9.
```

## Estrutura de Resposta

### 📋 **Resposta da API Corcel**

A API Corcel retorna o seguinte formato de resposta:

```json
{
  "signed_urls": [
    "https://corcel.b-cdn.net/0e1f48e8-51ab-48f2-8e2e-190781e49d5e.webp"
  ]
}
```

**Nota:** A função foi atualizada para tratar corretamente o formato `signed_urls` da resposta da API Corcel.

### Sucesso
```json
{
  "courseImageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "moduleImages": {
    "module-uuid-1": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "module-uuid-2": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

### Erro - Chave não configurada
```json
{
  "error": "Missing CORCEL_API_KEY",
  "requiresSecret": true
}
```

## Segurança e Boas Práticas

### ✅ Implementado
- Autenticação obrigatória (usuário logado)
- Autorização por role (admin/instructor)
- Validação de entrada de dados
- Tratamento de erros robusto
- Rate limiting (execução sequencial)
- Logs detalhados para debug

### 🔒 Variáveis de Ambiente
- `CORCEL_API_KEY` - Nunca exposta no frontend
- Configurada apenas no backend (Edge Functions)
- Validação de presença antes do uso

## 🐛 **Troubleshooting**

### ✅ **Problema Resolvido: Erro 500**
O erro 500 foi corrigido! A função agora trata corretamente a resposta da API Corcel no formato `signed_urls`.

### Erro: "Missing CORCEL_API_KEY"
**Solução:** Configure a chave nos ambientes (local e produção)

### Erro: "Not authenticated"
**Solução:** Usuário deve estar logado

### Erro: "Not authorized"
**Solução:** Usuário deve ter role 'admin' ou 'instructor'

### Erro: "Course not found"
**Solução:** Verifique se o courseId existe no banco

### Erro 401: "Unauthorized"
- Chave da API inválida ou expirada
- Verifique se a chave está configurada corretamente no Supabase

### Erro 400: "Bad Request"
- Parâmetros inválidos (width, height, steps, etc.)
- Prompt muito longo ou vazio
- Verifique se o `text_prompts` está no formato correto

### Imagens não aparecem
**Possíveis causas:**
1. Chave da API inválida
2. Rate limit da Corcel atingido
3. Problema de conectividade
4. Engine indisponível

### Verificar Configuração
```bash
# Verificar se a chave está configurada no Supabase
supabase secrets list

# Deve mostrar CORCEL_API_KEY na lista
```

### Logs de Debug
Verifique os logs da Edge Function no Supabase Dashboard:
- **Functions** > **generate-course-images** > **Logs**

## Custos e Limites

### Corcel API
- Consulte os preços em: https://corcel.io/pricing
- Monitore o uso no dashboard da Corcel
- Configure alertas de limite se necessário

### Otimizações
- Geração sequencial para evitar rate limits
- Cache de imagens no Supabase Storage (futuro)
- Retry automático em caso de falha temporária

## Próximos Passos

### Melhorias Planejadas
1. **Seleção de Engine no Frontend**
   - Interface para escolher engine (Proteus, Flux, DreamShaper)
   
2. **Customização de Prompts**
   - Permitir edição dos prompts pelo admin
   
3. **Cache Inteligente**
   - Armazenar imagens no Supabase Storage
   - Evitar regeneração desnecessária
   
4. **Batch Processing**
   - Gerar imagens para múltiplos cursos
   
5. **Preview e Aprovação**
   - Visualizar antes de aplicar
   - Sistema de aprovação para imagens

---

**📝 Nota:** Esta documentação será atualizada conforme novas funcionalidades forem implementadas.

**🔗 Links Úteis:**
- [Documentação Corcel API](https://docs.corcel.io/reference/vision-text-to-image)
- [Dashboard Corcel](https://corcel.io/dashboard)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)