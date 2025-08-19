import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Upload, Image as ImageIcon, Link, Palette, Check, X, History, User, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface para dados de capa do curso
 */
interface CourseCover {
  id: string;
  course_id: string;
  image_url: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_role?: string;
  creator_user_id?: string;
}

/**
 * Props do componente CourseCoverManager
 */
interface CourseCoverManagerProps {
  courseId: string;
  courseTitle?: string;
  onCoverUpdated?: (imageUrl: string) => void;
}

/**
 * Componente para gerenciamento avançado de capas de cursos
 * Integra com a tabela course_covers e oferece funcionalidades completas
 */
export default function CourseCoverManager({
  courseId,
  courseTitle = 'Curso',
  onCoverUpdated
}: CourseCoverManagerProps) {
  // Estados do componente
  const [isOpen, setIsOpen] = useState(false);
  const [covers, setCovers] = useState<CourseCover[]>([]);
  const [activeCover, setActiveCover] = useState<CourseCover | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Verifica se o usuário tem permissão para gerenciar capas
   */
  const checkUserPermissions = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setIsAuthorized(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        setIsAuthorized(false);
        return;
      }

      const role = profile.role;
      setUserRole(role);
      setIsAuthorized(['admin', 'instructor'].includes(role));
    } catch (error) {
      console.error('[COVER_MANAGER] Erro ao verificar permissões:', error);
      setIsAuthorized(false);
    }
  };

  /**
   * Carrega todas as capas do curso
   */
  const loadCovers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('course_covers_with_details')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[COVER_MANAGER] Erro ao carregar capas:', error);
        toast.error('Erro ao carregar capas do curso');
        return;
      }

      setCovers(data || []);
      
      // Encontrar capa ativa
      const active = data?.find(cover => cover.is_active);
      setActiveCover(active || null);
      
    } catch (error) {
      console.error('[COVER_MANAGER] Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar capas');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Valida se a URL da imagem é válida
   */
  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const validProtocols = ['http:', 'https:'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      
      return validProtocols.includes(urlObj.protocol) &&
             validExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
    } catch {
      return false;
    }
  };

  /**
   * Faz upload de arquivo para o Supabase Storage
   */
  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    try {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.');
        return null;
      }

      // Validar tamanho (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB.');
        return null;
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}/${Date.now()}.${fileExt}`;

      // Upload para o storage
      const { data, error } = await supabase.storage
        .from('course-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[COVER_MANAGER] Erro no upload:', error);
        toast.error('Erro ao fazer upload da imagem');
        return null;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('course-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('[COVER_MANAGER] Erro inesperado no upload:', error);
      toast.error('Erro inesperado no upload');
      return null;
    }
  };

  /**
   * Adiciona nova capa ao banco de dados
   */
  const addCoverToDatabase = async (imageUrl: string, makeActive: boolean = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return false;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error('Perfil do usuário não encontrado');
        return false;
      }

      // Inserir nova capa
      const { error: insertError } = await supabase
        .from('course_covers')
        .insert({
          course_id: courseId,
          image_url: imageUrl,
          is_active: makeActive,
          created_by: profile.id
        });

      if (insertError) {
        console.error('[COVER_MANAGER] Erro ao inserir capa:', insertError);
        toast.error('Erro ao salvar capa no banco de dados');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[COVER_MANAGER] Erro inesperado ao salvar:', error);
      toast.error('Erro inesperado ao salvar capa');
      return false;
    }
  };

  /**
   * Ativa uma capa específica
   */
  const activateCover = async (coverId: string) => {
    try {
      const { error } = await supabase.rpc('activate_course_cover', {
        cover_id: coverId
      });

      if (error) {
        console.error('[COVER_MANAGER] Erro ao ativar capa:', error);
        toast.error('Erro ao ativar capa');
        return;
      }

      toast.success('Capa ativada com sucesso!');
      await loadCovers();
      
      // Notificar componente pai
      const newActiveCover = covers.find(cover => cover.id === coverId);
      if (newActiveCover && onCoverUpdated) {
        onCoverUpdated(newActiveCover.image_url);
      }
    } catch (error) {
      console.error('[COVER_MANAGER] Erro inesperado ao ativar:', error);
      toast.error('Erro inesperado ao ativar capa');
    }
  };

  /**
   * Remove uma capa
   */
  const deleteCover = async (coverId: string) => {
    try {
      const { error } = await supabase
        .from('course_covers')
        .delete()
        .eq('id', coverId);

      if (error) {
        console.error('[COVER_MANAGER] Erro ao excluir capa:', error);
        toast.error('Erro ao excluir capa');
        return;
      }

      toast.success('Capa excluída com sucesso!');
      await loadCovers();
    } catch (error) {
      console.error('[COVER_MANAGER] Erro inesperado ao excluir:', error);
      toast.error('Erro inesperado ao excluir capa');
    }
  };

  /**
   * Manipula upload de arquivo
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadFileToStorage(file);
      if (uploadedUrl) {
        const success = await addCoverToDatabase(uploadedUrl, true);
        if (success) {
          toast.success('Capa enviada com sucesso!');
          await loadCovers();
          if (onCoverUpdated) {
            onCoverUpdated(uploadedUrl);
          }
        }
      }
    } finally {
      setIsUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Manipula inserção de URL
   */
  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      toast.error('Digite uma URL válida');
      return;
    }

    if (!isValidImageUrl(imageUrl)) {
      toast.error('URL inválida. Use uma URL completa com extensão de imagem válida.');
      return;
    }

    setIsUploading(true);
    try {
      const success = await addCoverToDatabase(imageUrl, true);
      if (success) {
        toast.success('Capa adicionada com sucesso!');
        setImageUrl('');
        await loadCovers();
        if (onCoverUpdated) {
          onCoverUpdated(imageUrl);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Gera capa com IA
   */
  const handleGenerateWithAI = async (engine: 'flux' | 'recraft' = 'flux') => {
    setIsGenerating(true);
    try {
      console.log('[AI_GENERATION] Iniciando geração de capa para curso:', courseId);

      const { data, error } = await supabase.functions.invoke('generate-course-cover', {
        body: {
          courseId,
          engine,
          regenerate: true
        }
      });

      if (error) {
        console.error('[AI_GENERATION] Erro na Edge Function:', error);
        toast.error(`Erro na geração: ${error.message}`);
        return;
      }

      if (data?.success || data?.predictionId) {
        toast.success('Geração de capa iniciada! A imagem será atualizada em breve.');
        // Recarregar capas após um tempo para pegar a nova capa
        setTimeout(() => {
          loadCovers();
        }, 3000);
      } else {
        toast.error('Resposta inesperada do serviço de geração');
      }
    } catch (error) {
      console.error('[AI_GENERATION] Erro inesperado:', error);
      toast.error('Erro inesperado na geração de capa');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Formata data para exibição
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Efeitos
  useEffect(() => {
    checkUserPermissions();
  }, []);

  useEffect(() => {
    if (isOpen && isAuthorized) {
      loadCovers();
    }
  }, [isOpen, isAuthorized, courseId]);

  // Renderização
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageIcon className="h-4 w-4 mr-2" />
          {activeCover ? 'Gerenciar Capas' : 'Adicionar Capa'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Gerenciar Capas - {courseTitle}
          </DialogTitle>
        </DialogHeader>

        {!isAuthorized ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Você não tem permissão para gerenciar capas de cursos.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Apenas administradores e instrutores podem realizar esta ação.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Capa Atual</TabsTrigger>
              <TabsTrigger value="add">Adicionar Nova</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            {/* Capa Atual */}
            <TabsContent value="current" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando...</span>
                </div>
              ) : activeCover ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={activeCover.image_url}
                          alt="Capa atual do curso"
                          className="w-full md:w-48 h-32 object-cover rounded-md border"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Ativa</Badge>
                          <Badge variant="outline">
                            <User className="h-3 w-3 mr-1" />
                            {activeCover.creator_role || 'Usuário'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Criada em {formatDate(activeCover.created_at)}
                        </p>
                        <p className="text-xs text-muted-foreground break-all">
                          {activeCover.image_url}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma capa ativa encontrada.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Adicione uma nova capa na aba "Adicionar Nova".
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Adicionar Nova */}
            <TabsContent value="add" className="space-y-4">
              <div className="grid gap-4">
                {/* Geração com IA */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Gerar com IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Gere uma capa profissional automaticamente baseada no título e descrição do curso.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleGenerateWithAI('flux')}
                        disabled={isGenerating || isUploading}
                        className="flex-1"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          'Flux 1.1 Pro'
                        )}
                      </Button>
                      <Button
                        onClick={() => handleGenerateWithAI('recraft')}
                        disabled={isGenerating || isUploading}
                        variant="outline"
                        className="flex-1"
                      >
                        {isGenerating ? 'Gerando...' : 'Recraft V3'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Upload de arquivo */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload de Arquivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Envie uma imagem do seu computador (JPEG, PNG, WebP, GIF - máx. 10MB)
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileUpload}
                        disabled={isUploading || isGenerating}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isGenerating}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Selecionar Arquivo
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* URL externa */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      URL Externa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Cole a URL de uma imagem hospedada na internet
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        disabled={isUploading || isGenerating}
                      />
                      <Button
                        onClick={handleUrlSubmit}
                        disabled={isUploading || isGenerating || !imageUrl.trim()}
                      >
                        {isUploading ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Histórico */}
            <TabsContent value="history" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando histórico...</span>
                </div>
              ) : covers.length > 0 ? (
                <div className="space-y-3">
                  {covers.map((cover) => (
                    <Card key={cover.id} className={cover.is_active ? 'ring-2 ring-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-shrink-0">
                            <img
                              src={cover.image_url}
                              alt={`Capa ${cover.is_active ? 'ativa' : 'inativa'}`}
                              className="w-full md:w-32 h-20 object-cover rounded-md border"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {cover.is_active ? (
                                <Badge variant="default">
                                  <Check className="h-3 w-3 mr-1" />
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Inativa</Badge>
                              )}
                              <Badge variant="outline">
                                <User className="h-3 w-3 mr-1" />
                                {cover.creator_role || 'Usuário'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {formatDate(cover.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!cover.is_active && (
                              <Button
                                size="sm"
                                onClick={() => activateCover(cover.id)}
                                disabled={isLoading}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Ativar
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={isLoading}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Excluir
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir capa?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A capa será removida permanentemente.
                                    {cover.is_active && ' Esta é a capa ativa do curso.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCover(cover.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma capa encontrada no histórico.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    As capas adicionadas aparecerão aqui.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Relatório de Implementação:
 * 
 * O componente CourseCoverManager foi desenvolvido como uma solução robusta e completa para
 * gerenciamento de capas de cursos, integrando perfeitamente com a nova tabela course_covers.
 * 
 * Principais características implementadas:
 * - Interface intuitiva com abas para organizar funcionalidades
 * - Integração completa com a tabela course_covers e suas funções
 * - Validação rigorosa de permissões (apenas admins/instrutores)
 * - Três métodos de adição: IA, upload e URL externa
 * - Histórico completo com possibilidade de ativar/desativar capas
 * - Estados de loading e tratamento robusto de erros
 * - Design responsivo usando shadcn/ui components
 * 
 * Sugestões de aprimoramento futuro:
 * - Implementar preview de imagens antes do upload
 * - Adicionar funcionalidade de crop/resize de imagens
 * - Incluir métricas de performance das capas
 * - Implementar sistema de aprovação para capas geradas por IA
 * - Adicionar cache local para melhorar performance
 */