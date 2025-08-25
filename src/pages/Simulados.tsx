import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, FileText, BarChart3, Play, CheckCircle } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useStudentData } from "@/hooks/useStudentData";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { supabase } from "@/integrations/supabase/client";

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'ENEM' | 'Vestibular' | 'Específico' | 'Área';
  duration_minutes: number;
  total_questions: number;
  difficulty: 'Baixo' | 'Médio' | 'Alto';
  subjects: string[];
  attempts: number;
  best_score?: number;
  last_attempt?: string;
  status: 'disponivel' | 'em_andamento' | 'concluido';
  created_at: string;
}

interface AssessmentAttempt {
  id: string;
  user_id: string;
  assessment_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent_minutes: number;
  status: string;
  completed_at?: string;
  created_at: string;
}

export default function SimuladosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSimulado, setSelectedSimulado] = useState<Assessment | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { profile } = useCurrentProfile();
  const { studentData } = useStudentData();

  // Buscar simulados e tentativas do usuário
  useEffect(() => {
    const fetchAssessmentsAndAttempts = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);

        // Buscar todos os simulados ativos
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('assessments')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (assessmentsError) throw assessmentsError;

        // Buscar tentativas do usuário
        let attemptsData = [];
        try {
          const { data, error: attemptsError } = await supabase
            .from('assessment_attempts')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
          
          if (attemptsError) {
            console.warn('Tabela assessment_attempts não encontrada, usando dados padrão:', attemptsError);
            attemptsData = [];
          } else {
            attemptsData = data || [];
          }
        } catch (error) {
          console.warn('Erro ao acessar assessment_attempts, usando dados padrão:', error);
          attemptsData = [];
        }

        setAttempts(attemptsData || []);

        // Combinar dados dos simulados com tentativas do usuário
        const assessmentsWithAttempts = assessmentsData?.map(assessment => {
          const userAttempts = attemptsData?.filter(attempt => attempt.assessment_id === assessment.id) || [];
          const completedAttempts = userAttempts.filter(attempt => attempt.status === 'completed');
          const inProgressAttempt = userAttempts.find(attempt => attempt.status === 'in_progress');
          
          const bestScore = completedAttempts.length > 0 
            ? Math.max(...completedAttempts.map(attempt => attempt.score))
            : undefined;
          
          const lastAttempt = completedAttempts.length > 0
            ? new Date(completedAttempts[0].completed_at || completedAttempts[0].created_at).toLocaleDateString('pt-BR')
            : undefined;

          let status: Assessment['status'] = 'disponivel';
          if (inProgressAttempt) {
            status = 'em_andamento';
          } else if (completedAttempts.length > 0) {
            status = 'concluido';
          }

          return {
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            type: assessment.type as Assessment['type'],
            duration_minutes: assessment.duration_minutes,
            total_questions: assessment.total_questions,
            difficulty: assessment.difficulty as Assessment['difficulty'],
            subjects: assessment.subjects || [],
            attempts: userAttempts.length,
            best_score: bestScore,
            last_attempt: lastAttempt,
            status,
            created_at: assessment.created_at
          };
        }) || [];

        setAssessments(assessmentsWithAttempts);
      } catch (error) {
        console.error('Erro ao buscar simulados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentsAndAttempts();
  }, [profile?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disponivel":
        return "bg-neutral-500/20 text-neutral-300";
      case "em_andamento":
        return `bg-${themeColors.primaryText.split("-")[1]}-500/20 text-${themeColors.primaryText.split("-")[1]}-500`;
      case "concluido":
        return "bg-green-500/20 text-green-500";
      default:
        return "bg-neutral-500/20 text-neutral-300";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Baixo":
        return "bg-green-500/20 text-green-500";
      case "Médio":
        return `bg-${themeColors.primaryText.split("-")[1]}-500/20 text-${themeColors.primaryText.split("-")[1]}-500`;
      case "Alto":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-neutral-500/20 text-neutral-300";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ENEM":
        return "bg-blue-500/20 text-blue-500";
      case "Vestibular":
        return "bg-purple-500/20 text-purple-500";
      case "Específico":
        return "bg-yellow-500/20 text-yellow-500";
      case "Área":
        return "bg-pink-500/20 text-pink-500";
      default:
        return "bg-neutral-500/20 text-neutral-300";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  const filteredSimulados = assessments.filter(
    (simulado) =>
      simulado.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      simulado.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      simulado.subjects.some((subject) => subject.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleStartAssessment = async (assessmentId: string) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('assessment_attempts')
        .insert({
          user_id: profile.id,
          assessment_id: assessmentId,
          status: 'in_progress',
          score: 0,
          correct_answers: 0,
          time_spent_minutes: 0
        });

      if (error) {
        console.warn('Não foi possível iniciar simulado - tabela não existe:', error);
        return;
      }

      // Atualizar estado local
      setAssessments(prev => prev.map(assessment => 
        assessment.id === assessmentId 
          ? { ...assessment, status: 'em_andamento', attempts: assessment.attempts + 1 }
          : assessment
      ));
    } catch (error) {
      console.error('Erro ao iniciar simulado:', error);
    }
  };

  // Estatísticas calculadas
  const totalAttempts = attempts.length;
  const completedAssessments = assessments.filter((s) => s.status === "concluido").length;
  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
    : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-white tracking-wider">SIMULADOS</h1>
          <p className="text-sm text-neutral-400">Pratique com simulados e teste seus conhecimentos</p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar simulados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TENTATIVAS</p>
                <p className="text-2xl font-bold text-white font-mono">{totalAttempts}</p>
              </div>
              <FileText className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CONCLUÍDOS</p>
                <p className="text-2xl font-bold text-green-500 font-mono">{completedAssessments}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">MÉDIA</p>
                <p className="text-2xl font-bold text-white font-mono">{averageScore}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulados Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSimulados.map((simulado) => (
          <Card
            key={simulado.id}
            className="bg-neutral-900 border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer"
            onClick={() => setSelectedSimulado(simulado)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wider">{simulado.title}</CardTitle>
                  <p className="text-xs text-neutral-400 font-mono">{simulado.type}</p>
                </div>
                <Badge className={getStatusColor(simulado.status)}>
                  {simulado.status === "disponivel"
                    ? "DISPONÍVEL"
                    : simulado.status === "em_andamento"
                      ? "EM ANDAMENTO"
                      : "CONCLUÍDO"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getTypeColor(simulado.type)}>{simulado.type.toUpperCase()}</Badge>
                <Badge className={getDifficultyColor(simulado.difficulty)}>{simulado.difficulty.toUpperCase()}</Badge>
              </div>

              <p className="text-sm text-neutral-300">{simulado.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(simulado.duration_minutes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{simulado.total_questions} questões</span>
                  </div>
                </div>
                <div className="text-xs text-neutral-400">
                  Tentativas: <span className="text-white font-mono">{simulado.attempts}</span>
                  {simulado.best_score && (
                    <span className="ml-4">
                      Melhor nota: <span className="text-white font-mono">{simulado.best_score}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {simulado.subjects.slice(0, 3).map((subject) => (
                  <Badge key={subject} className="bg-neutral-800 text-neutral-300 text-xs">
                    {subject}
                  </Badge>
                ))}
                {simulado.subjects.length > 3 && (
                  <Badge className="bg-neutral-800 text-neutral-300 text-xs">+{simulado.subjects.length - 3}</Badge>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {simulado.status === "em_andamento" ? (
                  <Button
                    size="sm"
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white flex-1`}
                  >
                    Continuar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (simulado.status === "disponivel") {
                        handleStartAssessment(simulado.id);
                      }
                    }}
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white flex-1`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Simulado Detail Modal */}
      {selectedSimulado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedSimulado.title}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedSimulado.type}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedSimulado(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">INFORMAÇÕES</h3>
                    <div className="flex gap-2 mb-3">
                      <Badge className={getStatusColor(selectedSimulado.status)}>
                        {selectedSimulado.status === "disponivel"
                          ? "DISPONÍVEL"
                          : selectedSimulado.status === "em_andamento"
                            ? "EM ANDAMENTO"
                            : "CONCLUÍDO"}
                      </Badge>
                      <Badge className={getTypeColor(selectedSimulado.type)}>
                        {selectedSimulado.type.toUpperCase()}
                      </Badge>
                      <Badge className={getDifficultyColor(selectedSimulado.difficulty)}>
                        {selectedSimulado.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-300">{selectedSimulado.description}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DETALHES</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Duração:</span>
                        <span className="text-white">{formatDuration(selectedSimulado.duration_minutes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Questões:</span>
                        <span className="text-white">{selectedSimulado.total_questions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Tentativas:</span>
                        <span className="text-white">{selectedSimulado.attempts}</span>
                      </div>
                      {selectedSimulado.best_score && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Melhor Nota:</span>
                          <span className="text-white font-mono">{selectedSimulado.best_score}</span>
                        </div>
                      )}
                      {selectedSimulado.last_attempt && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Última Tentativa:</span>
                          <span className="text-white font-mono">{selectedSimulado.last_attempt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">MATÉRIAS</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSimulado.subjects.map((subject) => (
                        <Badge key={subject} className="bg-neutral-800 text-neutral-300">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedSimulado.best_score && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESEMPENHO</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-400">Melhor Pontuação</span>
                          <span className="text-white font-mono">{selectedSimulado.best_score}/1000</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-3">
                          <div
                            className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                            style={{ width: `${(selectedSimulado.best_score / 1000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                {selectedSimulado.status === "em_andamento" ? (
                  <Button
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                  >
                    Continuar Simulado
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (selectedSimulado.status === "disponivel") {
                        handleStartAssessment(selectedSimulado.id);
                      }
                      setSelectedSimulado(null);
                    }}
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Simulado
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Ver Histórico
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}