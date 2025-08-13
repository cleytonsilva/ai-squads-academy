# Correção do Erro 401 - Token Replicate

## 🔍 Diagnóstico

O erro `Replicate API error 401: {"title":"Unauthenticated","detail":"You did not pass a valid authentication token","status":401}` indica que o token do Replicate está **inválido ou expirado**.

### ✅ Verificações Realizadas
- ✅ Secret `REPLICATE_API_TOKEN` está configurado no Supabase
- ✅ Código da Edge Function está correto
- ✅ Formato do cabeçalho de autorização está correto
- ❌ Token provavelmente inválido ou expirado

## 🛠️ Solução Passo a Passo

### 1. Obter um Novo Token do Replicate

1. Acesse: https://replicate.com/account/api-tokens
2. Faça login na sua conta Replicate
3. Clique em "Create token" ou "New token"
4. Dê um nome descritivo (ex: "AI Squads Academy")
5. Copie o token gerado (formato: `r8_...`)

### 2. Testar o Token Localmente

Antes de configurar no Supabase, teste se o token funciona:

```bash
# Substitua SEU_TOKEN_AQUI pelo token real
curl -H "Authorization: Bearer SEU_TOKEN_AQUI" https://api.replicate.com/v1/models
```

Se retornar uma lista de modelos, o token está válido.

### 3. Configurar o Token no Supabase

```bash
# Substitua r8_seu_novo_token pelo token real
npx supabase secrets set REPLICATE_API_TOKEN=r8_seu_novo_token --project-ref ncrlojjfkhevjotchhxi
```

### 4. Fazer Redeploy da Edge Function

```bash
npx supabase functions deploy generate-course-images --project-ref ncrlojjfkhevjotchhxi
```

### 5. Testar a Geração de Imagem

Após o redeploy, teste novamente a geração de imagem no frontend.

## 🔧 Comandos de Teste

### Testar Autenticação
```bash
curl -H "Authorization: Bearer SEU_TOKEN" https://api.replicate.com/v1/models
```

### Testar Criação de Predição
```bash
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "black-forest-labs/flux-1.1-pro",
    "input": {
      "prompt": "a beautiful sunset over mountains",
      "aspect_ratio": "16:9",
      "output_format": "webp",
      "output_quality": 80,
      "safety_tolerance": 2,
      "prompt_upsampling": true
    }
  }'
```

## 📋 Checklist de Verificação

- [ ] Token obtido do dashboard do Replicate
- [ ] Token testado localmente com curl
- [ ] Token configurado no Supabase
- [ ] Edge Function redeployada
- [ ] Geração de imagem testada no frontend

## 🚨 Possíveis Problemas Adicionais

### Se o erro persistir após seguir os passos:

1. **Verificar limites da conta Replicate**
   - Acesse o dashboard e verifique se há créditos disponíveis
   - Verifique se não há limites de rate limiting

2. **Verificar modelo específico**
   - O modelo `black-forest-labs/flux-1.1-pro` pode ter restrições
   - Teste com um modelo mais simples primeiro

3. **Verificar logs detalhados**
   - Use `npx supabase functions logs generate-course-images` para ver logs detalhados

4. **Verificar variáveis de ambiente**
   - Confirme que o secret está sendo lido corretamente na Edge Function

## 📞 Suporte

Se o problema persistir:
- Verifique a documentação do Replicate: https://replicate.com/docs
- Contate o suporte do Replicate se necessário
- Verifique se há atualizações na API do Replicate

---

**Nota**: Tokens do Replicate não expiram automaticamente, mas podem ser revogados ou invalidados. É uma boa prática renovar tokens periodicamente por segurança.