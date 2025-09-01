import { Cloud, CloudRain, CloudSun, FileCheck2, CheckSquare, ListChecks } from 'lucide-react';
import { useScrollReveal, useScrollRevealStagger } from '@/hooks/useScrollReveal';

export default function CertificationsSection() {
  // Scroll reveal animations
  const leftContentReveal = useScrollReveal({ delay: 0 }, 'fromLeft');
  const rightContentReveal = useScrollReveal({ delay: 200 }, 'fromRight');
  const badgesStagger = useScrollRevealStagger(6, { delay: 400 }, 'staggered');

  return (
    <section id="certificacoes" className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div 
            ref={leftContentReveal.ref}
            className={`lg:col-span-6 ${leftContentReveal.animationClasses}`}
            style={leftContentReveal.animationStyles}
          >
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Trilhas inteligentes para certificações reconhecidas</h2>
            <p className="mt-2 text-slate-700 text-sm md:text-base">
              Prepare-se para AWS, Azure e Google Cloud com simulados adaptativos, flashcards e questões atualizadas. Estude no seu ritmo e acompanhe o progresso com relatórios detalhados.
            </p>

            <div className="mt-4">
              <a href="#certificacoes" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-all hover:-translate-y-0.5">
                Explorar certificações
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </a>
            </div>

            <div 
              ref={badgesStagger.containerRef}
              className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              <div className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-all hover:-translate-y-0.5 ${badgesStagger.getItemClasses(0)}`}>
                <Cloud className="w-4.5 h-4.5 text-slate-800" />
                <span className="text-sm font-medium">AWS</span>
              </div>
              <div className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-all hover:-translate-y-0.5 ${badgesStagger.getItemClasses(1)}`}>
                <CloudRain className="w-4.5 h-4.5 text-slate-800" />
                <span className="text-sm font-medium">Azure</span>
              </div>
              <div className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-all hover:-translate-y-0.5 ${badgesStagger.getItemClasses(2)}`}>
                <CloudSun className="w-4.5 h-4.5 text-slate-800" />
                <span className="text-sm font-medium">Google Cloud</span>
              </div>
              <div className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-all hover:-translate-y-0.5 ${badgesStagger.getItemClasses(3)}`}>
                <FileCheck2 className="w-4.5 h-4.5 text-slate-800" />
                <span className="text-sm font-medium">Simulados</span>
              </div>
              <div className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-all hover:-translate-y-0.5 ${badgesStagger.getItemClasses(4)}`}>
                <CheckSquare className="w-4.5 h-4.5 text-slate-800" />
                <span className="text-sm font-medium">Flashcards</span>
              </div>
              <div className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50 transition-all hover:-translate-y-0.5 ${badgesStagger.getItemClasses(5)}`}>
                <ListChecks className="w-4.5 h-4.5 text-slate-800" />
                <span className="text-sm font-medium">Questões</span>
              </div>
            </div>
          </div>

          <div 
            ref={rightContentReveal.ref}
            className={`lg:col-span-6 ${rightContentReveal.animationClasses}`}
            style={rightContentReveal.animationStyles}
          >
            <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1">
              <img src="https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80" alt="Ambiente de cibersegurança" className="h-64 w-full object-cover" />
              <div className="p-5">
                <div className="flex items-center gap-2 text-[12px] text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                  </svg>
                  Guia rápido
                </div>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Roteiro de estudos por certificação</h3>
                <p className="mt-1.5 text-sm text-slate-700">Trilhas inteligentes com metas semanais, simulados adaptativos e revisão espaçada.</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-[12px] font-medium text-slate-700 rounded-md border border-slate-200 px-2 py-1">Fundamentos</span>
                  <span className="text-[12px] font-medium text-slate-700 rounded-md border border-slate-200 px-2 py-1">Segurança em Nuvem</span>
                  <span className="text-[12px] font-medium text-slate-700 rounded-md border border-slate-200 px-2 py-1">Arquitetura</span>
                </div>
              </div>
            </div>
          </div>
        </div>        
      </div>
    </section>
  );
}
