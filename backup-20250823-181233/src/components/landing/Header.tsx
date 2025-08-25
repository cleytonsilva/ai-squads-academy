import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Top Accent */}
      <div className="w-full h-1 bg-gradient-to-r from-indigo-200 via-sky-200 to-emerald-200 animate-pulse" style={{animationDuration: '6s'}}></div>
      
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-md border border-slate-300 bg-white shadow-sm flex items-center justify-center ring-1 ring-slate-100 transition-colors group-hover:border-slate-400">
                <span className="text-[11px] font-semibold tracking-tight text-slate-800">ESQ</span>
              </div>
              <span className="text-slate-900 text-lg md:text-xl font-semibold tracking-tight">Esquads</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#cursos" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Cursos</a>
              <a href="#missoes" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Missões</a>
              <a href="#planos" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Planos</a>
              <a href="#certificacoes" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Certificações</a>
              <a href="#empresas" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Empresas</a>
            </nav>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  <Link 
                    to={user.role === 'admin' ? '/admin' : '/dashboard'} 
                    className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md transition-all hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    Dashboard
                  </Link>
                  <Button 
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="text-sm font-medium"
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-md transition-all hover:-translate-y-0.5 hover:shadow-sm">Entrar</Link>
                  <Link to="/auth?mode=signup" className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
                    </svg>
                    Criar conta
                  </Link>
                </>
              )}
            </div>

            {/* Mobile */}
            <details className="lg:hidden group relative">
              <summary className="list-none inline-flex items-center justify-center h-10 w-10 rounded-md border border-slate-300 hover:border-slate-400 bg-white shadow-sm cursor-pointer transition-all hover:shadow-sm hover:-translate-y-0.5">
                <Menu className="w-5 h-5 text-slate-700" />
              </summary>
              <div className="absolute right-0 mt-3 w-[88vw] max-w-xs rounded-lg border border-slate-200 bg-white shadow-xl p-2 transition-all">
                <div className="flex flex-col">
                  <a href="#cursos" className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cursos</a>
                  <a href="#missoes" className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Missões</a>
                  <a href="#planos" className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Planos</a>
                  <a href="#certificacoes" className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Certificações</a>
                  <a href="#empresas" className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Empresas</a>
                  <div className="my-2 border-t border-slate-200"></div>
                  {user ? (
                    <>
                      <Link 
                        to={user.role === 'admin' ? '/admin' : '/dashboard'} 
                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <button 
                        onClick={handleSignOut}
                        className="mt-1 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Sair
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth" className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Entrar</Link>
                      <Link to="/auth?mode=signup" className="mt-1 inline-flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
                        </svg>
                        Criar conta
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
