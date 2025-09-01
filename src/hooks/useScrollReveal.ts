import { useEffect, useRef, useState } from 'react';
import { ScrollRevealConfig, ScrollRevealState, defaultConfigs } from '@/types/scroll-reveal';

/**
 * Hook customizado para animações de scroll reveal
 * Utiliza Intersection Observer API para detectar elementos na viewport
 */
export function useScrollReveal(
  config: Partial<ScrollRevealConfig> = {},
  configPreset?: keyof typeof defaultConfigs
) {
  const elementRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<ScrollRevealState>({
    isVisible: false,
    hasAnimated: false,
  });

  // Mescla configuração padrão com configuração personalizada
  const finalConfig = {
    ...(configPreset ? defaultConfigs[configPreset] : defaultConfigs.default),
    ...config,
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Configuração do Intersection Observer
    const observerOptions = {
      threshold: finalConfig.threshold,
      rootMargin: '0px 0px -50px 0px', // Trigger um pouco antes do elemento aparecer
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setState((prev) => {
            // Se 'once' está ativo e já animou, não anima novamente
            if (finalConfig.once && prev.hasAnimated) {
              return prev;
            }
            return {
              isVisible: true,
              hasAnimated: true,
            };
          });

          // Se 'once' está ativo, para de observar após primeira animação
          if (finalConfig.once) {
            observer.unobserve(element);
          }
        } else if (!finalConfig.once) {
          // Se 'once' está desativo, permite re-animação
          setState((prev) => ({
            ...prev,
            isVisible: false,
          }));
        }
      });
    }, observerOptions);

    observer.observe(element);

    // Cleanup
    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [finalConfig.threshold, finalConfig.once]);

  // Gera as classes CSS para a animação
  const getAnimationClasses = () => {
    const baseClasses = 'transition-all';
    const durationClass = `duration-[${Math.round(finalConfig.duration * 1000)}ms]`;
    const delayClass = finalConfig.delay > 0 ? `delay-[${finalConfig.delay}ms]` : '';
    const easingClass = 'ease-out';

    if (!state.isVisible) {
      // Estado inicial (antes da animação)
      switch (finalConfig.direction) {
        case 'up':
          return `${baseClasses} ${durationClass} ${delayClass} ${easingClass} opacity-0 translate-y-[${finalConfig.distance}px]`;
        case 'down':
          return `${baseClasses} ${durationClass} ${delayClass} ${easingClass} opacity-0 -translate-y-[${finalConfig.distance}px]`;
        case 'left':
          return `${baseClasses} ${durationClass} ${delayClass} ${easingClass} opacity-0 translate-x-[${finalConfig.distance}px]`;
        case 'right':
          return `${baseClasses} ${durationClass} ${delayClass} ${easingClass} opacity-0 -translate-x-[${finalConfig.distance}px]`;
        case 'scale':
          return `${baseClasses} ${durationClass} ${delayClass} ${easingClass} opacity-0 scale-95`;
        default:
          return `${baseClasses} ${durationClass} ${delayClass} ${easingClass} opacity-0 translate-y-[${finalConfig.distance}px]`;
      }
    } else {
      // Estado final (após a animação)
      return `${baseClasses} ${durationClass} ${delayClass} ${easingClass} opacity-100 translate-x-0 translate-y-0 scale-100`;
    }
  };

  // Gera estilos inline para animações mais complexas
  const getAnimationStyles = () => {
    if (finalConfig.easing && finalConfig.easing !== 'ease-out') {
      return {
        transitionTimingFunction: finalConfig.easing,
      };
    }
    return {};
  };

  return {
    ref: elementRef,
    isVisible: state.isVisible,
    hasAnimated: state.hasAnimated,
    animationClasses: getAnimationClasses(),
    animationStyles: getAnimationStyles(),
    config: finalConfig,
  };
}

/**
 * Hook para aplicar stagger em múltiplos elementos
 * Útil para listas de cards ou elementos similares
 */
export function useScrollRevealStagger(
  itemCount: number,
  config: Partial<ScrollRevealConfig> = {},
  configPreset?: keyof typeof defaultConfigs
) {
  const containerRef = useRef<HTMLElement>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  const finalConfig = {
    ...(configPreset ? defaultConfigs[configPreset] : defaultConfigs.staggered),
    ...config,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observerOptions = {
      threshold: finalConfig.threshold,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Anima os itens com stagger
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems((prev) => new Set([...prev, i]));
            }, i * (finalConfig.stagger || 100));
          }

          if (finalConfig.once) {
            observer.unobserve(container);
          }
        } else if (!finalConfig.once) {
          setVisibleItems(new Set());
        }
      });
    }, observerOptions);

    observer.observe(container);

    return () => {
      observer.unobserve(container);
      observer.disconnect();
    };
  }, [itemCount, finalConfig.threshold, finalConfig.once, finalConfig.stagger]);

  const getItemClasses = (index: number) => {
    const baseClasses = 'transition-all';
    const durationClass = `duration-[${Math.round(finalConfig.duration * 1000)}ms]`;
    const easingClass = 'ease-out';
    const isVisible = visibleItems.has(index);

    if (!isVisible) {
      switch (finalConfig.direction) {
        case 'up':
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0 translate-y-[${finalConfig.distance}px]`;
        case 'scale':
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0 scale-95`;
        default:
          return `${baseClasses} ${durationClass} ${easingClass} opacity-0 translate-y-[${finalConfig.distance}px]`;
      }
    } else {
      return `${baseClasses} ${durationClass} ${easingClass} opacity-100 translate-x-0 translate-y-0 scale-100`;
    }
  };

  return {
    containerRef,
    getItemClasses,
    visibleItems,
    config: finalConfig,
  };
}