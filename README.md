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
