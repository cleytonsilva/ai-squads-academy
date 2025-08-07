import { useEffect } from "react";

const AdminDashboard = () => {
  useEffect(() => {
    document.title = "Admin — Esquads";
  }, []);
  return (
    <main className="min-h-screen container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Administração</h1>
      <p className="text-muted-foreground">Conecte o Supabase para habilitar autenticação, RLS e gestão completa de conteúdo.</p>
    </main>
  );
};

export default AdminDashboard;
