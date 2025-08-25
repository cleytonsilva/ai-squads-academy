import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { Compass, Target, Trophy, Users, Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import MissionManager from '@/components/admin/MissionManager';
import TrackMissionManager from '@/components/admin/TrackMissionManager';

// Interface para estatísticas de missões
interface MissionStats {
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  totalParticipants: number;
}

// Interface para missão
interface Mission {
  id: string;
  title: string;
  description?: string;
  status: string;
  points: number;
  course_id?: string;
  module_id?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminMissions() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Verificar autenticação e permissões
  useEffect(() => {
    if (!authLoading && (!user || !['admin', 'instructor'].includes(user.role))) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Query para buscar estatísticas de missões
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['mission-stats'],
    queryFn: async (): Promise<MissionStats> => {
      try {
        // Buscar total de missões
        const { count: totalMissions, error: missionsError } = await supabase
          .from('missions')
          .select('*', { count: 'exact', head: true });

        if (missionsError) {
          console.warn('Erro ao buscar missões:', missionsError);
          // Se a tabela não existe, retornar zeros
          if (missionsError.message?.includes('relation') || missionsError.message?.includes('does not exist')) {
            return { totalMissions: 0, activeMissions: 0, completedMissions: 0, totalParticipants: 0 };
          }
          throw missionsError;
        }

        // Buscar missões ativas
        const { count: activeMissions } = await supabase
          .from('missions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'available');

        // Buscar missões completadas
        const { count: completedMissions } = await supabase
          .from('missions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');

        // Buscar total de participantes únicos
        const { count: totalParticipants } = await supabase
          .from('user_missions')
          .select('user_id', { count: 'exact', head: true });

        return {
          totalMissions: totalMissions || 0,
          activeMissions: activeMissions || 0,
          completedMissions: completedMissions || 0,
          totalParticipants: totalParticipants || 0,
        };
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        // Retornar valores padrão em caso de erro
        return {
          totalMissions: 0,
          activeMissions: 0,
          completedMissions: 0,
          totalParticipants: 0,
        };
      }
    },
    enabled: !!user,
    retry: 1, // Tentar apenas uma vez em caso de erro
    staleTime: 30000, // Cache por 30 segundos
  });

  // Query para buscar missões
  const { data: missions, isLoading: missionsLoading, error: missionsError } = useQuery({
    queryKey: ['missions', searchTerm, filterStatus],
    queryFn: async (): Promise<Mission[]> => {
      try {
        let query = supabase
          .from('missions')
          .select('*')
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.ilike('title', `%${searchTerm}%`);
        }

        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus);
        }

        const { data, error } = await query;

        if (error) {
          // Se a tabela não existe, retornar array vazio
          if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
            console.warn('Tabela missions não existe ainda');
            return [];
          }
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Erro ao buscar missões:', error);
        // Não mostrar toast de erro se for problema de tabela não existir
        if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
          toast.error('Erro ao carregar missões');
        }
        return [];
      }
    },
    enabled: !!user,
    retry: 1, // Tentar apenas uma vez em caso de erro
    staleTime: 30000, // Cache por 30 segundos
  });

  // Query para buscar cursos (para o MissionManager)
  const { data: courses } = useQuery({
    queryKey: ['courses-for-missions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('is_published', true)
          .order('title');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Erro ao buscar cursos:', error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Mostrar loading enquanto verifica autenticação
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              Missões
            </h1>
            <p className="text-gray-600 mt-1">Gerencie missões e desafios para os estudantes</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Nova Missão
          </Button>
        </div>

        {/* Aviso sobre configuração */}
        {(statsError || missionsError) && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800">Sistema de Missões em Configuração</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    As tabelas de missões estão sendo configuradas. Execute as migrações do Supabase para ativar todas as funcionalidades.
                  </p>
                  <p className="text-xs text-yellow-600 mt-2">
                    Migrações necessárias: create_rpg_mission_tables.sql, create_gamification_rpc.sql, fix_missions_rls_policies.sql
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Missões</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalMissions || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Compass className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Missões Ativas</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-green-600">{stats?.activeMissions || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-yellow-600">{stats?.completedMissions || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Participantes</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mt-2" />
                  ) : (
                    <p className="text-3xl font-bold text-purple-600">{stats?.totalParticipants || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar missões..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  className="whitespace-nowrap"
                >
                  Todas
                </Button>
                <Button
                  variant={filterStatus === 'available' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('available')}
                  className="whitespace-nowrap"
                >
                  Ativas
                </Button>
                <Button
                  variant={filterStatus === 'completed' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('completed')}
                  className="whitespace-nowrap"
                >
                  Completadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs para diferentes tipos de missões */}
        <Tabs defaultValue="course-missions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-xl border-white/20">
            <TabsTrigger value="course-missions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
              Missões de Curso
            </TabsTrigger>
            <TabsTrigger value="track-missions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
              Missões de Trilha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="course-missions" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Missões de Curso
                </CardTitle>
                <CardDescription>
                  Gerencie missões específicas para cursos individuais
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courses && courses.length > 0 ? (
                  <MissionManager 
                    courseId={courses[0]?.id || ''} 
                    modules={[]} 
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum curso disponível para criar missões</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="track-missions" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-purple-600" />
                  Missões de Trilha
                </CardTitle>
                <CardDescription>
                  Gerencie missões que abrangem múltiplos cursos em uma trilha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrackMissionManager trackId="" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Lista de Missões */}
        <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle>Missões Recentes</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as missões do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {missionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : missions && missions.length > 0 ? (
              <div className="space-y-4">
                {missions.map((mission) => (
                  <div key={mission.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <Compass className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{mission.title}</h3>
                        <p className="text-sm text-gray-600">
                          {mission.points} pontos • Criada em {new Date(mission.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={mission.status === 'available' ? 'default' : mission.status === 'completed' ? 'secondary' : 'outline'}
                        className={mission.status === 'available' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {mission.status === 'available' ? 'Ativa' : 
                         mission.status === 'completed' ? 'Completada' : 
                         mission.status === 'in_progress' ? 'Em Progresso' : mission.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Compass className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Nenhuma missão encontrada</p>
                <p className="text-sm text-gray-400">Crie sua primeira missão para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}