import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAppStore } from "@/store/useAppStore";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
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
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AppDashboard = () => {
  const { xp, level } = useAppStore();
  const { profile } = useCurrentProfile();
  const { stats, isLoading } = useStudentDashboardData();
  const [currentStreak, setCurrentStreak] = useState(7);
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [completedThisWeek, setCompletedThisWeek] = useState(3);

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

  // Dados mockados para gráficos
  const progressData = [
    { day: 'Seg', xp: 120 },
    { day: 'Ter', xp: 180 },
    { day: 'Qua', xp: 150 },
    { day: 'Qui', xp: 220 },
    { day: 'Sex', xp: 190 },
    { day: 'Sáb', xp: 160 },
    { day: 'Dom', xp: 140 }
  ];

  const categoryData = [
    { name: 'Cibersegurança', value: 40, color: '#8B5CF6' },
    { name: 'Programação', value: 30, color: '#06B6D4' },
    { name: 'Redes', value: 20, color: '#10B981' },
    { name: 'Outros', value: 10, color: '#F59E0B' }
  ];

  const recentActivities = [
    { type: 'course', title: 'Concluiu: Fundamentos de Ethical Hacking', time: '2 horas atrás', icon: BookOpen, color: 'text-green-500' },
    { type: 'badge', title: 'Conquistou: Badge de Persistência', time: '1 dia atrás', icon: Award, color: 'text-yellow-500' },
    { type: 'challenge', title: 'Completou: Desafio de Penetration Testing', time: '2 dias atrás', icon: Target, color: 'text-blue-500' },
    { type: 'streak', title: 'Manteve sequência de 7 dias!', time: '3 dias atrás', icon: Flame, color: 'text-orange-500' }
  ];

  if (isLoading) {
    return (
      <main className="min-h-screen container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando seu dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen container mx-auto py-10 space-y-6">
      <Helmet>
        <title>Minha Jornada | Esquads</title>
        <meta name="description" content="Dashboard completo do aluno - acompanhe progresso, conquistas e cursos disponíveis." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {/* Header moderno com gradiente */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-4 border-white/20 shadow-xl">
                <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || 'Usuário'} />
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                  {profile?.display_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold mb-2">Olá, {profile?.display_name || 'Estudante'}! 👋</h1>
                <p className="text-white/80 text-lg">
                  Nível {level} • {xp} XP • {currentStreak} dias de sequência 🔥
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {planLabels[userPlan as keyof typeof planLabels]}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {stats.totalCourses} Cursos
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Progresso da meta semanal */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Meta Semanal</h3>
                <p className="text-white/80">{completedThisWeek} de {weeklyGoal} cursos concluídos</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{Math.round((completedThisWeek / weeklyGoal) * 100)}%</div>
                <div className="text-white/80 text-sm">Completo</div>
              </div>
            </div>
            <Progress 
              value={(completedThisWeek / weeklyGoal) * 100} 
              className="h-3 bg-white/20" 
            />
          </div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute top-4 right-4 opacity-20">
          <Star className="h-8 w-8" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <Zap className="h-6 w-6" />
        </div>
      </header>
        
        {/* Estatísticas rápidas com design moderno */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.averageProgress}%</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Progresso Médio</div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completedCourses}</div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">Concluídos</div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.totalCertificates}</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Certificados</div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalBadges}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Badges</div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{Math.round(stats.totalTimeSpent / 60)}h</div>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Estudadas</div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{currentStreak}</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Dias Sequência</div>
            </CardContent>
          </Card>
        </div>
      </header>

      {/* Dashboard com abas */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progresso
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Conquistas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Visão geral - componentes originais otimizados */}
          <TrackBuilder />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProgressOverview />
            <Achievements />
          </div>
          
          {/* Dicas e ações rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Próximos Passos
                </CardTitle>
                <CardDescription>
                  Continue sua jornada de aprendizado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <Link to="/courses">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Explorar Cursos
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/challenges">
                    <Trophy className="h-4 w-4 mr-2" />
                    Ver Desafios
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Dica do Dia
                </CardTitle>
                <CardDescription>
                  Maximize seu aprendizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Conclua pelo menos uma aula por dia para manter sua sequência de estudos e ganhar mais XP!
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Tempo recomendado: 30-60 min/dia
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
