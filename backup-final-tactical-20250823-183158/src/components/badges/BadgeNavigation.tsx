import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge, Trophy, Award, Target, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Interface para itens de navegação
interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// Interface para props do componente
interface BadgeNavigationProps {
  className?: string;
  variant?: 'sidebar' | 'horizontal' | 'compact';
}

/**
 * Componente de navegação para seções relacionadas a badges
 * Permite navegar entre diferentes páginas de badges e conquistas
 */
export default function BadgeNavigation({ 
  className, 
  variant = 'sidebar' 
}: BadgeNavigationProps) {
  const location = useLocation();

  // Itens de navegação
  const navigationItems: NavigationItem[] = [
    {
      href: '/achievements',
      label: 'Minhas Conquistas',
      icon: Trophy,
      description: 'Visualize todos os seus badges e certificados'
    },
    {
      href: '/badges',
      label: 'Explorar Badges',
      icon: Badge,
      description: 'Descubra todos os badges disponíveis'
    },
    {
      href: '/leaderboard',
      label: 'Ranking',
      icon: Star,
      description: 'Veja sua posição no ranking de badges'
    },
    {
      href: '/challenges',
      label: 'Desafios',
      icon: Target,
      description: 'Participe de desafios para ganhar badges'
    }
  ];

  // Renderização para variante sidebar
  if (variant === 'sidebar') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground mb-4">
              Badges & Conquistas
            </h3>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 h-auto p-3',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {item.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderização para variante horizontal
  if (variant === 'horizontal') {
    return (
      <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive ? 'default' : 'outline'}
                className={cn(
                  'flex-shrink-0 gap-2',
                  isActive && 'bg-primary text-primary-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
    );
  }

  // Renderização para variante compact
  return (
    <div className={cn('flex gap-1', className)}>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link key={item.href} to={item.href}>
            <Button
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'gap-1',
                isActive && 'bg-primary text-primary-foreground'
              )}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}

// Componente de navegação rápida para badges
export function QuickBadgeNav({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Link to="/achievements">
        <Button variant="outline" size="sm" className="gap-2">
          <Trophy className="w-4 h-4" />
          Conquistas
        </Button>
      </Link>
      <Link to="/badges">
        <Button variant="outline" size="sm" className="gap-2">
          <Badge className="w-4 h-4" />
          Badges
        </Button>
      </Link>
    </div>
  );
}

// Hook para verificar se está em uma página relacionada a badges
export function useBadgeNavigation() {
  const location = useLocation();
  
  const isBadgePage = [
    '/achievements',
    '/badges',
    '/leaderboard',
    '/challenges'
  ].some(path => location.pathname.startsWith(path));
  
  return {
    isBadgePage,
    currentPath: location.pathname
  };
}