import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Play, 
  Lock, 
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number | null;
  is_published: boolean;
  category: string | null;
  thumbnail_url: string | null;
  required_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  prerequisites: string[] | null;
  created_at: string;
  updated_at: string;
}

interface UserProgress {
  course_id: string;
  completion_percentage: number;
  last_accessed: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface Enrollment {
  id: string;
  course_id: string;
  enrolled_at: string;
  status: 'active' | 'completed' | 'paused';
}

type FilterOption = 'all' | 'enrolled' | 'available' | 'completed' | 'in_progress';
type SortOption = 'title' | 'level' | 'duration' | 'updated' | 'progress';

/**
 * Componente para exibir e gerenciar cursos do aluno
 * Inclui filtros por plano, busca avançada e status de disponibilidade
 */
export default function StudentCourses() {
  const { profile } = useCurrentProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Buscar todos os cursos publicados
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("title");
      if (error) throw error;
      return data as Course[];
    },
  });

  // Buscar matrículas do usuário
  const { data: enrollments } = useQuery({
    queryKey: ["enrollments", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<Enrollment[]> => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return data as Enrollment[];
    },
  });

  // Buscar progresso do usuário
  const { data: userProgress } = useQuery({
    queryKey: ["user-progress", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<UserProgress[]> => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("course_id,completion_percentage,last_accessed")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return data.map(p => ({
        ...p,
        status: p.completion_percentage === 100 ? 'completed' : 
                p.completion_percentage > 0 ? 'in_progress' : 'not_started'
      })) as UserProgress[];
    },
  });

  // Simular plano do usuário (em produção, viria do perfil)
  const userPlan = profile?.subscription_plan || 'free';

  // Verificar se o usuário pode acessar um curso baseado no plano
  const canAccessCourse = (course: Course): boolean => {
    const planHierarchy = { free: 0, basic: 1, premium: 2, enterprise: 3 };
    const userPlanLevel = planHierarchy[userPlan as keyof typeof planHierarchy] || 0;
    const coursePlanLevel = planHierarchy[course.required_plan] || 0;
    return userPlanLevel >= coursePlanLevel;
  };

  // Verificar se o usuário atende aos pré-requisitos
  const meetsPrerequisites = (course: Course): boolean => {
    if (!course.prerequisites || course.prerequisites.length === 0) return true;
    
    // Verificar se o usuário completou os cursos pré-requisitos
    const completedCourses = (userProgress || [])
      .filter(p => p.status === 'completed')
      .map(p => p.course_id);
    
    return course.prerequisites.every(prereq => completedCourses.includes(prereq));
  };

  // Obter status do curso para o usuário
  const getCourseStatus = (course: Course) => {
    const enrollment = enrollments?.find(e => e.course_id === course.id);
    const progress = userProgress?.find(p => p.course_id === course.id);
    
    if (!canAccessCourse(course)) return 'locked';
    if (!meetsPrerequisites(course)) return 'prerequisites_required';
    if (progress?.status === 'completed') return 'completed';
    if (progress?.status === 'in_progress' || enrollment) return 'in_progress';
    return 'available';
  };

  // Filtrar e ordenar cursos
  const filteredAndSortedCourses = useMemo(() => {
    if (!courses) return [];
    
    let filtered = courses.filter(course => {
      // Filtro por termo de busca
      const matchesSearch = !searchTerm || 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro por nível
      const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
      
      // Filtro por categoria
      const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
      
      // Filtro por status
      const status = getCourseStatus(course);
      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'enrolled' && (status === 'in_progress' || status === 'completed')) ||
        (filterBy === 'available' && status === 'available') ||
        (filterBy === 'completed' && status === 'completed') ||
        (filterBy === 'in_progress' && status === 'in_progress');
      
      return matchesSearch && matchesLevel && matchesCategory && matchesFilter;
    });
    
    // Ordenar cursos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'level':
          const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
          return levelOrder[a.level] - levelOrder[b.level];
        case 'duration':
          return (a.duration_hours || 0) - (b.duration_hours || 0);
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'progress':
          const progressA = userProgress?.find(p => p.course_id === a.id)?.completion_percentage || 0;
          const progressB = userProgress?.find(p => p.course_id === b.id)?.completion_percentage || 0;
          return progressB - progressA;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [courses, searchTerm, filterBy, sortBy, selectedLevel, selectedCategory, userProgress, enrollments]);

  // Obter categorias únicas
  const categories = useMemo(() => {
    if (!courses) return [];
    return Array.from(new Set(courses.map(c => c.category).filter(Boolean)));
  }, [courses]);

  // Obter estatísticas
  const stats = useMemo(() => {
    if (!courses) return { total: 0, enrolled: 0, completed: 0, available: 0 };
    
    const total = courses.length;
    const enrolled = courses.filter(c => {
      const status = getCourseStatus(c);
      return status === 'in_progress' || status === 'completed';
    }).length;
    const completed = courses.filter(c => getCourseStatus(c) === 'completed').length;
    const available = courses.filter(c => getCourseStatus(c) === 'available').length;
    
    return { total, enrolled, completed, available };
  }, [courses, userProgress, enrollments]);

  // Renderizar status do curso
  const renderCourseStatus = (course: Course) => {
    const status = getCourseStatus(course);
    const progress = userProgress?.find(p => p.course_id === course.id);
    
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary">
            <Play className="h-3 w-3 mr-1" />
            Em Progresso ({progress?.completion_percentage || 0}%)
          </Badge>
        );
      case 'available':
        return (
          <Badge variant="outline">
            <BookOpen className="h-3 w-3 mr-1" />
            Disponível
          </Badge>
        );
      case 'locked':
        return (
          <Badge variant="destructive">
            <Lock className="h-3 w-3 mr-1" />
            Plano {course.required_plan}
          </Badge>
        );
      case 'prerequisites_required':
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pré-requisitos
          </Badge>
        );
      default:
        return null;
    }
  };

  // Renderizar nível do curso
  const renderLevel = (level: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado'
    };
    
    return (
      <Badge variant="secondary" className={colors[level as keyof typeof colors]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  if (coursesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando cursos...</span>
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
              <BookOpen className="h-5 w-5" />
              Meus Cursos
            </CardTitle>
            <CardDescription>
              Explore cursos disponíveis para seu plano e acompanhe seu progresso
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            Plano: {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.enrolled}</div>
              <div className="text-sm text-muted-foreground">Matriculado</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Concluído</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.available}</div>
              <div className="text-sm text-muted-foreground">Disponível</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="enrolled">Matriculado</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="beginner">Iniciante</SelectItem>
              <SelectItem value="intermediate">Intermediário</SelectItem>
              <SelectItem value="advanced">Avançado</SelectItem>
            </SelectContent>
          </Select>
          {categories.length > 0 && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Nome</SelectItem>
              <SelectItem value="level">Nível</SelectItem>
              <SelectItem value="duration">Duração</SelectItem>
              <SelectItem value="updated">Atualização</SelectItem>
              <SelectItem value="progress">Progresso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Cursos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedCourses.map((course) => {
            const status = getCourseStatus(course);
            const progress = userProgress?.find(p => p.course_id === course.id);
            const canAccess = status !== 'locked' && status !== 'prerequisites_required';
            
            return (
              <Card key={course.id} className={`relative group hover:shadow-lg transition-shadow ${
                !canAccess ? 'opacity-75' : ''
              }`}>
                <CardContent className="p-0">
                  {course.thumbnail_url && (
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      {!canAccess && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Lock className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm leading-tight">{course.title}</h3>
                      {renderCourseStatus(course)}
                    </div>
                    
                    {course.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {renderLevel(course.level)}
                      {course.duration_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duration_hours}h
                        </div>
                      )}
                    </div>
                    
                    {progress && progress.completion_percentage > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progresso</span>
                          <span>{progress.completion_percentage}%</span>
                        </div>
                        <Progress value={progress.completion_percentage} className="h-2" />
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setSelectedCourse(course)}
                          >
                            <Info className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{selectedCourse?.title}</DialogTitle>
                          </DialogHeader>
                          {selectedCourse && (
                            <div className="space-y-4">
                              {selectedCourse.thumbnail_url && (
                                <img 
                                  src={selectedCourse.thumbnail_url} 
                                  alt={selectedCourse.title}
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex gap-2">
                                {renderLevel(selectedCourse.level)}
                                {renderCourseStatus(selectedCourse)}
                              </div>
                              {selectedCourse.description && (
                                <p className="text-sm text-muted-foreground">
                                  {selectedCourse.description}
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Duração:</strong> {selectedCourse.duration_hours || 'N/A'}h
                                </div>
                                <div>
                                  <strong>Categoria:</strong> {selectedCourse.category || 'Geral'}
                                </div>
                                <div>
                                  <strong>Plano necessário:</strong> {selectedCourse.required_plan}
                                </div>
                                <div>
                                  <strong>Atualizado:</strong> {new Date(selectedCourse.updated_at).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                              {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                                <div>
                                  <strong className="text-sm">Pré-requisitos:</strong>
                                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                    {selectedCourse.prerequisites.map((prereq, index) => (
                                      <li key={index}>{prereq}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {canAccess ? (
                        <Button size="sm" className="flex-1" asChild>
                          <Link to={`/courses/${course.id}`}>
                            <Play className="h-4 w-4 mr-1" />
                            {status === 'completed' ? 'Revisar' : status === 'in_progress' ? 'Continuar' : 'Iniciar'}
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1" disabled>
                          <Lock className="h-4 w-4 mr-1" />
                          {status === 'locked' ? 'Upgrade' : 'Bloqueado'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {filteredAndSortedCourses.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum curso encontrado com os filtros aplicados.</p>
            <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou termos de busca.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}