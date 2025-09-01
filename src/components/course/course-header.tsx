import React from "react";
import { Link } from "react-router-dom";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/theme-context";

/**
 * Interface para as propriedades do componente CourseHeader
 */
interface CourseHeaderProps {
  /** Título do curso */
  title: string;
  /** Descrição do curso */
  description?: string | null;
}

/**
 * Componente responsável por exibir o cabeçalho do curso
 * Inclui título, descrição e link para voltar aos cursos
 * Otimizado com React.memo para evitar re-renderizações desnecessárias
 */
const CourseHeader = ({ title, description }: CourseHeaderProps) => {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  return (
    <>
      <CardHeader>
        <CardTitle className={`transition-colors duration-300 ${themeColors.foreground}`}>
          {title || "Curso"}
        </CardTitle>
        <CardDescription className={`line-clamp-3 transition-colors duration-300 ${themeColors.mutedForeground}`}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link 
          to="/courses" 
          className={`text-sm underline transition-colors duration-300 ${themeColors.primary} ${themeColors.primaryHover}`}
          aria-label="Voltar para a lista de cursos"
        >
          Voltar para cursos
        </Link>
        <Separator className={`transition-colors duration-300 ${themeColors.border}`} />
        <h2 className={`font-medium transition-colors duration-300 ${themeColors.foreground}`}>
          Módulos
        </h2>
      </CardContent>
    </>
  );
};

// Exportar com React.memo para otimização de performance
export default React.memo(CourseHeader);