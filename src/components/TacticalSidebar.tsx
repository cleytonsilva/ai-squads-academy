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
  Star,
  Settings,
  LogOut
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/contexts/theme-context";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useStudentData } from "@/hooks/useStudentData";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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
      // Limpar storage local primeiro para UX mais rápida
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-ncrlojjfkhevjotchhxi-auth-token');
      
      // Tentar logout no Supabase com timeout reduzido
      const logoutPromise = supabase.auth.signOut({ scope: 'local' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000) // Reduzido para 2s
      );
      
      try {
        await Promise.race([logoutPromise, timeoutPromise]);
        console.log('✅ Logout do Supabase realizado com sucesso');
      } catch (logoutError) {
        console.warn('⚠️ Timeout no logout do Supabase (continuando com logout local):', logoutError);
        // Storage já foi limpo acima, então apenas continuar
      }
      
      toast({
        title: "Sucesso",
        description: "Logout realizado com sucesso!"
      });
      
      // Redirecionar para página inicial
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Erro crítico no logout:', error);
      // Garantir limpeza mesmo com erro crítico
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-ncrlojjfkhevjotchhxi-auth-token');
      
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive"
      });
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
        ${themeColors.card} ${themeColors.border} border-r
        flex flex-col h-screen sticky top-0
        ${className}
      `}
    >
      {/* Header */}
      <div className={`p-4 border-b ${themeColors.border}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <img
            src="/images/esquads2.png"
            alt="Esquads Logo"
            className="w-8 h-8 object-contain flex-shrink-0 transition-opacity duration-200"
            loading="eager"
            style={{ imageRendering: 'crisp-edges' }}
          />
              <span className={`font-bold ${themeColors.foreground} tracking-wider text-sm`}>ESQUADS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`${themeColors.mutedForeground} ${themeColors.foreground.replace('text-', 'hover:text-')} ${themeColors.muted.replace('bg-', 'hover:bg-')} h-8 w-8`}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <div className={`p-4 border-b ${themeColors.border}`}>
        <div className="flex items-center gap-3">
          <Avatar className={`${isCollapsed ? 'h-8 w-8' : 'h-12 w-12'} border-2 ${themeColors.border}`}>
            <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || 'Operador'} />
            <AvatarFallback className={`${themeColors.muted} ${themeColors.foreground} font-mono`}>
              {profile?.display_name?.charAt(0) || 'O'}
            </AvatarFallback>
          </Avatar>
          
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-green-500 font-orbitron tracking-wider">ONLINE</span>
              </div>
              <h3 className={`text-sm font-bold ${themeColors.foreground} truncate font-orbitron tracking-wider`}>
                {(profile?.display_name || 'OPERADOR').toUpperCase()}
              </h3>
              <div className={`flex items-center gap-2 text-[10px] ${themeColors.mutedForeground} font-orbitron`}>
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
            <div className={`flex justify-between text-[10px] ${themeColors.mutedForeground} mb-1`}>
              <span>Próximo nível</span>
              <span>{Math.round((xp % 1000) / 10)}%</span>
            </div>
            <div className={`w-full ${themeColors.muted} rounded-full h-1.5`}>
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
                    ? `${themeColors.primaryBg} ${themeColors.background.replace('bg-', 'text-')} hover:${themeColors.primaryBg.replace('bg-', 'bg-').replace('-500', '-600')}` 
                    : `${themeColors.mutedForeground} ${themeColors.foreground.replace('text-', 'hover:text-')} ${themeColors.muted.replace('bg-', 'hover:bg-')}`
                  }
                  transition-all duration-200
                `}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={`h-4 w-4 ${isActive ? themeColors.background.replace('bg-', 'text-') : ''}`} />
                  
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 text-left">
                        <div className={`text-[11px] font-bold tracking-wider font-orbitron ${
                          isActive ? themeColors.background.replace('bg-', 'text-') : themeColors.foreground
                        }`}>
                          {item.label}
                        </div>
                        <div className={`text-[9px] ${themeColors.mutedForeground} font-orbitron`}>
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
      <div className={`p-4 border-t ${themeColors.border} space-y-2`}>
        {!isCollapsed && (
          <div className={`text-xs ${themeColors.mutedForeground} font-mono mb-3`}>
            <div className="flex justify-between items-center mb-1">
              <span>STATUS DO SISTEMA</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-500">OPERACIONAL</span>
              </div>
            </div>
            <div className={`text-xs ${themeColors.mutedForeground} opacity-75`}>
              Última sincronização: agora
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <ThemeToggle />
          <Link to="/app/perfil" className="flex-1">
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              className={`w-full ${themeColors.mutedForeground} ${themeColors.foreground.replace('text-', 'hover:text-')} ${themeColors.muted.replace('bg-', 'hover:bg-')} font-mono text-xs`}
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">CONFIGURAÇÕES</span>}
            </Button>
          </Link>
        </div>
        
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