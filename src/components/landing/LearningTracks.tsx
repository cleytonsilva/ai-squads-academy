import { Target, FlaskConical, BadgeCheck, Trophy, ArrowRight } from 'lucide-react';

export default function LearningTracks() {
  const scrollToMissions = () => {
    document.getElementById('missoes')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="cursos" className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Aprenda com desafios práticos</h2>
            <p className="mt-2 text-slate-700 text-sm md:text-base">Missões, labs guiados e simulados para consolidar o conhecimento.</p>
          </div>
          <button onClick={scrollToMissions} className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-slate-900 border border-slate-300 rounded-md px-3 py-2 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
            Ver missões
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1">
            <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-slate-800" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Missões e CTFs</h3>
            <p className="mt-1.5 text-sm text-slate-700">Desafios reais de ofensiva e defensiva, com XP, badges e ranking global.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1">
            <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-slate-800" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Labs guiados</h3>
            <p className="mt-1.5 text-sm text-slate-700">Ambientes seguros para praticar exploits, análise de logs e hardening.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1">
            <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-slate-800" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Certificações</h3>
            <p className="mt-1.5 text-sm text-slate-700">Credenciais verificáveis. Nível básico no Free e exclusivas no Pro.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1">
            <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-slate-800" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Gamificação</h3>
            <p className="mt-1.5 text-sm text-slate-700">Trilhas, níveis, conquistas e temporadas para manter o foco e ritmo.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
