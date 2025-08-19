# Comandos Git para Upload do Projeto AI Squads Academy

## Pré-requisitos
1. Ter uma conta no GitHub
2. Ter o Git instalado localmente
3. Ter criado um repositório no GitHub (vazio, sem README)

## Comandos para Configuração Inicial

### 1. Configurar informações do usuário (se ainda não configurado)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

### 2. Adicionar todos os arquivos ao staging
```bash
git add .
```

### 3. Fazer o commit inicial
```bash
git commit -m "feat: initial commit - AI Squads Academy project setup

- Complete project structure with React + TypeScript + Vite
- Supabase integration for backend services
- Course management system with AI-powered cover generation
- User authentication and role-based access control
- Comprehensive documentation and setup guides"
```

### 4. Adicionar o repositório remoto
```bash
# Substitua 'seu-usuario' e 'ai-squads-academy' pelos valores corretos
git remote add origin https://github.com/seu-usuario/ai-squads-academy.git
```

### 5. Fazer o push inicial
```bash
git branch -M main
git push -u origin main
```

## Comandos para Atualizações Futuras

### Adicionar mudanças específicas
```bash
git add arquivo-especifico.js
# ou para adicionar todos os arquivos modificados
git add .
```

### Fazer commit com mensagem descritiva
```bash
git commit -m "tipo: descrição breve

- Detalhes da mudança 1
- Detalhes da mudança 2"
```

### Enviar para o GitHub
```bash
git push origin main
```

## Tipos de Commit Recomendados
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Mudanças de formatação
- `refactor:` Refatoração de código
- `test:` Adição ou modificação de testes
- `chore:` Tarefas de manutenção

## Verificações Importantes

### Antes do primeiro push:
1. Verificar se o arquivo `.env` não está sendo commitado
2. Confirmar que apenas o `.env.example` está incluído
3. Verificar se `node_modules` está no `.gitignore`
4. Confirmar que arquivos sensíveis estão excluídos

### Comando para verificar status
```bash
git status
```

### Comando para ver diferenças
```bash
git diff
```

### Comando para ver histórico
```bash
git log --oneline
```

## Estrutura de Branches (Opcional)

Para projetos maiores, considere usar branches:

```bash
# Criar branch para nova funcionalidade
git checkout -b feature/nova-funcionalidade

# Trabalhar na branch e fazer commits
git add .
git commit -m "feat: implementar nova funcionalidade"

# Voltar para main e fazer merge
git checkout main
git merge feature/nova-funcionalidade

# Deletar branch após merge
git branch -d feature/nova-funcionalidade
```

## Troubleshooting

### Se o repositório remoto já tem conteúdo:
```bash
git pull origin main --allow-unrelated-histories
```

### Para forçar push (use com cuidado):
```bash
git push -f origin main
```

### Para desfazer último commit (mantendo mudanças):
```bash
git reset --soft HEAD~1
```

---

**Nota:** Sempre revise os arquivos que serão commitados antes de fazer o push para evitar enviar informações sensíveis.