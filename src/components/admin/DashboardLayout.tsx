import { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Award,
  Trophy,
  Target,
  TrendingUp,
  Menu,
  LogOut,
  Brain,
  X,
  User,
  Compass,
  FileText
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Cursos', href: '/admin/courses', icon: BookOpen },
  { name: 'Gerador de IA', href: '/admin/ai-generator', icon: Brain },
  { name: 'Usuários', href: '/admin/users', icon: Users },
  { name: 'Badges', href: '/admin/badges', icon: Award },
  { name: 'Certificados', href: '/admin/certificates', icon: Trophy },
  { name: 'Desafios', href: '/admin/challenges', icon: Target },
  { name: 'Missões', href: '/admin/missions', icon: Compass },
  { name: 'Simulados', href: '/admin/simulados', icon: FileText },
  { name: 'Rankings', href: '/admin/rankings', icon: TrendingUp },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Tema administrativo fixo - não usar tema do estudante
  const adminThemeColors = {
    primary: "text-blue-600",
    primaryHover: "hover:text-blue-700",
    primaryText: "text-blue-600",
    primaryBg: "bg-blue-600",
    background: "bg-slate-50",
    foreground: "text-slate-900",
    card: "bg-white",
    cardForeground: "text-slate-900",
    border: "border-slate-200",
    muted: "bg-slate-100",
    mutedForeground: "text-slate-500",
    accent: "bg-slate-100",
    accentForeground: "text-slate-900",
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Limpar estado local primeiro para UX mais rápida
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
      
      // Navegar para página inicial
      navigate('/', { replace: true });
    } catch (error) {
      console.error('❌ Erro crítico no logout:', error);
      // Garantir limpeza mesmo com erro crítico
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-ncrlojjfkhevjotchhxi-auth-token');
      navigate('/', { replace: true });
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${adminThemeColors.background}`}>
      {/* Mobile sidebar */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 z-[60] flex">
          <div className={`relative flex w-full max-w-xs flex-1 flex-col ${adminThemeColors.card} shadow-xl`}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex items-center space-x-3 px-6 mb-8">
                <img 
                  src="/images/esquads.webp" 
                  alt="Esquads Logo" 
                  className="w-10 h-10 object-contain flex-shrink-0"
                  loading="eager"
                  style={{ imageRendering: 'crisp-edges' }}
                />
                <h1 className={`text-2xl font-bold ${adminThemeColors.foreground}`}>Esquads</h1>
              </div>
              
              <nav className="flex-1 space-y-1 px-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                        isActive
                          ? `${adminThemeColors.primaryBg} text-white shadow-lg`
                          : `${adminThemeColors.foreground} ${adminThemeColors.muted.replace('bg-', 'hover:bg-')} ${adminThemeColors.primary.replace('text-', 'hover:text-')}`
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : `${adminThemeColors.mutedForeground} ${adminThemeColors.primary.replace('text-', 'group-hover:text-')}`}`} />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
          <div className="w-14 flex-shrink-0" />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:z-30">
        <div className={`flex flex-1 flex-col overflow-y-auto ${adminThemeColors.card}/80 backdrop-blur-xl ${adminThemeColors.border} border-r shadow-lg`}>
          <div className="flex items-center space-x-3 px-4 py-3">
            <img 
              src="/images/esquads.webp" 
              alt="Esquads Logo" 
              className="w-10 h-10 object-contain flex-shrink-0"
              loading="eager"
              style={{ imageRendering: 'crisp-edges' }}
            />
            <h1 className={`text-2xl font-bold ${adminThemeColors.foreground}`}>Esquads</h1>
          </div>
          
          <nav className="flex-1 space-y-1 px-3 pb-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? `${adminThemeColors.primaryBg} text-white shadow-lg transform scale-[1.02]`
                      : `${adminThemeColors.foreground} ${adminThemeColors.muted.replace('bg-', 'hover:bg-')} ${adminThemeColors.primary.replace('text-', 'hover:text-')} hover:scale-[1.01]`
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : `${adminThemeColors.mutedForeground} ${adminThemeColors.primary.replace('text-', 'group-hover:text-')}`}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className={`sticky top-0 z-40 ${adminThemeColors.card}/80 backdrop-blur-xl ${adminThemeColors.border} border-b shadow-sm`}>
          <div className="flex items-center justify-between px-4 py-3 h-16">
            <button
              type="button"
              className={`lg:hidden rounded-md p-2 ${adminThemeColors.mutedForeground} ${adminThemeColors.muted.replace('bg-', 'hover:bg-')} ${adminThemeColors.foreground.replace('text-', 'hover:text-')}`}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className={`text-sm font-medium ${adminThemeColors.foreground}`}>{user?.name || user?.email}</p>
                  <p className={`text-xs ${adminThemeColors.mutedForeground}`}>{user?.role === 'admin' ? 'Administrador' : 'Instrutor'}</p>
                </div>
              </div>
              
              <ThemeToggle />
              
              <button
                onClick={handleLogout}
                className={`rounded-lg p-2 ${adminThemeColors.mutedForeground} hover:bg-red-50 hover:text-red-600 transition-colors`}
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
