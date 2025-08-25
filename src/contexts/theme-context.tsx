import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Theme = "orange" | "blue" | "yellow" | "purple" | "green" | "red"
type ColorMode = "light" | "dark" | "system"

interface ThemeContextType {
  currentTheme: Theme
  colorMode: ColorMode
  isDark: boolean
  setTheme: (theme: Theme) => void
  setColorMode: (mode: ColorMode) => void
  getThemeColors: () => {
    primary: string
    primaryHover: string
    primaryText: string
    primaryBg: string
    background: string
    foreground: string
    card: string
    cardForeground: string
    border: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>("blue")
  const [colorMode, setColorModeState] = useState<ColorMode>("system")
  const [isDark, setIsDark] = useState(false)

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme)
    localStorage.setItem('esquads-theme', theme)
  }

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode)
    localStorage.setItem('esquads-color-mode', mode)
    applyColorMode(mode)
  }

  const applyColorMode = (mode: ColorMode) => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (mode === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(systemPrefersDark)
      root.classList.add(systemPrefersDark ? 'dark' : 'light')
    } else {
      setIsDark(mode === 'dark')
      root.classList.add(mode)
    }
  }

  // Carregar configurações do localStorage na inicialização
  useEffect(() => {
    const savedTheme = localStorage.getItem('esquads-theme') as Theme
    const savedColorMode = localStorage.getItem('esquads-color-mode') as ColorMode
    
    if (savedTheme && ['orange', 'blue', 'yellow', 'purple', 'green', 'red'].includes(savedTheme)) {
      setCurrentTheme(savedTheme)
    }
    
    if (savedColorMode && ['light', 'dark', 'system'].includes(savedColorMode)) {
      setColorModeState(savedColorMode)
      applyColorMode(savedColorMode)
    } else {
      applyColorMode('system')
    }
  }, [])

  // Detectar mudanças nas preferências do sistema
  useEffect(() => {
    if (colorMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyColorMode('system')
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [colorMode])

  const getThemeColors = () => {
    // Paleta de cores da marca AI Squads Academy com suporte a dark/light mode
    const baseColors = {
      orange: {
        primary: isDark ? "text-orange-400" : "text-orange-600",
        primaryHover: isDark ? "hover:text-orange-300" : "hover:text-orange-700",
        primaryText: isDark ? "text-orange-400" : "text-orange-600",
        primaryBg: isDark ? "bg-orange-500" : "bg-orange-600",
      },
      blue: {
        primary: isDark ? "text-blue-400" : "text-blue-600",
        primaryHover: isDark ? "hover:text-blue-300" : "hover:text-blue-700",
        primaryText: isDark ? "text-blue-400" : "text-blue-600",
        primaryBg: isDark ? "bg-blue-500" : "bg-blue-600",
      },
      yellow: {
        primary: isDark ? "text-yellow-400" : "text-yellow-600",
        primaryHover: isDark ? "hover:text-yellow-300" : "hover:text-yellow-700",
        primaryText: isDark ? "text-yellow-400" : "text-yellow-600",
        primaryBg: isDark ? "bg-yellow-500" : "bg-yellow-600",
      },
      purple: {
        primary: isDark ? "text-purple-400" : "text-purple-600",
        primaryHover: isDark ? "hover:text-purple-300" : "hover:text-purple-700",
        primaryText: isDark ? "text-purple-400" : "text-purple-600",
        primaryBg: isDark ? "bg-purple-500" : "bg-purple-600",
      },
      green: {
        primary: isDark ? "text-green-400" : "text-green-600",
        primaryHover: isDark ? "hover:text-green-300" : "hover:text-green-700",
        primaryText: isDark ? "text-green-400" : "text-green-600",
        primaryBg: isDark ? "bg-green-500" : "bg-green-600",
      },
      red: {
        primary: isDark ? "text-red-400" : "text-red-600",
        primaryHover: isDark ? "hover:text-red-300" : "hover:text-red-700",
        primaryText: isDark ? "text-red-400" : "text-red-600",
        primaryBg: isDark ? "bg-red-500" : "bg-red-600",
      },
    }

    // Cores base do sistema com suporte a dark/light mode
    const systemColors = {
      background: isDark ? "bg-neutral-950" : "bg-white",
      foreground: isDark ? "text-white" : "text-neutral-950",
      card: isDark ? "bg-neutral-900" : "bg-white",
      cardForeground: isDark ? "text-white" : "text-neutral-950",
      border: isDark ? "border-neutral-700" : "border-neutral-200",
      muted: isDark ? "bg-neutral-800" : "bg-neutral-100",
      mutedForeground: isDark ? "text-neutral-400" : "text-neutral-500",
      accent: isDark ? "bg-neutral-800" : "bg-neutral-100",
      accentForeground: isDark ? "text-white" : "text-neutral-950",
    }

    return {
      ...baseColors[currentTheme],
      ...systemColors,
    }
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        currentTheme, 
        colorMode, 
        isDark, 
        setTheme, 
        setColorMode, 
        getThemeColors 
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}