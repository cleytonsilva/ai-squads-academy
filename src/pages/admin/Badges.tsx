import { useEffect, useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import DashboardLayout from '@/react-app/components/DashboardLayout';
import { Award, Plus, Search, Star, Trophy, Target, BookOpen, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { Badge, CreateBadge } from '@/shared/types';

export default function Badges() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBadge, setNewBadge] = useState<CreateBadge>({
    name: '',
    description: '',
    criteria: '',
    points_required: 0
  });

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/');
      return;
    }

    if (user) {
      fetchBadges();
    }
  }, [user, isPending, navigate]);

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/badges');
      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBadge),
      });

      if (response.ok) {
        const createdBadge = await response.json();
        setBadges([createdBadge, ...badges]);
        setShowCreateModal(false);
        setNewBadge({
          name: '',
          description: '',
          criteria: '',
          points_required: 0
        });
      } else {
        alert('Erro ao criar badge');
      }
    } catch (error) {
      console.error('Error creating badge:', error);
      alert('Erro ao criar badge');
    }
  };

  const filteredBadges = badges.filter(badge =>
    badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (badge.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const predefinedBadges = [
    {
      name: 'Primeiro Curso',
      description: 'Complete seu primeiro curso',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      criteria: 'Completar 1 curso',
      points: 100
    },
    {
      name: 'Estudioso',
      description: 'Complete 5 cursos',
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      criteria: 'Completar 5 cursos',
      points: 500
    },
    {
      name: 'Expert',
      description: 'Complete 10 cursos',
      icon: Trophy,
      color: 'from-purple-500 to-purple-600',
      criteria: 'Completar 10 cursos',
      points: 1000
    },
    {
      name: 'Mestre',
      description: 'Complete 20 cursos',
      icon: Award,
      color: 'from-red-500 to-red-600',
      criteria: 'Completar 20 cursos',
      points: 2000
    },
    {
      name: 'Desafiador',
      description: 'Complete 10 desafios',
      icon: Target,
      color: 'from-green-500 to-green-600',
      criteria: 'Completar 10 desafios',
      points: 750
    }
  ];

  if (isPending || !user) {
    return <div>Carregando...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Badges</h1>
            <p className="text-gray-600 mt-2">
              Crie e gerencie badges para gamificar o aprendizado
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Badge</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Badges</p>
                <p className="text-xl font-bold text-gray-900">{badges.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Badges Ativas</p>
                <p className="text-xl font-bold text-gray-900">
                  {badges.filter(b => b.is_active).length}
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
                <p className="text-sm text-gray-600">Badges Conquistadas</p>
                <p className="text-xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Create Suggestions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Badges Sugeridas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {predefinedBadges.map((badge, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setNewBadge({
                  name: badge.name,
                  description: badge.description,
                  criteria: badge.criteria,
                  points_required: badge.points
                })}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${badge.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <badge.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{badge.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                <p className="text-xs text-yellow-600 font-medium">{badge.points} pontos</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar badges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Badges Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredBadges.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {badges.length === 0 ? 'Nenhuma badge criada' : 'Nenhuma badge encontrada'}
            </h3>
            <p className="text-gray-600 mb-6">
              {badges.length === 0 
                ? 'Comece criando sua primeira badge para gamificar o aprendizado.'
                : 'Tente ajustar os termos de busca.'
              }
            </p>
            {badges.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeira Badge</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBadges.map((badge) => (
              <div key={badge.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {badge.icon_url ? (
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={badge.icon_url} alt={badge.name} className="object-contain" />
                          <AvatarFallback className="bg-transparent">
                            <Award className="w-8 h-8 text-white" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Award className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {badge.criteria && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Critério:</span> {badge.criteria}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {badge.points_required && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      {badge.points_required} pontos
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    badge.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {badge.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Badge Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Criar Nova Badge</h2>
              
              <form onSubmit={handleCreateBadge} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Badge *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBadge.name}
                    onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Ex: Primeiro Curso"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    rows={3}
                    value={newBadge.description}
                    onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Descreva como ganhar esta badge..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Critério para Conquista
                  </label>
                  <input
                    type="text"
                    value={newBadge.criteria}
                    onChange={(e) => setNewBadge({ ...newBadge, criteria: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Ex: Completar 5 cursos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pontos Necessários
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newBadge.points_required}
                    onChange={(e) => setNewBadge({ ...newBadge, points_required: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all"
                  >
                    Criar Badge
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
