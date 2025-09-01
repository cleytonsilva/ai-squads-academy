import { ShieldCheck, Play, Layers, Target, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDecryptAnimation } from '@/hooks/useDecryptAnimation';
import { useScrollReveal, useScrollRevealStagger } from '@/hooks/useScrollReveal';

export default function Hero() {
  const [currentTerm, setCurrentTerm] = useState(0);
  const terms = ['missões práticas', 'CTFs', 'laboratórios em nuvem', 'simulações de ataque'];
  
  // Animação de descriptografia para o título principal
  const heroTitle = 'Cibersegurança para todos, sem complicação';
  const decryptedTitle = useDecryptAnimation(heroTitle, 2500);

  // Scroll reveal animations
  const badgeReveal = useScrollReveal({ delay: 0 }, 'hero');
  const titleReveal = useScrollReveal({ delay: 200 }, 'hero');
  const descriptionReveal = useScrollReveal({ delay: 400 }, 'hero');
  const buttonsReveal = useScrollReveal({ delay: 600 }, 'hero');
  const badgesReveal = useScrollReveal({ delay: 800 }, 'hero');
  const dashboardReveal = useScrollReveal({ delay: 300 }, 'fromRight');
  const cardsStagger = useScrollRevealStagger(4, { delay: 100 }, 'staggered');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTerm((prev) => (prev + 1) % terms.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const scrollToPlans = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMissions = () => {
    document.getElementById('missoes')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden">
      {/* Soft background shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-indigo-100 blur-3xl opacity-70 animate-pulse" style={{animationDuration: '7s'}}></div>
        <div className="absolute top-28 -left-12 h-64 w-64 rounded-full bg-sky-100 blur-3xl opacity-70 animate-pulse" style={{animationDuration: '8s'}}></div>
        <div className="absolute bottom-0 right-1/3 h-56 w-56 rounded-full bg-emerald-100 blur-3xl opacity-60 animate-pulse" style={{animationDuration: '9s'}}></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <span 
              ref={badgeReveal.ref}
              className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 ${badgeReveal.animationClasses}`}
              style={badgeReveal.animationStyles}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Aprenda praticando em missões reais
            </span>
            <h1 
              ref={titleReveal.ref}
              className={`mt-5 text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 ${titleReveal.animationClasses}`}
              style={titleReveal.animationStyles}
            >
              {decryptedTitle}
            </h1>
            <div 
              ref={descriptionReveal.ref}
              className={`mt-4 text-base md:text-lg text-slate-700 ${descriptionReveal.animationClasses}`}
              style={descriptionReveal.animationStyles}
            >
              <p className="mb-2">
                Treine com{" "}
                <span className="font-semibold text-indigo-600 animate-pulse">
                  {terms[currentTerm]}
                </span>
                , simulações de ataque e defesa.
              </p>
              <p>
                Evolua do básico ao avançado e conquiste certificações de mercado.
              </p>
            </div>

            <div 
              ref={buttonsReveal.ref}
              className={`mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${buttonsReveal.animationClasses}`}
              style={buttonsReveal.animationStyles}
            >
              <a href="/auth?mode=signup" className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 text-white px-5 py-3 text-sm font-medium hover:bg-slate-800 shadow-sm ring-1 ring-slate-900/10 transition-all hover:shadow-md hover:-translate-y-0.5">
                <Play className="w-4 h-4" />
                Criar conta grátis
              </a>
              <button onClick={scrollToPlans} className="inline-flex items-center justify-center gap-2 rounded-md bg-white text-slate-900 px-5 py-3 text-sm font-medium border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
                <Layers className="w-4 h-4" />
                Ver planos
              </button>
              <button onClick={scrollToMissions} className="inline-flex items-center justify-center gap-2 rounded-md bg-white/70 text-slate-900 px-5 py-3 text-sm font-medium border border-slate-300 hover:border-slate-400 hover:bg-white transition-all hover:-translate-y-0.5">
                <Target className="w-4 h-4" />
                Ver missões
              </button>
            </div>

            {/* Badges */}
            <div 
              ref={badgesReveal.ref}
              className={`mt-6 flex flex-wrap items-center gap-2 ${badgesReveal.animationClasses}`}
              style={badgesReveal.animationStyles}
            >
              <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[12px] font-medium text-indigo-700 transition-all hover:-translate-y-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                Certificações exclusivas Pro
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-[12px] font-medium text-sky-700 transition-all hover:-translate-y-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
                AWS • Azure • Google Cloud
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700 transition-all hover:-translate-y-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"></path>
                  <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"></path>
                  <path d="M18 9h1.5a1 1 0 0 0 0-5H18"></path>
                  <path d="M4 22h16"></path>
                  <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"></path>
                  <path d="M6 9H4.5a1 1 0 0 1 0-5H6"></path>
                </svg>
                Rankings e missões
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div 
              ref={dashboardReveal.ref}
              className={`relative transition-transform duration-500 ease-out hover:scale-[1.01] ${dashboardReveal.animationClasses}`}
              style={dashboardReveal.animationStyles}
            >
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-50"></div>
              <div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_30px_80px_-20px_rgba(37,99,235,0.25)]">
                <div 
                  ref={cardsStagger.containerRef}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <div className={`rounded-xl border border-slate-200 p-4 bg-slate-50/70 hover:bg-slate-50 transition-all hover:-translate-y-0.5 hover:shadow ${cardsStagger.getItemClasses(0)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-slate-800">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 tracking-tight">Missão: Hardening</p>
                          <p className="text-xs text-slate-600">Linux Server</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">+120 XP</span>
                    </div>
                    <div className="mt-3">
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{width: '68%'}}></div>
                      </div>
                      <div className="mt-1 text-[12px] text-slate-600">Progresso 68%</div>
                    </div>
                  </div>

                  <div className={`rounded-xl border border-slate-200 p-4 bg-slate-50/70 hover:bg-slate-50 transition-all hover:-translate-y-0.5 hover:shadow ${cardsStagger.getItemClasses(1)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-slate-800">
                            <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"></path>
                            <path d="M4 6h.01"></path>
                            <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"></path>
                            <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"></path>
                            <path d="M12 18h.01"></path>
                            <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"></path>
                            <circle cx="12" cy="12" r="2"></circle>
                            <path d="m13.41 10.59 5.66-5.66"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 tracking-tight">CTF: Web Exploitation</p>
                          <p className="text-xs text-slate-600">OWASP Top 10</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">+200 XP</span>
                    </div>
                    <div className="mt-3">
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{width: '40%'}}></div>
                      </div>
                      <div className="mt-1 text-[12px] text-slate-600">Progresso 40%</div>
                    </div>
                  </div>

                  <div className={`rounded-xl border border-slate-200 p-4 bg-slate-50/70 hover:bg-slate-50 transition-all hover:-translate-y-0.5 hover:shadow ${cardsStagger.getItemClasses(2)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-slate-800">
                            <rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect>
                            <rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect>
                            <line x1="6" x2="6.01" y1="6" y2="6"></line>
                            <line x1="6" x2="6.01" y1="18" y2="18"></line>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 tracking-tight">Simulado: AWS Security</p>
                          <p className="text-xs text-slate-600">Ferramentas Free</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">50 questões</span>
                    </div>
                    <div className="mt-3">
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full animate-pulse" style={{width: '24%', animationDuration: '2.2s'}}></div>
                      </div>
                      <div className="mt-1 text-[12px] text-slate-600">Progresso 24%</div>
                    </div>
                  </div>

                  <div className={`rounded-xl border border-slate-200 p-4 bg-slate-50/70 hover:bg-slate-50 transition-all hover:-translate-y-0.5 hover:shadow ${cardsStagger.getItemClasses(3)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-slate-800">
                            <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path>
                            <circle cx="12" cy="8" r="6"></circle>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 tracking-tight">Certificação Pro</p>
                          <p className="text-xs text-slate-600">Blue Team Analyst</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Exclusivo Pro</span>
                    </div>
                    <div className="mt-3">
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{width: '82%'}}></div>
                      </div>
                      <div className="mt-1 text-[12px] text-slate-600">Progresso 82%</div>
                    </div>
                  </div>
                </div>

                {/* Soft footer */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
                      <Sparkles className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 tracking-tight">Trilha sugerida</p>
                      <p className="text-xs text-slate-600">Red Team • Web • Cloud</p>
                    </div>
                  </div>
                  <a href="#cursos" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
                    Explorar
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      
    </section>
  );
}
