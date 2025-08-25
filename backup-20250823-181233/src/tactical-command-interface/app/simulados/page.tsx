"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Clock, FileText, BarChart3, Play, CheckCircle } from "lucide-react"
import { useTheme } from "../contexts/theme-context"

export default function SimuladosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSimulado, setSelectedSimulado] = useState(null)
  const { getThemeColors } = useTheme()
  const themeColors = getThemeColors()

  const simulados = [
    {
      id: "SIM-001",
      title: "ENEM 2024 - Completo",
      description: "Simulado completo com todas as áreas do conhecimento",
      type: "ENEM",
      duration: "5h 30min",
      questions: 180,
      difficulty: "Alto",
      attempts: 2,
      bestScore: 750,
      lastAttempt: "15/06/2025",
      status: "disponivel",
      subjects: ["Matemática", "Português", "História", "Geografia", "Física", "Química", "Biologia"],
    },
    {
      id: "SIM-002",
      title: "Matemática - Funções",
      description: "Simulado focado em funções matemáticas",
      type: "Específico",
      duration: "2h",
      questions: 50,
      difficulty: "Médio",
      attempts: 5,
      bestScore: 860,
      lastAttempt: "14/06/2025",
      status: "concluido",
      subjects: ["Matemática"],
    },
    {
      id: "SIM-003",
      title: "Português - Interpretação",
      description: "Exercícios de interpretação de texto e gramática",
      type: "Específico",
      duration: "1h 30min",
      questions: 30,
      difficulty: "Médio",
      attempts: 3,
      bestScore: 920,
      lastAttempt: "13/06/2025",
      status: "concluido",
      subjects: ["Português"],
    },
    {
      id: "SIM-004",
      title: "Vestibular USP 2024",
      description: "Simulado baseado no vestibular da USP",
      type: "Vestibular",
      duration: "4h",
      questions: 90,
      difficulty: "Alto",
      attempts: 1,
      bestScore: 680,
      lastAttempt: "12/06/2025",
      status: "em_andamento",
      subjects: ["Matemática", "Português", "História", "Geografia", "Física"],
    },
    {
      id: "SIM-005",
      title: "Ciências da Natureza",
      description: "Física, Química e Biologia para ENEM",
      type: "Área",
      duration: "2h 30min",
      questions: 45,
      difficulty: "Alto",
      attempts: 0,
      bestScore: null,
      lastAttempt: null,
      status: "disponivel",
      subjects: ["Física", "Química", "Biologia"],
    },
    {
      id: "SIM-006",
      title: "História do Brasil",
      description: "Período colonial até República",
      type: "Específico",
      duration: "1h",
      questions: 25,
      difficulty: "Baixo",
      attempts: 4,
      bestScore: 880,
      lastAttempt: "10/06/2025",
      status: "concluido",
      subjects: ["História"],
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "disponivel":
        return "bg-neutral-500/20 text-neutral-300"
      case "em_andamento":
        return `bg-${themeColors.primaryText.split("-")[1]}-500/20 text-${themeColors.primaryText.split("-")[1]}-500`
      case "concluido":
        return "bg-green-500/20 text-green-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Baixo":
        return "bg-green-500/20 text-green-500"
      case "Médio":
        return `bg-${themeColors.primaryText.split("-")[1]}-500/20 text-${themeColors.primaryText.split("-")[1]}-500`
      case "Alto":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "ENEM":
        return "bg-blue-500/20 text-blue-500"
      case "Vestibular":
        return "bg-purple-500/20 text-purple-500"
      case "Específico":
        return "bg-yellow-500/20 text-yellow-500"
      case "Área":
        return "bg-pink-500/20 text-pink-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const filteredSimulados = simulados.filter(
    (simulado) =>
      simulado.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      simulado.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      simulado.subjects.some((subject) => subject.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const totalAttempts = simulados.reduce((sum, s) => sum + s.attempts, 0)
  const completedSimulados = simulados.filter((s) => s.status === "concluido").length
  const averageScore = simulados
    .filter((s) => s.bestScore)
    .reduce((sum, s, _, arr) => sum + s.bestScore / arr.length, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SIMULADOS</h1>
          <p className="text-sm text-neutral-400">Pratique com simulados e teste seus conhecimentos</p>
        </div>
        <div className="flex gap-2">
          <Button
            className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
          >
            Criar Simulado
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar simulados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TENTATIVAS</p>
                <p className="text-2xl font-bold text-white font-mono">{totalAttempts}</p>
              </div>
              <FileText className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CONCLUÍDOS</p>
                <p className="text-2xl font-bold text-green-500 font-mono">{completedSimulados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">MÉDIA</p>
                <p className="text-2xl font-bold text-white font-mono">{Math.round(averageScore)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulados Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSimulados.map((simulado) => (
          <Card
            key={simulado.id}
            className="bg-neutral-900 border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer"
            onClick={() => setSelectedSimulado(simulado)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wider">{simulado.title}</CardTitle>
                  <p className="text-xs text-neutral-400 font-mono">{simulado.id}</p>
                </div>
                <Badge className={getStatusColor(simulado.status)}>
                  {simulado.status === "disponivel"
                    ? "DISPONÍVEL"
                    : simulado.status === "em_andamento"
                      ? "EM ANDAMENTO"
                      : "CONCLUÍDO"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getTypeColor(simulado.type)}>{simulado.type.toUpperCase()}</Badge>
                <Badge className={getDifficultyColor(simulado.difficulty)}>{simulado.difficulty.toUpperCase()}</Badge>
              </div>

              <p className="text-sm text-neutral-300">{simulado.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{simulado.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{simulado.questions} questões</span>
                  </div>
                </div>
                <div className="text-xs text-neutral-400">
                  Tentativas: <span className="text-white font-mono">{simulado.attempts}</span>
                  {simulado.bestScore && (
                    <span className="ml-4">
                      Melhor nota: <span className="text-white font-mono">{simulado.bestScore}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {simulado.subjects.slice(0, 3).map((subject) => (
                  <Badge key={subject} className="bg-neutral-800 text-neutral-300 text-xs">
                    {subject}
                  </Badge>
                ))}
                {simulado.subjects.length > 3 && (
                  <Badge className="bg-neutral-800 text-neutral-300 text-xs">+{simulado.subjects.length - 3}</Badge>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {simulado.status === "em_andamento" ? (
                  <Button
                    size="sm"
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white flex-1`}
                  >
                    Continuar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white flex-1`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Simulado Detail Modal */}
      {selectedSimulado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedSimulado.title}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedSimulado.id}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedSimulado(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">INFORMAÇÕES</h3>
                    <div className="flex gap-2 mb-3">
                      <Badge className={getStatusColor(selectedSimulado.status)}>
                        {selectedSimulado.status === "disponivel"
                          ? "DISPONÍVEL"
                          : selectedSimulado.status === "em_andamento"
                            ? "EM ANDAMENTO"
                            : "CONCLUÍDO"}
                      </Badge>
                      <Badge className={getTypeColor(selectedSimulado.type)}>
                        {selectedSimulado.type.toUpperCase()}
                      </Badge>
                      <Badge className={getDifficultyColor(selectedSimulado.difficulty)}>
                        {selectedSimulado.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-300">{selectedSimulado.description}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DETALHES</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Duração:</span>
                        <span className="text-white">{selectedSimulado.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Questões:</span>
                        <span className="text-white">{selectedSimulado.questions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Tentativas:</span>
                        <span className="text-white">{selectedSimulado.attempts}</span>
                      </div>
                      {selectedSimulado.bestScore && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Melhor Nota:</span>
                          <span className="text-white font-mono">{selectedSimulado.bestScore}</span>
                        </div>
                      )}
                      {selectedSimulado.lastAttempt && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Última Tentativa:</span>
                          <span className="text-white font-mono">{selectedSimulado.lastAttempt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">MATÉRIAS</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSimulado.subjects.map((subject) => (
                        <Badge key={subject} className="bg-neutral-800 text-neutral-300">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedSimulado.bestScore && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESEMPENHO</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-400">Melhor Pontuação</span>
                          <span className="text-white font-mono">{selectedSimulado.bestScore}/1000</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-3">
                          <div
                            className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                            style={{ width: `${(selectedSimulado.bestScore / 1000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                {selectedSimulado.status === "em_andamento" ? (
                  <Button
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                  >
                    Continuar Simulado
                  </Button>
                ) : (
                  <Button
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Simulado
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Ver Histórico
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
