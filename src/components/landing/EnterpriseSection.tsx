import { Briefcase, TrendingUp, Puzzle, Layers, Lock, Calendar, ArrowRight, Download } from 'lucide-react';
import { useScrollReveal, useScrollRevealStagger } from '@/hooks/useScrollReveal';

export default function EnterpriseSection() {
  // Scroll reveal animations
  const leftContentReveal = useScrollReveal({ delay: 0 }, 'fromLeft');
  const rightContentReveal = useScrollReveal({ delay: 200 }, 'fromRight');
  const featuresStagger = useScrollRevealStagger(4, { delay: 300 }, 'staggered');
  const buttonsReveal = useScrollReveal({ delay: 600 }, 'default');

  return (
    <section id="empresas" className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div 
            ref={leftContentReveal.ref}
            className={`lg:col-span-6 ${leftContentReveal.animationClasses}`}
            style={leftContentReveal.animationStyles}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 shadow-sm">
              <Briefcase className="w-4 h-4" />
              Para empresas
            </div>
            <h3 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Capacite squads de segurança com eficiência</h3>
            <p className="mt-2 text-slate-700 text-sm md:text-base">Crie trilhas por função, acompanhe indicadores de desempenho e gere relatórios de conformidade. Monitore engajamento e reduza riscos de forma mensurável.</p>

            <div 
              ref={featuresStagger.containerRef}
              className="mt-6 grid grid-cols-2 gap-3"
            >
              <div className={`rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-all ${featuresStagger.getItemClasses(0)}`}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-slate-800" />
                  <span className="text-sm font-medium">Métricas de skill</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">Avaliações contínuas e mensuráveis.</p>
              </div>
              <div className={`rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-all ${featuresStagger.getItemClasses(1)}`}>
                <div className="flex items-center gap-2">
                  <Puzzle className="w-4.5 h-4.5 text-slate-800" />
                  <span className="text-sm font-medium">Integrações</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">Conecte com Google, Slack e Microsoft.</p>
              </div>
              <div className={`rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-all ${featuresStagger.getItemClasses(2)}`}>
                <div className="flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-slate-800" />
                  <span className="text-sm font-medium">Trilhas por função</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">SOC, DevSecOps, GRC.</p>
              </div>
              <div className={`rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-all ${featuresStagger.getItemClasses(3)}`}>
                <div className="flex items-center gap-2">
                  <Lock className="w-4.5 h-4.5 text-slate-800" />
                  <span className="text-sm font-medium">Compliance</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">Acompanhe requisitos regulatórios com relatórios automáticos.</p>
              </div>
            </div>

            <div 
              ref={buttonsReveal.ref}
              className={`mt-6 flex items-center gap-3 ${buttonsReveal.animationClasses}`}
              style={buttonsReveal.animationStyles}
            >
              <a href="#contato" className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-all hover:-translate-y-0.5">
                Agendar demo
                <Calendar className="w-4 h-4" />
              </a>
              <a href="#planos" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
                Ver planos
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div 
            ref={rightContentReveal.ref}
            className={`lg:col-span-6 ${rightContentReveal.animationClasses}`}
            style={rightContentReveal.animationStyles}
          >
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-100 blur-3xl opacity-70 animate-pulse" style={{animationDuration: '9s'}}></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 tracking-tight">Squad Blue Team</p>
                    <p className="text-xs text-slate-600">8 membros • Nível Intermediário</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">Objetivo: L2</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-[11px] text-slate-600">Conformidade</p>
                  <p className="text-sm font-semibold text-slate-900">78%</p>
                  <div className="mt-2 h-2 w-full bg-slate-200 rounded-full">
                    <div className="h-2 bg-emerald-500 rounded-full" style={{width: '78%'}}></div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-[11px] text-slate-600">CloudSec</p>
                  <p className="text-sm font-semibold text-slate-900">61%</p>
                  <div className="mt-2 h-2 w-full bg-slate-200 rounded-full">
                    <div className="h-2 bg-sky-500 rounded-full" style={{width: '61%'}}></div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-[11px] text-slate-600">AppSec</p>
                  <p className="text-sm font-semibold text-slate-900">72%</p>
                  <div className="mt-2 h-2 w-full bg-slate-200 rounded-full">
                    <div className="h-2 bg-indigo-500 rounded-full" style={{width: '72%'}}></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 tracking-tight">Relatório mensal pronto</p>
                  <p className="text-xs text-slate-600">Exporte para PDF ou conecte ao Slack</p>
                </div>
                <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
                  Exportar
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div> 
      </div>
    </section>
  );
}
