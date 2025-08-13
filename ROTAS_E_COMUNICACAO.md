# Documentação de Rotas e Comunicação

## Visão Geral
Este documento mapeia como as pastas e arquivos se comunicam na aplicação AI Squads Academy, incluindo fluxo de dados, rotas de navegação e dependências entre componentes.

## 1. Estrutura de Rotas Principais

### 1.1 Rotas Públicas
```
/ (Home)
├── /login
├── /register
├── /forgot-password
└── /reset-password
```

### 1.2 Rotas Protegidas (Estudante)
```
/dashboard
├── /courses
│   ├── /courses/[id]
│   └── /courses/[id]/lessons/[lessonId]
├── /challenges
│   └── /challenges/[id]
├── /achievements
├── /badges
├── /profile
└── /settings
```

### 1.3 Rotas Administrativas
```
/admin
├── /admin/dashboard
├── /admin/users
├── /admin/courses
│   ├── /admin/courses/create
│   └── /admin/courses/[id]/edit
├── /admin/challenges
│   ├── /admin/challenges/create
│   └── /admin/challenges/[id]/edit
├── /admin/badges
├── /admin/analytics
└── /admin/settings
```

## 2. Fluxo de Comunicação entre Componentes

### 2.1 Arquitetura de Dados
```
Supabase (Backend)
    ↓
Hooks (src/hooks/)
    ↓
Store (src/store/) - Zustand
    ↓
Pages (src/pages/)
    ↓
Components (src/components/)
    ↓
UI Components (src/components/ui/)
```

### 2.2 Fluxo de Autenticação
```
Auth Components (src/components/auth/)
    ↓
Supabase Auth (src/integrations/supabase/)
    ↓
Auth Store (src/store/authStore.ts)
    ↓
Protected Routes
    ↓
User Dashboard/Admin Panel
```

## 3. Comunicação entre Pastas

### 3.1 src/pages/ → src/components/
```typescript
// Exemplo: Dashboard page usa componentes específicos
src/pages/Dashboard.tsx
├── imports src/components/app/Sidebar.tsx
├── imports src/components/app/Header.tsx
├── imports src/components/student/CourseGrid.tsx
└── imports src/components/achievements/AchievementsList.tsx
```

### 3.2 src/components/ → src/hooks/
```typescript
// Componentes consomem dados via hooks customizados
src/components/student/CourseGrid.tsx
├── uses src/hooks/useCourses.ts
├── uses src/hooks/useAuth.ts
└── uses src/hooks/useProgress.ts

src/components/badges/BadgesList.tsx
├── uses src/hooks/useBadges.ts
└── uses src/hooks/useUserBadges.ts
```

### 3.3 src/hooks/ → src/integrations/
```typescript
// Hooks fazem chamadas para Supabase
src/hooks/useCourses.ts
├── imports src/integrations/supabase/client.ts
└── uses tabelas: courses, user_courses, lessons

src/hooks/useAuth.ts
├── imports src/integrations/supabase/auth.ts
└── gerencia: login, logout, register, session
```

### 3.4 src/store/ → src/hooks/
```typescript
// Store global gerenciado pelo Zustand
src/store/authStore.ts
├── consumido por src/hooks/useAuth.ts
├── atualizado por src/components/auth/
└── usado em src/pages/ para proteção de rotas

src/store/courseStore.ts
├── consumido por src/hooks/useCourses.ts
├── atualizado por src/components/student/
└── usado em src/pages/courses/
```

## 4. Fluxos de Dados Específicos

### 4.1 Fluxo de Login
```
1. src/components/auth/LoginForm.tsx
   ↓ (submete credenciais)
2. src/hooks/useAuth.ts
   ↓ (chama Supabase)
3. src/integrations/supabase/auth.ts
   ↓ (autentica)
4. src/store/authStore.ts
   ↓ (atualiza estado)
5. src/pages/Dashboard.tsx
   (redireciona para dashboard)
```

### 4.2 Fluxo de Curso
```
1. src/pages/courses/[id].tsx
   ↓ (carrega curso)
2. src/hooks/useCourses.ts
   ↓ (busca dados)
3. src/integrations/supabase/client.ts
   ↓ (query database)
4. src/components/student/CourseContent.tsx
   ↓ (renderiza conteúdo)
5. src/components/student/LessonPlayer.tsx
   (exibe lição)
```

