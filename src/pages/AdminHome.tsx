import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Users, 
  BookOpen, 
  Award, 
  Trophy, 
  Target, 
  TrendingUp,
  Plus,
  ArrowUpRight,
  Sparkles,
  UserPlus,
  Medal
} from 'lucide-react';

interface DashboardStats {
  total_users: number;
  total_courses: number;
  published_courses: number;
  total_badges: number;
  total_certificates: number;
  active_challenges: number;
  recent_enrollments: number;
}

interface RecentActivity {
  id: string;
  type: 'course_created' | 'user_registered' | 'badge_earned' | 'certificate_issued';
  title: string;
  description: string;
  created_at: string;
  user_name?: string;
}

const AdminHome = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useCurrentProfile();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    document.title = "Dashboard Admin — Esquads";
  }, []);

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        const [
          usersResult,
          coursesResult,
          badgesResult,
          certificatesResult,
          challengesResult
        ] = await Promise.all([
          supabase.from("profiles").select("id", { count: 'exact', head: true }).then(r => ({ ...r, count: r.count || 0 })),
          supabase.from("courses").select("id, is_published", { count: 'exact' }).then(r => ({ ...r, count: r.count || 0 })),
          supabase.from("badges").select("id", { count: 'exact', head: true }).then(r => ({ ...r, count: r.count || 0 })).catch(() => ({ count: 0, error: null })),
          supabase.from("certificates").select("id", { count: 'exact', head: true }).then(r => ({ ...r, count: r.count || 0 })).catch(() => ({ count: 0, error: null })),
          supabase.from("challenges").select("id", { count: 'exact', head: true }).then(r => ({ ...r, count: r.count || 0 })).catch(() => ({ count: 0, error: null }))
        ]);

        const publishedCourses = coursesResult.data?.filter(course => course.is_published).length || 0;
        
        return {
          total_users: usersResult.count,
          total_courses: coursesResult.count,
          published_courses: publishedCourses,
          total_badges: badgesResult.count,
          total_certificates: certificatesResult.count,
          active_challenges: challengesResult.count,
          recent_enrollments: 0 // TODO: Implement enrollments tracking
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
          total_users: 0,
          total_courses: 0,
          published_courses: 0,
          total_badges: 0,
          total_certificates: 0,
          active_challenges: 0,
          recent_enrollments: 0
        };
      }
    },
    enabled: !!profile
  });

  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        // Simulate recent activity for now - in a real app this would come from an activity log table
        const mockActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'course_created',
            title: 'Novo curso criado',
            description: 'Sistema de geração de cursos com IA está funcionando',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'user_registered',
            title: 'Dashboard administrativo ativo',
            description: 'Sistema de administração configurado com sucesso',
            created_at: new Date(Date.now() - 60000).toISOString(),
          },
          {
            id: '3',
            type: 'badge_earned',
            title: 'Integração com Supabase',
            description: 'Banco de dados e autenticação configurados',
            created_at: new Date(Date.now() - 120000).toISOString(),
          }
        ];
        setRecentActivity(mockActivity);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }
    };

    if (profile) {
      fetchRecentActivity();
    }
  }, [profile]);

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    navigate('/');
    return null;
  }

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/users',
      description: 'usuários cadastrados'
    },
    {
      title: 'Cursos Ativos',
      value: stats?.published_courses || 0,
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      href: '/admin/courses',
      description: 'cursos publicados'
    },
    {
      title: 'Total de Cursos',
      value: stats?.total_courses || 0,
      icon: BookOpen,
      color: 'from-emerald-500 to-emerald-600',
      href: '/admin/courses',
      description: 'incluindo rascunhos'
    },
    {
      title: 'Badges Criadas',
      value: stats?.total_badges || 0,
      icon: Award,
      color: 'from-yellow-500 to-yellow-600',
      href: '/admin/badges',
      description: 'conquistas disponíveis'
    },
    {
      title: 'Certificados',
      value: stats?.total_certificates || 0,
      icon: Trophy,
      color: 'from-purple-500 to-purple-600',
      href: '/admin/certificates',
      description: 'certificados emitidos'
    },
    {
      title: 'Desafios Ativos',
      value: stats?.active_challenges || 0,
      icon: Target,
      color: 'from-red-500 to-red-600',
      href: '/admin/challenges',
      description: 'desafios disponíveis'
    }
  ];

  const quickActions = [
    {
      title: 'Criar Novo Curso',
      description: 'Adicione um curso manualmente',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/courses'
    },
    {
      title: 'Gerar com IA',
      description: 'Use IA para criar cursos automaticamente',
      icon: Sparkles,
      color: 'from-purple-500 to-purple-600',
      href: '/admin/ai-generator'
    },
    {
      title: 'Gerenciar Usuários',
      description: 'Visualizar e gerenciar usuários',
      icon: UserPlus,
      color: 'from-green-500 to-green-600',
      href: '/admin/users'
    },
    {
      title: 'Criar Badge',
      description: 'Adicione uma nova conquista',
      icon: Medal,
      color: 'from-yellow-500 to-yellow-600',
      href: '/admin/badges'
    }
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'course_created':
        return BookOpen;
      case 'user_registered':
        return Users;
      case 'badge_earned':
        return Award;
      case 'certificate_issued':
        return Trophy;
      default:
        return Target;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'course_created':
        return 'from-green-500 to-green-600';
      case 'user_registered':
        return 'from-blue-500 to-blue-600';
      case 'badge_earned':
        return 'from-purple-500 to-purple-600';
      case 'certificate_issued':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Dashboard Admin — Esquads</title>
        <meta name="description" content="Dashboard administrativo principal com estatísticas e ações rápidas." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Administrativo
            </h1>
            <p className="text-gray-600 mt-2">
              Bem-vindo de volta, {profile.display_name || 'Administrador'}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => navigate('/admin/ai-generator')}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar com IA
            </Button>
            <Button
              onClick={() => navigate('/admin/courses')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Curso
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
            <Card
              key={index}
              onClick={() => navigate(card.href)}
              className="cursor-pointer group hover:shadow-xl transition-all hover:scale-[1.02] bg-white/60 backdrop-blur-sm border-white/20"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    card.value.toLocaleString()
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-4">{card.description}</p>
                <div className="flex items-center text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                  <span>Ver detalhes</span>
                  <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => navigate(action.href)}
                  variant="outline"
                  className="p-6 h-auto flex-col items-start space-y-4 group hover:shadow-lg hover:scale-[1.02] bg-white/40 border-gray-200 hover:border-gray-300"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                
                return (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-white/40 rounded-lg">
                    <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center`}>
                      <ActivityIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminHome;