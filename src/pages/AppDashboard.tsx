import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AppDashboard = () => {
  const { xp, level, addXP } = useAppStore();
  useEffect(() => {
    document.title = "Minha Jornada — Esquads";
  }, []);
  return (
    <main className="min-h-screen container mx-auto py-10">
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
