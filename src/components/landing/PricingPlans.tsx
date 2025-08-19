import { useState } from 'react';
import { CheckCircle2, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';

export default function PricingPlans() {
  const [billingMode, setBillingMode] = useState<'monthly' | 'annual'>('monthly');

  return (
    <section id="planos" className="relative">
      {/* soft shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-indigo-100 blur-3xl opacity-70 animate-pulse" style={{animationDuration: '8s'}}></div>
        <div className="absolute bottom-0 -right-10 h-40 w-40 rounded-full bg-emerald-100 blur-3xl opacity-70 animate-pulse" style={{animationDuration: '10s'}}></div>
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Planos simples para crescer</h2>
          <p className="mt-2 text-slate-700 text-sm md:text-base">Escolha mensal ou economize no anual. Cancele quando quiser.</p>

          {/* Billing toggle (mensal/anual) */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm" role="tablist">
            <button 
              onClick={() => setBillingMode('monthly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                billingMode === 'monthly' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-900 hover:bg-slate-50'
              }`}
            >
              Mensal
            </button>
            <button 
              onClick={() => setBillingMode('annual')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all inline-flex items-center gap-1.5 ${
                billingMode === 'annual' 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-900 hover:bg-slate-50'
              }`}
            >
              Anual
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                economize 20%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Free */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">Free</h3>
              <span className="text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">Comece agora</span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-slate-900">R$ 0</span>
              <span className="text-sm text-slate-600">/mês</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Cursos básicos e labs introdutórios
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Missões iniciais e ranking
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Certificação nível básico
              </li>
            </ul>
            <a href="#comecar" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
              Criar conta gratuita
            </a>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[0_20px_60px_-24px_rgba(2,6,23,0.3)] transition-all hover:-translate-y-1">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 shadow-sm">
              Mais popular
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">Pro</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md animate-pulse" style={{animationDuration: '3.5s'}}>
                2 meses grátis no anual
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-slate-900">
                {billingMode === 'monthly' ? 'R$ 59' : 'R$ 47'}
              </span>
              <span className="text-sm text-slate-600">/mês</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Todas as missões e CTFs
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Labs avançados e trilhas guiadas
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Certificações exclusivas Pro
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Simulados adaptativos ilimitados
              </li>
            </ul>
            <a href="#comecar" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-all hover:-translate-y-0.5">
              Assinar Pro
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Corporate */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-[0_12px_30px_-12px_rgba(37,99,235,0.25)] transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">Corporate</h3>
              <span className="text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">Para equipes</span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-slate-900">Custom</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-800 mt-0.5 flex-shrink-0">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
                  <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
                  <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
                  <path d="M10 6h4"></path>
                  <path d="M10 10h4"></path>
                  <path d="M10 14h4"></path>
                  <path d="M10 18h4"></path>
                </svg>
                Dashboard, SSO e SCIM
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-800 mt-0.5 flex-shrink-0">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="m22 21-3-3m-3-3 3-3m3 3-3 3"></path>
                </svg>
                Trilhas por squad e relatórios
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-800 mt-0.5 flex-shrink-0">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                SLAs e suporte dedicado
              </li>
            </ul>
            <a href="#empresas" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
              Falar com vendas
              <MessageSquare className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
