"use client"

import { useState } from "react"
import { ChevronRight, BookOpen, Trophy, Target, Users, Bell, RefreshCw, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./contexts/theme-context"
import DashboardPage from "./dashboard/page"
import CursosPage from "./cursos/page"
import MissoesPage from "./missoes/page"
import ConquistasPage from "./conquistas/page"
import SimuladosPage from "./simulados/page"
import PerfilPage from "./perfil/page"

export default function EsquadsDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { currentTheme } = useTheme()

  const getThemeColors = () => {
    const themes = {
      orange: "text-orange-500 bg-orange-500 border-orange-500 hover:bg-orange-600",
      blue: "text-blue-500 bg-blue-500 border-blue-500 hover:bg-blue-600",
      yellow: "text-yellow-500 bg-yellow-500 border-yellow-500 hover:bg-yellow-600",
      purple: "text-purple-500 bg-purple-500 border-purple-500 hover:bg-purple-600",
      green: "text-green-500 bg-green-500 border-green-500 hover:bg-green-600",
      red: "text-red-500 bg-red-500 border-red-500 hover:bg-red-600",
    }
    return themes[currentTheme] || themes.orange
  }

  const themeColors = getThemeColors()

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className={`font-bold text-lg tracking-wider ${themeColors.split(" ")[0]}`}>ESQUADS</h1>
              <p className="text-neutral-500 text-xs">Plataforma Educacional</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`text-neutral-400 hover:${themeColors.split(" ")[0]}`}
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {[
              { id: "dashboard", icon: BookOpen, label: "DASHBOARD" },
              { id: "cursos", icon: BookOpen, label: "CURSOS" },
              { id: "missoes", icon: Target, label: "MISSÕES" },
              { id: "conquistas", icon: Trophy, label: "CONQUISTAS" },
              { id: "simulados", icon: Users, label: "SIMULADOS" },
              { id: "perfil", icon: User, label: "PERFIL" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? `${themeColors.split(" ")[1]} text-white`
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-white">ONLINE</span>
              </div>
              <div className="text-xs text-neutral-500">
                <div>NÍVEL: 15</div>
                <div>XP: 2,847 / 3,000</div>
                <div>CURSOS: 5 ATIVOS</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!sidebarCollapsed ? "md:ml-0" : ""}`}>
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              ESQUADS / <span className={themeColors.split(" ")[0]}>{activeSection.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">ÚLTIMA ATIVIDADE: 2 min atrás</div>
            <Button variant="ghost" size="icon" className={`text-neutral-400 hover:${themeColors.split(" ")[0]}`}>
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className={`text-neutral-400 hover:${themeColors.split(" ")[0]}`}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === "dashboard" && <DashboardPage />}
          {activeSection === "cursos" && <CursosPage />}
          {activeSection === "missoes" && <MissoesPage />}
          {activeSection === "conquistas" && <ConquistasPage />}
          {activeSection === "simulados" && <SimuladosPage />}
          {activeSection === "perfil" && <PerfilPage />}
        </div>
      </div>
    </div>
  )
}