### 4.3 Fluxo de Badges
```
1. src/components/badges/BadgesList.tsx
   ↓ (solicita badges)
2. src/hooks/useBadges.ts
   ↓ (busca badges do usuário)
3. src/integrations/supabase/client.ts
   ↓ (query user_badges + badges)
4. src/components/badges/BadgeCard.tsx
   (renderiza badge individual)
```

## 5. Dependências entre Arquivos

### 5.1 Arquivos Centrais
```
src/main.tsx (ponto de entrada)
├── src/App.tsx
├── src/integrations/supabase/client.ts
└── src/store/ (stores globais)

src/App.tsx
├── src/components/app/Layout.tsx
├── src/pages/ (todas as páginas)
└── src/lib/router.tsx
```

### 5.2 Utilitários Compartilhados
```
src/lib/
├── utils.ts (funções utilitárias)
├── constants.ts (constantes globais)
├── validations.ts (schemas Zod)
└── types.ts (tipos TypeScript)

// Usado por:
├── src/components/ (todos os componentes)
├── src/hooks/ (todos os hooks)
├── src/pages/ (todas as páginas)
└── src/store/ (todos os stores)
```

### 5.3 Componentes UI Base
```
src/components/ui/
├── button.tsx
├── input.tsx
├── card.tsx
├── dialog.tsx
└── ... (outros componentes shadcn/ui)

// Usado por:
├── src/components/auth/
├── src/components/student/
├── src/components/admin/
├── src/components/badges/
└── src/pages/
```

## 6. Comunicação com APIs Externas

### 6.1 Supabase
```
src/integrations/supabase/
├── client.ts (cliente principal)
├── auth.ts (autenticação)
├── storage.ts (upload de arquivos)
└── types.ts (tipos do banco)

// Tabelas principais:
├── users (perfis de usuário)
├── courses (cursos disponíveis)
├── lessons (lições dos cursos)
├── user_courses (progresso do usuário)
├── badges (badges disponíveis)
├── user_badges (badges conquistados)
├── challenges (desafios)
└── user_challenges (progresso em desafios)
```

### 6.2 APIs de IA (futuro)
```
src/integrations/openai/
├── client.ts
├── content-generation.ts
└── chat.ts

// Usado por:
├── src/components/admin/ContentGenerator.tsx
├── src/hooks/useAIGeneration.ts
└── src/pages/admin/courses/create.tsx
```

## 7. Padrões de Comunicação

### 7.1 Props Drilling (Evitado)
```typescript
// ❌ Evitar passar props por muitos níveis
Parent → Child → GrandChild → GreatGrandChild

// ✅ Usar hooks e store global
Component → useHook → Store/API
```

### 7.2 Event Handling
```typescript
// Eventos de UI
Component → onEvent → Hook → API/Store

// Exemplo:
LoginForm → onSubmit → useAuth → Supabase Auth
```

### 7.3 Data Fetching
```typescript
// Padrão de carregamento de dados
Page/Component → useEffect → Hook → API → State Update

// Com loading e error states
const { data, loading, error } = useCustomHook();
```

## 8. Rotas de Navegação Programática

### 8.1 Navegação entre Páginas
```typescript
// Usando React Router
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navegação após ações
navigate('/dashboard'); // após login
navigate('/courses/' + courseId); // ao selecionar curso
navigate('/admin/users'); // área administrativa
```

### 8.2 Proteção de Rotas
```typescript
// ProtectedRoute component
src/components/auth/ProtectedRoute.tsx
├── verifica src/store/authStore.ts
├── redireciona para /login se não autenticado
└── renderiza children se autenticado

// AdminRoute component
src/components/auth/AdminRoute.tsx
├── verifica role de admin
├── redireciona para /dashboard se não admin
└── renderiza admin panel se autorizado
```

## 9. Comunicação em Tempo Real (Futuro)

### 9.1 Supabase Realtime
```typescript
// Para notificações e atualizações em tempo real
src/hooks/useRealtime.ts
├── conecta com Supabase Realtime
├── escuta mudanças em tabelas específicas
└── atualiza estado local automaticamente

// Usado em:
├── Notificações de novos badges
├── Progresso de outros estudantes
└── Atualizações de conteúdo
```

## 10. Resumo de Comunicação

```
Usuário
  ↓ (interage)
UI Components
  ↓ (eventos)
Pages/Components
  ↓ (chama)
Hooks
  ↓ (acessa)
Store (Zustand) ←→ Supabase API
  ↓ (atualiza)
UI Components
  ↓ (renderiza)
Usuário (vê resultado)
```

Esta estrutura garante um fluxo de dados unidirecional, facilita manutenção e permite escalabilidade da aplicação.