// Tipos para configurações de scroll reveal
export interface ScrollRevealConfig {
  // Direção da animação
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  // Duração da animação em segundos
  duration?: number;
  // Atraso antes da animação iniciar em milissegundos
  delay?: number;
  // Distância de movimento em pixels
  distance?: number;
  // Threshold para trigger da animação (0-1)
  threshold?: number;
  // Se a animação deve executar apenas uma vez
  once?: boolean;
  // Função de easing personalizada
  easing?: string;
  // Se deve aplicar stagger em elementos filhos
  stagger?: number;
}

// Configurações padrão para diferentes tipos de elementos
export const defaultConfigs = {
  // Configuração padrão para a maioria dos elementos
  default: {
    direction: 'up' as const,
    duration: 0.8,
    delay: 0,
    distance: 30,
    threshold: 0.15,
    once: true,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  // Para elementos do hero
  hero: {
    direction: 'up' as const,
    duration: 1,
    delay: 200,
    distance: 50,
    threshold: 0.1,
    once: true,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  // Para cards e elementos importantes
  card: {
    direction: 'scale' as const,
    duration: 0.6,
    delay: 0,
    distance: 0,
    threshold: 0.2,
    once: true,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  // Para elementos que vêm da esquerda
  fromLeft: {
    direction: 'left' as const,
    duration: 0.8,
    delay: 0,
    distance: 60,
    threshold: 0.15,
    once: true,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  // Para elementos que vêm da direita
  fromRight: {
    direction: 'right' as const,
    duration: 0.8,
    delay: 0,
    distance: 60,
    threshold: 0.15,
    once: true,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  // Para listas com stagger
  staggered: {
    direction: 'up' as const,
    duration: 0.6,
    delay: 0,
    distance: 30,
    threshold: 0.15,
    once: true,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    stagger: 100,
  },
} as const;

// Estado do elemento durante a animação
export interface ScrollRevealState {
  isVisible: boolean;
  hasAnimated: boolean;
}