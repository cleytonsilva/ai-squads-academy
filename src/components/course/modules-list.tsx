import React from "react";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/hooks/use-toast";

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
 * Interface para as propriedades do componente ModulesList
 */
interface ModulesListProps {
  /** Lista de módulos do curso */
  modules: ModuleRow[];
  /** Índice do módulo selecionado atualmente */
  selectedIndex: number;
  /** IDs dos módulos concluídos */
  completedIds: Set<string>;
  /** Se a prova final está desbloqueada */
  unlockedFinalExam: boolean;
  /** Função para selecionar um módulo */
  onSelectModule: (index: number) => void;
}

/**
 * Componente responsável por exibir a lista de módulos do curso
 * Inclui navegação, status de conclusão e controle de acesso
 * Otimizado com React.memo para evitar re-renderizações desnecessárias
 */
const ModulesList = ({
  modules,
  selectedIndex,
  completedIds,
  unlockedFinalExam,
  onSelectModule
}: ModulesListProps) => {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { toast } = useToast();

  /**
   * Manipula o clique em um módulo
   * Verifica se o módulo está disponível antes de selecioná-lo
   */
  const handleModuleClick = (moduleIndex: number, module: ModuleRow) => {
    // Verifica se é prova final e se está bloqueada
    if ((module as any).module_type === "final_exam" && !unlockedFinalExam) {
      toast.error('Prova final bloqueada. Conclua todos os módulos para liberar.');
      return;
    }
    
    onSelectModule(moduleIndex);
  };

  /**
   * Renderiza o ícone de status do módulo
   */
  const renderModuleIcon = (module: ModuleRow) => {
    if ((module as any).module_type === "final_exam") {
      return unlockedFinalExam ? (
        <CheckCircle2 className={`h-4 w-4 transition-colors duration-300 ${themeColors.primary}`} />
      ) : (
        <Lock className={`h-4 w-4 transition-colors duration-300 ${themeColors.mutedForeground}`} />
      );
    }
    
    return completedIds.has(module.id) ? (
      <CheckCircle2 className={`h-4 w-4 transition-colors duration-300 ${themeColors.primary}`} />
    ) : (
      <Circle className={`h-4 w-4 transition-colors duration-300 ${themeColors.mutedForeground}`} />
    );
  };

  return (
    <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
      {modules?.map((module, index) => (
        <button
          key={module.id}
          onClick={() => handleModuleClick(index, module)}
          className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-all duration-300 ${
            themeColors.border
          } ${
            index === selectedIndex
              ? `${themeColors.accent} ${themeColors.accentForeground}`
              : `${themeColors.cardForeground} hover:${themeColors.muted}`
          }`}
          aria-current={index === selectedIndex}
          aria-label={`Módulo ${index + 1}: ${module.title}${
            completedIds.has(module.id) ? ' - Concluído' : ''
          }${
            (module as any).module_type === "final_exam" && !unlockedFinalExam
              ? ' - Bloqueado'
              : ''
          }`}
          disabled={(module as any).module_type === "final_exam" && !unlockedFinalExam}
        >
          <div className="flex items-center justify-between">
            <span className="truncate">
              {index + 1}. {module.title}
            </span>
            <span className="ml-2">
              {renderModuleIcon(module)}
            </span>
          </div>
        </button>
      ))}
      {(!modules || modules.length === 0) && (
        <p className={`text-sm transition-colors duration-300 ${themeColors.mutedForeground}`}>
          Nenhum módulo disponível.
        </p>
      )}
    </div>
  );
};

// Exportar com React.memo para otimização de performance
export default React.memo(ModulesList);