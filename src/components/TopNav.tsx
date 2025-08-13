import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type AppRole = "student" | "admin" | "instructor" | null;

export default function TopNav() {
  const location = useLocation();
  const [role, setRole] = useState<AppRole>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, display_name")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (mounted) {
            setRole((profile?.role as AppRole) ?? "student");
            setDisplayName(profile?.display_name || session.user.email || "Usuário");
          }
        } else {
          if (mounted) setRole(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setRole(null);
        setDisplayName("");
      } else {
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, display_name")
            .eq("user_id", session.user!.id)
            .maybeSingle();
          setRole((profile?.role as AppRole) ?? "student");
          setDisplayName(profile?.display_name || session.user!.email || "Usuário");
        }, 0);
      }
    });
    return () => { sub.subscription.unsubscribe(); mounted = false; };
  }, []);

  const isAdmin = role === "admin" || role === "instructor";
  const linkCls = ({ isActive }: { isActive: boolean }) => cn(
    "px-3 py-2 rounded-md text-sm transition",
    isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
  );

  const initials = useMemo(() => displayName?.split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase() || "U", [displayName]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta");
  };

  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/lovable-uploads/aeca3981-62ec-4107-85c4-2f118d51554d.png" alt="Esquads logo" className="h-10 w-10" />
          <span className="sr-only">Esquads</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {/* Navegação apenas para usuários logados */}
          {role && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/courses" className={linkCls} end>Courses</NavLink>
              <NavLink to="/achievements" className={linkCls} end>Achievements</NavLink>
              <NavLink to="/badges" className={linkCls} end>Badges</NavLink>
              <NavLink to="/ranking" className={linkCls} end>Ranking</NavLink>
              <NavLink to="/challenges" className={linkCls} end>Desafios</NavLink>
            </nav>
          )}
          
          {/* Navegação para visitantes */}
          {!role && (
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
            </nav>
          )}
          
          {/* Menu Admin para usuários logados */}
          {role && isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(
                "px-3 py-2 rounded-md text-sm transition",
                location.pathname.startsWith('/admin') ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
              )}>
                Admin
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/admin">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin?tab=users">Usuários</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin?tab=templates">Templates</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/achievements">Gerenciar Achievements</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/monitoring">Monitoramento</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/ranking">Ranking</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin?tab=challenges">Desafios</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/tracks">Trilhas</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-24 rounded-md bg-accent animate-pulse" />
          ) : role ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm max-w-[140px] truncate">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/app">Minha jornada</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="hero">
              <Link to="/app">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
