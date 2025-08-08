# Documentação — Esquads (parcial)

Esta documentação resume as implementações realizadas.

## Geração de Cursos por IA
- Edge Function `ai-generate-course` agora envia progresso em tempo real para a tabela `generation_jobs.output`:
  - `events`: lista de logs (mensagem + timestamp)
  - `progress_modules`: títulos de módulos conforme são criados
- Nova página: `/admin/generation/:jobId` (src/pages/GenerationJob.tsx)
  - Lista módulos criados e logs ao vivo (auto refresh ~1.5s)
  - Botão para abrir o curso quando finalizado
- Admin Dashboard abre o acompanhamento automaticamente após iniciar a geração.

## Imagens de Curso (Corcel)
- Função `generate-course-images` configurada para usar Corcel sem fallback de imagem; engine selecionável.

## Logo
- TopBar atualizada para usar o logo oficial (arquivo enviado) com alt adequado.

## Monitoramento Admin
- Nova página `/admin/monitoring` com:
  - Últimos usuários criados (profiles)
  - Ranking dos alunos por XP (profiles.xp)

## Perfis de Usuário
- Perfil é criado automaticamente via trigger `handle_new_user` em `auth.users` (já existente no projeto).

## Stripe — Próximos Passos
- Definir tipo de cobrança (assinatura ou pagamento único)
- Inserir STRIPE_SECRET_KEY nos secrets e criar funções:
  - `create-checkout` e `customer-portal`
  - (opcional) `check-subscription` + tabela `subscribers`

## SEO
- Novas páginas usam `<Helmet>` com título, descrição e canonical.

