# AI Squads Academy

Plataforma de ensino com IA para criação e gerenciamento de cursos educacionais.

## 📋 Sobre o Projeto

O AI Squads Academy é uma plataforma moderna de ensino que utiliza inteligência artificial para criar e gerenciar cursos educacionais. A plataforma oferece recursos avançados como geração automática de capas de cursos, sistema de autenticação robusto, e uma interface administrativa completa.

## ✨ Funcionalidades Principais

### 🎨 Sistema de Geração de Capas
- **Geração Automática**: Crie capas profissionais usando IA (Flux-1.1-Pro e Recraft-V3)
- **Upload Manual**: Faça upload de suas próprias imagens
- **URL Externa**: Adicione capas através de URLs
- **Histórico**: Mantenha um histórico de todas as capas geradas
- **Controle de Acesso**: Sistema baseado em roles (admins/instrutores)

### 🔐 Autenticação e Segurança
- Autenticação via Supabase Auth
- Sistema de roles (admin, instructor, student)
- Row Level Security (RLS) no banco de dados
- Proteção de rotas e componentes

### 📚 Gestão de Cursos
- Criação e edição de cursos
- Sistema de módulos e lições
- Quizzes e avaliações
- Sistema de badges e conquistas
- Progresso do estudante

### 🎮 Sistema de Gamificação

O AI Squads Academy incorpora um sistema de gamificação robusto e envolvente, projetado para aumentar o engajamento dos estudantes e tornar o aprendizado mais motivador e divertido.

#### 🏆 Componentes Principais

**Badges (Distintivos)**
- **Conquistas Automáticas**: Badges desbloqueados automaticamente ao atingir marcos específicos
- **Categorias Diversas**: Badges de conclusão, performance, tempo de estudo, streaks e conquistas especiais
- **Níveis de Raridade**: Bronze, Prata, Ouro e Platina para diferentes níveis de dificuldade
- **Exibição Visual**: Interface atrativa com ícones personalizados e animações

**Missões e Desafios**
- **Missões Diárias**: Tarefas específicas que renovam a cada dia
- **Desafios Semanais**: Objetivos de longo prazo com recompensas maiores
- **Missões Personalizadas**: Criadas por instrutores para cursos específicos
- **Tipos de Desafio**: Conclusão de módulos, pontuação em quizzes, tempo de estudo, sequências de estudo

**Sistema de Quizzes Interativos**
- **Avaliações Gamificadas**: Quizzes com pontuação, tempo limite e feedback imediato
- **Múltiplas Tentativas**: Sistema que permite retentar com penalidades progressivas
- **Ranking de Performance**: Classificação baseada em pontuação e tempo de resposta
- **Análise de Progresso**: Relatórios detalhados de performance por tópico

**Pontuação e XP (Experiência)**
- **Sistema de Pontos**: Ganhe pontos por completar lições, quizzes e atividades
- **Multiplicadores**: Bônus por sequências de estudo e performance excepcional
- **Níveis de Usuário**: Progressão através de níveis baseados em XP acumulado
- **Recompensas por Nível**: Desbloqueio de recursos e privilégios especiais

#### 🎯 Mecânicas de Progressão

**Sistema de Streaks (Sequências)**
- **Streak Diário**: Mantenha uma sequência de dias consecutivos estudando
- **Streak de Conclusão**: Complete módulos consecutivos sem falhar
- **Multiplicadores de Streak**: Bônus crescentes para sequências longas
- **Recuperação de Streak**: Sistema de "freeze" para manter streaks em situações especiais

**Desbloqueio Progressivo**
- **Conteúdo Sequencial**: Novos módulos desbloqueados conforme progresso
- **Pré-requisitos Dinâmicos**: Sistema flexível de dependências entre conteúdos
- **Caminhos Alternativos**: Múltiplas rotas para atingir objetivos
- **Conteúdo Bônus**: Material extra desbloqueado por alta performance

**Recompensas e Incentivos**
- **Certificados Digitais**: Certificações automáticas por conclusão de cursos
- **Títulos Especiais**: Reconhecimentos únicos por conquistas excepcionais
- **Acesso Antecipado**: Preview de novos conteúdos para top performers
- **Recursos Premium**: Desbloqueio de funcionalidades avançadas

#### 🏅 Sistema de Ranking e Competição

**Leaderboards (Placares)**
- **Ranking Global**: Classificação geral de todos os usuários da plataforma
- **Ranking por Curso**: Competição específica dentro de cada curso
- **Ranking Semanal/Mensal**: Competições temporárias com reset periódico
- **Ranking por Categoria**: Classificações especializadas (velocidade, precisão, consistência)

**Competições e Eventos**
- **Torneios de Quiz**: Eventos especiais com premiações
- **Desafios Comunitários**: Objetivos coletivos que toda a comunidade trabalha junto
- **Maratonas de Estudo**: Eventos de tempo limitado com recompensas especiais
- **Competições entre Turmas**: Rivalidade saudável entre diferentes grupos

#### 📈 Benefícios Educacionais

**Aumento do Engajamento**
- **Motivação Intrínseca**: Sistema que recompensa o progresso genuíno
- **Feedback Imediato**: Reconhecimento instantâneo de conquistas
- **Senso de Progresso**: Visualização clara do avanço no aprendizado
- **Diversão no Aprendizado**: Elementos lúdicos que tornam o estudo prazeroso

