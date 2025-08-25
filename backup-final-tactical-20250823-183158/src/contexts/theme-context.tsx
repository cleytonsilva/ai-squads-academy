import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Theme = "orange" | "blue" | "yellow" | "purple" | "green" | "red"

interface ThemeContextType {
  currentTheme: Theme
  setTheme: (theme: Theme) => void
  getThemeColors: () => {
    primary: string
    primaryHover: string
    primaryText: string
    primaryBg: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>("orange")

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme)
    // Salvar tema no localStorage para persistência
    localStorage.setItem('esquads-theme', theme)
  }

  // Carregar tema do localStorage na inicialização
  useEffect(() => {
    const savedTheme = localStorage.getItem('esquads-theme') as Theme
    if (savedTheme && ['orange', 'blue', 'yellow', 'purple', 'green', 'red'].includes(savedTheme)) {
      setCurrentTheme(savedTheme)
    }
  }, [])

  const getThemeColors = () => {
    const themes = {
      orange: {
        primary: "text-orange-500",
        primaryHover: "hover:text-orange-500",
        primaryText: "text-orange-500",
        primaryBg: "bg-orange-500",
      },
      blue: {
        primary: "text-blue-500",
        primaryHover: "hover:text-blue-500",
        primaryText: "text-blue-500",
        primaryBg: "bg-blue-500",
      },
      yellow: {
        primary: "text-yellow-500",
        primaryHover: "hover:text-yellow-500",
        primaryText: "text-yellow-500",
        primaryBg: "bg-yellow-500",
      },
      purple: {
        primary: "text-purple-500",
        primaryHover: "hover:text-purple-500",
        primaryText: "text-purple-500",
        primaryBg: "bg-purple-500",
      },
      green: {
        primary: "text-green-500",
        primaryHover: "hover:text-green-500",
        primaryText: "text-green-500",
        primaryBg: "bg-green-500",
      },
      red: {
        primary: "text-red-500",
        primaryHover: "hover:text-red-500",
        primaryText: "text-red-500",
        primaryBg: "bg-red-500",
      },
    }
    return themes[currentTheme]
  }

  return <ThemeContext.Provider value={{ currentTheme, setTheme, getThemeColors }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}