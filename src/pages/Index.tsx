import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Sparkles, Shield, Cloud, Users, Star, Trophy, Zap, Target, Clock, Award, ChevronRight, Quote, User } from "lucide-react";
import SignatureAurora from "@/components/SignatureAurora";
import heroImage from "@/assets/hero-esquads.jpg";
import { Link } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
const Index = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, courses: 0, certificates: 0 });

  useEffect(() => {
    document.title = "Esquads — Educação Tech por IA";
    
    // Buscar estatísticas da plataforma
    const fetchStats = async () => {
      try {
        const [usersResult, coursesResult, certificatesResult] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('courses').select('id', { count: 'exact', head: true }),
          supabase.from('certificates').select('id', { count: 'exact', head: true })
        ]);
        
        setStats({
          users: usersResult.count || 0,
          courses: coursesResult.count || 0,
          certificates: certificatesResult.count || 0
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <main>
        {/* Hero Section */}
        <section className="container mx-auto grid md:grid-cols-2 gap-10 items-center py-14">
          <div>
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by AI
            </Badge>
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
                <a href="#pricing">Ver preços</a>
              </Button>
            </div>
            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="text-primary w-4 h-4" /> Curso completo em até 3 minutos</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="text-primary w-4 h-4" /> Trilhas personalizadas em até 2 minutos</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="text-primary w-4 h-4" /> Sistema de XP e certificações</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="text-primary w-4 h-4" /> Colaboração em squads</li>
            </ul>
          </div>
          <div className="relative">
            <img src={heroImage} alt="Plataforma Esquads: educação em cibersegurança, cloud e IA" loading="lazy" className="w-full h-auto rounded-xl border border-border shadow-glow" />
            <SignatureAurora />
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">{stats.users.toLocaleString()}+</div>
                <p className="text-muted-foreground">Estudantes ativos</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">{stats.courses.toLocaleString()}+</div>
                <p className="text-muted-foreground">Cursos disponíveis</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">{stats.certificates.toLocaleString()}+</div>
                <p className="text-muted-foreground">Certificados emitidos</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que escolher a Esquads?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nossa plataforma combina inteligência artificial avançada com metodologias comprovadas de ensino
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>IA que gera conteúdo</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Gere cursos de 15-20 módulos com base nos seus objetivos e nível de conhecimento.
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Cibersegurança</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Labs práticos e desafios com validação de competências em segurança digital.
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Cloud className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Cloud e DevOps</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Trilhas para AWS, Azure, GCP com certificações modulares e projetos reais.
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Squads colaborativos</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Estude em squads, receba feedback e evolua com a comunidade tech.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-muted/30 py-16">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos que se adaptam ao seu ritmo</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Escolha o plano ideal para acelerar sua carreira em tecnologia
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Plano Gratuito */}
              <Card className="relative">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">Gratuito</Badge>
                  <CardTitle className="text-2xl">Starter</CardTitle>
                  <div className="text-3xl font-bold">R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> 3 cursos por mês</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Acesso básico aos labs</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Certificados básicos</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Comunidade Discord</li>
                  </ul>
                  <Button className="w-full" variant="outline">
                    <Link to="/app">Começar grátis</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Plano Pro */}
              <Card className="relative border-primary">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">Mais popular</Badge>
                <CardHeader>
                  <Badge variant="default" className="w-fit">Pro</Badge>
                  <CardTitle className="text-2xl">Professional</CardTitle>
                  <div className="text-3xl font-bold">R$ 49<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Cursos ilimitados</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Labs avançados</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Certificações profissionais</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Mentoria em squads</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Projetos práticos</li>
                  </ul>
                  <Button className="w-full">
                    <Link to="/app">Começar teste grátis</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Plano Enterprise */}
              <Card className="relative">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">Enterprise</Badge>
                  <CardTitle className="text-2xl">Corporativo</CardTitle>
                  <div className="text-3xl font-bold">R$ 199<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Tudo do Pro</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Trilhas customizadas</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Relatórios avançados</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Suporte prioritário</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> API personalizada</li>
                  </ul>
                  <Button className="w-full" variant="outline">
                    Falar com vendas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">O que nossos estudantes dizem</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Histórias reais de profissionais que transformaram suas carreiras
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "A IA da Esquads criou um curso personalizado que me levou de iniciante a certificado AWS em 3 meses. Incrível!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Maria Silva</p>
                    <p className="text-sm text-muted-foreground">DevOps Engineer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Os labs práticos de cibersegurança são fantásticos. Aprendi mais em 2 meses do que em anos de estudo tradicional."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">João Santos</p>
                    <p className="text-sm text-muted-foreground">Security Analyst</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "O sistema de squads me conectou com profissionais incríveis. Hoje trabalho na empresa dos meus sonhos!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Ana Costa</p>
                    <p className="text-sm text-muted-foreground">Cloud Architect</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-muted/30 py-16">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
              <p className="text-lg text-muted-foreground">
                Tire suas dúvidas sobre a plataforma Esquads
              </p>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-background rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Como funciona a geração de cursos por IA?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Nossa IA analisa seus objetivos, nível de conhecimento e preferências para criar um curso personalizado com 15-20 módulos. O processo leva apenas 3 minutos e inclui exercícios práticos, projetos e avaliações.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-background rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Posso cancelar minha assinatura a qualquer momento?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas adicionais. Seu acesso continuará ativo até o final do período pago.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-background rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Os certificados são reconhecidos no mercado?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Nossos certificados são validados por competências práticas e reconhecidos por empresas parceiras. Além disso, preparamos você para certificações oficiais como AWS, Azure e CompTIA.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-background rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Como funcionam os squads colaborativos?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Os squads são grupos de 4-6 estudantes com objetivos similares. Vocês estudam juntos, compartilham conhecimento, fazem projetos em equipe e recebem mentoria de profissionais experientes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-background rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Existe suporte técnico disponível?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim! Oferecemos suporte via chat, email e Discord. Usuários Pro e Enterprise têm acesso a suporte prioritário e sessões de mentoria individual.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para acelerar sua carreira em tech?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Junte-se a milhares de profissionais que já transformaram suas carreiras com a Esquads
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link to="/app">Começar agora grátis</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#pricing">Ver planos</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Esquads. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/courses" className="hover:underline">Cursos</Link>
                <Link to="/app" className="hover:underline">Minha jornada</Link>
                <Link to="/admin" className="hover:underline">Admin</Link>
              </>
            ) : (
              <>
                <a href="#features" className="hover:underline">Recursos</a>
                <a href="#pricing" className="hover:underline">Preços</a>
                <a href="#faq" className="hover:underline">FAQ</a>
              </>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
};
export default Index;