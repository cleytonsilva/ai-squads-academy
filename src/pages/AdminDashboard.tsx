import { Helmet } from "react-helmet-async";

const AdminDashboard = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/admin` : "/admin";
  return (
    <main className="min-h-screen container mx-auto py-10">
      <Helmet>
        <title>Admin — Esquads</title>
        <meta name="description" content="Crie cursos, gerencie módulos e certificações na Esquads." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <h1 className="text-3xl font-bold mb-4">Administração</h1>
      <p className="text-muted-foreground">Conecte o Supabase para habilitar autenticação, RLS e gestão completa de conteúdo.</p>
    </main>
  );
};

export default AdminDashboard;
