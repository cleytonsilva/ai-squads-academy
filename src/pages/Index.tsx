import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Shield, Cloud, Users } from "lucide-react";
import SignatureAurora from "@/components/SignatureAurora";
import heroImage from "@/assets/hero-esquads.jpg";
import { Link } from "react-router-dom";

const Index = () => {
  useEffect(() => {
    document.title = "Esquads — Educação Tech por IA";
  }, []);
  return (
    <>


      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <header className="container mx-auto py-6 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg">Esquads</Link>
          <nav className="flex items-center gap-4">
            <Link to="/courses" className="hover:underline">Cursos</Link>
            <Link to="/app" className="hover:underline">Minha jornada</Link>
            <Link to="/admin" className="hover:underline">Admin</Link>
            <Button asChild variant="hero" className="ml-2">
              <Link to="/app">Começar agora</Link>
            </Button>
          </nav>
        </header>

        <main>
          <section className="container mx-auto grid md:grid-cols-2 gap-10 items-center py-14">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Plataforma Esquads de Educação Tech com IA
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Geração automática de cursos, trilhas personalizadas e gamificação para acelerar sua carreira em cibersegurança, cloud e tecnologia.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild size="lg" variant="hero">
                  <Link to="/app">Criar minha trilha</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/courses">Explorar cursos</Link>
                </Button>
              </div>
              <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="text-primary" /> Curso completo em até 3 minutos</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="text-primary" /> Trilhas personalizadas em até 2 minutos</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="text-primary" /> Sistema de XP e certificações</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="text-primary" /> Colaboração em squads</li>
              </ul>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Plataforma Esquads: educação em cibersegurança, cloud e IA"
                loading="lazy"
                className="w-full h-auto rounded-xl border border-border shadow-glow"
              />
              <SignatureAurora />
            </div>
          </section>

          <section className="container mx-auto py-10">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles /> IA que gera conteúdo</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Gere cursos de 15-20 módulos com base nos seus objetivos e nível.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield /> Cibersegurança</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Labs práticos e desafios com validação de competências.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Cloud /> Cloud e DevOps</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Trilhas para AWS, Azure, GCP com certificações modulares.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users /> Squads colaborativos</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Estude em squads, receba feedback e evolua com a comunidade.
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="container mx-auto py-16">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h2 className="text-2xl font-semibold mb-2">João</h2>
                <p className="text-muted-foreground">Estudante de TI (20-25). Busca especialização e primeiro emprego.</p>
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Maria</h2>
                <p className="text-muted-foreground">Profissional em transição (28-35). Quer migrar para tecnologia com prática.</p>
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Carlos</h2>
                <p className="text-muted-foreground">Especialista (30-45). Precisa se atualizar rápido com conteúdo preciso.</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border py-8">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Esquads. Todos os direitos reservados.</p>
            <div className="flex items-center gap-3">
              <Link to="/courses" className="hover:underline">Cursos</Link>
              <Link to="/app" className="hover:underline">Minha jornada</Link>
              <Link to="/admin" className="hover:underline">Admin</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
