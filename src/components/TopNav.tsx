import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/contexts/theme-context"
import { ArrowLeft, Home } from "lucide-react"

export default function TopNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { getThemeColors } = useTheme()
  const themeColors = getThemeColors()
  
  // Mostrar botão de retorno quando não estiver no dashboard principal
  const showBackButton = location.pathname !== "/app" && location.pathname.startsWith("/app")
  const showHomeButton = location.pathname.startsWith("/courses/")

  const handleBackToDashboard = () => {
    navigate("/app")
  }

  return (
    <header className={`w-full border-b ${themeColors.border} ${themeColors.background}/80 backdrop-blur supports-[backdrop-filter]:${themeColors.background}/60 transition-colors duration-200`}>
      <div className={`flex items-center px-4 py-3 ${(showBackButton || showHomeButton) ? 'justify-between' : 'justify-center'}`}>
        <div className="flex items-center gap-3">
          {/* Logo e título removidos conforme solicitado */}
        </div>
        
        {/* Botão de retorno ao dashboard */}
        {(showBackButton || showHomeButton) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToDashboard}
            className={`flex items-center gap-2 ${themeColors.primaryHover} transition-colors duration-200`}
          >
            {showBackButton ? (
              <>
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar ao Dashboard</span>
              </>
            ) : (
              <>
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </>
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
