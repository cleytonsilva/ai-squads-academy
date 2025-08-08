import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIModuleExtendDialogProps {
  moduleTitle: string;
  currentHtml: string;
  onExtended: (extendedHtml: string) => void;
}

export default function AIModuleExtendDialog({ moduleTitle, currentHtml, onExtended }: AIModuleExtendDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState(
    "Aprimore e aprofunde este módulo com exemplos práticos, dicas e um pequeno exercício no final."
  );
  const [length, setLength] = useState("medium");
  const [tone, setTone] = useState("neutral");

  const handleExtend = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("ai-extend-module", {
        body: {
          moduleTitle,
          html: currentHtml,
          prompt,
          length,
          tone,
          language: "pt-BR",
        },
      });

      if (error) throw error;

      const extendedHtml = (data as any)?.extendedHtml as string | undefined;
      if (!extendedHtml) {
        toast.error("Falha ao gerar extensão com IA");
        return;
      }

      onExtended(extendedHtml);
      setOpen(false);
    } catch (e: any) {
      console.error("AI extend error", e);
      toast.error("Erro ao estender com IA", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Estender com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Estender módulo com IA</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Instruções para a IA</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Explique como você quer aprimorar este módulo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Curto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="long">Longo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tom</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="friendly">Amigável</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="technical">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleExtend} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar extensão
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
