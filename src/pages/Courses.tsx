import { Helmet } from "react-helmet-async";

const Courses = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/courses` : "/courses";
  return (
    <main className="min-h-screen container mx-auto py-10">
      <Helmet>
        <title>Cursos — Esquads</title>
        <meta name="description" content="Explore cursos de cibersegurança, cloud e IA da Esquads." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <h1 className="text-3xl font-bold mb-4">Catálogo de Cursos</h1>
      <p className="text-muted-foreground">Conecte o Supabase para habilitar a geração automática de cursos e filtros personalizados.</p>
    </main>
  );
};

export default Courses;
