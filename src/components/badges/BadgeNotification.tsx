import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Trophy, 
  X, 
  Star, 
  Medal, 
  Crown, 
  Award,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Interface para notificação de badge
interface BadgeNotification {
  id: string;
  badgeId: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  earnedAt: string;
  isNew: boolean;
}

// Interface para props do componente
interface BadgeNotificationProps {
  notification: BadgeNotification;
  onDismiss: (id: string) => void;
  onView: (badgeId: string) => void;
  variant?: 'toast' | 'modal' | 'inline';
  autoHide?: boolean;
  hideDelay?: number;
}

// Interface para o sistema de notificações
interface BadgeNotificationSystemProps {
  userId?: string;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Componente individual de notificação de badge
 */
export function BadgeNotificationItem({ 
  notification, 
  onDismiss, 
  onView,
  variant = 'toast',
  autoHide = true,
  hideDelay = 5000
}: BadgeNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide após delay
  useEffect(() => {
    if (autoHide && variant === 'toast') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300);
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, notification.id, onDismiss, variant]);

  // Obter cor e ícone baseado na raridade
  const getRarityConfig = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return {
          color: 'text-gray-600 bg-gray-100 border-gray-200',
          icon: Star,
          gradient: 'from-gray-400 to-gray-600'
        };
      case 'uncommon':
        return {
          color: 'text-green-600 bg-green-100 border-green-200',
          icon: Star,
          gradient: 'from-green-400 to-green-600'
        };
      case 'rare':
        return {
          color: 'text-blue-600 bg-blue-100 border-blue-200',
          icon: Award,
          gradient: 'from-blue-400 to-blue-600'
        };
      case 'epic':
        return {
          color: 'text-purple-600 bg-purple-100 border-purple-200',
          icon: Medal,
          gradient: 'from-purple-400 to-purple-600'
        };
      case 'legendary':
        return {
          color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
          icon: Crown,
          gradient: 'from-yellow-400 to-yellow-600'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-100 border-gray-200',
          icon: Star,
          gradient: 'from-gray-400 to-gray-600'
        };
    }
  };

  const config = getRarityConfig(notification.rarity);
  const Icon = config.icon;

  // Renderização para modal
  if (variant === 'modal') {
    return (
      <Dialog open={isVisible} onOpenChange={(open) => !open && onDismiss(notification.id)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              🎉 Novo Badge Conquistado!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            {/* Ícone do Badge com animação */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="relative mx-auto w-20 h-20"
            >
              <div className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center border-4',
                config.color
              )}>
                {notification.badgeIcon ? (
                  <img 
                    src={notification.badgeIcon} 
                    alt={notification.badgeName}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <Icon className="w-10 h-10" />
                )}
              </div>
              
              {/* Efeito de brilho */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, transparent, ${config.color.split(' ')[0]}, transparent)`
                }}
              />
            </motion.div>

            {/* Informações do Badge */}
            <div>
              <h3 className="font-bold text-lg">{notification.badgeName}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {notification.badgeDescription}
              </p>
              
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge variant="secondary" className={config.color}>
                  {notification.rarity.charAt(0).toUpperCase() + notification.rarity.slice(1)}
                </Badge>
                <Badge variant="outline">
                  {notification.category}
                </Badge>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onDismiss(notification.id)}
                className="flex-1"
              >
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  onView(notification.badgeId);
                  onDismiss(notification.id);
                }}
                className="flex-1"
              >
                Ver Badge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Renderização para toast
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ type: "spring", duration: 0.4 }}
        >
          <Card className={cn(
            'w-80 shadow-lg border-l-4',
            config.color.split(' ')[2]
          )}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Ícone do Badge */}
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                  config.color
                )}>
                  {notification.badgeIcon ? (
                    <img 
                      src={notification.badgeIcon} 
                      alt={notification.badgeName}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        🎉 Novo Badge!
                      </p>
                      <h4 className="font-semibold text-sm truncate">
                        {notification.badgeName}
                      </h4>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(notification.id)}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {notification.badgeDescription}
                  </p>

                  {/* Ações */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {notification.rarity}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onView(notification.badgeId);
                        onDismiss(notification.id);
                      }}
                      className="text-xs h-6"
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Sistema de notificações de badges
 * Gerencia múltiplas notificações e sua exibição
 */
export default function BadgeNotificationSystem({ 
  userId,
  maxNotifications = 3,
  position = 'top-right'
}: BadgeNotificationSystemProps) {
  const [notifications, setNotifications] = useState<BadgeNotification[]>([]);
  const [modalNotification, setModalNotification] = useState<BadgeNotification | null>(null);

  // Sistema de notificações será integrado com eventos reais do Supabase
  useEffect(() => {
    // TODO: Implementar listener para novos badges do usuário
    // Exemplo: subscription para mudanças na tabela user_badges
  }, [userId]);

  // Adicionar nova notificação
  const addNotification = (notification: BadgeNotification) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev].slice(0, maxNotifications);
      return newNotifications;
    });

    // Para badges raros ou épicos, mostrar modal
    if (['rare', 'epic', 'legendary'].includes(notification.rarity)) {
      setModalNotification(notification);
    }

    // Toast para todos os badges
    toast.success(`Novo badge conquistado: ${notification.badgeName}!`, {
      description: notification.badgeDescription,
      action: {
        label: 'Ver',
        onClick: () => handleViewBadge(notification.badgeId)
      }
    });
  };

  // Remover notificação
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Visualizar badge
  const handleViewBadge = (badgeId: string) => {
    // Navegar para página de detalhes do badge ou abrir modal
    console.log('Visualizar badge:', badgeId);
  };

  // Obter classes de posicionamento
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <>
      {/* Container de notificações toast */}
      <div className={cn(
        'fixed z-50 space-y-2 pointer-events-none',
        getPositionClasses()
      )}>
        <AnimatePresence>
          {notifications.map((notification) => (
            <div key={notification.id} className="pointer-events-auto">
              <BadgeNotificationItem
                notification={notification}
                onDismiss={dismissNotification}
                onView={handleViewBadge}
                variant="toast"
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal para badges especiais */}
      {modalNotification && (
        <BadgeNotificationItem
          notification={modalNotification}
          onDismiss={() => setModalNotification(null)}
          onView={handleViewBadge}
          variant="modal"
          autoHide={false}
        />
      )}
    </>
  );
}

// Hook para usar o sistema de notificações
export function useBadgeNotifications() {
  const [notifications, setNotifications] = useState<BadgeNotification[]>([]);

  const addNotification = (notification: Omit<BadgeNotification, 'id' | 'isNew'>) => {
    const newNotification: BadgeNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      isNew: true
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    return newNotification.id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isNew: false } : n)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll
  };
}