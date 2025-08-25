import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BadgeManagement } from '@/components/badges';

/**
 * Página de Badges
 * Renderiza o componente apropriado baseado no papel do usuário:
 * - AdminBadgeManagement para administradores e instrutores
 * - StudentBadgeView para estudantes
 */
export default function BadgesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header com navegação */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar ao Dashboard</span>
                </Button>
              </Link>
              
              <div className="border-l pl-4">
                <h1 className="text-2xl font-bold">Badges</h1>
                <p className="text-muted-foreground">
                  Conquiste badges e acompanhe seu progresso
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-8">
        <BadgeManagement />
      </div>
    </div>
  );
}