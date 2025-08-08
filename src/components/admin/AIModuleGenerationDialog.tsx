import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIModuleGenerationDialogProps {
  courseId: string;
  onSuccess?: () => void;
}

export default function AIModuleGenerationDialog({ courseId, onSuccess }: AIModuleGenerationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(2);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [focus, setFocus] = useState('');

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const { error, data } = await supabase.functions.invoke('ai-generate-modules', {
        body: { courseId, count, difficulty, focus }
      });
      if (error) throw error;
      toast(`Módulos gerados com sucesso`);
      setOpen(false);
      onSuccess?.();
    } catch (e: any) {
      console.error(e);
      toast(`Erro ao gerar módulos: ${e.message || 'tente novamente'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Gerar módulos com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar módulos com IA</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="count">Quantidade</Label>
            <Input id="count" type="number" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </div>
          <div>
            <Label>Dificuldade</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="focus">Foco/tema (opcional)</Label>
            <Input id="focus" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Ex.: Segurança em API REST" />
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</>) : 'Gerar módulos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
