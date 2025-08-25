import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Award, Medal, Trophy, Download, Calendar, Star, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCertificates } from '@/hooks/useCertificates';
import { toast } from 'sonner';

// Interfaces para tipagem
interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    background_color: string;
    text_color: string;
    border_style: string;
    course: {
      title: string;
    };
  };
}

interface UserCertificate {
  id: string;
  certificate_id: string;
  issued_at: string;
  certificate_url?: string;
  certificate: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    background_color: string;
    text_color: string;
    font_family: string;
    border_style: string;
    signature_line: boolean;
    main_text: string;
    footer_text: string;
    course: {
      title: string;
    };
  };
}

interface AchievementDisplayProps {
  userId?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export default function AchievementDisplay({ 
  userId, 
  showTitle = true, 
  compact = false 
}: AchievementDisplayProps) {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<UserCertificate | null>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState<string | null>(null);

  
  // Usar o hook de certificados
  const { 
    certificates, 
    loading: certificatesLoading, 
    error: certificatesError,
    generateCertificate,
    downloadCertificate 
  } = useCertificates();

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      loadAchievements();
    }
  }, [targetUserId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);

      // Carregar badges do usuário
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          id,
          badge_id,
          earned_at,
          badge:badges (
            id,
            name,
            description,
            icon,
            background_color,
            text_color,
            border_style,
            course:courses (
              title
            )
          )
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });

      if (badgesError) throw badgesError;

      setBadges(badgesData || []);
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
      toast.error('Erro ao carregar conquistas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gera um certificado
   */
  const handleGenerateCertificate = async (certificateId: string) => {
    try {
      setGeneratingCertificate(certificateId);
      await generateCertificate(certificateId);
    } finally {
      setGeneratingCertificate(null);
    }
  };

  /**
   * Faz download do certificado
   */
  const handleDownloadCertificate = async (certificateId: string, title: string) => {
    await downloadCertificate(certificateId, `certificado-${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'trophy':
        return <Trophy className="w-6 h-6" />;
      case 'medal':
        return <Medal className="w-6 h-6" />;
      case 'star':
        return <Star className="w-6 h-6" />;
      default:
        return <Award className="w-6 h-6" />;
    }
  };

  const renderBadge = (userBadge: UserBadge) => {
    const { badge } = userBadge;
    
    return (
      <Card 
        key={userBadge.id} 
        className={`transition-all hover:shadow-md ${compact ? 'p-2' : ''}`}
        style={{
          backgroundColor: badge.background_color || '#f8f9fa',
          color: badge.text_color || '#333',
          borderStyle: badge.border_style || 'solid'
        }}
      >
        <CardContent className={compact ? 'p-3' : 'p-4'}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {getBadgeIcon(badge.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
                {badge.name}
              </h4>
              {!compact && (
                <>
                  <p className="text-sm opacity-80 mt-1">{badge.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {badge.course.title}
                    </Badge>
                    <span className="text-xs opacity-60 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(userBadge.earned_at)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCertificate = (userCertificate: UserCertificate) => {
    const { certificate } = userCertificate;
    
    return (
      <Card key={userCertificate.id} className="transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-base">{certificate.title}</h4>
              </div>
              
              {certificate.subtitle && (
                <p className="text-sm text-gray-600 mb-2">{certificate.subtitle}</p>
              )}
              
              <p className="text-sm text-gray-700 mb-3">{certificate.description}</p>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {certificate.course.title}
                </Badge>
                <span className="text-xs text-gray-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(userCertificate.issued_at)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2 ml-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCertificate(userCertificate)}
                  >
                    Visualizar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{certificate.title}</DialogTitle>
                    <DialogDescription>
                      Certificado emitido em {formatDate(userCertificate.issued_at)}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Preview do certificado */}
                  <div 
                    className="border rounded-lg p-8 text-center min-h-[400px] flex flex-col justify-center"
                    style={{
                      backgroundColor: certificate.background_color || '#ffffff',
                      color: certificate.text_color || '#000000',
                      fontFamily: certificate.font_family || 'serif',
                      borderStyle: certificate.border_style || 'solid'
                    }}
                  >
                    <h1 className="text-3xl font-bold mb-4">{certificate.title}</h1>
                    {certificate.subtitle && (
                      <h2 className="text-xl mb-6">{certificate.subtitle}</h2>
                    )}
                    
                    <div className="text-lg mb-6" dangerouslySetInnerHTML={{ 
                      __html: certificate.main_text || 'Certificamos que o usuário concluiu com sucesso o curso.' 
                    }} />
                    
                    <div className="text-base mb-4">
                      <strong>Curso:</strong> {certificate.course.title}
                    </div>
                    
                    <div className="text-sm mb-6">
                      <strong>Data de Emissão:</strong> {formatDate(userCertificate.issued_at)}
                    </div>
                    
                    {certificate.signature_line && (
                      <div className="border-t border-gray-400 w-64 mx-auto mt-8 pt-2 text-sm">
                        Assinatura Digital
                      </div>
                    )}
                    
                    {certificate.footer_text && (
                      <div className="text-xs mt-6 opacity-70">
                        {certificate.footer_text}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              {userCertificate.certificate_url ? (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleDownloadCertificate(userCertificate.id, userCertificate.certificate.title)}
                  className="flex items-center space-x-1"
                  disabled={generatingCertificate === userCertificate.id}
                >
                  <Download className="w-3 h-3" />
                  <span>Baixar</span>
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleGenerateCertificate(userCertificate.id)}
                  disabled={generatingCertificate === userCertificate.id}
                  className="flex items-center space-x-1"
                >
                  {generatingCertificate === userCertificate.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  <span>{generatingCertificate === userCertificate.id ? 'Gerando...' : 'Gerar PDF'}</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const isLoading = loading || certificatesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4">
        {badges.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Badges Conquistados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {badges.slice(0, 4).map(renderBadge)}
            </div>
            {badges.length > 4 && (
              <p className="text-xs text-gray-500 mt-2">
                +{badges.length - 4} badges adicionais
              </p>
            )}
          </div>
        )}
        
        {certificates.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Certificados</h3>
            <div className="space-y-2">
              {certificates.slice(0, 2).map(cert => (
                <div key={cert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{cert.certificate.title}</span>
                  {cert.certificate_url ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadCertificate(cert.id, cert.certificate.title)}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleGenerateCertificate(cert.id)}
                      disabled={generatingCertificate === cert.id}
                    >
                      {generatingCertificate === cert.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {certificates.length > 2 && (
              <p className="text-xs text-gray-500 mt-2">
                +{certificates.length - 2} certificados adicionais
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <h2 className="text-2xl font-bold">Minhas Conquistas</h2>
        </div>
      )}

      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="badges" className="flex items-center space-x-2">
            <Medal className="w-4 h-4" />
            <span>Badges ({badges.length})</span>
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>Certificados ({certificates.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4">
          {badges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Medal className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum badge conquistado ainda
                </h3>
                <p className="text-gray-500">
                  Complete cursos e atividades para ganhar seus primeiros badges!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map(renderBadge)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          {certificates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum certificado emitido ainda
                </h3>
                <p className="text-gray-500">
                  Complete cursos integralmente para receber seus certificados!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {certificates.map(renderCertificate)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}