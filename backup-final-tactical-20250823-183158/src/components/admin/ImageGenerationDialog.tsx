import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Palette, Zap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ImageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (engine: string) => Promise<void>;
  courseTitle: string;
  isLoading?: boolean;
  authChecked?: boolean;
  isAuthenticated?: boolean;
  userRole?: string | null;
}

type EngineOption = {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
};

const engineOptions: EngineOption[] = [
  {
    value: 'flux',
    label: 'FLUX 1.1 Pro',
    description: 'Modelo mais avançado com qualidade superior e geração rápida',
    icon: <Zap className="h-4 w-4" />,
    badge: 'Recomendado'
  },
  {
    value: 'recraft',
    label: 'Recraft V3',
    description: 'Modelo especializado em design profissional e imagens de alta qualidade',
    icon: <Palette className="h-4 w-4" />,
    badge: 'Novo'
  },
  {
    value: 'proteus',
    label: 'Proteus',
    description: 'Qualidade balanceada, ideal para imagens profissionais',
    icon: <Sparkles className="h-4 w-4" />,
    badge: 'Estável'
  }
];

export default function ImageGenerationDialog({
  open,
  onOpenChange,
  onGenerate,
  courseTitle,
  isLoading = false,
  authChecked = true,
  isAuthenticated = false,
  userRole = null,
}: ImageGenerationDialogProps) {
  const [selectedEngine, setSelectedEngine] = useState<string>('flux');

  const handleGenerate = async () => {
    try {
      await onGenerate(selectedEngine);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro na geração de imagens:', error);
    }
  };

  const selectedOption = engineOptions.find(opt => opt.value === selectedEngine);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Gerar Imagens com IA
          </DialogTitle>
          <DialogDescription>
            Gere automaticamente uma capa e imagens temáticas para os capítulos do curso:
            <span className="font-medium text-foreground block mt-1">
              "{courseTitle}"
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="engine-select">Engine de Geração</Label>
            <Select value={selectedEngine} onValueChange={setSelectedEngine}>
              <SelectTrigger id="engine-select">
                <SelectValue placeholder="Selecione um engine" />
              </SelectTrigger>
              <SelectContent>
                {engineOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2 w-full">
                      {option.icon}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.label}</span>
                          {option.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {option.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOption && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {selectedOption.icon}
                <span className="font-medium">{selectedOption.label}</span>
                {selectedOption.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedOption.badge}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedOption.description}
              </p>
            </div>
          )}

          <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <h4 className="font-medium text-sm mb-2">O que será gerado:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Capa do curso (1024x576px)</li>
              <li>• Imagem para cada capítulo/módulo</li>
              <li>• Inserção automática no conteúdo</li>
              <li>• Estilo profissional de tecnologia</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3">
          {/* Status de autenticação */}
          {authChecked && (
            <div className="flex items-center justify-center text-sm">
              {isAuthenticated ? (
                <span className="text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Autenticado como {userRole}
                </span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Login necessário (admin ou instructor)
                </span>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !authChecked || !isAuthenticated}
              className="min-w-[120px]"
            >
              {!authChecked ? (
                'Verificando...'
              ) : !isAuthenticated ? (
                'Login necessário'
              ) : isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Gerando...
                </>
              ) : (
                'Gerar Imagens'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook para usar o diálogo
export function useImageGenerationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [courseId, setCourseId] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [onSuccess, setOnSuccess] = useState<(() => void) | null>(null);

  const openDialog = (id: string, title: string, successCallback?: () => void) => {
    setCourseId(id);
    setCourseTitle(title);
    setOnSuccess(() => successCallback);
    setIsOpen(true);
  };
  
  const closeDialog = () => {
    setIsOpen(false);
    setCourseId('');
    setCourseTitle('');
    setOnSuccess(null);
  };

  return {
    isOpen,
    courseId,
    courseTitle,
    onSuccess,
    openDialog,
    closeDialog
  };
}