import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Target, Award, Clock, BookOpen, Users, TrendingUp, Medal, Crown, Zap, CheckCircle, Shield, BarChart3, Calendar, Download, Share2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAchievementsData, Achievement, Course, StudyStats, RankingData, CompetencyData, PerformanceData } from '@/hooks/useAchievementsData';
import { useTheme } from '@/contexts/theme-context';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useStudentData } from '@/hooks/useStudentData';

// Interfaces movidas para useAchievementsData hook

const iconMap = {
  Trophy,
  Star,
  Medal,
  Award,
  Crown,
  Shield
};

export default function ConquistasPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { profile } = useCurrentProfile();
  const { studentData } = useStudentData();
  
  // Usar o hook para buscar dados reais
  const {
    achievements,
    courses,
    studyStats,
    rankingData,
    performanceData,
    competencyData,
    loading,
    error
  } = useAchievementsData();

  // Dados agora são buscados através do hook useAchievementsData

  const categories = ["todas", ...new Set(achievements.map(a => a.category))];

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case "Comum":
        return "bg-gray-500/20 text-gray-400";
      case "Raro":
        return "bg-blue-500/20 text-blue-400";
      case "Épico":
        return "bg-purple-500/20 text-purple-400";
      case "Lendário":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-neutral-500/20 text-neutral-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'active':
        return 'bg-blue-500/20 text-blue-400';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const downloadCertificate = (achievementId: string) => {
    // Implementar download do certificado em PDF
    console.log('Downloading certificate for:', achievementId);
  };

  const shareOnLinkedIn = (achievement: Achievement) => {
    const text = `Acabei de conquistar: ${achievement.title} na AI Squads Academy!`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredConquistas = achievements.filter(
    (conquista) => selectedCategory === "todas" || conquista.category === selectedCategory,
  );

  const unlockedCount = achievements.filter((c) => c.unlocked).length;
  const totalXP = achievements.filter((c) => c.unlocked).reduce((sum, c) => sum + c.xp_reward, 0);
  const progressPercentage = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className={`h-8 ${themeColors.muted} rounded w-1/4 mb-4`}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
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
          <h1 className={`text-3xl font-bold ${themeColors.foreground} tracking-wider`}>PERFIL DO ALUNO</h1>
          <p className={`text-sm ${themeColors.mutedForeground}`}>Acompanhe seu progresso acadêmico e conquistas</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-6 ${themeColors.muted}`}>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Cursos</span>
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Ranking</span>
          </TabsTrigger>
          <TabsTrigger value="competencies" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Competências</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Conquistas</span>
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`${themeColors.card} ${themeColors.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${themeColors.mutedForeground} tracking-wider`}>CONQUISTAS</p>
                    <p className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{unlockedCount}</p>
                  </div>
                  <Trophy className={`w-8 h-8 ${themeColors.foreground}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${themeColors.card} ${themeColors.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${themeColors.mutedForeground} tracking-wider`}>HORAS DE ESTUDO</p>
                    <p className={`text-2xl font-bold ${themeColors.cardForeground} font-mono`}>{studyStats?.total_hours || 0}</p>
                  </div>
                  <Clock className={`w-8 h-8 ${themeColors.cardForeground}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${themeColors.card} ${themeColors.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${themeColors.mutedForeground} tracking-wider`}>RANKING</p>
                    <p className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>#{rankingData?.current_position || 0}</p>
                  </div>
                  <Star className={`w-8 h-8 ${themeColors.foreground}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={`${themeColors.card} ${themeColors.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${themeColors.mutedForeground} tracking-wider`}>MÉDIA GERAL</p>
                    <p className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{studyStats?.assessments.average_score || 0}%</p>
                  </div>
                  <Award className={`w-8 h-8 ${themeColors.foreground}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card className={`${themeColors.card} ${themeColors.border}`}>
            <CardHeader>
              <CardTitle className={`${themeColors.foreground} flex items-center gap-2`}>
                <TrendingUp className="w-5 h-5" />
                Desenvolvimento e Progresso Acadêmico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" className={themeColors.mutedForeground} />
                    <XAxis dataKey="month" className={themeColors.mutedForeground} />
                    <YAxis className={themeColors.mutedForeground} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: themeColors.card.includes('bg-white') ? '#ffffff' : '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Desempenho (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Horas de Estudo"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cursos Tab */}
        <TabsContent value="courses" className="space-y-6">
          <Card className={`${themeColors.card} ${themeColors.border}`}>
            <CardHeader>
              <CardTitle className={`${themeColors.foreground} flex items-center gap-2`}>
                <BookOpen className="w-5 h-5" />
                Cursos Matriculados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className={`p-4 rounded-lg ${themeColors.muted} border ${themeColors.border}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`font-semibold ${themeColors.foreground}`}>{course.title}</h3>
                      <p className={`text-sm ${themeColors.mutedForeground}`}>
                        {course.completed_lessons}/{course.total_lessons} aulas concluídas
                      </p>
                    </div>
                    <Badge className={getStatusColor(course.status)}>
                      {course.status === 'completed' ? 'Concluído' : 
                       course.status === 'active' ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={themeColors.mutedForeground}>Progresso</span>
                      <span className={`${themeColors.foreground} font-mono`}>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className={`text-xs ${themeColors.mutedForeground}`}>
                      Último acesso: {new Date(course.last_accessed).toLocaleDateString('pt-BR')}
                    </span>
                    <Button size="sm" variant="outline">
                      Continuar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-6">
          <Card className={`${themeColors.card} ${themeColors.border}`}>
            <CardHeader>
              <CardTitle className={`${themeColors.foreground} flex items-center gap-2`}>
                <Users className="w-5 h-5" />
                Ranking Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${themeColors.primaryBg.replace('bg-', 'bg-').replace('-500', '-50')} border-l-4 border-blue-500`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${themeColors.mutedForeground}`}>Sua Posição</p>
                      <p className={`text-2xl font-bold ${themeColors.foreground}`}>#{rankingData?.current_position}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${themeColors.mutedForeground}`}>de {rankingData?.total_students} alunos</p>
                      <p className={`text-lg font-semibold ${themeColors.foreground}`}>{rankingData?.top_students.find(s => s.position === rankingData.current_position)?.score} pts</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className={`font-semibold ${themeColors.foreground} mb-4`}>Top 10 Alunos</h3>
                  {rankingData?.top_students.map((student, index) => (
                    <div key={student.position} className={`flex items-center justify-between p-3 rounded-lg ${
                      student.name === 'Você' ? `${themeColors.primaryBg.replace('bg-', 'bg-').replace('-500', '-50')} border border-blue-200` : themeColors.muted
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' : themeColors.muted
                        }`}>
                          {index < 3 ? (
                            index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
                          ) : (
                            <span className={`text-sm font-bold ${themeColors.foreground}`}>{student.position}</span>
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${themeColors.foreground} ${
                            student.name === 'Você' ? 'font-bold' : ''
                          }`}>{student.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono text-sm ${themeColors.foreground}`}>{student.score} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competencies Tab */}
        <TabsContent value="competencies" className="space-y-6">
          <Card className={`${themeColors.card} ${themeColors.border}`}>
            <CardHeader>
              <CardTitle className={`${themeColors.foreground} flex items-center gap-2`}>
                <Target className="w-5 h-5" />
                Visualização de Competências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={competencyData}>
                    <PolarGrid className={themeColors.mutedForeground} />
                    <PolarAngleAxis dataKey="subject" className={themeColors.foreground} />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      className={themeColors.mutedForeground}
                    />
                    <Radar
                      name="Competências"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                {competencyData.map((competency, index) => (
                  <div key={index} className={`p-3 rounded-lg ${themeColors.muted}`}>
                    <h4 className={`font-medium ${themeColors.foreground} text-sm`}>{competency.subject}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={competency.score} className="flex-1 h-2" />
                      <span className={`text-sm font-mono ${themeColors.foreground}`}>{competency.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Study Time by Subject */}
            <Card className={`${themeColors.card} ${themeColors.border}`}>
              <CardHeader>
                <CardTitle className={`${themeColors.foreground} flex items-center gap-2`}>
                  <Clock className="w-5 h-5" />
                  Tempo por Disciplina
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studyStats?.subjects.map((subject, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${themeColors.foreground}`}>{subject.name}</span>
                      <span className={`text-sm ${themeColors.mutedForeground}`}>{subject.hours}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(subject.hours / 50) * 100} className="flex-1 h-2" />
                      <Badge className={`text-xs ${subject.performance >= 80 ? 'bg-green-500/20 text-green-400' : subject.performance >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {subject.performance}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Assessment Statistics */}
            <Card className={`${themeColors.card} ${themeColors.border}`}>
              <CardHeader>
                <CardTitle className={`${themeColors.foreground} flex items-center gap-2`}>
                  <BarChart3 className="w-5 h-5" />
                  Desempenho em Avaliações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${themeColors.foreground}`}>{studyStats?.assessments.total}</p>
                    <p className={`text-xs ${themeColors.mutedForeground}`}>Total</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold text-green-500`}>{studyStats?.assessments.passed}</p>
                    <p className={`text-xs ${themeColors.mutedForeground}`}>Aprovado</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${themeColors.foreground}`}>{studyStats?.assessments.average_score}%</p>
                    <p className={`text-xs ${themeColors.mutedForeground}`}>Média</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${themeColors.mutedForeground}`}>Taxa de Aprovação</span>
                    <span className={`font-mono ${themeColors.foreground}`}>
                      {studyStats ? Math.round((studyStats.assessments.passed / studyStats.assessments.total) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={studyStats ? (studyStats.assessments.passed / studyStats.assessments.total) * 100 : 0} 
                    className="h-3" 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${themeColors.mutedForeground}`}>Horas Semanais</span>
                    <span className={`font-mono ${themeColors.foreground}`}>{studyStats?.weekly_hours}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${themeColors.mutedForeground}`} />
                    <span className={`text-sm ${themeColors.mutedForeground}`}>Meta: 15h/semana</span>
                  </div>
                  <Progress value={studyStats ? (studyStats.weekly_hours / 15) * 100 : 0} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      {/* Achievements Tab */}
      <TabsContent value="achievements" className="space-y-6">
        {/* Category Filter */}
        <Card className={`${themeColors.card} ${themeColors.border}`}>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? `${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`
                    : `${themeColors.border} ${themeColors.mutedForeground} hover:${themeColors.muted} hover:${themeColors.cardForeground} bg-transparent`
                }
              >
                {category === "todas" ? "Todas" : category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredConquistas.map((conquista) => {
          const IconComponent = iconMap[conquista.icon_name as keyof typeof iconMap] || Trophy;
          return (
            <Card
              key={conquista.id}
              className={`${themeColors.card} ${themeColors.border} hover:${themeColors.border.replace('border-neutral-200', 'border-neutral-300').replace('border-neutral-700', 'border-neutral-500')} transition-colors cursor-pointer ${
                !conquista.unlocked ? "opacity-60" : ""
              }`}
              onClick={() => setSelectedAchievement(conquista)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${conquista.unlocked ? themeColors.primaryBg : themeColors.muted}`}>
                    <IconComponent className={`w-6 h-6 ${themeColors.foreground}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-sm font-bold ${themeColors.foreground} tracking-wider`}>{conquista.title}</CardTitle>
                    <p className={`text-xs ${themeColors.mutedForeground}`}>{conquista.category}</p>
                  </div>
                  </div>
                  {conquista.unlocked && <Badge className="bg-green-500/20 text-green-500">DESBLOQUEADA</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={getRarityColor(conquista.rarity)}>{(conquista.rarity || 'Comum').toUpperCase()}</Badge>
                  <Badge className={`${themeColors.muted} ${themeColors.cardForeground}`}>{conquista.xp_reward} XP</Badge>
                </div>
                
                {conquista.unlocked && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => downloadCertificate(conquista.id)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => shareOnLinkedIn(conquista)}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      LinkedIn
                    </Button>
                  </div>
                )}

                <p className={`text-sm ${themeColors.cardForeground}`}>{conquista.description}</p>

                {conquista.unlocked ? (
                  <div className={`text-xs ${themeColors.mutedForeground}`}>
                    Desbloqueada em: <span className={`${themeColors.foreground} font-mono`}>{conquista.unlocked_date}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className={`${themeColors.mutedForeground}`}>Progresso</span>
                      <span className={`${themeColors.foreground} font-mono`}>
                        {conquista.progress}/{conquista.total_required}
                      </span>
                    </div>
                    <div className={`w-full ${themeColors.muted} rounded-full h-2`}>
                      <div
                        className={`${themeColors.primaryBg} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${(conquista.progress / conquista.total_required) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className={`${themeColors.card} ${themeColors.border} w-full max-w-2xl`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded ${selectedAchievement.unlocked ? themeColors.primaryBg : themeColors.muted}`}
                >
                  {(() => {
                    const IconComponent = iconMap[selectedAchievement.icon_name as keyof typeof iconMap] || Trophy;
                    return <IconComponent className={`w-8 h-8 ${themeColors.foreground}`} />;
                  })()}
                </div>
                <div>
                  <CardTitle className={`text-xl font-bold ${themeColors.foreground} tracking-wider`}>
                    {selectedAchievement.title}
                  </CardTitle>
                  <p className={`text-sm ${themeColors.mutedForeground}`}>{selectedAchievement.category}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedAchievement(null)}
                className={`${themeColors.mutedForeground} hover:${themeColors.foreground}`}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider mb-2`}>DESCRIÇÃO</h3>
                  <p className={`text-sm ${themeColors.cardForeground}`}>{selectedAchievement.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider mb-2`}>RARIDADE</h3>
                    <Badge className={getRarityColor(selectedAchievement.rarity)}>
                      {(selectedAchievement.rarity || 'Comum').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <h3 className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider mb-2`}>RECOMPENSA</h3>
                    <Badge className={`${themeColors.muted} ${themeColors.cardForeground}`}>{selectedAchievement.xp_reward} XP</Badge>
                  </div>
                </div>

                {selectedAchievement.unlocked ? (
                  <div>
                    <h3 className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider mb-2`}>DATA DE DESBLOQUEIO</h3>
                    <p className={`text-sm ${themeColors.foreground} font-mono`}>{selectedAchievement.unlocked_date}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider mb-2`}>PROGRESSO</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={`${themeColors.mutedForeground}`}>Concluído</span>
                        <span className={`${themeColors.foreground} font-mono`}>
                          {selectedAchievement.progress}/{selectedAchievement.total_required}
                        </span>
                      </div>
                      <div className={`w-full ${themeColors.muted} rounded-full h-3`}>
                        <div
                          className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${(selectedAchievement.progress / selectedAchievement.total_required) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </TabsContent>
      </Tabs>
    </div>
  );
}