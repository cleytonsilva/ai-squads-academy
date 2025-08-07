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
        <Link to="/" className="font-semibold text-base">Esquads</Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/courses" className={linkCls} end>Courses</NavLink>
          <NavLink to="/app" className={linkCls} end>Minha jornada</NavLink>
          {isAdmin && <NavLink to="/admin" className={linkCls} end>Admin</NavLink>}
        </nav>
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
