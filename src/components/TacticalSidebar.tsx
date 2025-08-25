import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  BookOpen, 
  Target, 
  Trophy, 
  FileText, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Star,
  Settings,
  LogOut
} from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useStudentData } from "@/hooks/useStudentData";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TacticalSidebarProps {
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  description: string;
}

export default function TacticalSidebar({ className }: TacticalSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { profile } = useCurrentProfile();
  const { studentData } = useStudentData();
  const { xp, level } = useAppStore();

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "DASHBOARD",
      icon: Home,
      path: "/app",
      description: "Central de comando principal"
    },
    {
      id: "cursos",
      label: "CURSOS",
      icon: BookOpen,
      path: "/app/cursos",
      description: "Biblioteca de conhecimento"
    },
    {
      id: "missoes",
      label: "MISSÕES",
      icon: Target,
      path: "/app/missoes",
      description: "Objetivos e desafios"
    },
    {
      id: "conquistas",
      label: "CONQUISTAS",
      icon: Trophy,
      path: "/app/conquistas",
      description: "Badges e achievements"
    },
    {
      id: "simulados",
      label: "SIMULADOS",
      icon: FileText,
      path: "/app/simulados",
      description: "Testes e avaliações"
    },
    {
      id: "perfil",
      label: "PERFIL",
      icon: User,
      path: "/app/perfil",
      description: "Configurações pessoais"
    }
  ];

  const handleLogout = async () => {
    try {
      // Tentar logout no Supabase com timeout
      const logoutPromise = supabase.auth.signOut({ scope: 'local' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      try {
        await Promise.race([logoutPromise, timeoutPromise]);
        toast.success("Logout realizado com sucesso!");
      } catch (logoutError) {
        console.warn('Erro no logout do Supabase (continuando com logout local):', logoutError);
        // Continuar mesmo com erro - limpar estado local
        toast.success("Logout realizado com sucesso!");
      }
      
      // Redirecionar para página inicial
      window.location.href = '/';
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error("Erro ao fazer logout");
      // Em caso de erro crítico, ainda tentar redirecionar
      window.location.href = '/';
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside 
      className={`
        ${isCollapsed ? 'w-16' : 'w-64'} 
        transition-all duration-300 ease-in-out
        bg-neutral-900 border-r border-neutral-700 
        flex flex-col h-screen sticky top-0
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-wider text-sm">ESQUADS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800 h-8 w-8"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-neutral-700">
        <div className="flex items-center gap-3">
          <Avatar className={`${isCollapsed ? 'h-8 w-8' : 'h-12 w-12'} border-2 border-neutral-600`}>
            <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || 'Operador'} />
            <AvatarFallback className="bg-neutral-800 text-white font-mono">
              {profile?.display_name?.charAt(0) || 'O'}
            </AvatarFallback>
          </Avatar>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-500 font-mono tracking-wider">ONLINE</span>
              </div>
              <h3 className="text-sm font-bold text-white truncate font-mono tracking-wider">
                {(profile?.display_name || 'OPERADOR').toUpperCase()}
              </h3>
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                <Star className="w-3 h-3" />
                <span>Nv.{level}</span>
                <span>•</span>
                <span>{xp.toLocaleString()} XP</span>
              </div>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-neutral-400 mb-1">
              <span>Próximo nível</span>
              <span>{Math.round((xp % 1000) / 10)}%</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-1.5">
              <div
                className={`${themeColors.primaryBg} h-1.5 rounded-full transition-all duration-300`}
                style={{ width: `${(xp % 1000) / 10}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);
          
          return (
            <Link key={item.id} to={item.path}>
              <Button
                variant="ghost"
                className={`
                  w-full justify-start h-auto p-3
                  ${isActive 
                    ? `${themeColors.primaryBg} text-white hover:${themeColors.primaryBg.replace('bg-', 'bg-').replace('-500', '-600')}` 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }
                  transition-all duration-200
                `}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                  
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 text-left">
                        <div className={`text-xs font-bold tracking-wider font-mono ${
                          isActive ? 'text-white' : 'text-neutral-300'
                        }`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-neutral-500 font-mono">
                          {item.description}
                        </div>
                      </div>
                      

                    </>
                  )}
                </div>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-700 space-y-2">
        {!isCollapsed && (
          <div className="text-xs text-neutral-500 font-mono mb-3">
            <div className="flex justify-between items-center mb-1">
              <span>STATUS DO SISTEMA</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-500">OPERACIONAL</span>
              </div>
            </div>
            <div className="text-xs text-neutral-600">
              Última sincronização: agora
            </div>
          </div>
        )}
        
        <Link to="/app/perfil">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            className="w-full text-neutral-400 hover:text-white hover:bg-neutral-800 font-mono text-xs"
          >
            <Settings className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">CONFIGURAÇÕES</span>}
          </Button>
        </Link>
        
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "sm"}
          onClick={handleLogout}
          className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 font-mono text-xs"
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">DESCONECTAR</span>}
        </Button>
      </div>
    </aside>
  );
}