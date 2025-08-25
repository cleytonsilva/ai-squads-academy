import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CurrentProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "student" | "admin" | "instructor";
  xp: number;
};

export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (mounted) setProfile(null);
          return;
        }
        const { data } = await supabase
          .from("profiles")
          .select("id,user_id,display_name,avatar_url,role,xp")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (mounted) setProfile(data as any);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) setProfile(null);
      else setTimeout(load, 0);
    });
    return () => { sub.subscription.unsubscribe(); mounted = false; };
  }, []);

  return { profile, loading } as const;
}
