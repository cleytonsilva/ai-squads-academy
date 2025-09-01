import { useTheme } from "@/contexts/theme-context";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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
 * Interface para as propriedades do componente ModuleContent
 */
interface ModuleContentProps {
  /** Módulo atual selecionado */
  currentModule: ModuleRow | null;
  /** Filhos do componente (quiz sections, navigation, etc.) */
  children?: React.ReactNode;
}

/**
 * Componente responsável por exibir o conteúdo do módulo selecionado
 * Inclui título, descrição e conteúdo HTML do módulo
 */
export default function ModuleContent({ currentModule, children }: ModuleContentProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  /**
   * Extrai o HTML do conteúdo do módulo
   * Trata diferentes formatos de payload de conteúdo
   */
  const getHtml = (payload: unknown): string => {
    try {
      if (payload && typeof payload === "object" && payload !== null && "html" in (payload as any)) {
        return (payload as any).html || "";
      }
      return typeof payload === "string" ? (payload as string) : "";
    } catch {
      return "";
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className={`transition-colors duration-300 ${themeColors.foreground}`}>
          {currentModule ? currentModule.title : "Selecione um módulo"}
        </CardTitle>
        <CardDescription className={`transition-colors duration-300 ${themeColors.mutedForeground}`}>
          Visualização do aluno
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentModule ? (
          <div className="space-y-4">
            {/* Conteúdo principal do módulo */}
            <article 
              className={`rounded-md border p-4 transition-colors duration-300 ${themeColors.border} ${themeColors.card}`}
              role="main"
              aria-label={`Conteúdo do módulo: ${currentModule.title}`}
            >
              <div 
                className={`transition-colors duration-300 ${themeColors.foreground}`} 
                dangerouslySetInnerHTML={{ __html: getHtml(currentModule.content_jsonb) }} 
              />
            </article>

            {/* Seções adicionais (quizzes, navegação, etc.) */}
            {children}
          </div>
        ) : (
          <p className={`text-sm transition-colors duration-300 ${themeColors.mutedForeground}`}>
            Escolha um módulo para começar.
          </p>
        )}
      </CardContent>
    </>
  );
}