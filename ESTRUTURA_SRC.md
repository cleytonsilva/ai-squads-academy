# Documentação da Estrutura da Pasta `src`

## Visão Geral
Este documento descreve a organização e função de cada pasta e arquivo dentro do diretório `src` da aplicação AI Squads Academy.

## 📁 Estrutura de Pastas e Arquivos

### 📄 Arquivos Raiz (`/src`)

- **`App.tsx`** - Componente principal da aplicação React, define as rotas e layout geral
- **`App.css`** - Estilos específicos do componente App
- **`main.tsx`** - Ponto de entrada da aplicação React, renderiza o App no DOM
- **`index.css`** - Estilos globais da aplicação e configurações do Tailwind CSS
- **`vite-env.d.ts`** - Definições de tipos TypeScript para o Vite

### 📁 `assets/`
Recursos estáticos da aplicação:
- **`hero-esquads.jpg`** - Imagem principal/hero da landing page

### 📁 `components/`
Componentes React reutilizáveis organizados por funcionalidade:

#### 📄 Componentes Principais
- **`AppLayout.tsx`** - Layout principal da aplicação com navegação
- **`SignatureAurora.tsx`** - Componente de assinatura visual com efeito aurora
- **`TopNav.tsx`** - Barra de navegação superior

#### 📁 `achievements/`
Componentes relacionados a conquistas e certificações:
- **`AchievementDisplay.tsx`** - Exibição de conquistas do usuário

#### 📁 `admin/`
Componentes administrativos para gestão da plataforma:
- **`AdminBadgeManagement.tsx`** - Gerenciamento de badges (versão admin)
- **`AIGenerationDialog.tsx`** - Dialog para geração de conteúdo com IA
- **`AIModuleExtendDialog.tsx`** - Dialog para extensão de módulos com IA
- **`BadgeEditor.tsx`** - Editor de badges
- **`BadgeManagement.tsx`** - Gerenciamento geral de badges
- **`CertificateEditor.tsx`** - Editor de certificados
- **`ChallengeManagement.tsx`** - Gerenciamento de desafios
- **`ImageGenerationDialog.tsx`** - Dialog para geração de imagens
- **`ImageGenerationWrapper.tsx`** - Wrapper para funcionalidades de geração de imagem
- **`MissionManager.tsx`** - Gerenciador de missões
- **`QuizManager.tsx`** - Gerenciador de quizzes
- **`TemplateManagement.tsx`** - Gerenciamento de templates
- **`TrackMissionManager.tsx`** - Gerenciador de missões por trilha
- **`TrackQuizManager.tsx`** - Gerenciador de quizzes por trilha

#### 📁 `app/`
Componentes principais da aplicação para usuários:
- **`Achievements.tsx`** - Página de conquistas
- **`CertificateCard.tsx`** - Card de exibição de certificados
- **`ProgressOverview.tsx`** - Visão geral do progresso do usuário
- **`QuizRunner.tsx`** - Executor de quizzes
- **`TrackBuilder.tsx`** - Construtor de trilhas de aprendizado

#### 📁 `auth/`
Componentes de autenticação:
- **`RequireAuth.tsx`** - HOC para proteção de rotas autenticadas

#### 📁 `badges/`
Sistema completo de badges e gamificação:
- **`BadgeAchievements.tsx`** - Conquistas relacionadas a badges
- **`BadgeChallenges.tsx`** - Desafios de badges
- **`BadgeDisplay.tsx`** - Exibição de badges
- **`BadgeNavigation.tsx`** - Navegação do sistema de badges
- **`BadgeNotification.tsx`** - Notificações de badges
- **`BadgeRanking.tsx`** - Ranking de badges
- **`BadgeStats.tsx`** - Estatísticas de badges
- **`index.ts`** - Arquivo de exportação dos componentes de badges

#### 📁 `challenges/`
Sistema de desafios e competições:
- **`ChallengeActivityFeed.tsx`** - Feed de atividades dos desafios
- **`ChallengeDetails.tsx`** - Detalhes de um desafio específico
- **`ChallengeLeaderboard.tsx`** - Ranking dos desafios
- **`ChallengeProgress.tsx`** - Progresso nos desafios

#### 📁 `student/`
Componentes específicos para estudantes:
- **`StudentBadgeView.tsx`** - Visualização de badges para estudantes

