import { useEffect, useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import DashboardLayout from '@/react-app/components/DashboardLayout';
import { TrendingUp, Crown, Medal, Trophy, Star, Award, Users } from 'lucide-react';
import type { User } from '@/shared/types';

export default function Rankings() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/');
      return;
    }

    if (user) {
      fetchRankings();
    }
  }, [user, isPending, navigate]);

  const fetchRankings = async () => {
    try {
      const response = await fetch('/api/rankings');
      if (response.ok) {
        const data = await response.json();
        setRankings(data);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
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

  const getSubscriptionIcon = (level: string) => {
    switch (level) {
      case 'corporate': return <Crown className="w-4 h-4 text-purple-600" />;
      case 'pro': return <Star className="w-4 h-4 text-yellow-600" />;
      case 'free': return <Users className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  const getSubscriptionLabel = (level: string) => {
    switch (level) {
      case 'corporate': return 'Corporativo';
      case 'pro': return 'Pro';
      case 'free': return 'Gratuito';
      default: return level;
    }
  };

  const topThree = rankings.slice(0, 3);

  if (isPending || !user) {
    return <div>Carregando...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rankings Gerais</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe o desempenho dos alunos e as classificações por pontos
          </p>
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
                <p className="text-sm text-gray-600">Pontuação Máxima</p>
                <p className="text-xl font-bold text-gray-900">
                  {rankings.length > 0 ? rankings[0]?.total_points || 0 : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
                <p className="text-xl font-bold text-gray-900">
                  {rankings.filter(u => u.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Média de Pontos</p>
                <p className="text-xl font-bold text-gray-900">
                  {rankings.length > 0 
                    ? Math.round(rankings.reduce((sum, u) => sum + u.total_points, 0) / rankings.length)
                    : 0
                  }
                </p>
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
              Quando os usuários começarem a ganhar pontos, eles aparecerão aqui.
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
                            {(topThree[1].name || topThree[1].email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">2</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {topThree[1].name || 'Usuário'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{topThree[1].total_points} pontos</p>
                      <div className="h-20 w-16 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg mx-auto"></div>
                    </div>
                  )}

                  {/* 1st Place */}
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-xl">
                          {(topThree[0].name || topThree[0].email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1 text-lg">
                      {topThree[0].name || 'Usuário'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{topThree[0].total_points} pontos</p>
                    <div className="h-28 w-16 bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-lg mx-auto"></div>
                  </div>

                  {/* 3rd Place */}
                  {topThree[2] && (
                    <div className="text-center">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-white font-bold text-lg">
                            {(topThree[2].name || topThree[2].email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">3</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {topThree[2].name || 'Usuário'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{topThree[2].total_points} pontos</p>
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
                
                <div className="space-y-2">
                  {rankings.map((userRank, index) => {
                    const position = index + 1;
                    const isTopThree = position <= 3;
                    
                    return (
                      <div
                        key={userRank.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg transition-all ${
                          isTopThree 
                            ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200' 
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                      >
                        {/* Position */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${getRankBadge(position)}`}>
                          {position <= 3 ? getRankIcon(position) : position}
                        </div>

                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {(userRank.name || userRank.email).charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {userRank.name || 'Usuário'}
                          </h3>
                          <p className="text-sm text-gray-600">{userRank.email}</p>
                        </div>

                        {/* Subscription */}
                        <div className="flex items-center space-x-2">
                          {getSubscriptionIcon(userRank.subscription_level)}
                          <span className="text-sm text-gray-600">
                            {getSubscriptionLabel(userRank.subscription_level)}
                          </span>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{userRank.total_points}</p>
                          <p className="text-xs text-gray-500">pontos</p>
                        </div>

                        {/* Status */}
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            userRank.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userRank.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
