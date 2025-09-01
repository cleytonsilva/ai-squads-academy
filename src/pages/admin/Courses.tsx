import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { BookOpen, Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '@/types/course';

export default function Courses() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/');
      return;
    }

    if (user) {
      fetchCourses();
    }
  }, [user, isPending, navigate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Verificar se há uma sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Erro", description: "Sessão expirada. Por favor, faça login novamente.", variant: "destructive" });
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          status,
          difficulty_level,
          is_published,
          created_at,
          updated_at,
          ai_generated,
          instructor_id,
          cover_image_url
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cursos:', error);
        toast({ title: "Erro", description: "Erro ao carregar cursos", variant: "destructive" });
        return;
      }

      setCourses(data || []);
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      toast({ title: "Erro", description: "Erro ao carregar cursos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesFilter = filterLevel === 'all' || course.difficulty_level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return level;
    }
  };

  if (isPending || !user) {
    return <div>Carregando...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Cursos</h1>
            <p className="text-gray-600 mt-2">
              Gerencie todos os cursos da plataforma
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/ai-generator')}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg"
            >
              <Brain className="w-4 h-4" />
              <span>Gerar com IA</span>
            </button>
            <button 
              onClick={() => navigate('/admin/courses/create')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center space-x-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Curso</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os níveis</option>
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {courses.length === 0 ? 'Nenhum curso criado' : 'Nenhum curso encontrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {courses.length === 0 
                ? 'Comece criando seu primeiro curso com IA ou manualmente.'
                : 'Tente ajustar os filtros ou termos de busca.'
              }
            </p>
            {courses.length === 0 && (
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => navigate('/ai-generator')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center space-x-2"
                >
                  <Brain className="w-4 h-4" />
                  <span>Gerar com IA</span>
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Criar Manualmente</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all group">
                <div className="p-6">
                  {/* Course Image Placeholder */}
                  <div className="h-40 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg mb-4 flex items-center justify-center">
                    {course.cover_image_url ? (
                      <img 
                        src={course.cover_image_url} 
                        alt={course.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <BookOpen className="w-12 h-12 text-blue-400" />
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                      <div className="relative">
                        <button className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {course.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty_level)}`}>
                          {getDifficultyLabel(course.difficulty_level)}
                        </span>
                        {course.ai_generated && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            IA
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.is_published ? 'Publicado' : 'Rascunho'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-500">
                        {course.total_modules} módulos
                      </span>
                      <div className="flex items-center space-x-1">
                        <button className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Visualizar">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