#### 📁 `ui/`
Componentes de interface baseados no shadcn/ui:
- **Componentes de formulário:** `button.tsx`, `input.tsx`, `textarea.tsx`, `form.tsx`, `label.tsx`
- **Componentes de navegação:** `navigation-menu.tsx`, `menubar.tsx`, `pagination.tsx`
- **Componentes de layout:** `card.tsx`, `dialog.tsx`, `sheet.tsx`, `sidebar.tsx`, `separator.tsx`
- **Componentes de feedback:** `alert.tsx`, `toast.tsx`, `toaster.tsx`, `sonner.tsx`, `progress.tsx`
- **Componentes de dados:** `table.tsx`, `tabs.tsx`, `accordion.tsx`, `collapsible.tsx`
- **Componentes de entrada:** `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `slider.tsx`
- **Componentes visuais:** `avatar.tsx`, `badge.tsx`, `skeleton.tsx`, `scroll-area.tsx`
- **Componentes interativos:** `dropdown-menu.tsx`, `popover.tsx`, `tooltip.tsx`, `hover-card.tsx`
- **Utilitários:** `use-toast.ts` - Hook para sistema de notificações

### 📁 `hooks/`
Hooks customizados do React para lógica reutilizável:
- **`use-mobile.tsx`** - Hook para detecção de dispositivos móveis
- **`use-toast.ts`** - Hook para sistema de notificações
- **`useAuth.ts`** - Hook para gerenciamento de autenticação
- **`useBadges.ts`** - Hook para gerenciamento de badges
- **`useCertificates.ts`** - Hook para gerenciamento de certificados
- **`useChallenges.ts`** - Hook para gerenciamento de desafios
- **`useCurrentProfile.ts`** - Hook para perfil do usuário atual

### 📁 `integrations/`
Integrações com serviços externos:

#### 📁 `supabase/`
- **`client.ts`** - Cliente configurado do Supabase
- **`types.ts`** - Tipos TypeScript gerados pelo Supabase

### 📁 `lib/`
Bibliotecas e utilitários centrais:
- **`supabase.ts`** - Configuração e inicialização do Supabase
- **`utils.ts`** - Funções utilitárias gerais (cn, formatters, etc.)

### 📁 `pages/`
Páginas principais da aplicação:

#### 📄 Páginas Principais
- **`Index.tsx`** - Página inicial/landing page
- **`Auth.tsx`** - Página de autenticação (login/registro)
- **`AppDashboard.tsx`** - Dashboard principal da aplicação
- **`Courses.tsx`** - Listagem de cursos
- **`CourseView.tsx`** - Visualização detalhada de um curso
- **`NotFound.tsx`** - Página 404

#### 📄 Páginas Administrativas
- **`AdminDashboard.tsx`** - Dashboard administrativo
- **`AdminCourseEditor.tsx`** - Editor de cursos para administradores
- **`AdminMonitoring.tsx`** - Monitoramento do sistema
- **`AdminTracks.tsx`** - Gerenciamento de trilhas
- **`GenerationJob.tsx`** - Página para jobs de geração de conteúdo

#### 📁 Páginas por Funcionalidade
- **`achievements/index.tsx`** - Página de conquistas
- **`admin/`** - Páginas administrativas específicas:
  - **`index.tsx`** - Dashboard admin
  - **`AchievementManagement.tsx`** - Gerenciamento de conquistas
  - **`BadgeManagement.tsx`** - Gerenciamento de badges
  - **`ChallengeManagement.tsx`** - Gerenciamento de desafios
- **`badges/index.tsx`** - Página de badges
- **`challenges/index.tsx`** - Página de desafios
- **`ranking/index.tsx`** - Página de ranking

### 📁 `store/`
Gerenciamento de estado global:
- **`useAppStore.ts`** - Store principal da aplicação usando Zustand

### 📁 `utils/`
Utilitários específicos:
- **`imageProxy.ts`** - Utilitários para proxy e manipulação de imagens

## 🏗️ Arquitetura e Padrões

### Organização por Funcionalidade
A estrutura segue o padrão de organização por funcionalidade, onde:
- Cada pasta representa uma área específica da aplicação
- Componentes relacionados ficam agrupados
- Hooks e utilitários são centralizados

### Padrões de Nomenclatura
- **Componentes:** PascalCase (ex: `BadgeDisplay.tsx`)
- **Hooks:** camelCase com prefixo "use" (ex: `useAuth.ts`)
- **Utilitários:** camelCase (ex: `imageProxy.ts`)
- **Páginas:** PascalCase (ex: `AdminDashboard.tsx`)

### Tecnologias Utilizadas
- **React 18+** com TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes de interface
- **Supabase** para backend
- **Zustand** para gerenciamento de estado

## 🔄 Fluxo de Dados

1. **Autenticação:** `useAuth.ts` → `RequireAuth.tsx` → Páginas protegidas
2. **Estado Global:** `useAppStore.ts` → Componentes que precisam de estado compartilhado
3. **Dados do Backend:** Hooks específicos (`useBadges.ts`, `useChallenges.ts`) → Componentes
4. **UI Components:** `components/ui/` → Componentes de funcionalidade → Páginas

## 📝 Convenções de Desenvolvimento

- Todos os componentes são funcionais com hooks
- TypeScript estrito para tipagem
- Componentes pequenos e focados em uma responsabilidade
- Hooks customizados para lógica reutilizável
- Separação clara entre lógica de negócio e apresentação

---

*Este documento deve ser atualizado sempre que houver mudanças significativas na estrutura do projeto.*