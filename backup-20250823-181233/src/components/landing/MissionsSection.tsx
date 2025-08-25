import { Compass, Bug, Cloud, ArrowRight, Swords } from 'lucide-react';

export default function MissionsSection() {
  const scrollToPlans = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="missoes" className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Missões que evoluem com você</h2>
            <p className="mt-2 text-slate-700 text-sm md:text-base">Comece do básico e avance até pentests e defesa avançada.</p>
          </div>
          <button onClick={scrollToPlans} className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-slate-900 border border-slate-300 rounded-md px-3 py-2 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
            Requisitos por plano
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
                <Compass className="w-5 h-5 text-slate-800" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900">Fundamentos de Segurança</h3>
                <p className="text-xs text-slate-600">Privilégios, rede e criptografia</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-700">Duração</span>
                <span className="text-[12px] font-medium text-slate-900">6h</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{width: '70%'}}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Progresso</span>
                <span className="text-[12px] font-medium text-slate-800">70%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">+80 XP</span>
              <a href="#comecar" className="text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors inline-flex items-center gap-1">
                Iniciar
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
                <Bug className="w-5 h-5 text-slate-800" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900">Web Exploitation</h3>
                <p className="text-xs text-slate-600">OWASP Top 10 na prática</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-700">Duração</span>
                <span className="text-[12px] font-medium text-slate-900">8h</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{width: '45%'}}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Progresso</span>
                <span className="text-[12px] font-medium text-slate-800">45%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">+150 XP</span>
              <a href="#comecar" className="text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors inline-flex items-center gap-1">
                Continuar
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-slate-800" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900">Cloud Sec Ops</h3>
                <p className="text-xs text-slate-600">AWS e Azure: IAM, VPC, WAF</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-700">Duração</span>
                <span className="text-[12px] font-medium text-slate-900">10h</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full animate-pulse" style={{width: '20%', animationDuration: '2.5s'}}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-600">Progresso</span>
                <span className="text-[12px] font-medium text-slate-800">20%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">+200 XP</span>
              <a href="#comecar" className="text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors inline-flex items-center gap-1">
                Praticar
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center animate-pulse" style={{animationDuration: '4s'}}>
              <Swords className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 tracking-tight">Novas missões toda semana</p>
              <p className="text-xs text-slate-600">Temporadas com temas e recompensas exclusivas.</p>
            </div>
          </div>
          <a href="#comecar" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
            Começar agora
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
