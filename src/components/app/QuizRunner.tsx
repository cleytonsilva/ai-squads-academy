import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

export default function QuizRunner({ quiz, onClose }: { quiz: QuizRow; onClose?: () => void }) {
  const questions = useMemo(() => normalizeQuestions(quiz.questions || []), [quiz.questions]);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState(false);

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
  };

  return (
    <div className="space-y-6">
      {quiz.description && <p className="text-sm text-muted-foreground">{quiz.description}</p>}

      <div className="space-y-5">
        {questions.map((q, idx) => (
          <div key={idx} className="rounded-md border p-4">
            <p className="font-medium mb-3">{idx + 1}. {q.prompt}</p>
            <RadioGroup
              value={answers[idx] != null ? String(answers[idx]) : undefined}
              onValueChange={(val) => setAnswers((prev) => ({ ...prev, [idx]: Number(val) }))}
              disabled={submitted}
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
            Resultado: <span className="font-semibold">{score}/{questions.length}</span>
          </div>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          {!submitted ? (
            <Button onClick={handleSubmit} disabled={!allAnswered}>Enviar</Button>
          ) : (
            <Button variant="outline" onClick={reset}>Refazer</Button>
          )}
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
