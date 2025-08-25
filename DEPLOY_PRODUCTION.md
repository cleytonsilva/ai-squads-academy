# Deploy de Produção - AI Squads Academy

## 🚀 Guia Completo de Deploy

### 1. Pré-requisitos

- [x] Node.js 18+ instalado
- [x] Conta no Vercel
- [x] Projeto Supabase configurado
- [x] Variáveis de ambiente configuradas

### 2. Configuração de Variáveis de Ambiente

#### No Vercel Dashboard:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Aplicação
VITE_APP_TITLE=Esquads Academy
VITE_APP_DESCRIPTION=Plataforma de ensino com IA
VITE_PRODUCTION_URL=https://your-domain.vercel.app

# IA Services
OPENAI_API_KEY=sk-proj-your_openai_key_here
REPLICATE_API_TOKEN=r8_your_replicate_token_here
REPLICATE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Pagamentos (Opcional)
VITE_STRIPE_SECRET_KEY=sk_live_your_stripe_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

### 3. Scripts de Deploy

#### Deploy Automático via Vercel CLI:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login no Vercel
vercel login

# Deploy para produção
vercel --prod
```

#### Deploy via GitHub (Recomendado):

1. Conecte o repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no dashboard
3. Cada push na branch `main` fará deploy automático

### 4. Configuração do Supabase

#### Edge Functions:

```bash
# Deploy das Edge Functions
supabase functions deploy --project-ref your-project-id

# Verificar status
supabase functions list --project-ref your-project-id
```

#### Migrações de Banco:

```bash
# Aplicar migrações
supabase db push --project-ref your-project-id

# Verificar status
supabase db diff --project-ref your-project-id
```

### 5. Verificações Pós-Deploy

#### ✅ Checklist de Verificação:

- [ ] Site carrega corretamente
- [ ] Autenticação funcionando
- [ ] Conexão com Supabase ativa
- [ ] Edge Functions respondendo
- [ ] Geração de capas com IA funcionando
- [ ] Upload de arquivos funcionando
- [ ] Webhooks configurados
- [ ] SSL/HTTPS ativo
- [ ] Performance otimizada

#### Comandos de Teste:

```bash
# Testar build local
npm run build
npm run preview

# Verificar tipos
npm run type-check

# Verificar lint
npm run lint
```

### 6. Monitoramento

#### Logs do Vercel:

```bash
# Ver logs em tempo real
vercel logs your-deployment-url

# Ver logs de função específica
vercel logs your-deployment-url --function=api/function-name
```

#### Logs do Supabase:

- Dashboard > Logs > Edge Functions
- Dashboard > Logs > Database
- Dashboard > Logs > Auth

### 7. Domínio Personalizado

#### Configurar no Vercel:

1. Vá para Project Settings > Domains
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções
4. Aguarde propagação (até 48h)

#### Atualizar variáveis:

```bash
# Atualizar URL de produção
VITE_PRODUCTION_URL=https://your-custom-domain.com
VITE_AUTH_REDIRECT_URL=https://your-custom-domain.com/auth/callback
```

### 8. Otimizações de Performance

#### Configurações aplicadas:

- ✅ Code splitting automático
- ✅ Lazy loading de componentes
- ✅ Compressão de assets
- ✅ Cache de recursos estáticos
- ✅ Minificação de JS/CSS
- ✅ Tree shaking

#### Métricas esperadas:

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### 9. Segurança

#### Headers de segurança configurados:

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

#### Variáveis sensíveis:

- ✅ Todas as chaves de API em variáveis de ambiente
- ✅ Service Role Key apenas no servidor
- ✅ Webhooks com verificação de assinatura
- ✅ CORS configurado adequadamente

### 10. Troubleshooting

#### Problemas comuns:

**Build falha:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Variáveis de ambiente não carregam:**
- Verificar se começam com `VITE_` para frontend
- Confirmar configuração no Vercel Dashboard
- Fazer redeploy após mudanças

**Edge Functions não respondem:**
```bash
# Verificar deploy
supabase functions list --project-ref your-project-id

# Redeploy se necessário
supabase functions deploy function-name --project-ref your-project-id
```

### 11. Backup e Rollback

#### Backup automático:
- Vercel mantém histórico de deployments
- Supabase faz backup automático do banco
- Git mantém histórico de código

#### Rollback rápido:
```bash
# Via Vercel CLI
vercel rollback your-deployment-url

# Via Dashboard
# Deployments > Previous deployment > Promote to Production
```

### 12. Contatos de Suporte

- **Vercel:** https://vercel.com/support
- **Supabase:** https://supabase.com/support
- **Documentação:** docs/TROUBLESHOOTING.md
- **Issues:** https://github.com/your-org/ai-squads-academy/issues

---

**✅ Deploy concluído com sucesso!**

Seu projeto AI Squads Academy está agora rodando em produção com todas as otimizações e configurações de segurança aplicadas.