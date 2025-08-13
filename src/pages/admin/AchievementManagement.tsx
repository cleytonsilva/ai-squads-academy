import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge, Trophy, Award, Settings, Users, BarChart3 } from 'lucide-react';
import BadgeEditor from '@/components/admin/BadgeEditor';
import CertificateEditor from '@/components/admin/CertificateEditor';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AchievementStats {
  total_badges_awarded: number;
  total_certificates_issued: number;
  active_badge_templates: number;
  active_certificate_templates: number;
  recent_achievements: Array<{
    type: 'badge' | 'certificate';
    user_name: string;
    achievement_name: string;
    awarded_at: string;
  }>;
}

export default function AchievementManagement() {
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      
      // Carregar estatísticas de badges
      const { data: badgeStats, error: badgeError } = await supabase
        .from('user_badges')
        .select('id');
      
      if (badgeError) throw badgeError;

      // Carregar estatísticas de certificados
      const { data: certificateStats, error: certificateError } = await supabase
        .from('certificates')
        .select('id');
      
      if (certificateError) throw certificateError;

      // Carregar templates ativos de badges
      const { data: activeBadgeTemplates, error: badgeTemplateError } = await supabase
        .from('badges')
        .select('id');
      
      if (badgeTemplateError) throw badgeTemplateError;

      // Carregar templates ativos de certificados
      const { data: activeCertificateTemplates, error: certificateTemplateError } = await supabase
        .from('certificate_templates')
        .select('id')
        .eq('is_active', true);
      
      if (certificateTemplateError) throw certificateTemplateError;

      // Carregar conquistas recentes (últimos 10)
      const { data: recentBadges, error: recentBadgesError } = await supabase
        .from('user_badges')
        .select(`
          awarded_at,
          badges!inner(name),
          profiles!inner(display_name)
        `)
        .order('awarded_at', { ascending: false })
        .limit(5);
      
      if (recentBadgesError) throw recentBadgesError;

      const { data: recentCertificates, error: recentCertificatesError } = await supabase
        .from('certificates')
        .select(`
          issued_at,
          courses!inner(title),
          profiles!inner(display_name)
        `)
        .order('issued_at', { ascending: false })
        .limit(5);
      
      if (recentCertificatesError) throw recentCertificatesError;

      // Combinar e ordenar conquistas recentes
      const recentAchievements = [
        ...(recentBadges || []).map(badge => ({
          type: 'badge' as const,
          user_name: badge.profiles?.display_name || 'Usuário',
          achievement_name: badge.badges?.name || 'Badge',
          awarded_at: badge.awarded_at
        })),
        ...(recentCertificates || []).map(cert => ({
          type: 'certificate' as const,
          user_name: cert.profiles?.display_name || 'Usuário',
          achievement_name: cert.courses?.title || 'Curso',
          awarded_at: cert.issued_at
        }))
      ]
        .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime())
        .slice(0, 10);

      setStats({
        total_badges_awarded: badgeStats?.length || 0,
        total_certificates_issued: certificateStats?.length || 0,
        active_badge_templates: activeBadgeTemplates?.length || 0,
        active_certificate_templates: activeCertificateTemplates?.length || 0,
        recent_achievements: recentAchievements
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Não foi possível carregar as estatísticas');
    } finally {
      setIsLoadingStats(false);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description 
  }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description: string; 
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Conquistas</h1>
          <p className="text-muted-foreground">
            Gerencie badges e certificados que são automaticamente concedidos aos alunos
          </p>
        </div>
        <Button onClick={loadStats} disabled={isLoadingStats}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Atualizar Estatísticas
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Badges Concedidos"
            value={stats.total_badges_awarded}
            icon={Trophy}
            description="Total de badges concedidos aos alunos"
          />
          <StatCard
            title="Certificados Emitidos"
            value={stats.total_certificates_issued}
            icon={Award}
            description="Total de certificados emitidos"
          />
          <StatCard
            title="Templates de Badge Ativos"
            value={stats.active_badge_templates}
            icon={Badge}
            description="Templates de badge disponíveis"
          />
          <StatCard
            title="Templates de Certificado Ativos"
            value={stats.active_certificate_templates}
            icon={Settings}
            description="Templates de certificado disponíveis"
          />
        </div>
      )}

      {/* Conquistas Recentes */}
      {stats && stats.recent_achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conquistas Recentes</CardTitle>
            <CardDescription>
              Últimas conquistas obtidas pelos alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_achievements.map((achievement, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {achievement.type === 'badge' ? (
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Award className="w-5 h-5 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium">{achievement.user_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {achievement.type === 'badge' ? 'Conquistou o badge' : 'Recebeu certificado do curso'}: {achievement.achievement_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(achievement.awarded_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editores */}
      <Tabs defaultValue="badges" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Editor de Badges
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Editor de Certificados
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="badges" className="space-y-4">
          <BadgeEditor />
        </TabsContent>
        
        <TabsContent value="certificates" className="space-y-4">
          <CertificateEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}