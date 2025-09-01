import { Target, FlaskConical, BadgeCheck, Trophy, ArrowRight } from 'lucide-react';
import { useScrollReveal, useScrollRevealStagger } from '@/hooks/useScrollReveal';

export default function LearningTracks() {
  const scrollToMissions = () => {
    document.getElementById('missoes')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll reveal animations
  const headerReveal = useScrollReveal({ delay: 0 }, 'default');
  const cardsStagger = useScrollRevealStagger(4, { delay: 200 }, 'staggered');

  return (
    <section id="cursos" className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div 
          ref={headerReveal.ref}
          className={`flex items-end justify-between gap-6 ${headerReveal.animationClasses}`}
          style={headerReveal.animationStyles}
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Aprenda cibersegurança com prática, não só teoria</h2>
            <p className="mt-2 text-slate-700 text-sm md:text-base">Missões gamificadas, laboratórios guiados, CTFs e simulados criados para que você domine segurança digital de forma prática e progressiva.</p>
          </div>
          <button onClick={scrollToMissions} className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-slate-900 border border-slate-300 rounded-md px-3 py-2 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
            Ver missões
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div 
          ref={cardsStagger.containerRef}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <div className={`rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1 ${cardsStagger.getItemClasses(0)}`}>
            <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-slate-800" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Missões e CTFs</h3>
            <p className="mt-1.5 text-sm text-slate-700">Supere desafios reais, ganhe badges e avance no ranking global.</p>
          </div>

          <div className={`rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1 ${cardsStagger.getItemClasses(1)}`}>
            <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-slate-800" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Labs guiados</h3>
            <p className="mt-1.5 text-sm text-slate-700">Ambientes seguros para testar ataques, explorar falhas e aplicar defesas.</p>
          </div>

          <div className={`rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1 ${cardsStagger.getItemClasses(2)}`}>
            <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-slate-800" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Certificações</h3>
            <p className="mt-1.5 text-sm text-slate-700">Trilhas que conectam teoria à prática com credenciais verificáveis.</p>
          </div>

          <div className={`rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1 ${cardsStagger.getItemClasses(3)}`}>
            <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-slate-800" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Gamificação</h3>
            <p className="mt-1.5 text-sm text-slate-700">Conquistas, níveis e recompensas para manter ritmo e engajamento.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
