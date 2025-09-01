import { Sparkles, ArrowRight, Layers } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 md:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-100 blur-3xl opacity-70 animate-pulse" style={{animationDuration: '9s'}}></div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Comece grátis em 1 minuto
            </div>
            <h3 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Pronto para subir de nível em cibersegurança?</h3>
            <p className="mt-2 text-slate-700 text-sm md:text-base">Crie sua conta agora e desbloqueie missões que vão transformar seu aprendizado em prática real.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a href="/auth?mode=signup" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 text-white px-5 py-3 text-sm font-medium hover:bg-slate-800 shadow-sm ring-1 ring-slate-900/10 transition-all hover:shadow-md hover:-translate-y-0.5 animate-pulse" style={{animationDuration: '3s'}}>
                Criar conta grátis
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#planos" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-slate-900 px-5 py-3 text-sm font-medium hover:bg-slate-50 transition-all hover:-translate-y-0.5">
                Ver planos
                <Layers className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
