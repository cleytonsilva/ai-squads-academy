import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Award, Trophy, Medal, Download, Share2, Eye } from "lucide-react";
import CertificateCard from "@/components/app/CertificateCard";
import html2canvas from "html2canvas";

interface Certificate {
  id: string;
  course_id: string;
  issued_at: string;
  certificate_number: string | null;
}

interface Course {
  id: string;
  title: string;
  category?: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  awarded_at: string;
}

interface BadgeRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category?: string;
  points?: number;
}

type SortOption = 'date-desc' | 'date-asc' | 'category' | 'name';

/**
 * Componente expandido para exibir conquistas do aluno
 * Inclui certificados, badges e reconhecimentos com filtros e visualização detalhada
 */
export default function StudentAchievements() {
  const { profile } = useCurrentProfile();
  const [holderName, setHolderName] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      setHolderName(profile.display_name || "Aluno Esquads");
    }
  }, [profile]);

  // Buscar certificados
  const { data: certificates } = useQuery({
    queryKey: ["certificates", profile?.id],
    enabled: !!profile?.id,
    queryFn: async (): Promise<Certificate[]> => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id,course_id,issued_at,certificate_number")
        .eq("user_id", profile!.id)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Certificate[];
    },
  });

  // Buscar cursos dos certificados
  const courseIds = useMemo(() => 
    Array.from(new Set((certificates || []).map(c => c.course_id))), 
    [certificates]
  );
  
  const { data: courses } = useQuery({
    queryKey: ["certificate-courses", courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,title")
        .in("id", courseIds);
      if (error) throw error;
      return data as Course[];
    },
  });

  // Buscar badges do usuário
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
      return (data || []) as UserBadge[];
    }
  });

  // Buscar detalhes dos badges
  const badgeIds = useMemo(() => 
    Array.from(new Set((userBadges || []).map(b => b.badge_id))), 
    [userBadges]
  );
  
  const { data: badges } = useQuery({
    queryKey: ["badges", badgeIds.join(",")],
    enabled: badgeIds.length > 0,
    queryFn: async (): Promise<BadgeRow[]> => {
      const { data, error } = await supabase
        .from("badges")
        .select("id,name,description,image_url")
        .in("id", badgeIds);
      if (error) throw error;
      return data as BadgeRow[];
    }
  });

  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    refs.current[id] = el;
  };

  // Função para obter título do curso
  const getCourseTitle = (courseId: string) => 
    (courses || []).find(c => c.id === courseId)?.title || courseId;

  // Função para baixar certificado
  const downloadCertificate = async (certificate: Certificate) => {
    const el = refs.current[certificate.id];
    if (!el) return;
    
    try {
      const canvas = await html2canvas(el, { 
        scale: 2, 
        backgroundColor: getComputedStyle(document.body).backgroundColor 
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `certificado-${certificate.certificate_number || certificate.id}.png`;
      a.click();
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
    }
  };

  // Função para compartilhar certificado
  const shareCertificate = async (certificate: Certificate) => {
    const el = refs.current[certificate.id];
    if (!el) return;
    
    try {
      const canvas = await html2canvas(el, { 
        scale: 2, 
        backgroundColor: getComputedStyle(document.body).backgroundColor 
      });
      
      if ((navigator as any).share && canvas) {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `certificado-${certificate.certificate_number || certificate.id}.png`, { 
            type: "image/png" 
          });
          try {
            await (navigator as any).share({ 
              title: "Meu Certificado Esquads", 
              text: "Conquista na Esquads!", 
              files: [file] 
            });
          } catch (shareError) {
            console.error('Erro ao compartilhar:', shareError);
          }
        });
      }
    } catch (error) {
      console.error('Erro ao compartilhar certificado:', error);
    }
  };

  // Organizar certificados por categoria e data
  const sortedCertificates = useMemo(() => {
    if (!certificates) return [];
    
    let sorted = [...certificates];
    
    switch (sortBy) {
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.issued_at).getTime() - new Date(b.issued_at).getTime());
        break;
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
        break;
      case 'category':
        sorted.sort((a, b) => getCourseTitle(a.course_id).localeCompare(getCourseTitle(b.course_id)));
        break;
      case 'name':
        sorted.sort((a, b) => getCourseTitle(a.course_id).localeCompare(getCourseTitle(b.course_id)));
        break;
    }
    
    return sorted;
  }, [certificates, sortBy, courses]);

  // Organizar badges por categoria e data
  const sortedBadges = useMemo(() => {
    if (!userBadges || !badges) return [];
    
    const badgesWithDetails = userBadges.map(ub => {
      const badgeDetails = badges.find(b => b.id === ub.badge_id);
      return {
        ...ub,
        ...badgeDetails,
        awarded_at: ub.awarded_at
      };
    }).filter(b => b.name); // Filtrar badges sem detalhes
    
    switch (sortBy) {
      case 'date-asc':
        return badgesWithDetails.sort((a, b) => new Date(a.awarded_at).getTime() - new Date(b.awarded_at).getTime());
      case 'date-desc':
        return badgesWithDetails.sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime());
      case 'category':
        return badgesWithDetails.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      case 'name':
        return badgesWithDetails.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      default:
        return badgesWithDetails;
    }
  }, [userBadges, badges, sortBy]);

  // Obter categorias únicas
  const categories = useMemo(() => {
    const certCategories = (courses || []).map(c => c.category).filter(Boolean);
    const badgeCategories = (badges || []).map(b => b.category).filter(Boolean);
    return Array.from(new Set([...certCategories, ...badgeCategories]));
  }, [courses, badges]);

  return (
    <Card className="animate-enter">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Minhas Conquistas
            </CardTitle>
            <CardDescription>
              Visualize e gerencie todas as suas medalhas, certificados e reconhecimentos
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Data (Recente)</SelectItem>
                <SelectItem value="date-asc">Data (Antigo)</SelectItem>
                <SelectItem value="category">Categoria</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
              </SelectContent>
            </Select>
            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="certificates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certificados ({certificates?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Medal className="h-4 w-4" />
              Badges ({userBadges?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Resumo
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="certificates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedCertificates.map((certificate) => (
                <Card key={certificate.id} className="relative group">
                  <CardContent className="p-4">
                    <CertificateCard
                      title={getCourseTitle(certificate.course_id)}
                      holder={holderName}
                      number={certificate.certificate_number}
                      issuedAt={certificate.issued_at}
                      refEl={setRef(certificate.id)}
                    />
                    <div className="flex gap-2 mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Certificado - {getCourseTitle(certificate.course_id)}</DialogTitle>
                          </DialogHeader>
                          <div className="p-4">
                            <CertificateCard
                              title={getCourseTitle(certificate.course_id)}
                              holder={holderName}
                              number={certificate.certificate_number}
                              issuedAt={certificate.issued_at}
                            />
                            <div className="flex gap-2 mt-4 justify-center">
                              <Button onClick={() => downloadCertificate(certificate)}>
                                <Download className="h-4 w-4 mr-1" />
                                Baixar
                              </Button>
                              <Button variant="outline" onClick={() => shareCertificate(certificate)}>
                                <Share2 className="h-4 w-4 mr-1" />
                                Compartilhar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="sm" 
                        onClick={() => downloadCertificate(certificate)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Emitido em {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {(!certificates || certificates.length === 0) && (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum certificado conquistado ainda.</p>
                <p className="text-sm text-muted-foreground">Complete cursos para ganhar certificados!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="badges" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {sortedBadges.map((badge) => (
                <Card key={badge.id} className="relative group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="mb-3">
                      {badge.image_url ? (
                        <img 
                          src={badge.image_url} 
                          alt={`Badge ${badge.name}`} 
                          className="h-16 w-16 mx-auto rounded-full" 
                        />
                      ) : (
                        <div className="h-16 w-16 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                          <Medal className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                    {badge.description && (
                      <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {badge.category || 'Geral'}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(badge.awarded_at).toLocaleDateString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {(!userBadges || userBadges.length === 0) && (
              <div className="text-center py-8">
                <Medal className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum badge conquistado ainda.</p>
                <p className="text-sm text-muted-foreground">Participe de atividades para ganhar badges!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Award className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">{certificates?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Certificados</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Medal className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <div className="text-2xl font-bold">{userBadges?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Badges</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <div className="text-2xl font-bold">{(certificates?.length || 0) + (userBadges?.length || 0)}</div>
                  <div className="text-sm text-muted-foreground">Total de Conquistas</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Timeline das conquistas recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conquistas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Combinar e ordenar conquistas por data */}
                  {[
                    ...(certificates || []).map(c => ({
                      type: 'certificate' as const,
                      title: getCourseTitle(c.course_id),
                      date: c.issued_at,
                      id: c.id
                    })),
                    ...(sortedBadges || []).map(b => ({
                      type: 'badge' as const,
                      title: b.name || '',
                      date: b.awarded_at,
                      id: b.id
                    }))
                  ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        {item.type === 'certificate' ? (
                          <Award className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Medal className="h-5 w-5 text-yellow-500" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.type === 'certificate' ? 'Certificado' : 'Badge'} • {new Date(item.date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  {(certificates?.length === 0 && userBadges?.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      Nenhuma conquista ainda. Continue estudando!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}