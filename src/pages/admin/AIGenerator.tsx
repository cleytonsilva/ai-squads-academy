import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { Brain, Loader2, BookOpen, Users, Star, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { GenerateCourseRequest, GenerationJob, Course } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function AIGenerator() {
  // Declarar TODOS os hooks primeiro, incondicionalmente
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generationJob, setGenerationJob] = useState<GenerationJob | null>(null);
  const [generatedCourse, setGeneratedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<GenerateCourseRequest>({
    title: '',
    description: '',
    target_audience: '',
    difficulty_level: 'beginner',
    num_modules: 12,
    include_final_exam: true,
    tone: 'profissional',
    module_length_min: 2200,
    module_length_max: 3500
  });
  const [jobProgress, setJobProgress] = useState<any>(null);

  // Polling para acompanhar o progresso do job
  useEffect(() => {
    if (!generationJob || generationJob.status === 'completed' || generationJob.status === 'failed') {
      return;
    }

    const pollJob = async () => {
      try {
        const { data, error } = await supabase
          .from('generation_jobs')
          .select('*')
          .eq('id', generationJob.id)
          .single();

        if (error) throw error;

        setGenerationJob(data);
        setJobProgress(data.output);

        if (data.status === 'completed' && data.output?.course_id) {
          // Buscar o curso gerado
          const { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select(`
              *,
              modules:modules(
                *,
                quizzes:quizzes(*)
              )
            `)
            .eq('id', data.output.course_id)
            .single();

          if (!courseError && courseData) {
            setGeneratedCourse(courseData);
            toast({ title: "Sucesso", description: "Curso gerado com sucesso!" });
          }
        } else if (data.status === 'failed') {
          toast({ title: "Erro", description: `Erro na geração: ${data.error || 'Erro desconhecido'}`, variant: "destructive" });
        }
      } catch (error) {
        console.error('Erro ao verificar status do job:', error);
      }
    };

    const interval = setInterval(pollJob, 2000); // Poll a cada 2 segundos
    return () => clearInterval(interval);
  }, [generationJob]);

  // Efeito para redirecionamento após todos os hooks serem declarados
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && user && user.role !== 'admin') {
      navigate('/app');
    }
  }, [authLoading, user, navigate]);

  // Renderização condicional APÓS todos os hooks
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Se não está autenticado ou não é admin, renderizar null
  // O redirecionamento será feito pelo useEffect acima
  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGenerationJob(null);
    setGeneratedCourse(null);
    setJobProgress(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-course', {
        body: formData
      });

      if (error) throw error;

      if (data?.job_id) {
        // Buscar o job criado
        const { data: jobData, error: jobError } = await supabase
          .from('generation_jobs')
          .select('*')
          .eq('id', data.job_id)
          .single();

        if (!jobError && jobData) {
          setGenerationJob(jobData);
          toast({ title: "Sucesso", description: "Geração iniciada! Acompanhe o progresso abaixo." });
        }
      }
    } catch (error: any) {
      console.error('Erro ao gerar curso:', error);
      toast({ title: "Erro", description: `Erro ao gerar curso: ${error.message || 'Erro desconhecido'}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishCourse = async () => {
    if (!generatedCourse) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          is_published: true, 
          status: 'published' 
        })
        .eq('id', generatedCourse.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Curso publicado com sucesso!" });
      navigate(`/admin/courses/${generatedCourse.id}/edit`);
    } catch (error: any) {
      console.error('Erro ao publicar curso:', error);
      toast({ title: "Erro", description: `Erro ao publicar curso: ${error.message}`, variant: "destructive" });
    }
  };

  const handleEditCourse = () => {
    if (generatedCourse) {
      navigate(`/admin/courses/${generatedCourse.id}/edit`);
    }
  };

  const resetGeneration = () => {
    setGenerationJob(null);
    setGeneratedCourse(null);
    setJobProgress(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerador de Cursos com IA
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Use inteligência artificial para criar cursos completos automaticamente. 
            Forneça os detalhes e nossa IA gerará módulos, conteúdo e avaliações.
          </p>
        </div>

        {!generationJob && !generatedCourse && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Curso *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Ex: Fundamentos de Liderança Empresarial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Público-alvo *
                  </label>
                  <select
                    required
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Selecione o público-alvo</option>
                    <option value="Estudantes">Estudantes</option>
                    <option value="CEOs">CEOs</option>
                    <option value="RH">Recursos Humanos (RH)</option>
                    <option value="Advogados">Advogados</option>
                    <option value="Não técnicos">Profissionais Não Técnicos</option>
                    <option value="Desenvolvedores">Desenvolvedores</option>
                    <option value="Designers">Designers</option>
                    <option value="Analistas">Analistas</option>
                    <option value="Gerentes">Gerentes</option>
                    <option value="Consultores">Consultores</option>
                    <option value="Empreendedores">Empreendedores</option>
                    <option value="Profissionais de TI">Profissionais de TI</option>
                    <option value="Vendedores">Vendedores</option>
                    <option value="Marketing">Profissionais de Marketing</option>
                    <option value="Geral">Público Geral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição do Curso *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Descreva o que o curso deve abordar, objetivos de aprendizado e benefícios..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nível de Dificuldade
                  </label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="beginner">Iniciante</option>
                    <option value="intermediate">Intermediário</option>
                    <option value="advanced">Avançado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Módulos
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.num_modules}
                    onChange={(e) => setFormData({ ...formData, num_modules: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tom do Curso
                  </label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="profissional">Profissional</option>
                    <option value="casual">Casual</option>
                    <option value="academico">Acadêmico</option>
                    <option value="pratico">Prático</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.include_final_exam}
                      onChange={(e) => setFormData({ ...formData, include_final_exam: e.target.checked })}
                      className="mr-2"
                    />
                    Incluir Prova Final
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Adiciona uma prova final de múltipla escolha ao curso
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanho Mínimo do Módulo (caracteres)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    max={5000}
                    value={formData.module_length_min}
                    onChange={(e) => setFormData({ ...formData, module_length_min: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanho Máximo do Módulo (caracteres)
                  </label>
                  <input
                    type="number"
                    min={2000}
                    max={10000}
                    value={formData.module_length_max}
                    onChange={(e) => setFormData({ ...formData, module_length_max: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Gerando curso com IA...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    <span>Gerar Curso com IA</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {(generationJob || generatedCourse) && (
          <div className="space-y-6">
            {/* Generation Progress and Results */}
            {generationJob && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Status da Geração</h2>
                  <div className="flex items-center space-x-2">
                    {generationJob.status === 'processing' && (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-blue-600 font-medium">Processando...</span>
                      </>
                    )}
                    {generationJob.status === 'completed' && (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-600 font-medium">Concluído</span>
                      </>
                    )}
                    {generationJob.status === 'failed' && (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-600 font-medium">Erro</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Events */}
                {jobProgress?.events && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-gray-900 mb-3">Progresso:</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {jobProgress.events.map((event: any, index: number) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <span>{event.message}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(event.at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress Modules */}
                {jobProgress?.progress_modules && jobProgress.progress_modules.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Módulos Criados:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {jobProgress.progress_modules.map((module: any, index: number) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{module.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generationJob.status === 'failed' && generationJob.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-medium text-red-900 mb-2">Erro:</h3>
                    <p className="text-sm text-red-700">{generationJob.error}</p>
                  </div>
                )}

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={resetGeneration}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Gerar Novamente
                  </button>
                </div>
              </div>
            )}

            {/* Generated Course Preview */}
            {generatedCourse && (
              <div className="space-y-6">
                {/* Course Overview */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Curso Gerado</h2>
                    <div className="flex space-x-3">
                      <button
                        onClick={resetGeneration}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Gerar Novamente
                      </button>
                      <button
                        onClick={handleEditCourse}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                      >
                        Editar Curso
                      </button>
                      <button
                        onClick={handlePublishCourse}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                      >
                        Publicar Curso
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Módulos</p>
                        <p className="font-semibold">{generatedCourse.modules?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Duração</p>
                        <p className="font-semibold">{generatedCourse.estimated_duration} min</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm text-gray-600">Nível</p>
                        <p className="font-semibold capitalize">{generatedCourse.difficulty_level}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{generatedCourse.title}</h3>
                    <p className="text-gray-600 mb-4">{generatedCourse.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Status: {generatedCourse.status}</span>
                      <span>•</span>
                      <span>Criado: {new Date(generatedCourse.created_at).toLocaleDateString()}</span>
                      {generatedCourse.ai_generated && (
                        <>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Brain className="w-4 h-4" />
                            <span>Gerado por IA</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modules List */}
                {generatedCourse.modules && generatedCourse.modules.length > 0 && (
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Módulos do Curso</h3>
                    <div className="space-y-4">
                      {generatedCourse.modules.map((module: any, index: number) => (
                        <div key={module.id} className="border border-gray-200 rounded-lg p-6 bg-white/40">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              Módulo {index + 1}: {module.title}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Tipo: {module.module_type}</span>
                              {module.quizzes && module.quizzes.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4" />
                                  <span>{module.quizzes.length} quiz(s)</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">
                            {module.description || 'Sem descrição'}
                          </p>
                          {module.content_jsonb?.summary && (
                            <div className="bg-gray-50 rounded p-3">
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {module.content_jsonb.summary}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
