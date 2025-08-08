import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useAppStore } from "@/store/useAppStore";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TrackBuilder from "@/components/app/TrackBuilder";
import ProgressOverview from "@/components/app/ProgressOverview";
import Achievements from "@/components/app/Achievements";

const AppDashboard = () => {
  const { xp, level } = useAppStore();
  const { profile } = useCurrentProfile();

  useEffect(() => {
    document.title = "Minha Jornada — Esquads";
  }, []);

  const canonical = useMemo(() => {
    try { return window.location.href } catch { return "/app" }
  }, []);

  return (
    <main className="min-h-screen container mx-auto py-10 space-y-6">
      <Helmet>
        <title>Minha Jornada | Esquads</title>
        <meta name="description" content="Construa sua trilha, acompanhe seu progresso, XP, certificados e badges." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header>
        <h1 className="text-3xl font-bold mb-1">Minha Jornada</h1>
        <p className="text-muted-foreground">Bem-vindo{profile?.display_name ? `, ${profile.display_name}` : ""}. XP: {xp} • Nível: {level}</p>
      </header>

      <TrackBuilder />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressOverview />
        <Achievements />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dica</CardTitle>
          <CardDescription>Conclua módulos diariamente para manter a sequência e ganhar mais XP.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/courses">Explorar cursos</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default AppDashboard;
