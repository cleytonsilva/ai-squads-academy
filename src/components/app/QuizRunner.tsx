import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type NormalizedQuestion = {
  prompt: string;
  options: string[];
  correctIndex?: number; // optional for practice mode
  explanation?: string | null;
  type?: string;
};

export interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  module_id: string | null;
  questions?: any[];
}

function normalizeQuestions(raw: any[] = []): NormalizedQuestion[] {
  return raw.map((q: any) => {
    // Format A (ai-generate-course): { q, options, answer (index), explanation }
    if (q && typeof q === "object" && "q" in q && Array.isArray(q.options)) {
      const idx = typeof q.answer === "number" ? q.answer : undefined;
      return {
        prompt: String(q.q ?? "Pergunta"),
        options: q.options.map((o: any) => String(o)),
        correctIndex: idx,
        explanation: q.explanation ? String(q.explanation) : null,
        type: q.type ? String(q.type) : undefined,
      };
    }
    // Format B (ai-generate-certifications): { question, type, options, correct_answer, explanation }
    if (q && typeof q === "object" && "question" in q) {
      let options: string[] = [];
      let correctIndex: number | undefined = undefined;
      const type = String(q.type ?? "multiple_choice");

      if (type === "true_false") {
        options = ["Verdadeiro", "Falso"];
        const ca = String(q.correct_answer ?? "Verdadeiro").toLowerCase();
        correctIndex = ca.startsWith("v") ? 0 : 1;
      } else {
        options = Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : [];
        const ca = q.correct_answer != null ? String(q.correct_answer) : undefined;
        if (ca && options.length) {
          const idx = options.findIndex((o) => o === ca);
          correctIndex = idx >= 0 ? idx : undefined;
        }
      }

      return {
        prompt: String(q.question ?? "Pergunta"),
        options,
        correctIndex,
        explanation: q.explanation ? String(q.explanation) : null,
        type,
      };
    }
    // Fallback
    return {
      prompt: String(q?.question || q?.q || "Pergunta"),
      options: Array.isArray(q?.options) ? q.options.map((o: any) => String(o)) : ["Opção A", "Opção B", "Opção C", "Opção D"],
      correctIndex: undefined,
      explanation: null,
      type: String(q?.type || "multiple_choice"),
    };
  });
}

export default function QuizRunner({ quiz, onClose, courseId, courseDifficulty }: { quiz: QuizRow; onClose?: () => void; courseId: string; courseDifficulty?: string | null }) {
  const questions = useMemo(() => normalizeQuestions(quiz.questions || []), [quiz.questions]);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState(false);

  // Timer: 1 min por questão (mín 3min, máx 20min)
  const totalSeconds = useMemo(() => {
    const q = Math.max(questions.length, 3);
    return Math.min(20 * 60, Math.max(3 * 60, q * 60));
  }, [questions.length]);
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    setRemaining(totalSeconds);
    setSubmitted(false);
    setAnswers({});
  }, [totalSeconds, quiz.id]);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          clearInterval(t);
          setSubmitted(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submitted, totalSeconds]);

  const score = useMemo(() => {
    if (!submitted) return 0;
    let s = 0;
    questions.forEach((q, i) => {
      if (q.correctIndex != null && answers[i] === q.correctIndex) s += 1;
    });
    return s;
  }, [submitted, answers, questions]);

  const allAnswered = questions.every((_, i) => answers[i] != null);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
    setRemaining(totalSeconds);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [xpDelta, setXpDelta] = useState(0);

  useEffect(() => {
    if (!submitted || saved) return;
    const persist = async () => {
      setSaving(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast({ title: "Faça login", description: "Autenticação necessária.", variant: "destructive" });
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("id,xp")
          .eq("user_id", session.user.id)
          .maybeSingle();

        const profileId = profile?.id as string | undefined;
        const correct = score;
        const wrong = Math.max(0, questions.length - correct);
        const gain = correct * 10;
        const penalty = wrong * 5;
        const delta = gain - penalty;
        setXpDelta(delta);

        const feedback = questions.map((q, i) => ({
          correct: q.correctIndex != null ? (answers[i] === q.correctIndex) : null,
          explanation: q.explanation ?? null,
        }));

        await supabase.from("quiz_attempts").insert({
          user_id: profileId,
          quiz_id: quiz.id,
          score: correct,
          is_passed: correct >= Math.ceil(0.7 * questions.length),
          answers,
          feedback,
        });

        if (profileId) {
          const newXp = Math.max(0, (profile?.xp || 0) + delta);
          await supabase.from("profiles").update({ xp: newXp }).eq("id", profileId);
          toast({
            title: delta >= 0 ? `+${delta} XP` : `${delta} XP`,
            description: delta >= 0 ? "Bom trabalho!" : "Pontos deduzidos pelo desempenho.",
          });
        }

        setSaved(true);
      } catch (err) {
        console.error("Salvar tentativa de quiz:", err);
        toast({ title: "Erro ao salvar tentativa", description: "Tente novamente depois.", variant: "destructive" });
      } finally {
        setSaving(false);
      }
    };
    persist();
  }, [submitted, saved, score, answers, questions.length, quiz.id]);

  const prevent = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onKey = (e: any) => {
    if ((e.ctrlKey || e.metaKey) && ["c", "p"].includes(String(e.key).toLowerCase())) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  return (
    <div
      className="space-y-6 select-none"
      onCopy={prevent}
      onCut={prevent}
      onPaste={prevent}
      onContextMenu={prevent}
      onKeyDownCapture={onKey}
    >
      {quiz.description && <p className="text-sm text-muted-foreground">{quiz.description}</p>}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Tempo</span>
          <span className="font-mono">{mm}:{ss}</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="space-y-5">
        {questions.map((q, idx) => (
          <div key={idx} className="rounded-md border p-4">
            <p className="font-medium mb-3">{idx + 1}. {q.prompt}</p>
            <RadioGroup
              value={answers[idx] != null ? String(answers[idx]) : undefined}
              onValueChange={(val) => setAnswers((prev) => ({ ...prev, [idx]: Number(val) }))}
              disabled={submitted || remaining <= 0}
            >
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-center space-x-2 py-1">
                  <RadioGroupItem id={`q${idx}-o${i}`} value={String(i)} />
                  <Label htmlFor={`q${idx}-o${i}`} className="text-sm">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
            {submitted && q.correctIndex != null && (
              <div className="mt-3 text-sm">
                <p>
                  Correto: <span className="font-medium">{q.options[q.correctIndex]}</span>
                </p>
                {q.explanation && (
                  <p className="text-muted-foreground mt-1">{q.explanation}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {submitted ? (
          <div className="text-sm">
            <div>
              Resultado: <span className="font-semibold">{score}/{questions.length}</span>
            </div>
            <div className="mt-1">
              XP: <span className={xpDelta >= 0 ? "text-primary" : "text-destructive"}>{xpDelta >= 0 ? `+${xpDelta}` : xpDelta}</span>{saving ? " (salvando...)" : ""}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ranking em construção</p>
          </div>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          {!submitted ? (
            <Button onClick={handleSubmit} disabled={!allAnswered || remaining <= 0}>Enviar</Button>
          ) : (
            <Button variant="outline" onClick={reset}>Refazer</Button>
          )}
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