**Melhoria na Retenção**
- **Hábitos de Estudo**: Incentivo à consistência através de streaks e missões diárias
- **Revisão Gamificada**: Sistema que torna a revisão de conteúdo mais atrativa
- **Spaced Repetition**: Algoritmos que otimizam a retenção de longo prazo
- **Microlearning**: Quebra de conteúdo em pequenas doses digestíveis

**Desenvolvimento de Competências**
- **Autoavaliação**: Ferramentas para que estudantes monitorem seu próprio progresso
- **Metacognição**: Desenvolvimento da capacidade de "aprender a aprender"
- **Resiliência**: Sistema que encoraja persistência através de tentativas múltiplas
- **Colaboração**: Elementos sociais que promovem aprendizado em grupo

#### ⚙️ Funcionamento Técnico

**Arquitetura do Sistema**
- **Banco de Dados**: Tabelas especializadas para badges, missões, quizzes e progresso
- **Edge Functions**: Processamento serverless para cálculos de pontuação e desbloqueios
- **Real-time Updates**: Atualizações em tempo real usando Supabase Realtime
- **Caching Inteligente**: Otimização de performance para dados de gamificação

**Algoritmos de Pontuação**
- **Pontuação Adaptativa**: Algoritmos que ajustam dificuldade baseado na performance
- **Anti-Gaming**: Proteções contra exploração do sistema de pontos
- **Balanceamento**: Ajustes contínuos para manter competição justa
- **Analytics**: Coleta de dados para otimização contínua do sistema

**Integração com IA**
- **Recomendações Personalizadas**: IA sugere próximos passos baseado no perfil do usuário
- **Geração de Conteúdo**: Criação automática de quizzes e desafios
- **Análise Preditiva**: Identificação precoce de estudantes em risco de evasão
- **Otimização de Experiência**: Ajustes automáticos baseados em padrões de comportamento

**Monitoramento e Analytics**
- **Métricas de Engajamento**: Tracking detalhado de interações com elementos gamificados
- **A/B Testing**: Testes contínuos para otimização de mecânicas
- **Relatórios de Performance**: Dashboards para educadores acompanharem progresso
- **Alertas Inteligentes**: Notificações automáticas para intervenções pedagógicas

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Estado**: Zustand
- **IA**: OpenAI GPT-4, Replicate (Flux, Recraft)
- **Pagamentos**: Stripe
- **Deploy**: Vercel

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ e npm
- Conta no Supabase
- Conta no Replicate (para geração de imagens)
- Conta no Stripe (para pagamentos)

### 1. Clone o Repositório

```bash
git clone https://github.com/cleytonsilva/ai-squads-academy.git
cd ai-squads-academy
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase

# Replicate (para geração de imagens)
REPLICATE_API_TOKEN=seu_token_do_replicate

# OpenAI
OPENAI_API_KEY=sua_chave_da_openai

# Stripe
STRIPE_SECRET_KEY=sua_chave_secreta_do_stripe
VITE_STRIPE_PUBLISHABLE_KEY=sua_chave_publica_do_stripe
```

### 4. Configure o Supabase

#### Instale o Supabase CLI

```bash
npm install -g @supabase/cli
```

#### Inicie o projeto Supabase

```bash
supabase start
supabase db push
```

#### Execute as migrações

```bash
supabase db reset
```

### 5. Valide a Configuração

```bash
node scripts/validate-replicate-config.js
```

### 6. Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📦 Deploy

### Deploy no Vercel

1. **Conecte seu repositório ao Vercel**
2. **Configure as variáveis de ambiente** no painel do Vercel
3. **Deploy automático** será feito a cada push na branch main

### Deploy das Edge Functions

```bash
npm run deploy:functions
```

### Deploy do Banco de Dados

```bash
npm run deploy:db
```

## 🗂️ Estrutura do Projeto

```
ai-squads-academy/
├── docs/                    # Documentação
├── public/                  # Arquivos públicos
├── scripts/                 # Scripts de deploy e manutenção
├── src/
│   ├── components/          # Componentes React
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilitários e configurações
│   ├── pages/              # Páginas da aplicação
│   ├── stores/             # Estados globais (Zustand)
│   └── types/              # Definições de tipos TypeScript
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Migrações do banco
└── ...
```

## 📚 Documentação

- [Sistema de Capas de Curso](docs/COURSE_COVERS_SYSTEM.md)
- [Guia Técnico de Edge Functions](docs/EDGE_FUNCTIONS_TECHNICAL_GUIDE.md)
- [Configuração do Replicate](docs/REPLICATE_API_SETUP.md)
- [Configuração do Corcel](docs/CORCEL_SETUP.md)
- [Guia de Implementação](docs/IMPLEMENTATION.md)

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build
npm run type-check       # Verificação de tipos TypeScript

# Supabase
npm run supabase:start   # Inicia Supabase local
npm run supabase:stop    # Para Supabase local
npm run supabase:reset   # Reset do banco local
npm run supabase:push    # Push das migrações
npm run supabase:pull    # Pull das migrações

# Deploy
npm run deploy:functions # Deploy das Edge Functions
npm run deploy:db        # Deploy do banco de dados
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a [documentação](docs/)
2. Procure por [issues existentes](https://github.com/cleytonsilva/ai-squads-academy/issues)
3. Crie uma nova issue se necessário

## 🔗 Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Replicate Dashboard](https://replicate.com/dashboard)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

**Desenvolvido com ❤️ para a comunidade educacional**
