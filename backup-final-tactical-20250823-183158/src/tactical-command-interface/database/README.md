# Esquads - Documentação do Banco de Dados

Este documento descreve a estrutura do banco de dados para a plataforma educacional Esquads.

## Visão Geral

O sistema utiliza um banco de dados relacional com as seguintes entidades principais:
- Usuários (estudantes)
- Cursos e conteúdos educacionais
- Missões e gamificação
- Conquistas e badges
- Simulados e avaliações
- Sistema de progresso e estatísticas

## Estrutura das Tabelas

### 1. Gerenciamento de Usuários
- `users` - Dados básicos dos usuários
- `user_profiles` - Informações detalhadas do perfil
- `user_preferences` - Configurações e preferências

### 2. Sistema Educacional
- `courses` - Catálogo de cursos
- `course_modules` - Módulos dentro dos cursos
- `lessons` - Aulas individuais
- `course_enrollments` - Matrículas dos usuários
- `lesson_progress` - Progresso nas aulas

### 3. Gamificação
- `missions` - Missões disponíveis
- `user_missions` - Missões dos usuários
- `achievements` - Conquistas disponíveis
- `user_achievements` - Conquistas desbloqueadas
- `user_xp_log` - Histórico de XP

### 4. Avaliações
- `simulados` - Simulados disponíveis
- `simulado_attempts` - Tentativas dos usuários
- `questions` - Banco de questões
- `user_answers` - Respostas dos usuários

### 5. Sistema de Progresso
- `user_stats` - Estatísticas gerais
- `study_sessions` - Sessões de estudo
- `daily_progress` - Progresso diário

## Relacionamentos

O banco de dados utiliza chaves estrangeiras para manter a integridade referencial entre as tabelas, permitindo consultas eficientes e relatórios detalhados sobre o progresso dos estudantes.

## Índices e Performance

Índices são criados nas colunas mais consultadas para otimizar a performance das consultas, especialmente em:
- IDs de usuários
- Datas de criação e atualização
- Status de progresso
- Pontuações e rankings
