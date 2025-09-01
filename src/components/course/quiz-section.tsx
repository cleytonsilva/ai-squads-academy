import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";

/**
 * Interface para um quiz
 */
interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  module_id: string | null;
  questions?: any[];
}

/**
 * Interface para um módulo do curso
 */
interface ModuleRow {
  id: string;
  title: string;
  order_index: number;
  content_jsonb: any | null;
  module_type?: string | null;
}

/**
 * Interface para as propriedades do componente QuizSection
 */
interface QuizSectionProps {
  /** Módulo atual */
  currentModule: ModuleRow;
  /** Quizzes do módulo atual */
  moduleQuizzes: QuizRow[];
  /** Quiz da prova final */
  finalExamQuiz: QuizRow | null;
  /** Se é o último módulo (para mostrar prova final) */
  isLastModule: boolean;
  /** Se a prova final está desbloqueada */
  unlockedFinalExam: boolean;
  /** Se o módulo atual é uma prova final */
  isFinalCurrent: boolean;
  /** Se não existe módulo de prova final no banco */
  finalExamModule: ModuleRow | null;
  /** Função para abrir um quiz */
  onOpenQuiz: (quiz: QuizRow) => void;
}

/**
 * Componente responsável por exibir as seções de quiz
 * Inclui quizzes do módulo e prova final quando aplicável
 */
export default function QuizSection({
  currentModule,
  moduleQuizzes,
  finalExamQuiz,
  isLastModule,
  unlockedFinalExam,
  isFinalCurrent,
  finalExamModule,
  onOpenQuiz
}: QuizSectionProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  /**
   * Renderiza um item de quiz
   */
  const renderQuizItem = (quiz: QuizRow, isDisabled = false, buttonText = "Responder") => (
    <div className={`flex items-center justify-between rounded-md border p-3 transition-colors duration-300 ${themeColors.border} ${themeColors.muted}`}>
      <div>
        <p className={`font-medium transition-colors duration-300 ${themeColors.foreground}`}>
          {quiz.title}
        </p>
        {quiz.description && (
          <p className={`text-sm transition-colors duration-300 ${themeColors.mutedForeground}`}>
            {quiz.description}
          </p>
        )}
      </div>
      <Button 
        variant="outline" 
        onClick={() => onOpenQuiz(quiz)} 
        disabled={isDisabled}
        aria-label={`${buttonText}: ${quiz.title}`}
      >
        {isDisabled ? "Bloqueado" : buttonText}
      </Button>
    </div>
  );

  return (
    <>
      {/* Quiz do módulo regular (não prova final e não módulo 10) */}
      {!isFinalCurrent && currentModule?.order_index !== 10 && moduleQuizzes.length > 0 && (
        <section 
          className={`rounded-md border p-4 transition-colors duration-300 ${themeColors.border} ${themeColors.card}`}
          aria-labelledby="module-quiz-heading"
        >
          <h3 
            id="module-quiz-heading"
            className={`font-medium transition-colors duration-300 ${themeColors.foreground}`}
          >
            Quiz do módulo
          </h3>
          <ul className="mt-2 space-y-2" role="list">
            {moduleQuizzes.map((quiz) => (
              <li key={quiz.id}>
                {renderQuizItem(quiz)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Prova final para módulo final existente */}
      {isFinalCurrent && moduleQuizzes.length > 0 && (
        <section 
          className={`rounded-md border p-4 transition-colors duration-300 ${themeColors.border} ${themeColors.card}`}
          aria-labelledby="final-exam-heading"
        >
          <h3 
            id="final-exam-heading"
            className={`font-medium transition-colors duration-300 ${themeColors.foreground}`}
          >
            Prova final
          </h3>
          {!unlockedFinalExam && (
            <p className={`text-sm mt-1 transition-colors duration-300 ${themeColors.mutedForeground}`}>
              Finalize todos os módulos para liberar a prova final.
            </p>
          )}
          <div className="mt-2">
            {renderQuizItem(
              moduleQuizzes[0], 
              !unlockedFinalExam, 
              unlockedFinalExam ? "Iniciar a prova" : "Bloqueado"
            )}
          </div>
        </section>
      )}

      {/* Prova final sintética (quando não há módulo final no banco) */}
      {!finalExamModule && isLastModule && finalExamQuiz && (
        <section 
          className={`rounded-md border p-4 transition-colors duration-300 ${themeColors.border} ${themeColors.card}`}
          aria-labelledby="synthetic-final-exam-heading"
        >
          <h3 
            id="synthetic-final-exam-heading"
            className={`font-medium transition-colors duration-300 ${themeColors.foreground}`}
          >
            Prova final do curso
          </h3>
          {!unlockedFinalExam && (
            <p className={`text-sm mt-1 transition-colors duration-300 ${themeColors.mutedForeground}`}>
              Conclua todos os módulos para liberar.
            </p>
          )}
          <div className="mt-2">
            {renderQuizItem(
              finalExamQuiz, 
              !unlockedFinalExam, 
              unlockedFinalExam ? "Iniciar a prova" : "Bloqueado"
            )}
          </div>
        </section>
      )}
    </>
  );
}