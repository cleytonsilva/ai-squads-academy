import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Clock, Users, Star, Play, List, X } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useStudentData } from "@/hooks/useStudentData";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: number; // em horas
  students_count: number;
  rating: number;
  category: string;
  level: string;
  status: 'disponivel' | 'em_andamento' | 'concluido';
  progress?: number;
}

interface CourseProgress {
  course_id: string;
  progress_percentage: number;
  status: string;
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  duration?: number;
  is_completed?: boolean;
}

export default function CursosPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { profile } = useCurrentProfile();
  const { studentData } = useStudentData();

  // Buscar cursos e progresso do usuário
  useEffect(() => {
    const fetchCoursesAndProgress = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        console.log('🔍 Buscando cursos diretamente do Supabase...');

        // Buscar cursos diretamente do Supabase
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (coursesError) {
          console.error('❌ Erro ao buscar cursos:', coursesError);
          throw coursesError;
        }
        
        console.log('✅ Cursos carregados:', coursesData);

        // Buscar progresso do usuário (corrigido para user_progress)
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', profile.id);

        if (progressError) {
          console.warn('⚠️ Erro ao buscar progresso (tabela pode não existir):', progressError);
        }

        setCourseProgress(progressData || []);

        // Combinar dados dos cursos com progresso
        const coursesWithProgress = coursesData?.map((course: any) => {
          const progress = progressData?.find(p => p.course_id === course.id);
          return {
            id: course.id,
            title: course.title,
            description: course.description,
            instructor: course.instructor || 'Instrutor não definido',
            duration: course.duration || 0,
            students_count: course.students_count || 0,
            rating: course.rating || 4.5,
            category: course.category || 'Geral',
            level: course.level || 'Iniciante',
            status: progress ? 
              (progress.progress_percentage >= 100 ? 'concluido' : 'em_andamento') : 
              'disponivel',
            progress: progress?.progress_percentage || 0
          };
        }) || [];

        console.log(`✅ ${coursesWithProgress.length} cursos processados`);
        setCourses(coursesWithProgress);
      } catch (error) {
        console.error('❌ Erro ao buscar cursos:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndProgress();
  }, [profile?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "em_andamento":
        return `bg-${themeColors.primaryText.split("-")[1]}-500/20 text-${themeColors.primaryText.split("-")[1]}-500`;
      case "concluido":
        return "bg-green-500/20 text-green-500";
      case "disponivel":
        return "bg-neutral-500/20 text-neutral-300";
      default:
        return "bg-neutral-500/20 text-neutral-300";
    }
  };

  const filteredCursos = courses.filter(
    (curso) =>
      curso.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.instructor.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Estatísticas calculadas
  const cursosEmAndamento = courses.filter(c => c.status === 'em_andamento').length;
  const cursosConcluidos = courses.filter(c => c.status === 'concluido').length;
  const horasEstudadas = studentData?.total_study_hours || 0;

  // Função para iniciar/continuar curso - redireciona para página do curso
  const handleStartCourse = (courseId: string) => {
    console.log('🚀 Iniciando/continuando curso:', courseId);
    console.log('📊 Log de evento: COURSE_START_CLICKED', { courseId, userId: profile?.id, timestamp: new Date().toISOString() });
    
    try {
      // Redirecionar para a página do curso
      navigate(`/courses/${courseId}`);
      console.log('✅ Redirecionamento realizado para:', `/courses/${courseId}`);
    } catch (error) {
      console.error('❌ Erro ao redirecionar para curso:', error);
    }
  };

  // Função para visualizar curso (somente leitura)
  const handleViewCourse = (courseId: string) => {
    console.log('👁️ Visualizando curso:', courseId);
    console.log('📊 Log de evento: COURSE_VIEW_CLICKED', { courseId, userId: profile?.id, timestamp: new Date().toISOString() });
    
    // Redirecionar para visualização do curso
    navigate(`/courses/${courseId}`);
  };

  // Função para carregar módulos do curso
  const loadCourseModules = async (courseId: string) => {
    console.log('📚 Carregando módulos do curso:', courseId);
    console.log('📊 Log de evento: COURSE_MODULES_REQUESTED', { courseId, userId: profile?.id, timestamp: new Date().toISOString() });
    
    setLoadingModules(true);
    try {
      // Tentar buscar da tabela course_modules primeiro
      let { data: modules, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      // Se não encontrar, tentar tabela modules
      if (error || !modules || modules.length === 0) {
        console.log('⚠️ Tentando tabela modules como fallback...');
        const { data: fallbackModules, error: fallbackError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
        
        if (!fallbackError && fallbackModules) {
          modules = fallbackModules;
        }
      }

      if (error && !modules) {
        console.error('❌ Erro ao carregar módulos:', error);
        // Criar módulos de exemplo se não existirem
        modules = [
          { id: '1', title: 'Introdução ao Curso', description: 'Visão geral e objetivos', order_index: 1, duration: 30 },
          { id: '2', title: 'Conceitos Fundamentais', description: 'Base teórica necessária', order_index: 2, duration: 45 },
          { id: '3', title: 'Prática e Exercícios', description: 'Aplicação dos conceitos', order_index: 3, duration: 60 },
          { id: '4', title: 'Projeto Final', description: 'Consolidação do aprendizado', order_index: 4, duration: 90 }
        ];
      }

      setCourseModules(modules || []);
      console.log(`✅ ${modules?.length || 0} módulos carregados`);
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar módulos:', error);
      setCourseModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  // Função para exibir conteúdo do curso
  const handleViewContent = (courseId: string) => {
    console.log('📖 Visualizando conteúdo do curso:', courseId);
    console.log('📊 Log de evento: COURSE_CONTENT_VIEWED', { courseId, userId: profile?.id, timestamp: new Date().toISOString() });
    
    loadCourseModules(courseId);
    setShowModulesModal(true);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
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
          <h1 className="text-2xl font-bold text-white tracking-wider">MEUS CURSOS</h1>
          <p className="text-sm text-neutral-400">Gerencie seus cursos e acompanhe seu progresso</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Modo Visualização
          </Badge>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar cursos..."
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
                <p className="text-xs text-neutral-400 tracking-wider">EM ANDAMENTO</p>
                <p className="text-2xl font-bold text-white font-mono">{cursosEmAndamento}</p>
              </div>
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CONCLUÍDOS</p>
                <p className="text-2xl font-bold text-green-500 font-mono">{cursosConcluidos}</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">HORAS ESTUDADAS</p>
                <p className="text-2xl font-bold text-white font-mono">{horasEstudadas}h</p>
              </div>
              <Clock className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCursos.map((curso) => (
          <Card
            key={curso.id}
            className="bg-neutral-900 border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer"
            onClick={() => setSelectedCourse(curso)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wider">{curso.title}</CardTitle>
                  <p className="text-xs text-neutral-400">{curso.instructor}</p>
                </div>
                <Badge className={getStatusColor(curso.status)}>
                  {curso.status === "em_andamento"
                    ? "EM ANDAMENTO"
                    : curso.status === "concluido"
                      ? "CONCLUÍDO"
                      : "DISPONÍVEL"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-neutral-300">{curso.description}</p>

              <div className="flex items-center gap-4 text-xs text-neutral-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{curso.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{curso.students_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span>{curso.rating}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Badge className="bg-neutral-800 text-neutral-300 text-xs">{curso.category}</Badge>
                <Badge className="bg-neutral-800 text-neutral-300 text-xs">{curso.level}</Badge>
              </div>

              {curso.status !== "disponivel" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Progresso</span>
                    <span className="text-white font-mono">{curso.progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div
                      className={`${themeColors.primaryBg} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${curso.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewCourse(curso.id);
                  }}
                  className="text-neutral-300 border-neutral-600 hover:bg-neutral-800 hover:text-white flex-1"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Visualizar Curso
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedCourse.title}</CardTitle>
                <p className="text-sm text-neutral-400">{selectedCourse.instructor}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedCourse(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESCRIÇÃO</h3>
                    <p className="text-sm text-neutral-300">{selectedCourse.description}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DETALHES</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Duração:</span>
                        <span className="text-white">{selectedCourse.duration}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Estudantes:</span>
                        <span className="text-white">{selectedCourse.students_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Avaliação:</span>
                        <span className="text-white">{selectedCourse.rating}/5.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Nível:</span>
                        <span className="text-white">{selectedCourse.level}</span>
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
                        <span className="text-white font-mono">{selectedCourse.progress}%</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3">
                        <div
                          className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${selectedCourse.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">CATEGORIAS</h3>
                    <div className="flex gap-2">
                      <Badge className="bg-neutral-800 text-neutral-300">{selectedCourse.category}</Badge>
                      <Badge className="bg-neutral-800 text-neutral-300">{selectedCourse.level}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button
                  onClick={() => {
                    handleStartCourse(selectedCourse.id);
                    setSelectedCourse(null);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {selectedCourse.status === "disponivel" ? "Iniciar Curso" : "Continuar Estudos"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleViewContent(selectedCourse.id);
                  }}
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  <List className="w-4 h-4 mr-2" />
                  Ver Conteúdo
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Favoritar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Módulos do Curso */}
      {showModulesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-700">
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wider">Módulos do Curso</CardTitle>
                <p className="text-sm text-neutral-400">Conteúdo organizado por módulos</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowModulesModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingModules ? (
                <div className="p-6 space-y-4">
                  <div className="animate-pulse">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 bg-neutral-700 rounded mb-3"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                  {courseModules.length > 0 ? (
                    <div className="p-4 space-y-3">
                      {courseModules.map((module, index) => (
                        <div
                          key={module.id}
                          className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 hover:border-neutral-600 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {index + 1}
                                </div>
                                <h4 className="text-white font-medium">{module.title}</h4>
                              </div>
                              {module.description && (
                                <p className="text-neutral-400 text-sm mb-3 ml-11">{module.description}</p>
                              )}
                              <div className="flex items-center gap-4 ml-11">
                                {module.duration && (
                                  <div className="flex items-center gap-1 text-neutral-500 text-xs">
                                    <Clock className="w-3 h-3" />
                                    <span>{module.duration} min</span>
                                  </div>
                                )}
                                {module.is_completed && (
                                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                                    Concluído
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <h3 className="text-white font-medium mb-2">Nenhum módulo encontrado</h3>
                      <p className="text-neutral-400 text-sm">Este curso ainda não possui módulos configurados.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <div className="border-t border-neutral-700 p-4">
              <div className="flex justify-between items-center">
                <p className="text-neutral-400 text-sm">
                  {courseModules.length} módulo{courseModules.length !== 1 ? 's' : ''} disponível{courseModules.length !== 1 ? 'is' : ''}
                </p>
                <Button
                  onClick={() => setShowModulesModal(false)}
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}