import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon, Link, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  handleSupabaseError, 
  executeWithRetry, 
  safeSupabaseOperation,
  checkUserPermissions 
} from '@/utils/supabaseErrorHandler';

interface CoverImageUploadProps {
  courseId: string;
  currentImageUrl?: string | null;
  onImageUpdated: (imageUrl: string) => void;
}

export default function CoverImageUpload({
  courseId,
  currentImageUrl,
  onImageUpdated
}: CoverImageUploadProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Valida se a URL da imagem é válida
   * @param url - URL para validar
   * @returns boolean indicando se é válida
   */
  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  /**
   * Faz upload de arquivo para o Supabase Storage
   * @param file - Arquivo a ser enviado
   * @returns URL da imagem ou null em caso de erro
   */
  const deleteFromStorage = async (filePath: string) => {
    const result = await safeSupabaseOperation(async () => {
      return await supabase.storage.from('course-images').remove([filePath]);
    });
    
    if (result.success) {
      console.log('[CLEANUP] Arquivo órfão removido com sucesso:', filePath);
    } else {
      console.error('[CLEANUP] Falha ao remover arquivo órfão:', result.error);
      toast({ title: "Erro", description: "Falha ao limpar arquivo antigo após erro. Contate o suporte.", variant: "destructive" });
    }
  };

  const uploadFileToStorage = async (file: File): Promise<{ publicUrl: string; path: string } | null> => {
    // Validações de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Erro", description: "Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.", variant: "destructive" });
      return null;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({ title: "Erro", description: "Arquivo muito grande. Máximo 10MB.", variant: "destructive" });
      return null;
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `public/${courseId}-${Date.now()}.${fileExt}`;
    console.log('[UPLOAD] Enviando arquivo para:', filePath);

    // Upload com retry automático
    const uploadResult = await executeWithRetry(async () => {
      return await supabase.storage
        .from('course-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
    }, 2);

    if (!uploadResult.success) {
      console.error('[UPLOAD] Erro no upload:', uploadResult.error);
      toast({ title: "Erro", description: uploadResult.error, variant: "destructive" });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl(uploadResult.data.path);
    
    console.log('[UPLOAD] Upload concluído:', publicUrl);
    return { publicUrl, path: uploadResult.data.path };
  };

  const updateCourseImage = async (newImageUrl: string): Promise<boolean> => {
    const result = await safeSupabaseOperation(async () => {
      return await supabase
        .from('courses')
        .update({
          cover_image_url: newImageUrl,
          thumbnail_url: newImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);
    });

    if (result.success) {
      console.log('[UPDATE] Capa do curso atualizada com sucesso');
      onImageUpdated(newImageUrl);
      toast({ title: "Sucesso", description: "Capa do curso atualizada com sucesso!" });
      setIsOpen(false);
      setImageUrl('');
      return true;
    } else {
      console.error('[UPDATE] Erro ao atualizar curso:', result.error);
      toast({ title: "Erro", description: result.error, variant: "destructive" });
      return false;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar permissões antes de prosseguir
    const permissionCheck = await checkUserPermissions(supabase);
    if (!permissionCheck.success) {
      toast({ title: "Erro", description: permissionCheck.error, variant: "destructive" });
      return;
    }

    // O estado de 'isUploading' desabilita os botões na UI para prevenir cliques duplos.
    setIsUploading(true);
    let uploadResult: { publicUrl: string; path: string } | null = null;

    try {
      uploadResult = await uploadFileToStorage(file);

      if (uploadResult) {
        const updateSuccess = await updateCourseImage(uploadResult.publicUrl);

        // Se a atualização do banco de dados falhar, remove o arquivo recém-enviado do storage.
        if (!updateSuccess) {
          console.log(`[CLEANUP] A atualização do DB falhou. Removendo arquivo órfão: ${uploadResult.path}`);
          await deleteFromStorage(uploadResult.path);
        }
      }
    } catch (error: any) {
      console.error('[UPLOAD_PROCESS] Erro geral no processo de upload:', error);
      handleSupabaseError(error);
      // Tenta limpar o arquivo se um erro inesperado ocorrer após o upload.
      if (uploadResult) {
          await deleteFromStorage(uploadResult.path);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Manipula a inserção de URL manual
   */
  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      toast({ title: "Erro", description: "Digite uma URL válida", variant: "destructive" });
      return;
    }

    if (!isValidImageUrl(imageUrl)) {
      toast({ title: "Erro", description: "URL inválida. Use uma URL completa (http:// ou https://)", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      await updateCourseImage(imageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Gera capa automaticamente com IA
   */
  const handleGenerateWithAI = async () => {
    // Verificar permissões antes de prosseguir
    const permissionCheck = await checkUserPermissions(supabase);
    if (!permissionCheck.success) {
      toast({ title: "Erro", description: permissionCheck.error, variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('[AI_GENERATION] Iniciando geração de capa para curso:', courseId);

      // Executar geração com retry automático
      const result = await executeWithRetry(async () => {
        const { data, error } = await supabase.functions.invoke('generate-course-cover', {
          body: {
            courseId,
            engine: 'flux', // Usar Flux por padrão
            regenerate: true
          }
        });
        
        if (error) throw error;
        return data;
      }, 2);

      if (!result.success) {
        console.error('[AI_GENERATION] Erro na geração:', result.error);
        toast({ title: "Erro", description: result.error, variant: "destructive" });
        return;
      }

      console.log('[AI_GENERATION] Geração iniciada:', result.data);
      toast({ title: "Sucesso", description: "Geração de capa iniciada! A imagem será atualizada em breve." });
      setIsOpen(false);
    } catch (error: any) {
      console.error('[AI_GENERATION] Erro inesperado:', error);
      handleSupabaseError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageIcon className="h-4 w-4 mr-2" />
          {currentImageUrl ? 'Alterar Capa' : 'Adicionar Capa'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Gerenciar Capa do Curso
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Prévia da imagem atual */}
          {currentImageUrl && (
            <div className="space-y-2">
              <Label>Capa Atual</Label>
              <div className="relative">
                <img
                  src={currentImageUrl}
                  alt="Capa atual do curso"
                  className="w-full h-32 object-cover rounded-md border"
                />
              </div>
            </div>
          )}

          {/* Opção 1: Gerar com IA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Gerar com Inteligência Artificial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Gere uma capa profissional automaticamente baseada no título e descrição do curso.
              </p>
              <Button
                onClick={handleGenerateWithAI}
                disabled={isGenerating || isUploading}
                className="w-full"
              >
                {isGenerating ? 'Gerando...' : 'Gerar Capa com IA'}
              </Button>
            </CardContent>
          </Card>

          {/* Opção 2: Upload de arquivo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Fazer Upload de Arquivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Envie uma imagem do seu computador (JPEG, PNG, WebP, GIF - máx. 10MB)
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileUpload}
                  disabled={isUploading || isGenerating}
                />
              </div>
            </CardContent>
          </Card>

          {/* Opção 3: URL externa */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link className="h-4 w-4" />
                Usar URL Externa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}