import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  Target, 
  Clock, 
  BookOpen, 
  Award, 
  Calendar,
  Activity,
  CheckCircle,
  AlertCircle,
  PlayCircle
} from "lucide-react";
import { Link } from "react-router-dom";

interface UserProgress {
  id: string;
  course_id: string;
  completion_percentage: number;
  last_accessed: string;
  time_spent_minutes: number | null;
  modules_completed: number;
  total_modules: number;
  quiz_scores: number[] | null;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string | null;
  duration_hours: number | null;
}

interface Activity {
  id: string;
  course_id: string;
  activity_type: 'lesson_completed' | 'quiz_completed' | 'assignment_submitted';
  points_earned: number;
  created_at: string;
}

interface Assignment {
  id: string;
  course_id: string;
  title: string;
  due_date: string | null;
  status: 'pending' | 'submitted' | 'graded';
  score: number | null;
  max_score: number;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

/**
 * Componente para exibir progresso detalhado do aluno
 * Inclui gráficos visuais, métricas de desempenho e atividades pendentes
 */
export default function StudentProgress() {
  const { profile } = useCurrentProfile();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  // Buscar progresso do usuário
  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["detailed-user-progress", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<UserProgress[]> => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", profile!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as UserProgress[];
    },
  });

  // Buscar cursos relacionados
  const courseIds = useMemo(() => 
    Array.from(new Set((userProgress || []).map(p => p.course_id))), 
    [userProgress]
  );
  
  const { data: courses } = useQuery({
    queryKey: ["progress-courses", courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,title,level,category,duration_hours")
        .in("id", courseIds);
      if (error) throw error;
      return data as Course[];
    },
  });

  // Buscar atividades recentes
  const { data: activities } = useQuery({
    queryKey: ["user-activities", profile?.id, timeRange],
    enabled: !!profile?.id,
    queryFn: async (): Promise<Activity[]> => {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      const { data, error } = await supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", profile!.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Activity[];
    },
  });

  // Buscar atividades pendentes
  const { data: pendingAssignments } = useQuery({
    queryKey: ["pending-assignments", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<Assignment[]> => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("user_id", profile!.id)
        .in("status", ["pending", "submitted"])
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as Assignment[];
    },
  });

  // Função para obter título do curso
  const getCourseTitle = (courseId: string) => 
    courses?.find(c => c.id === courseId)?.title || 'Curso não encontrado';

  // Calcular estatísticas gerais
  const stats = useMemo(() => {
    if (!userProgress) return {
      totalCourses: 0,
      completedCourses: 0,
      averageProgress: 0,
      totalTimeSpent: 0,
      averageScore: 0
    };

    const totalCourses = userProgress.length;
    const completedCourses = userProgress.filter(p => p.completion_percentage === 100).length;
    const averageProgress = totalCourses > 0 ? 
      Math.round(userProgress.reduce((sum, p) => sum + p.completion_percentage, 0) / totalCourses) : 0;
    const totalTimeSpent = userProgress.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0);
    
    // Calcular média de notas dos quizzes
    const allScores = userProgress
      .flatMap(p => p.quiz_scores || [])
      .filter(score => score !== null);
    const averageScore = allScores.length > 0 ? 
      Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length) : 0;

    return {
      totalCourses,
      completedCourses,
      averageProgress,
      totalTimeSpent,
      averageScore
    };
  }, [userProgress]);

  // Preparar dados para gráfico de progresso por curso
  const progressChartData = useMemo(() => {
    if (!userProgress || !courses) return [];
    
    return userProgress
      .filter(p => selectedCourse === 'all' || p.course_id === selectedCourse)
      .map(progress => {
        const course = courses.find(c => c.id === progress.course_id);
        return {
          name: course?.title.substring(0, 20) + (course?.title.length > 20 ? '...' : '') || 'Curso',
          progress: progress.completion_percentage,
          modules: `${progress.modules_completed}/${progress.total_modules}`,
          timeSpent: progress.time_spent_minutes || 0
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [userProgress, courses, selectedCourse]);

  // Preparar dados para gráfico de atividade ao longo do tempo
  const activityChartData = useMemo(() => {
    if (!activities) return [];
    
    const groupedByDate = activities.reduce((acc, activity) => {
      const date = new Date(activity.created_at).toLocaleDateString('pt-BR');
      if (!acc[date]) {
        acc[date] = { date, activities: 0, points: 0 };
      }
      acc[date].activities += 1;
      acc[date].points += activity.points_earned;
      return acc;
    }, {} as Record<string, { date: string; activities: number; points: number }>);
    
    return Object.values(groupedByDate)
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - 
                     new Date(b.date.split('/').reverse().join('-')).getTime());
  }, [activities]);

  // Preparar dados para gráfico de distribuição por nível
  const levelDistributionData = useMemo(() => {
    if (!userProgress || !courses) return [];
    
    const distribution = userProgress.reduce((acc, progress) => {
      const course = courses.find(c => c.id === progress.course_id);
      const level = course?.level || 'unknown';
      
      if (!acc[level]) {
        acc[level] = { level, count: 0, avgProgress: 0, totalProgress: 0 };
      }
      acc[level].count += 1;
      acc[level].totalProgress += progress.completion_percentage;
      acc[level].avgProgress = Math.round(acc[level].totalProgress / acc[level].count);
      
      return acc;
    }, {} as Record<string, { level: string; count: number; avgProgress: number; totalProgress: number }>);
    
    const levelLabels = {
      beginner: 'Iniciante',
      intermediate: 'Intermediário', 
      advanced: 'Avançado'
    };
    
    return Object.values(distribution).map(item => ({
      ...item,
      level: levelLabels[item.level as keyof typeof levelLabels] || item.level
    }));
  }, [userProgress, courses]);

  // Cores para os gráficos
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (progressLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando progresso...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-enter">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Meu Progresso Acadêmico
            </CardTitle>
            <CardDescription>
              Acompanhe seu desenvolvimento, notas e atividades pendentes
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            {courses && courses.length > 1 && (
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cursos</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title.substring(0, 30)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="progress">Progresso</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
            <TabsTrigger value="pending">Pendências</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Estatísticas principais */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">{stats.totalCourses}</div>
                  <div className="text-sm text-muted-foreground">Cursos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
                  <div className="text-2xl font-bold">{stats.completedCourses}</div>
                  <div className="text-sm text-muted-foreground">Concluídos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                  <div className="text-2xl font-bold">{stats.averageProgress}%</div>
                  <div className="text-sm text-muted-foreground">Progresso Médio</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                  <div className="text-2xl font-bold">{Math.round(stats.totalTimeSpent / 60)}h</div>
                  <div className="text-sm text-muted-foreground">Tempo Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Award className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                  <div className="text-2xl font-bold">{stats.averageScore}%</div>
                  <div className="text-sm text-muted-foreground">Nota Média</div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de distribuição por nível */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Nível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={levelDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ level, count }) => `${level}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {levelDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="progress" className="space-y-6">
            {/* Progresso geral */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progresso por Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'progress' ? `${value}%` : value,
                          name === 'progress' ? 'Progresso' : 'Tempo (min)'
                        ]}
                      />
                      <Bar dataKey="progress" fill={colors[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Lista detalhada de progresso */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes do Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProgress?.map((progress) => {
                    const course = courses?.find(c => c.id === progress.course_id);
                    return (
                      <div key={progress.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{getCourseTitle(progress.course_id)}</h4>
                          <Badge variant={progress.completion_percentage === 100 ? 'default' : 'secondary'}>
                            {progress.completion_percentage}%
                          </Badge>
                        </div>
                        <Progress value={progress.completion_percentage} className="mb-2" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <strong>Módulos:</strong> {progress.modules_completed}/{progress.total_modules}
                          </div>
                          <div>
                            <strong>Tempo:</strong> {Math.round((progress.time_spent_minutes || 0) / 60)}h
                          </div>
                          <div>
                            <strong>Último acesso:</strong> {new Date(progress.last_accessed).toLocaleDateString('pt-BR')}
                          </div>
                          <div>
                            <strong>Nível:</strong> {course?.level || 'N/A'}
                          </div>
                        </div>
                        {progress.quiz_scores && progress.quiz_scores.length > 0 && (
                          <div className="mt-2">
                            <strong className="text-sm">Notas dos Quizzes:</strong>
                            <div className="flex gap-2 mt-1">
                              {progress.quiz_scores.map((score, index) => (
                                <Badge key={index} variant="outline">
                                  {score}%
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-6">
            {/* Gráfico de atividade */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atividade ao Longo do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="activities" 
                        stroke={colors[0]} 
                        fill={colors[0]} 
                        fillOpacity={0.3}
                        name="Atividades"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Lista de atividades recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities?.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {getCourseTitle(activity.course_id)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.activity_type === 'lesson_completed' && 'Aula concluída'}
                          {activity.activity_type === 'quiz_completed' && 'Quiz concluído'}
                          {activity.activity_type === 'assignment_submitted' && 'Atividade enviada'}
                          {' • '}
                          {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        +{activity.points_earned} pts
                      </Badge>
                    </div>
                  ))}
                  {(!activities || activities.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      Nenhuma atividade no período selecionado.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-6">
            {/* Atividades pendentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Atividades Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingAssignments?.map((assignment) => {
                    const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
                    return (
                      <div key={assignment.id} className={`p-4 border rounded-lg ${
                        isOverdue ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{assignment.title}</h4>
                          <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                            {assignment.status === 'pending' ? 'Pendente' : 'Enviado'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          <strong>Curso:</strong> {getCourseTitle(assignment.course_id)}
                        </div>
                        {assignment.due_date && (
                          <div className="text-sm text-muted-foreground mb-2">
                            <strong>Prazo:</strong> {new Date(assignment.due_date).toLocaleDateString('pt-BR')}
                            {isOverdue && <span className="text-red-600 ml-2">(Atrasado)</span>}
                          </div>
                        )}
                        {assignment.score !== null && (
                          <div className="text-sm text-muted-foreground mb-2">
                            <strong>Nota:</strong> {assignment.score}/{assignment.max_score}
                          </div>
                        )}
                        <Button size="sm" asChild>
                          <Link to={`/courses/${assignment.course_id}`}>
                            <PlayCircle className="h-4 w-4 mr-1" />
                            {assignment.status === 'pending' ? 'Fazer Atividade' : 'Ver Detalhes'}
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                  {(!pendingAssignments || pendingAssignments.length === 0) && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <p className="text-muted-foreground">Parabéns! Você está em dia com todas as atividades.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}