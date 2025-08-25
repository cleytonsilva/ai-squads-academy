import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type RequireRoleProps = {
  roles: Array<"admin" | "instructor" | "student">;
};

const Loader = () => (
  <div className="container mx-auto py-10">
    <Skeleton className="h-8 w-44 mb-4" />
    <Skeleton className="h-4 w-72" />
  </div>
);

const RequireAuth = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Loader />;
  if (!isAuthed) return <Navigate to="/auth" replace state={{ from: location }} />;
  return <Outlet />;
};

export const RequireRole = ({ roles }: RequireRoleProps) => {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        if (mounted) {
          setAllowed(false);
          setLoading(false);
        }
        return;
      }
      setTimeout(async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        if (!mounted) return;
        setAllowed(profile ? roles.includes(profile.role as any) : false);
        setLoading(false);
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      if (!mounted) return;
      setAllowed(profile ? roles.includes(profile.role as any) : false);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [roles]);

  if (loading) return <Loader />;
  if (!allowed) return <Navigate to="/auth" replace state={{ from: location }} />;
  return <Outlet />;
};

export default RequireAuth;
