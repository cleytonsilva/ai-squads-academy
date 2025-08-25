import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { TrendingUp, Crown, Medal, Trophy, Star, Award, Users, RefreshCw, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & {
  auth_user?: {
    email: string;
  };
};

interface RankingData {
  profile: Profile;
  position: number;
  totalXP: number;
  coursesCompleted: number;
  certificatesEarned: number;
  badgesEarned: number;
}

export default function RankingManagement() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/');
      return;
    }

    if (currentUser) {
      fetchRankings();
    }
  }, [currentUser, authLoading, navigate]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with XP data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('xp', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Erro ao carregar rankings');
        return;
      }

      // Note: Using profile data only as auth.admin.listUsers() requires special privileges

      // Fetch additional data for each user
      const rankingPromises = profiles?.map(async (profile, index) => {
        
        // Get courses completed
        const { data: completedCourses } = await supabase
          .from('user_progress')
          .select('course_id')
          .eq('user_id', profile.user_id)
          .eq('is_completed', true);

        // Get certificates earned
        const { data: certificates } = await supabase
          .from('certificates')
          .select('id')
          .eq('user_id', profile.user_id);

        // Get badges earned
        const { data: badges } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', profile.user_id);

        return {
          profile: {
            ...profile
          },
          position: index + 1,
          totalXP: profile.xp || 0,
          coursesCompleted: completedCourses?.length || 0,
          certificatesEarned: certificates?.length || 0,
          badgesEarned: badges?.length || 0
        };
      }) || [];

      const rankingsData = await Promise.all(rankingPromises);
      setRankings(rankingsData);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      toast.error('Erro ao carregar rankings');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRankings = async () => {
    setRefreshing(true);
    await fetchRankings();
    setRefreshing(false);
    toast.success('Rankings atualizados com sucesso');
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Trophy className="w-6 h-6 text-orange-500" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  const getRankBadge = (position: number) => {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'instructor': return 'Instrutor';
      case 'student': return 'Aluno';
      default: return role;
    }
  };

  const topThree = rankings.slice(0, 3);
  const totalXP = rankings.reduce((sum, r) => sum + r.totalXP, 0);
  const averageXP = rankings.length > 0 ? Math.round(totalXP / rankings.length) : 0;

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Rankings</h1>
            <p className="text-gray-600 mt-2">
              Acompanhe o desempenho dos usuários e as classificações por XP
            </p>
          </div>
          <button
            onClick={handleRefreshRankings}
            disabled={refreshing}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center space-x-2 shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar Rankings'}</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Participantes</p>
                <p className="text-xl font-bold text-gray-900">{rankings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">XP Máximo</p>
                <p className="text-xl font-bold text-gray-900">
                  {rankings.length > 0 ? rankings[0]?.totalXP || 0 : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">XP Total</p>
                <p className="text-xl font-bold text-gray-900">{totalXP.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Média de XP</p>
                <p className="text-xl font-bold text-gray-900">{averageXP}</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Podium Loading */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <div className="flex justify-center items-end space-x-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center animate-pulse">
                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2 mx-auto"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table Loading */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum ranking disponível
            </h3>
            <p className="text-gray-600">
              Quando os usuários começarem a ganhar XP, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Podium */}
            {topThree.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">🏆 Pódio de Líderes</h2>
                
                <div className="flex justify-center items-end space-x-8">
                  {/* 2nd Place */}
                  {topThree[1] && (
                    <div className="text-center">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-white font-bold text-lg">
                            {(topThree[1].profile.display_name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">2</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {topThree[1].profile.display_name || 'Usuário'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{topThree[1].totalXP} XP</p>
                      <div className="h-20 w-16 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg mx-auto"></div>
                    </div>
                  )}

                  {/* 1st Place */}
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-xl">
                          {(topThree[0].profile.display_name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">
                      {topThree[0].profile.display_name || 'Usuário'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{topThree[0].totalXP} XP</p>
                    <div className="h-28 w-16 bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-lg mx-auto"></div>
                  </div>

                  {/* 3rd Place */}
                  {topThree[2] && (
                    <div className="text-center">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-white font-bold text-lg">
                            {(topThree[2].profile.display_name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">3</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {topThree[2].profile.display_name || 'Usuário'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{topThree[2].totalXP} XP</p>
                      <div className="h-16 w-16 bg-gradient-to-t from-orange-400 to-orange-600 rounded-t-lg mx-auto"></div>
                    </div>
                  )}
                </div>
              </div>
            )} 
           {/* Complete Rankings Table */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Classificação Completa</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posição
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Papel
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          XP Total
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cursos
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificados
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Badges
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/50">
                      {rankings.map((ranking) => {
                        const isTopThree = ranking.position <= 3;
                        
                        return (
                          <tr
                            key={ranking.profile.id}
                            className={`transition-all ${
                              isTopThree 
                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50' 
                                : 'hover:bg-gray-50/50'
                            }`}
                          >
                            {/* Position */}
                            <td className="px-6 py-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${getRankBadge(ranking.position)}`}>
                                {ranking.position <= 3 ? getRankIcon(ranking.position) : ranking.position}
                              </div>
                            </td>

                            {/* User Info */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {(ranking.profile.display_name || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {ranking.profile.display_name || 'Nome não disponível'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    ID: {ranking.profile.user_id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(ranking.profile.role)}`}>
                                {getRoleLabel(ranking.profile.role)}
                              </span>
                            </td>

                            {/* XP */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="font-bold text-gray-900">{ranking.totalXP}</span>
                              </div>
                            </td>

                            {/* Courses Completed */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Trophy className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-900">{ranking.coursesCompleted}</span>
                              </div>
                            </td>

                            {/* Certificates */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Medal className="w-4 h-4 text-purple-500" />
                                <span className="text-gray-900">{ranking.certificatesEarned}</span>
                              </div>
                            </td>

                            {/* Badges */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Award className="w-4 h-4 text-green-500" />
                                <span className="text-gray-900">{ranking.badgesEarned}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performers</h3>
                <div className="space-y-3">
                  {rankings.slice(0, 5).map((ranking, index) => (
                    <div key={ranking.profile.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-xs">
                            {(ranking.profile.display_name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {ranking.profile.display_name || 'Usuário'}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-blue-600">{ranking.totalXP} XP</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Estatísticas Gerais</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Usuários com XP &gt; 0</span>
                    <span className="font-bold text-gray-900">
                      {rankings.filter(r => r.totalXP > 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cursos Completados (Total)</span>
                    <span className="font-bold text-gray-900">
                      {rankings.reduce((sum, r) => sum + r.coursesCompleted, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Certificados Emitidos</span>
                    <span className="font-bold text-gray-900">
                      {rankings.reduce((sum, r) => sum + r.certificatesEarned, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Badges Conquistados</span>
                    <span className="font-bold text-gray-900">
                      {rankings.reduce((sum, r) => sum + r.badgesEarned, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Engajamento Médio</span>
                    <span className="font-bold text-green-600">
                      {rankings.length > 0 
                        ? Math.round((rankings.filter(r => r.totalXP > 0).length / rankings.length) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}