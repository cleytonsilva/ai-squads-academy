import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAppStore } from "@/store/useAppStore";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useTheme } from "@/contexts/theme-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Home, 
  Trophy, 
  BookOpen, 
  TrendingUp, 
  Target,
  Clock,
  Award,
  Users,
  Flame,
  Calendar,
  Star,
  Zap,
  TrendingDown,
  ChevronRight,
  Bell,
  Settings
} from "lucide-react";
import TrackBuilder from "@/components/app/TrackBuilder";
import ProgressOverview from "@/components/app/ProgressOverview";
import Achievements from "@/components/app/Achievements";
import StudentAchievements from "@/components/student/StudentAchievements";
import StudentCourses from "@/components/student/StudentCourses";
import StudentProgress from "@/components/student/StudentProgress";
import { useStudentDashboardData } from "@/hooks/useStudentData";
import { Link } from "react-router-dom";
import { TacticalActivityCard } from "@/components/tactical/TacticalActivityCard";
import { TacticalStatsCard, TacticalCircularProgress, TacticalStatRow, TacticalStatsGrid } from "@/components/tactical/TacticalStatsCard";
import { TacticalChart, TacticalWeeklyChart, TacticalCourseProgress } from "@/components/tactical/TacticalChart";

const AppDashboard = () => {
  const { xp, level } = useAppStore();
  const { profile } = useCurrentProfile();
  const { getThemeColors } = useTheme();
  const { stats, isLoading } = useStudentDashboardData();
  const [currentStreak, setCurrentStreak] = useState(7);
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [completedThisWeek, setCompletedThisWeek] = useState(3);
  
  const themeColors = getThemeColors();

  useEffect(() => {
    document.title = "Minha Jornada — Esquads";
  }, []);

  const canonical = useMemo(() => {
    try { return window.location.href } catch { return "/app" }
  }, []);

  // Simular plano do usuário
  const userPlan = profile?.subscription_plan || 'free';
  const planLabels = {
    free: 'Gratuito',
    basic: 'Básico', 
    premium: 'Premium',
    enterprise: 'Enterprise'
  };

  // Dados reais do usuário
  const weeklyProgressData = useMemo(() => {
    // Aqui você pode implementar lógica para calcular progresso semanal real
    // Por enquanto, usando dados básicos baseados nas estatísticas reais
    return [
      { day: 'Seg', value: Math.min(stats.averageProgress + 10, 100) },
      { day: 'Ter', value: Math.min(stats.averageProgress + 5, 100) },
      { day: 'Qua', value: stats.averageProgress },
      { day: 'Qui', value: Math.min(stats.averageProgress + 15, 100) },
      { day: 'Sex', value: Math.min(stats.averageProgress + 8, 100) },
      { day: 'Sáb', value: Math.min(stats.averageProgress - 5, 0) },
      { day: 'Dom', value: Math.min(stats.averageProgress + 3, 100) }
    ];
  }, [stats.averageProgress]);

  // Atividades recentes baseadas em dados reais (placeholder para implementação futura)
  const recentActivities = useMemo(() => {
    // TODO: Implementar busca de atividades recentes do banco de dados
    return [
      { 
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString('pt-BR'), 
        action: 'acessou dashboard', 
        subject: 'Painel Principal', 
        course: null 
      }
    ];
  }, []);

  if (isLoading) {
    return (
      <main className={`min-h-screen ${themeColors.background} ${themeColors.foreground} transition-colors duration-200`}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${themeColors.primaryBg.replace('bg-', 'border-')} mx-auto mb-4`}></div>
            <p className={themeColors.mutedForeground}>Carregando seu dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${themeColors.background} ${themeColors.foreground} p-6 space-y-6 transition-colors duration-200`}>
      <Helmet>
        <title>Minha Jornada | Esquads</title>
        <meta name="description" content="Dashboard completo do aluno - acompanhe progresso, conquistas e cursos disponíveis." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {/* Header Tactical Command */}
      <header className={`${themeColors.card} ${themeColors.border} border rounded p-6 transition-colors duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className={`h-16 w-16 border-2 ${themeColors.border.replace('border-', 'border-')}`}>
              <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || 'Operador'} />
              <AvatarFallback className={`${themeColors.muted} ${themeColors.foreground} font-mono text-lg`}>
                {profile?.display_name?.charAt(0) || 'O'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-500 font-mono tracking-wider">ONLINE</span>
              </div>
              <h1 className={`text-2xl font-bold tracking-wider ${themeColors.primaryText}`}>
                OPERADOR: {(profile?.display_name || 'ANÔNIMO').toUpperCase()}
              </h1>
              <div className={`text-sm ${themeColors.mutedForeground} font-mono space-y-1`}>
                <div>NÍVEL: {level} | XP: {xp.toLocaleString()}</div>
                <div>SEQUÊNCIA: {currentStreak} DIAS | CURSOS: {stats.totalCourses}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-xs ${themeColors.mutedForeground} font-mono text-right`}>
              <div>ÚLTIMA ATIVIDADE:</div>
              <div>2 min atrás</div>
            </div>
            <Button variant="ghost" size="icon" className={`${themeColors.mutedForeground} ${themeColors.primaryHover}`}>
              <Bell className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" className={`${themeColors.mutedForeground} ${themeColors.primaryHover}`}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Status Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className={`${themeColors.muted} ${themeColors.border} border rounded p-3 text-center transition-colors duration-200`}>
            <div className={`text-lg font-bold ${themeColors.foreground} font-mono`}>{stats.averageProgress}%</div>
            <div className={`text-xs ${themeColors.mutedForeground} uppercase tracking-wider`}>Progresso</div>
          </div>
          <div className={`${themeColors.muted} ${themeColors.border} border rounded p-3 text-center transition-colors duration-200`}>
            <div className={`text-lg font-bold ${themeColors.foreground} font-mono`}>{stats.completedCourses}</div>
            <div className={`text-xs ${themeColors.mutedForeground} uppercase tracking-wider`}>Concluídos</div>
          </div>
          <div className={`${themeColors.muted} ${themeColors.border} border rounded p-3 text-center transition-colors duration-200`}>
            <div className={`text-lg font-bold ${themeColors.foreground} font-mono`}>{stats.totalBadges}</div>
            <div className={`text-xs ${themeColors.mutedForeground} uppercase tracking-wider`}>Badges</div>
          </div>
          <div className={`${themeColors.muted} ${themeColors.border} border rounded p-3 text-center transition-colors duration-200`}>
            <div className={`text-lg font-bold font-mono ${themeColors.primaryText}`}>+{Math.round(stats.totalTimeSpent / 10)} XP</div>
            <div className={`text-xs ${themeColors.mutedForeground} uppercase tracking-wider`}>Hoje</div>
          </div>
        </div>
      </header>

      {/* Dashboard Tactical com abas */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${themeColors.card} ${themeColors.border} border transition-colors duration-200`}>
          <TabsTrigger 
            value="overview" 
            className={`flex items-center gap-2 data-[state=active]:${themeColors.accent} data-[state=active]:${themeColors.accentForeground} ${themeColors.mutedForeground} font-mono text-xs tracking-wider transition-colors duration-200`}
          >
            <Home className="h-4 w-4" />
            VISÃO GERAL
          </TabsTrigger>
          <TabsTrigger 
            value="courses" 
            className={`flex items-center gap-2 data-[state=active]:${themeColors.accent} data-[state=active]:${themeColors.accentForeground} ${themeColors.mutedForeground} font-mono text-xs tracking-wider transition-colors duration-200`}
          >
            <BookOpen className="h-4 w-4" />
            CURSOS
          </TabsTrigger>
          <TabsTrigger 
            value="progress" 
            className={`flex items-center gap-2 data-[state=active]:${themeColors.accent} data-[state=active]:${themeColors.accentForeground} ${themeColors.mutedForeground} font-mono text-xs tracking-wider transition-colors duration-200`}
          >
            <TrendingUp className="h-4 w-4" />
            PROGRESSO
          </TabsTrigger>
          <TabsTrigger 
            value="achievements" 
            className={`flex items-center gap-2 data-[state=active]:${themeColors.accent} data-[state=active]:${themeColors.accentForeground} ${themeColors.mutedForeground} font-mono text-xs tracking-wider transition-colors duration-200`}
          >
            <Trophy className="h-4 w-4" />
            CONQUISTAS
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Dashboard Tactical Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Progresso dos Cursos */}
            <TacticalChart title="PROGRESSO DOS CURSOS" className="lg:col-span-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{stats.activeCourses || 0}</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>Em Andamento</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{stats.completedCourses}</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>Concluídos</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{stats.totalCourses}</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>Total</div>
                </div>
              </div>
              {/* Placeholder para lista de cursos - será implementado com dados reais */}
              <div className={`text-xs ${themeColors.mutedForeground} font-mono text-center py-4`}>
                CARREGANDO DADOS DOS CURSOS...
              </div>
            </TacticalChart>

            {/* Atividades Recentes */}
            <div className="lg:col-span-4">
              <TacticalActivityCard activities={recentActivities} />
            </div>

            {/* Estatísticas de Estudo */}
            <div className="lg:col-span-4">
              <TacticalStatsCard title="ESTATÍSTICAS DE ESTUDO">
                <TacticalCircularProgress percentage={stats.averageProgress} />
                <TacticalStatsGrid>
                  <TacticalStatRow 
                    label="Tempo de estudo total" 
                    value={`${Math.round(stats.totalTimeSpent / 60)}h`} 
                  />
                  <TacticalStatRow 
                    label="Sequência de dias" 
                    value={`${currentStreak} dias`} 
                  />
                  <TacticalStatRow 
                    label="XP total" 
                    value={xp.toLocaleString()} 
                    highlight 
                  />
                </TacticalStatsGrid>
              </TacticalStatsCard>
            </div>

            {/* Gráfico de Desempenho */}
            <TacticalChart title="DESEMPENHO SEMANAL" className="lg:col-span-8">
              <TacticalWeeklyChart data={weeklyProgressData} />
            </TacticalChart>

            {/* Próximas Atividades */}
            <TacticalChart title="PRÓXIMAS MISSÕES" className="lg:col-span-4">
              <div className={`text-xs ${themeColors.mutedForeground} font-mono text-center py-4`}>
                NENHUMA MISSÃO AGENDADA
              </div>
            </TacticalChart>
          </div>
          
          {/* Componentes originais mantidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrackBuilder />
          </div>
          
          {/* Ações Táticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={`${themeColors.card} ${themeColors.border} border transition-colors duration-200`}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 ${themeColors.cardForeground} tracking-wider text-sm font-medium`}>
                  <Target className="h-4 w-4" />
                  PRÓXIMAS MISSÕES
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className={`w-full ${themeColors.primaryBg} hover:opacity-90 font-mono text-xs tracking-wider`} asChild>
                  <Link to="/courses">
                    <BookOpen className="h-4 w-4 mr-2" />
                    EXPLORAR CURSOS
                  </Link>
                </Button>
                <Button variant="outline" className={`w-full ${themeColors.border} ${themeColors.cardForeground} hover:${themeColors.accent} font-mono text-xs tracking-wider transition-colors duration-200`} asChild>
                  <Link to="/challenges">
                    <Trophy className="h-4 w-4 mr-2" />
                    VER DESAFIOS
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className={`${themeColors.card} ${themeColors.border} border transition-colors duration-200`}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 ${themeColors.cardForeground} tracking-wider text-sm font-medium`}>
                  <Award className="h-4 w-4" />
                  BRIEFING DIÁRIO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-sm ${themeColors.mutedForeground} mb-3 font-mono`}>
                  MISSÃO: Conclua pelo menos uma aula por dia para manter sequência operacional e ganhar XP.
                </p>
                <div className={`flex items-center gap-2 text-xs ${themeColors.mutedForeground} font-mono`}>
                  <Clock className="h-3 w-3" />
                  TEMPO RECOMENDADO: 30-60 min/dia
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="courses" className="mt-6">
          <StudentCourses />
        </TabsContent>
        
        <TabsContent value="progress" className="mt-6">
          <StudentProgress />
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-6">
          <StudentAchievements />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default AppDashboard;
