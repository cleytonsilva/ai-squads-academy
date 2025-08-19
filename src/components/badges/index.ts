// Exportações centralizadas dos componentes de badges

// Componentes administrativos
export { default as AdminBadgeManagement } from '../admin/AdminBadgeManagement';

// Componentes para estudantes
export { default as StudentBadgeView } from '../student/StudentBadgeView';

// Componente principal (roteador baseado em papel)
export { default as BadgeManagement } from '../admin/BadgeManagement';

// Componentes específicos de badges (existentes)
export { default as BadgeAchievements } from './BadgeAchievements';
export { default as BadgeChallenges } from './BadgeChallenges';
export { default as BadgeDisplay } from './BadgeDisplay';
export { default as BadgeRanking } from './BadgeRanking';
export { default as BadgeStats } from './BadgeStats';