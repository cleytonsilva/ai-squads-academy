import { Button } from "@/components/ui/button";

/**
 * Interface para as propriedades do componente NavigationControls
 */
interface NavigationControlsProps {
  /** Índice do módulo atual */
  selectedIndex: number;
  /** Total de módulos disponíveis */
  totalModules: number;
  /** Função para ir ao módulo anterior */
  onPrevious: () => void;
  /** Função para ir ao próximo módulo */
  onNext: () => Promise<void>;
}

/**
 * Componente responsável pelos controles de navegação entre módulos
 * Inclui botões para anterior e próximo com validação de limites
 */
export default function NavigationControls({
  selectedIndex,
  totalModules,
  onPrevious,
  onNext
}: NavigationControlsProps) {
  const isFirstModule = selectedIndex === 0;
  const isLastModule = selectedIndex >= totalModules - 1;

  return (
    <div className="flex items-center justify-between">
      <Button 
        variant="outline" 
        onClick={onPrevious} 
        disabled={isFirstModule}
        aria-label="Ir para o módulo anterior"
      >
        Anterior
      </Button>
      <Button 
        onClick={onNext} 
        disabled={isLastModule}
        aria-label="Ir para o próximo módulo"
      >
        Próximo
      </Button>
    </div>
  );
}