import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  BookOpen, 
  Award, 
  Trophy, 
  Target, 
  TrendingUp,
  Plus,
  ArrowUpRight,
  Brain
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

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchStats();
    }
  }, [user, authLoading]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas do banco de dados
      const [coursesResult, usersResult, badgesResult] = await Promise.all([
        supabase.from('courses').select('id, is_published'),
        supabase.from('profiles').select('id'),
        supabase.from('badges').select('id')
      ]);

      const totalCourses = coursesResult.data?.length || 0;
      const publishedCourses = coursesResult.data?.filter(c => c.is_published)?.length || 0;
      const totalUsers = usersResult.data?.length || 0;
      const totalBadges = badgesResult.data?.length || 0;

      setStats({
        total_users: totalUsers,
        total_courses: totalCourses,
        published_courses: publishedCourses,
        total_badges: totalBadges,
        total_certificates: 0, // TODO: implementar quando tiver tabela de certificados
        active_challenges: 0, // TODO: implementar quando tiver tabela de desafios
        recent_enrollments: 0 // TODO: implementar quando tiver sistema de inscrições
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/users'
    },
    {
      title: 'Cursos Ativos',
      value: stats?.total_courses || 0,
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      href: '/admin/courses'
    },
    {
      title: 'Badges Criadas',
      value: stats?.total_badges || 0,
      icon: Award,
      color: 'from-yellow-500 to-yellow-600',
      href: '/admin/badges'
    },
    {
      title: 'Certificados',
      value: stats?.total_certificates || 0,
      icon: Trophy,
      color: 'from-purple-500 to-purple-600',
      href: '/admin/certificates'
    },
    {
      title: 'Desafios Ativos',
      value: stats?.active_challenges || 0,
      icon: Target,
      color: 'from-red-500 to-red-600',
      href: '/admin/challenges'
    },
    {
      title: 'Novos Inscritos',
      value: stats?.recent_enrollments || 0,
      icon: TrendingUp,
      color: 'from-cyan-500 to-cyan-600',
      href: '/admin/rankings'
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
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      href: '/admin/ai-generator'
    },
    {
      title: 'Adicionar Usuário',
      description: 'Cadastre um novo usuário',
      icon: Users,
      color: 'from-green-500 to-green-600',
      href: '/admin/users'
    },
    {
      title: 'Criar Badge',
      description: 'Adicione uma nova conquista',
      icon: Trophy,
      color: 'from-yellow-500 to-yellow-600',
      href: '/admin/badges'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Administrativo
            </h1>
            <p className="text-gray-600 mt-2">
              Bem-vindo de volta, {user?.name || user?.email}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/admin/ai-generator')}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg"
            >
              <Brain className="w-4 h-4" />
              <span>Gerar com IA</span>
            </button>
            <button
              onClick={() => navigate('/admin/courses')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center space-x-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Curso</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.href)}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all cursor-pointer group hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                <span>Ver detalhes</span>
                <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.href)}
                className="p-6 rounded-xl border border-gray-200 hover:border-gray-300 transition-all group hover:shadow-lg hover:scale-[1.02] bg-white/40"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Atividade Recente</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-white/40 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Sistema de geração de imagens corrigido</p>
                <p className="text-sm text-gray-600">Bug crítico na linha 95 foi corrigido com sucesso</p>
              </div>
              <span className="text-xs text-gray-500">Agora</span>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-white/40 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Sistema de fallback implementado</p>
                <p className="text-sm text-gray-600">Múltiplos engines de IA agora disponíveis com fallback automático</p>
              </div>
              <span className="text-xs text-gray-500">Agora</span>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-white/40 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Dashboard administrativo migrado</p>
                <p className="text-sm text-gray-600">Interface administrativa adaptada para Supabase Auth</p>
              </div>
              <span className="text-xs text-gray-500">Agora</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}