import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import CertificateCard from "./CertificateCard";
import html2canvas from "html2canvas";

interface Certificate { id: string; course_id: string; issued_at: string; certificate_number: string | null; }
interface Course { id: string; title: string; }
interface UserBadge { id: string; badge_id: string; awarded_at: string; }
interface BadgeRow { id: string; name: string; description: string | null; image_url: string | null; }

export default function Achievements() {
  const { profile } = useCurrentProfile();
  const [holderName, setHolderName] = useState("");

  useEffect(() => { if (profile) setHolderName(profile.display_name || "Aluno Esquads"); }, [profile]);

  const { data: certs } = useQuery({
    queryKey: ["certificates", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<Certificate[]> => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id,course_id,issued_at,certificate_number")
        .eq("user_id", profile!.id)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any;
    },
  });

  const courseIds = useMemo(() => Array.from(new Set((certs || []).map(c => c.course_id))), [certs]);
  const { data: courses } = useQuery({
    queryKey: ["certificate-courses", courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase.from("courses").select("id,title").in("id", courseIds);
      if (error) throw error;
      return data as any;
    },
  });
  const courseTitle = (id: string) => (courses || []).find(c => c.id === id)?.title || id;

  const { data: userBadges } = useQuery({
    queryKey: ["user-badges", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<UserBadge[]> => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("id,badge_id,awarded_at")
        .eq("user_id", profile!.id)
        .order("awarded_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any;
    }
  });
  const badgeIds = useMemo(() => Array.from(new Set((userBadges || []).map(b => b.badge_id))), [userBadges]);
  const { data: badges } = useQuery({
    queryKey: ["badges", badgeIds.join(",")],
    enabled: badgeIds.length > 0,
    queryFn: async (): Promise<BadgeRow[]> => {
      const { data, error } = await supabase.from("badges").select("id,name,description,image_url").in("id", badgeIds);
      if (error) throw error;
      return data as any;
    }
  });

  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const setRef = (id: string) => (el: HTMLDivElement | null) => { refs.current[id] = el; };

  const downloadCertificate = async (c: Certificate) => {
    const key = c.id;
    const el = refs.current[key];
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: getComputedStyle(document.body).backgroundColor });
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `certificado-${c.certificate_number || c.id}.png`;
    a.click();
  };

  const shareCertificate = async (c: Certificate) => {
    const key = c.id;
    const el = refs.current[key];
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: getComputedStyle(document.body).backgroundColor });
    if ((navigator as any).share && canvas) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `certificado-${c.certificate_number || c.id}.png`, { type: "image/png" });
        try {
          await (navigator as any).share({ title: "Meu Certificado Esquads", text: "Conquista na Esquads!", files: [file] });
        } catch {}
      });
    }
  };

  return (
    <Card className="animate-enter">
      <CardHeader>
        <CardTitle>Conquistas</CardTitle>
        <CardDescription>Baixe e compartilhe certificados e visualize seus badges.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="font-medium mb-2">Certificados</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {(certs || []).map((c) => (
              <div key={c.id} className="space-y-2">
                <CertificateCard
                  title={courseTitle(c.course_id)}
                  holder={holderName}
                  number={c.certificate_number}
                  issuedAt={c.issued_at}
                  refEl={setRef(c.id)}
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => downloadCertificate(c)}>Baixar</Button>
                  <Button size="sm" onClick={() => shareCertificate(c)}>Compartilhar</Button>
                </div>
              </div>
            ))}
            {(!certs || certs.length === 0) && <p className="text-sm text-muted-foreground">Nenhum certificado ainda.</p>}
          </div>
        </section>

        <Separator />

        <section>
          <h3 className="font-medium mb-2">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {(userBadges || []).map((ub) => {
              const b = (badges || []).find(bb => bb.id === ub.badge_id);
              return (
                <Badge key={ub.id} variant="secondary" className="gap-2">
                  {b?.image_url ? (
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={b.image_url} alt={`Badge ${b.name}`} />
                      <AvatarFallback>{b.name?.charAt(0) || "B"}</AvatarFallback>
                    </Avatar>
                  ) : null}
                  {b?.name || ub.badge_id}
                </Badge>
              );
            })}
            {(!userBadges || userBadges.length === 0) && <p className="text-sm text-muted-foreground">Nenhum badge ainda.</p>}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
