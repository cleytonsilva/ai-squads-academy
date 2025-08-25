import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Clock, Trophy, Star, CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useStudentData } from "@/hooks/useStudentData";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { supabase } from "@/integrations/supabase/client";

interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'Diária' | 'Semanal' | 'Mensal' | 'Especial';
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  xp_reward: number;
  progress: number;
  total_required: number;
  status: 'disponivel' | 'em_andamento' | 'concluida' | 'expirada';
  expires_at?: string;
  category: string;
  created_at: string;
}

interface UserMission {
  id: string;
  user_id: string;
  mission_id: string;
  progress: number;
  status: string;
  completed_at?: string;
  created_at: string;
}

export default function MissoesPage() {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [loading, setLoading] = useState(true);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { profile } = useCurrentProfile();
  const { studentData } = useStudentData();

  // Buscar missões e progresso do usuário
  useEffect(() => {
    const fetchMissionsAndProgress = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);

        // Buscar todas as missões ativas
        const { data: missionsData, error: missionsError } = await supabase
          .from('missions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (missionsError) throw missionsError;

        // Buscar progresso do usuário nas missões
        const { data: userMissionsData, error: userMissionsError } = await supabase
          .from('user_missions')
          .select('*')
          .eq('user_id', profile.id);

        if (userMissionsError) throw userMissionsError;

        setUserMissions(userMissionsData || []);

        // Combinar dados das missões com progresso do usuário
        const missionsWithProgress = missionsData?.map(mission => {
          const userMission = userMissionsData?.find(um => um.mission_id === mission.id);
          const now = new Date();
          const expiresAt = mission.expires_at ? new Date(mission.expires_at) : null;
          
          let status: Mission['status'] = 'disponivel';
          if (userMission) {
            if (userMission.status === 'completed') {
              status = 'concluida';
            } else if (userMission.progress > 0) {
              status = 'em_andamento';
            }
          }
          
          // Verificar se a missão expirou
          if (expiresAt && now > expiresAt && status !== 'concluida') {
            status = 'expirada';
          }

          return {
            id: mission.id,
            title: mission.title,
            description: mission.description,
            type: mission.type as Mission['type'],
            difficulty: mission.difficulty as Mission['difficulty'],
            xp_reward: mission.xp_reward,
            progress: userMission?.progress || 0,
            total_required: mission.total_required,
            status,
            expires_at: mission.expires_at,
            category: mission.category,
            created_at: mission.created_at
          };
        }) || [];

        setMissions(missionsWithProgress);
      } catch (error) {
        console.error('Erro ao buscar missões:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissionsAndProgress();
  }, [profile?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "em_andamento":
        return `bg-${themeColors.primaryText.split("-")[1]}-500/20 text-${themeColors.primaryText.split("-")[1]}-500`;
      case "concluida":
        return "bg-green-500/20 text-green-500";
      case "disponivel":
        return "bg-neutral-500/20 text-neutral-300";
      case "expirada":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-neutral-500/20 text-neutral-300";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-green-500/20 text-green-500";
      case "Médio":
        return `bg-${themeColors.primaryText.split("-")[1]}-500/20 text-${themeColors.primaryText.split("-")[1]}-500`;
      case "Difícil":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-neutral-500/20 text-neutral-300";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Diária":
        return "bg-blue-500/20 text-blue-500";
      case "Semanal":
        return "bg-purple-500/20 text-purple-500";
      case "Mensal":
        return "bg-yellow-500/20 text-yellow-500";
      case "Especial":
        return "bg-pink-500/20 text-pink-500";
      default:
        return "bg-neutral-500/20 text-neutral-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "em_andamento":
        return <Target className="w-4 h-4" />;
      case "concluida":
        return <CheckCircle className="w-4 h-4" />;
      case "disponivel":
        return <Clock className="w-4 h-4" />;
      case "expirada":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getTimeLeft = (expiresAt?: string) => {
    if (!expiresAt) return "Sem prazo";
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expirada";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} dias`;
    if (hours > 0) return `${hours}h`;
    return "Menos de 1h";
  };

  const handleStartMission = async (missionId: string) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('user_missions')
        .upsert({
          user_id: profile.id,
          mission_id: missionId,
          progress: 0,
          status: 'in_progress'
        });

      if (error) throw error;

      // Atualizar estado local
      setMissions(prev => prev.map(mission => 
        mission.id === missionId 
          ? { ...mission, status: 'em_andamento', progress: 0 }
          : mission
      ));
    } catch (error) {
      console.error('Erro ao iniciar missão:', error);
    }
  };

  // Estatísticas calculadas
  const missoesEmAndamento = missions.filter(m => m.status === 'em_andamento').length;
  const missoesConcluidas = missions.filter(m => m.status === 'concluida').length;
  const xpTotal = studentData?.total_xp || 0;
  const sequencia = studentData?.current_streak || 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-neutral-700 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-neutral-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">MISSÕES</h1>
          <p className="text-sm text-neutral-400">Complete desafios e ganhe XP para subir de nível</p>
        </div>
        <div className="flex gap-2">
          <Button
            className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
          >
            Ver Recompensas
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">EM ANDAMENTO</p>
                <p className="text-2xl font-bold text-white font-mono">{missoesEmAndamento}</p>
              </div>
              <Target className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CONCLUÍDAS</p>
                <p className="text-2xl font-bold text-green-500 font-mono">{missoesConcluidas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">XP TOTAL</p>
                <p className="text-2xl font-bold text-white font-mono">{xpTotal.toLocaleString()}</p>
              </div>
              <Star className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">SEQUÊNCIA</p>
                <p className="text-2xl font-bold text-white font-mono">{sequencia}</p>
              </div>
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {missions.map((missao) => (
          <Card
            key={missao.id}
            className="bg-neutral-900 border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer"
            onClick={() => setSelectedMission(missao)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wider">{missao.title}</CardTitle>
                  <p className="text-xs text-neutral-400 font-mono">{missao.category}</p>
                </div>
                <div className="flex items-center gap-2">{getStatusIcon(missao.status)}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getStatusColor(missao.status)}>
                  {missao.status === "em_andamento"
                    ? "EM ANDAMENTO"
                    : missao.status === "concluida"
                      ? "CONCLUÍDA"
                      : missao.status === "disponivel"
                        ? "DISPONÍVEL"
                        : "EXPIRADA"}
                </Badge>
                <Badge className={getTypeColor(missao.type)}>{missao.type.toUpperCase()}</Badge>
                <Badge className={getDifficultyColor(missao.difficulty)}>{missao.difficulty.toUpperCase()}</Badge>
              </div>

              <p className="text-sm text-neutral-300">{missao.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Trophy className="w-3 h-3" />
                  <span>{missao.xp_reward} XP</span>
                  <Clock className="w-3 h-3 ml-2" />
                  <span>{getTimeLeft(missao.expires_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Target className="w-3 h-3" />
                  <span>Categoria: {missao.category}</span>
                </div>
              </div>

              {missao.status !== "disponivel" && missao.status !== "expirada" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Progresso</span>
                    <span className="text-white font-mono">
                      {missao.progress}/{missao.total_required}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div
                      className={`${themeColors.primaryBg} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${(missao.progress / missao.total_required) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {missao.status === "disponivel" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartMission(missao.id);
                    }}
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white flex-1`}
                  >
                    Iniciar Missão
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mission Detail Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedMission.title}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedMission.category}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedMission(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">STATUS DA MISSÃO</h3>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(selectedMission.status)}>
                        {selectedMission.status === "em_andamento"
                          ? "EM ANDAMENTO"
                          : selectedMission.status === "concluida"
                            ? "CONCLUÍDA"
                            : selectedMission.status === "disponivel"
                              ? "DISPONÍVEL"
                              : "EXPIRADA"}
                      </Badge>
                      <Badge className={getTypeColor(selectedMission.type)}>{selectedMission.type.toUpperCase()}</Badge>
                      <Badge className={getDifficultyColor(selectedMission.difficulty)}>
                        {selectedMission.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DETALHES</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Categoria:</span>
                        <span className="text-white">{selectedMission.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Recompensa:</span>
                        <span className="text-white font-mono">{selectedMission.xp_reward} XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Tempo Restante:</span>
                        <span className="text-white font-mono">{getTimeLeft(selectedMission.expires_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Dificuldade:</span>
                        <Badge className={getDifficultyColor(selectedMission.difficulty)}>
                          {selectedMission.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">PROGRESSO</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Concluído</span>
                        <span className="text-white font-mono">
                          {selectedMission.progress}/{selectedMission.total_required}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3">
                        <div
                          className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${(selectedMission.progress / selectedMission.total_required) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESCRIÇÃO</h3>
                    <p className="text-sm text-neutral-300">{selectedMission.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                {selectedMission.status === "disponivel" ? (
                  <Button
                    onClick={() => {
                      handleStartMission(selectedMission.id);
                      setSelectedMission(null);
                    }}
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                  >
                    Iniciar Missão
                  </Button>
                ) : selectedMission.status === "em_andamento" ? (
                  <Button
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                  >
                    Continuar
                  </Button>
                ) : (
                  <Button disabled className="bg-neutral-700 text-neutral-400">
                    {selectedMission.status === "concluida" ? "Missão Concluída" : "Missão Expirada"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Ver Dicas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}