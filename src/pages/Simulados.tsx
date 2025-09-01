import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, FileText, BarChart3, Play, CheckCircle, Construction, ArrowRight } from "lucide-react";
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
      <div className="px-4 py-6 space-y-6">
        <div className="animate-pulse">
          <div className={`h-8 ${themeColors.muted} rounded w-1/4 mb-4`}></div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-24 ${themeColors.muted} rounded`}></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`h-64 ${themeColors.muted} rounded`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${themeColors.foreground} tracking-wider`}>SIMULADOS</h1>
          <p className={`text-sm ${themeColors.mutedForeground}`}>Pratique com simulados e teste seus conhecimentos</p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className={`lg:col-span-2 ${themeColors.card} ${themeColors.border}`}>
          <CardContent className="p-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeColors.mutedForeground}`} />
              <Input
                placeholder="Buscar simulados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${themeColors.muted} ${themeColors.border} ${themeColors.foreground} placeholder:${themeColors.mutedForeground}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={`${themeColors.card} ${themeColors.border}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${themeColors.mutedForeground} tracking-wider`}>TENTATIVAS</p>
                <p className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{totalAttempts}</p>
              </div>
              <FileText className={`w-8 h-8 ${themeColors.foreground}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={`${themeColors.card} ${themeColors.border}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${themeColors.mutedForeground} tracking-wider`}>CONCLUÍDOS</p>
                <p className="text-2xl font-bold text-green-500 font-mono">{completedAssessments}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${themeColors.card} ${themeColors.border}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${themeColors.mutedForeground} tracking-wider`}>MÉDIA</p>
                <p className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{averageScore}</p>
              </div>
              <BarChart3 className={`w-8 h-8 ${themeColors.foreground}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção Em Construção */}
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Card className={`${themeColors.card} ${themeColors.border} w-full max-w-2xl`}>
          <CardContent className="p-12 text-center space-y-8">
            {/* Ícone de Construção */}
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-neutral-100 bg-gradient-to-br from-orange-100 to-orange-200 animate-pulse">
          <Construction className="w-16 h-16 text-orange-600 animate-construction" />
              </div>
            </div>

            {/* Título */}
            <div className="space-y-3">
              <h2 className={`text-3xl font-bold ${themeColors.foreground} tracking-wider`}>
                EM CONSTRUÇÃO
              </h2>
              <div className={`w-24 h-1 ${themeColors.primaryBg} mx-auto rounded-full`}></div>
            </div>

            {/* Texto Atraente */}
            <div className="space-y-4">
              <p className={`text-lg ${themeColors.cardForeground} leading-relaxed`}>
                Estamos preparando algo <span className="font-semibold text-orange-600">incrível</span> para você!
              </p>
              <p className="text-base text-neutral-500 leading-relaxed max-w-lg mx-auto">
              Em breve, você terá acesso a <strong>simulados específicos</strong> para as provas mais concorridas do mercado, incluindo ENEM, vestibulares de universidades federais, concursos públicos e certificações profissionais como <strong>AWS, GCP, Azure, ISO 27001, CISP</strong> e outras tecnologias em alta demanda.
            </p>
              <p className={`text-sm ${themeColors.mutedForeground} italic`}>
                Prepare-se para elevar seu desempenho a um novo patamar!
              </p>
            </div>

            {/* Call-to-Action */}
            <div className="pt-4">
              <Button 
                size="lg"
                className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white px-8 py-3 text-base font-semibold tracking-wide transition-all duration-300 transform hover:scale-105 shadow-lg`}
                onClick={() => {
                  // Aqui você pode adicionar lógica para notificar o usuário ou redirecionar
                  alert('Obrigado pelo interesse! Você será notificado quando os simulados estiverem disponíveis.');
                }}
              >
                <span>Quero ser notificado</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Informação adicional */}
            <div className={`text-xs ${themeColors.mutedForeground} pt-4 border-t ${themeColors.border}`}>
              <p>🚀 Novidades chegando em breve • 📚 Conteúdo de alta qualidade • 🎯 Foco nos seus objetivos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulado Detail Modal */}
      {selectedSimulado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className={`${themeColors.card} ${themeColors.border} w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className={`text-xl font-bold ${themeColors.foreground} tracking-wider`}>{selectedSimulado.title}</CardTitle>
                <p className={`text-sm ${themeColors.mutedForeground} font-mono`}>{selectedSimulado.type}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedSimulado(null)}
                className={`${themeColors.mutedForeground} hover:${themeColors.foreground}`}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className={`text-sm font-medium ${themeColors.cardForeground} tracking-wider mb-2`}>INFORMAÇÕES</h3>
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
                    <p className={`text-sm ${themeColors.cardForeground}`}>{selectedSimulado.description}</p>
                  </div>

                  <div>
                    <h3 className={`text-sm font-medium ${themeColors.cardForeground} tracking-wider mb-2`}>DETALHES</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={`${themeColors.mutedForeground}`}>Duração:</span>
                        <span className={`${themeColors.foreground}`}>{formatDuration(selectedSimulado.duration_minutes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${themeColors.mutedForeground}`}>Questões:</span>
                        <span className={`${themeColors.foreground}`}>{selectedSimulado.total_questions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${themeColors.mutedForeground}`}>Tentativas:</span>
                        <span className={`${themeColors.foreground}`}>{selectedSimulado.attempts}</span>
                      </div>
                      {selectedSimulado.best_score && (
                        <div className="flex justify-between">
                          <span className={`${themeColors.mutedForeground}`}>Melhor Nota:</span>
                          <span className={`${themeColors.foreground} font-mono`}>{selectedSimulado.best_score}</span>
                        </div>
                      )}
                      {selectedSimulado.last_attempt && (
                        <div className="flex justify-between">
                          <span className={`${themeColors.mutedForeground}`}>Última Tentativa:</span>
                          <span className={`${themeColors.foreground} font-mono`}>{selectedSimulado.last_attempt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className={`text-sm font-medium ${themeColors.cardForeground} tracking-wider mb-2`}>MATÉRIAS</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSimulado.subjects.map((subject) => (
                        <Badge key={subject} className={`${themeColors.muted} ${themeColors.cardForeground}`}>
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedSimulado.best_score && (
                    <div>
                      <h3 className={`text-sm font-medium ${themeColors.cardForeground} tracking-wider mb-2`}>DESEMPENHO</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={`${themeColors.mutedForeground}`}>Melhor Pontuação</span>
                          <span className={`${themeColors.foreground} font-mono`}>{selectedSimulado.best_score}/1000</span>
                        </div>
                        <div className={`w-full ${themeColors.muted} rounded-full h-3`}>
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

              <div className={`flex gap-2 pt-4 border-t ${themeColors.border}`}>
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
                  className={`${themeColors.border} ${themeColors.mutedForeground} hover:${themeColors.muted} hover:${themeColors.cardForeground} bg-transparent`}
                >
                  Ver Histórico
                </Button>
                <Button
                  variant="outline"
                  className={`${themeColors.border} ${themeColors.mutedForeground} hover:${themeColors.muted} hover:${themeColors.cardForeground} bg-transparent`}
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