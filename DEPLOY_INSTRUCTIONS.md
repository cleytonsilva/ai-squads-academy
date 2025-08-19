# 🚀 Instruções de Deploy - Sistema de Geração de Capas

## Visão Geral

Este documento fornece instruções passo-a-passo para fazer o deploy completo do Sistema de Geração Automática de Capas de Cursos.

## ⚡ Deploy Rápido (Recomendado)

```bash
# 1. Clone e configure o projeto
git clone <repository-url>
cd ai-squads-academy

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves reais

# 3. Execute o deploy automático
node scripts/run-all-tests.js --deploy

# 4. Teste o sistema
npm run dev
```

## 📋 Deploy Manual Detalhado

### Passo 1: Pré-requisitos

#### 1.1 Ferramentas Necessárias

```bash
# Verificar Node.js (versão 18+)
node --version

# Instalar Supabase CLI
npm install -g supabase

# Verificar instalação
supabase --version
```

#### 1.2 Contas e Serviços

- ✅ Conta no [Supabase](https://supabase.com)
- ✅ Conta no [Replicate](https://replicate.com)
- ✅ Método de pagamento configurado no Replicate
- ✅ Projeto Supabase criado

### Passo 2: Configuração do Supabase

#### 2.1 Criar Projeto

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Configure:
   - **Name**: AI Squads Academy
   - **Database Password**: Senha segura
   - **Region**: Mais próxima dos usuários
4. Aguarde criação (2-3 minutos)

#### 2.2 Obter Credenciais

1. Vá para **Settings > API**
2. Copie:
   - **Project URL**
   - **anon public key**
   - **service_role secret key**

#### 2.3 Linkar Projeto Local

```bash
# Fazer login no Supabase
supabase login

# Linkar projeto
supabase link --project-ref YOUR_PROJECT_REF

# Verificar link
supabase status
```

### Passo 3: Configuração do Replicate

#### 3.1 Obter API Token

1. Acesse [Replicate Account](https://replicate.com/account)
2. Vá para **API tokens**
3. Clique em **Create token**
4. Nome: "AI Squads Academy"
5. Copie o token (formato: `r8_...`)

#### 3.2 Configurar Billing

1. Vá para [Billing](https://replicate.com/account/billing)
2. Adicione método de pagamento
3. Configure limite de gasto (recomendado: $50-100/mês)

#### 3.3 Configurar Webhook

1. Vá para [Webhooks](https://replicate.com/account/webhooks)
2. Clique em **Create webhook**
3. Configure:
   - **URL**: `https://YOUR-PROJECT.supabase.co/functions/v1/replicate-webhook`
   - **Events**: ✅ predictions
   - **Secret**: Gere um secret seguro
4. Salve o webhook secret

### Passo 4: Configuração de Ambiente

#### 4.1 Criar Arquivo .env

```bash
# Copiar template
cp .env.example .env
```

#### 4.2 Configurar Variáveis

Edite o arquivo `.env` com suas credenciais:

```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Replicate
REPLICATE_API_TOKEN=r8_your_token
REPLICATE_WEBHOOK_SECRET=whsec_your_secret

# Outros (opcional)
OPENAI_API_KEY=sk-proj-your_openai_key
```

#### 4.3 Validar Configuração

```bash
# Executar validação
node scripts/validate-replicate-config.js

# Deve mostrar:
# ✅ Todas as variáveis de ambiente estão configuradas
# ✅ Autenticação com Replicate OK
# ✅ Modelo Flux-1.1-Pro disponível
# ✅ Modelo Recraft-V3 disponível
```

### Passo 5: Deploy do Sistema

#### 5.1 Aplicar Migrações

```bash
# Aplicar todas as migrações
supabase db push

# Verificar se tabelas foram criadas
supabase db diff
```

#### 5.2 Deploy das Edge Functions

```bash
# Deploy da função de geração
supabase functions deploy generate-course-cover

# Deploy do webhook
supabase functions deploy replicate-webhook

# Verificar deploy
supabase functions list
```

#### 5.3 Configurar Storage

```bash
# O bucket é criado automaticamente pelas migrações
# Verificar se existe
supabase storage ls

# Deve mostrar: course-images
```

#### 5.4 Deploy Automático (Alternativa)

```bash
# Executar script de deploy completo
node scripts/deploy-course-covers.js

# Deve executar todos os passos automaticamente
```

### Passo 6: Testes e Validação

#### 6.1 Testes Básicos

```bash
# Executar testes funcionais
node scripts/test-course-cover-generation.js

# Deve mostrar:
# ✅ Geração com Flux iniciada com sucesso
# ✅ Geração com Recraft iniciada com sucesso
# ✅ Bucket course-images configurado corretamente
```

#### 6.2 Testes Completos

```bash
# Executar bateria completa de testes
node scripts/run-all-tests.js

# Aguardar conclusão (5-10 minutos)
# Verificar relatório em full-test-report.json
```

#### 6.3 Teste Manual

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:8080`

3. Faça login como administrador

4. Vá para **Admin Dashboard**

5. Clique em "Gerar capa com IA" em um curso

6. Aguarde 1-3 minutos

7. Verifique se a capa foi gerada

### Passo 7: Configuração de Produção

#### 7.1 Variáveis de Produção

Atualize o `.env` para produção:

```bash
# Desenvolvimento
VITE_DEV_MODE=false
VITE_API_BASE_URL=https://your-domain.com
VITE_AUTH_REDIRECT_URL=https://your-domain.com/auth/callback
VITE_PRODUCTION_URL=https://your-domain.com
```

#### 7.2 Deploy para Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod

# Configurar variáveis de ambiente no dashboard
```

#### 7.3 Configurar Domínio

1. No Vercel Dashboard, vá para **Settings > Domains**
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções
4. Aguarde propagação (até 24h)

### Passo 8: Monitoramento

#### 8.1 Configurar Alertas

1. **Supabase Dashboard**:
   - Vá para **Logs > Edge Functions**
   - Configure alertas para erros

2. **Replicate Dashboard**:
   - Monitore uso de créditos
   - Configure alertas de limite

#### 8.2 Métricas Importantes

```sql
-- Query para monitorar sistema
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE status = 'succeeded') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration
FROM replicate_predictions 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
```

#### 8.3 Logs Úteis

```bash
# Logs das Edge Functions
supabase functions logs generate-course-cover
supabase functions logs replicate-webhook

# Logs em tempo real
supabase functions logs --follow
```

## 🔧 Troubleshooting

### Problemas Comuns

#### "Edge Function não responde"

```bash
# Verificar status
supabase functions list

# Redeploy
supabase functions deploy generate-course-cover --no-verify-jwt
```

#### "Webhook não funciona"

1. Verificar URL no Replicate Dashboard
2. Testar conectividade:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/replicate-webhook \
        -H "Content-Type: application/json" \
        -d '{"test": true}'
   ```

#### "Permissão negada"

```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'course_covers';

-- Recriar se necessário
DROP POLICY IF EXISTS "Admins can manage course covers" ON course_covers;
CREATE POLICY "Admins can manage course covers" ON course_covers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  )
);
```

### Scripts de Diagnóstico

```bash
# Diagnóstico completo
node scripts/validate-replicate-config.js

# Teste específico
node scripts/test-course-cover-generation.js COURSE_ID

# Verificação de saúde
node scripts/run-all-tests.js --verbose
```

## 📚 Recursos Adicionais

### Documentação

- [📖 Guia Completo](docs/COURSE_COVERS_SYSTEM.md)
- [⚙️ Configuração Replicate](docs/REPLICATE_API_SETUP.md)
- [🔧 Troubleshooting](docs/TROUBLESHOOTING.md)

### Scripts Úteis

- `scripts/deploy-course-covers.js` - Deploy automático
- `scripts/validate-replicate-config.js` - Validação
- `scripts/test-course-cover-generation.js` - Testes funcionais
- `scripts/run-all-tests.js` - Bateria completa

### Suporte

- **GitHub Issues**: [Reportar problemas](https://github.com/your-org/ai-squads-academy/issues)
- **Email**: suporte@esquads.com
- **Documentação**: [docs.esquads.com](https://docs.esquads.com)

## ✅ Checklist Final

Antes de considerar o deploy concluído:

- [ ] ✅ Todas as variáveis de ambiente configuradas
- [ ] ✅ Supabase linkado e migrações aplicadas
- [ ] ✅ Edge Functions deployadas e funcionando
- [ ] ✅ Webhook do Replicate configurado
- [ ] ✅ Storage bucket criado e políticas configuradas
- [ ] ✅ Testes funcionais passando
- [ ] ✅ Geração de capas funcionando no admin panel
- [ ] ✅ Monitoramento configurado
- [ ] ✅ Alertas de erro configurados
- [ ] ✅ Backup e recovery planejados
- [ ] ✅ Equipe treinada no uso do sistema

---

**🎉 Parabéns! Seu Sistema de Geração de Capas está pronto para uso!**

**Próximos passos:**
1. 🎯 Teste com cursos reais
2. 📊 Monitore métricas de uso
3. 🔔 Configure alertas proativos
4. 📚 Treine a equipe
5. 🚀 Aproveite as capas automáticas!

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0  
**Compatibilidade:** Supabase v2.39+, Replicate API v1