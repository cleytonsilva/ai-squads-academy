import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
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
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/aeca3981-62ec-4107-85c4-2f118d51554d.png" 
            alt="AI Squads Academy Logo" 
            className="h-8 w-8 object-contain"
          />
          <h1 className={`text-xl font-bold ${themeColors.foreground} transition-colors duration-200`}>
            AI Squads Academy
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
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
          
          {/* Toggle de tema */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
