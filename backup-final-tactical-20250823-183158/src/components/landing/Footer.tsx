import { Twitter, Github } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <a href="#" className="inline-flex items-center gap-2">
              <div className="h-9 w-9 rounded-md border border-slate-300 bg-white shadow-sm flex items-center justify-center">
                <span className="text-[11px] font-semibold tracking-tight text-slate-800">ESQ</span>
              </div>
              <span className="text-slate-900 text-lg font-semibold tracking-tight">Esquads</span>
            </a>
            <p className="mt-3 text-sm text-slate-600">E‑learning gamificado de cibersegurança. Aprenda praticando.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Produto</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><a className="hover:text-slate-900 transition-colors" href="#cursos">Cursos</a></li>
              <li><a className="hover:text-slate-900 transition-colors" href="#missoes">Missões</a></li>
              <li><a className="hover:text-slate-900 transition-colors" href="#certificacoes">Certificações</a></li>
              <li><a className="hover:text-slate-900 transition-colors" href="#planos">Planos</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Empresa</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><a className="hover:text-slate-900 transition-colors" href="#empresas">Para Empresas</a></li>
              <li><a className="hover:text-slate-900 transition-colors" href="#">Carreiras</a></li>
              <li><a className="hover:text-slate-900 transition-colors" href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li><a className="hover:text-slate-900 transition-colors" href="#">Privacidade</a></li>
              <li><a className="hover:text-slate-900 transition-colors" href="#">Termos</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-500">© {currentYear} Esquads. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-500 hover:text-slate-700 transition-colors text-sm inline-flex items-center gap-1">
              <Twitter className="w-4 h-4" />
              Twitter
            </a>
            <a href="#" className="text-slate-500 hover:text-slate-700 transition-colors text-sm inline-flex items-center gap-1">
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
