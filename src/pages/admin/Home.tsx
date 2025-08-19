import { useEffect } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import { Loader2, GraduationCap, Brain, Award, Users } from 'lucide-react';

export default function Home() {
  const { user, isPending, redirectToLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && user) {
      navigate('/dashboard');
    }
  }, [user, isPending, navigate]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin">
          <Loader2 className="w-10 h-10 text-blue-600" />
        </div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <img 
                  src="https://mocha-cdn.com/0198a1fa-ecd4-794a-96a0-728614787c69/remove.photos-removed-background-(1).png" 
                  alt="Esquads Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Esquads</h1>
            </div>
            <button
              onClick={redirectToLogin}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Entrar com Google
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Plataforma de
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              E-Learning Inteligente
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Crie cursos com inteligência artificial, gerencie usuários, badges, certificados e 
            transforme o aprendizado em uma experiência gamificada e envolvente.
          </p>
          <button
            onClick={redirectToLogin}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105 font-semibold text-lg shadow-lg"
          >
            Acessar Dashboard Administrativo
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">IA Generativa</h3>
            <p className="text-gray-600">Crie cursos completos automaticamente com inteligência artificial avançada.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Cursos</h3>
            <p className="text-gray-600">Organize módulos, quizzes e avaliações de forma intuitiva e eficiente.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gamificação</h3>
            <p className="text-gray-600">Badges, certificados e rankings para engajar e motivar os alunos.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Usuários</h3>
            <p className="text-gray-600">Controle níveis de assinatura e permissões de forma granular.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Pronto para revolucionar o e-learning?
          </h3>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Acesse o dashboard administrativo e comece a criar experiências de aprendizado 
            extraordinárias com o poder da inteligência artificial.
          </p>
          <button
            onClick={redirectToLogin}
            className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg shadow-lg"
          >
            Começar Agora
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-white/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <img 
                  src="https://mocha-cdn.com/0198a1fa-ecd4-794a-96a0-728614787c69/remove.photos-removed-background-(1).png" 
                  alt="Esquads Logo" 
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="text-gray-700 font-medium">© 2025 Esquads. Transformando o futuro da educação.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
