import { Helmet } from "react-helmet-async";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";

const AppDashboard = () => {
  const { xp, level, addXP } = useAppStore();
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/app` : "/app";
  return (
    <main className="min-h-screen container mx-auto py-10">
      <Helmet>
        <title>Minha Jornada — Esquads</title>
        <meta name="description" content="Acompanhe seu progresso, XP e certificações na Esquads." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <h1 className="text-3xl font-bold mb-4">Minha Jornada</h1>
      <p className="text-muted-foreground mb-6">XP: {xp} • Nível: {level}</p>
      <div className="flex gap-3">
        <Button variant="hero" onClick={() => addXP(50)}>Concluir módulo (+50 XP)</Button>
        <Button variant="outline" onClick={() => addXP(200)}>Completar curso (+200 XP)</Button>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Conecte o Supabase para salvar progresso, squads e certificações.</p>
    </main>
  );
};

export default AppDashboard;
