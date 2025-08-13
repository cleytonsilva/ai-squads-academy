import { useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import DashboardLayout from '@/react-app/components/DashboardLayout';
import { Brain, Loader2, BookOpen, Users, Star, Clock } from 'lucide-react';
import type { GenerateCourseRequestType, AICourseMaterialType } from '@/shared/types';

export default function AIGenerator() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<AICourseMaterialType | null>(null);
  const [formData, setFormData] = useState<GenerateCourseRequestType>({
    title: '',
    description: '',
    target_audience: '',
    difficulty_level: 'beginner',
    modules_count: 12
  });

  if (!user && !isPending) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data.course_content);
      } else {
        alert('Erro ao gerar curso. Tente novamente.');
      }
    } catch (error) {
      console.error('Error generating course:', error);
      alert('Erro ao gerar curso. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!generatedContent) return;

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: generatedContent.title,
          description: generatedContent.description,
          target_audience: generatedContent.target_audience,
          difficulty_level: formData.difficulty_level,
          ai_generated: true,
        }),
      });

      if (response.ok) {
        alert('Curso criado com sucesso!');
        navigate('/courses');
      } else {
        alert('Erro ao criar curso. Tente novamente.');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Erro ao criar curso.');
    }
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

        {!generatedContent ? (
          // Form Section
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
                  <input
                    type="text"
                    required
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Ex: CEOs, RH, Advogados"
                  />
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
                    value={formData.modules_count}
                    onChange={(e) => setFormData({ ...formData, modules_count: parseInt(e.target.value) })}
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
        ) : (
          // Generated Content Preview
          <div className="space-y-6">
            {/* Course Overview */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Curso Gerado</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setGeneratedContent(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Gerar Novamente
                  </button>
                  <button
                    onClick={handleCreateCourse}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                  >
                    Criar Curso
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Módulos</p>
                    <p className="font-semibold">{generatedContent.modules.length}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Público-alvo</p>
                    <p className="font-semibold">{generatedContent.target_audience}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Prova Final</p>
                    <p className="font-semibold">{generatedContent.final_exam.questions.length} questões</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{generatedContent.title}</h3>
                <p className="text-gray-600 mb-4">{generatedContent.description}</p>
              </div>
            </div>

            {/* Modules List */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Módulos do Curso</h3>
              <div className="space-y-4">
                {generatedContent.modules.map((module, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white/40">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        Módulo {index + 1}: {module.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{module.duration_minutes} min</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {module.content.substring(0, 200)}...
                    </p>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-1" />
                      <span>Quiz com {module.quiz.questions.length} questões</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Exam */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Prova Final</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">{generatedContent.final_exam.title}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {generatedContent.final_exam.questions.length} questões de múltipla escolha
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
