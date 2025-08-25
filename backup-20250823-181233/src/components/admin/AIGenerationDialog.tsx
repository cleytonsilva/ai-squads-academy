import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIGenerationDialogProps {
  type: 'missions' | 'quizzes';
  trackId?: string;
  courseId?: string;
  onSuccess?: () => void;
}

export default function AIGenerationDialog({ type, trackId, courseId, onSuccess }: AIGenerationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Common fields
  const [count, setCount] = useState(3);
  const [difficulty, setDifficulty] = useState('intermediate');
  
  // Mission-specific fields
  const [missionType, setMissionType] = useState('practical');
  const [basePoints, setBasePoints] = useState(50);
  
  // Quiz-specific fields
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple_choice']);

  const handleQuestionTypeToggle = (questionType: string) => {
    setQuestionTypes(prev => 
      prev.includes(questionType) 
        ? prev.filter(t => t !== questionType)
        : [...prev, questionType]
    );
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.functions.invoke('ai-generate-certifications', {
        body: {
          type,
          trackId,
          courseId,
          count,
          difficulty,
          missionType: type === 'missions' ? missionType : undefined,
          basePoints: type === 'missions' ? basePoints : undefined,
          questionTypes: type === 'quizzes' ? questionTypes : undefined,
        }
      });

      if (error) throw error;

      toast(`${type === 'missions' ? 'Missões' : 'Quizzes'} geradas com sucesso!`);
      setOpen(false);
      onSuccess?.();
      
    } catch (error: any) {
      console.error('Generation error:', error);
      toast(`Erro ao gerar ${type === 'missions' ? 'missões' : 'quizzes'}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Gerar {type === 'missions' ? 'Missões' : 'Quizzes'} com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Gerar {type === 'missions' ? 'Missões' : 'Quizzes'} com IA
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="count">Quantidade</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Dificuldade</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'missions' && (
            <>
              <div>
                <Label htmlFor="missionType">Tipo de Missão</Label>
                <Select value={missionType} onValueChange={setMissionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practical">Prática</SelectItem>
                    <SelectItem value="theoretical">Teórica</SelectItem>
                    <SelectItem value="project">Projeto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="basePoints">Pontos Base</Label>
                <Input
                  id="basePoints"
                  type="number"
                  min={10}
                  max={200}
                  step={10}
                  value={basePoints}
                  onChange={(e) => setBasePoints(Number(e.target.value))}
                />
              </div>
            </>
          )}

          {type === 'quizzes' && (
            <div>
              <Label>Tipos de Questão</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { id: 'multiple_choice', label: 'Múltipla Escolha' },
                  { id: 'true_false', label: 'Verdadeiro/Falso' },
                  { id: 'essay', label: 'Dissertativa' }
                ].map(type => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={questionTypes.includes(type.id)}
                      onCheckedChange={() => handleQuestionTypeToggle(type.id)}
                    />
                    <Label htmlFor={type.id} className="text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
              {questionTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Selecione pelo menos um tipo de questão
                </p>
              )}
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={loading || (type === 'quizzes' && questionTypes.length === 0)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar {type === 'missions' ? 'Missões' : 'Quizzes'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}