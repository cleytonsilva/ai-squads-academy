# Plano de Migração - AI Squads Academy
*Migração das novas funcionalidades e design*

## 📋 Resumo Executivo

Este plano detalha a migração de:
1. **Nova Landing Page** (pasta Mocha) - Design moderno e gamificado
2. **Novo Painel Administrativo** (pasta Esquads) - Interface administrativa aprimorada
3. **Manutenção do Painel do Estudante** - Preservar funcionalidades existentes

## 🎯 Objetivos

- ✅ Migrar nova landing page com design moderno
- ✅ Implementar novo painel administrativo
- ✅ Manter painel do estudante funcional
- ✅ Adaptar ao Supabase e design system atual
- ✅ Preservar funcionalidades existentes

## 📁 Estrutura Atual vs Nova

### Estrutura Atual (src/)
```
src/
├── pages/
│   ├── Index.tsx (Landing Page atual)
│   ├── AdminDashboard.tsx (Painel admin atual)
│   ├── AppDashboard.tsx (Painel estudante)
│   └── ...
├── components/
│   ├── admin/ (Componentes admin atuais)
│   ├── app/ (Componentes estudante)
│   └── ...
```

### Nova Estrutura (mudancas/)
```
Mocha/src/react-app/
├── components/
│   ├── Hero.tsx (Nova hero section)
│   ├── Header.tsx (Novo header)
│   ├── PricingPlans.tsx (Seção de preços)
│   ├── MissionsSection.tsx (Seção de missões)
│   └── ...

Esquads/src/react-app/
├── pages/
│   ├── Dashboard.tsx (Novo painel admin)
│   ├── Users.tsx (Gestão de usuários)
│   ├── Courses.tsx (Gestão de cursos)
│   ├── Badges.tsx (Gestão de badges)
│   └── ...
```

## 🔄 Etapas de Migração

### Fase 1: Preparação e Backup
- [x] Análise da estrutura atual
- [x] Identificação de dependências
- [ ] Backup dos arquivos atuais
- [ ] Criação de branch de migração

### Fase 2: Migração da Landing Page
- [ ] Migrar componentes da pasta Mocha
- [ ] Adaptar ao sistema de roteamento atual
- [ ] Integrar com Supabase Auth
- [ ] Adaptar estilos ao Tailwind CSS
- [ ] Testar responsividade

### Fase 3: Migração do Painel Administrativo
- [ ] Migrar páginas da pasta Esquads
- [ ] Adaptar hooks de autenticação
- [ ] Integrar com Supabase Database
- [ ] Adaptar componentes UI para shadcn/ui
- [ ] Implementar permissões de acesso

### Fase 4: Integração e Testes
- [ ] Testar fluxos de autenticação
- [ ] Validar funcionalidades administrativas
- [ ] Verificar painel do estudante
- [ ] Testes de responsividade
- [ ] Testes de performance

### Fase 5: Ajustes Finais
- [ ] Correções de bugs
- [ ] Otimizações de performance
- [ ] Documentação atualizada
- [ ] Deploy em produção

## 🔧 Adaptações Necessárias

### Landing Page (Mocha → Index.tsx)
1. **Componentes a migrar:**
   - Hero.tsx → Seção hero principal
   - Header.tsx → Navegação superior
   - PricingPlans.tsx → Seção de preços
   - MissionsSection.tsx → Seção de missões
   - CertificationsSection.tsx → Seção de certificações
   - Footer.tsx → Rodapé

2. **Adaptações necessárias:**
   - Integrar com useAuth hook do Supabase
   - Adaptar rotas para React Router
   - Converter estilos para Tailwind CSS
   - Integrar com componentes shadcn/ui

### Painel Administrativo (Esquads → AdminDashboard.tsx)
1. **Páginas a migrar:**
   - Dashboard.tsx → Painel principal
   - Users.tsx → Gestão de usuários
   - Courses.tsx → Gestão de cursos
   - Badges.tsx → Gestão de badges
   - Certificates.tsx → Gestão de certificados
   - Challenges.tsx → Gestão de desafios
   - Rankings.tsx → Sistema de ranking
   - AIGenerator.tsx → Gerador de IA

2. **Adaptações necessárias:**
   - Substituir @getmocha/users-service por useAuth do Supabase
   - Adaptar queries para Supabase client
   - Integrar com sistema de permissões atual
   - Converter componentes para shadcn/ui
   - Adaptar layout para AppLayout existente

## 🛠️ Dependências e Configurações

### Bibliotecas Necessárias
```json
{
  "@supabase/supabase-js": "^2.x",
  "@tanstack/react-query": "^4.x",
  "react-router-dom": "^6.x",
  "lucide-react": "^0.x",
  "tailwindcss": "^3.x",
  "@radix-ui/react-*": "^1.x"
}
```

### Configurações do Supabase
- Verificar tabelas necessárias
- Configurar RLS policies
- Validar permissões de admin
- Testar conexões

## 🔒 Considerações de Segurança

1. **Autenticação:**
   - Manter sistema de auth do Supabase
   - Validar permissões de admin
   - Implementar proteção de rotas

2. **Dados Sensíveis:**
   - Não expor chaves de API
   - Validar inputs do usuário
   - Sanitizar dados antes de salvar

3. **Permissões:**
   - Verificar RLS policies
   - Implementar controle de acesso
   - Validar roles de usuário

## 📊 Métricas de Sucesso

- [ ] Landing page carregando em < 3s
- [ ] Painel admin funcional 100%
- [ ] Painel estudante preservado
- [ ] Zero erros de console
- [ ] Responsividade em todos os dispositivos
- [ ] Autenticação funcionando corretamente

## 🚨 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|----------|
| Quebra de autenticação | Média | Alto | Testes extensivos, backup |
| Perda de dados | Baixa | Alto | Backup completo, versionamento |
| Incompatibilidade de componentes | Alta | Médio | Adaptação gradual, testes |
| Performance degradada | Média | Médio | Otimização, lazy loading |

## 📅 Cronograma Estimado

- **Fase 1:** 1 dia (Preparação)
- **Fase 2:** 2-3 dias (Landing Page)
- **Fase 3:** 3-4 dias (Painel Admin)
- **Fase 4:** 2 dias (Integração e Testes)
- **Fase 5:** 1 dia (Ajustes Finais)

**Total Estimado:** 9-11 dias

## 🔄 Próximos Passos

1. ✅ Aprovação do plano de migração
2. 🔄 Criação de backup e branch
3. ⏳ Início da migração da landing page
4. ⏳ Migração do painel administrativo
5. ⏳ Testes e validação
6. ⏳ Deploy em produção

---

*Documento criado em: 13/08/2025*
*Versão: 1.0*
*Status: Aguardando aprovação*