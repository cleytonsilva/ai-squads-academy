"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, Clock, Trophy, Star, CheckCircle, XCircle } from "lucide-react"
import { useTheme } from "../contexts/theme-context"

export default function MissoesPage() {
  const [selectedMission, setSelectedMission] = useState(null)
  const { getThemeColors } = useTheme()
  const themeColors = getThemeColors()

  const missoes = [
    {
      id: "MISS-001",
      title: "Mestre da Matemática",
      description: "Complete 10 exercícios de matemática sem errar",
      type: "Diária",
      difficulty: "Fácil",
      xp: 100,
      progress: 7,
      total: 10,
      status: "em_andamento",
      timeLeft: "2h 30min",
      category: "Matemática",
    },
    {
      id: "MISS-002",
      title: "Leitor Voraz",
      description: "Leia 5 textos de literatura brasileira",
      type: "Semanal",
      difficulty: "Médio",
      xp: 250,
      progress: 3,
      total: 5,
      status: "em_andamento",
      timeLeft: "3 dias",
      category: "Português",
    },
    {
      id: "MISS-003",
      title: "Historiador Dedicado",
      description: "Assista 3 videoaulas sobre República Velha",
      type: "Diária",
      difficulty: "Fácil",
      xp: 150,
      progress: 3,
      total: 3,
      status: "concluida",
      timeLeft: "Concluída",
      category: "História",
    },
    {
      id: "MISS-004",
      title: "Cientista em Formação",
      description: "Resolva 15 questões de física sobre movimento",
      type: "Semanal",
      difficulty: "Difícil",
      xp: 400,
      progress: 8,
      total: 15,
      status: "em_andamento",
      timeLeft: "5 dias",
      category: "Física",
    },
    {
      id: "MISS-005",
      title: "Sequência de Estudos",
      description: "Estude por 7 dias consecutivos",
      type: "Especial",
      difficulty: "Médio",
      xp: 500,
      progress: 5,
      total: 7,
      status: "em_andamento",
      timeLeft: "2 dias",
      category: "Geral",
    },
    {
      id: "MISS-006",
      title: "Redator Expert",
      description: "Escreva 3 redações com nota acima de 800",
      type: "Mensal",
      difficulty: "Difícil",
      xp: 600,
      progress: 0,
      total: 3,
      status: "disponivel",
      timeLeft: "25 dias",
      category: "Redação",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "em_andamento":
        return `bg-${themeColors.primaryText.split("-")[1]}-500/20 text-${themeColors.primaryText.split("-")[1]}-500`
      case "concluida":
        return "bg-green-500/20 text-green-500"
      case "disponivel":
        return "bg-neutral-500/20 text-neutral-300"
      case "expirada":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-green-500/20 text-green-500"
      case "Médio":
        return `bg-${themeColors.primaryText.split("-")[1]}-500/20 text-${themeColors.primaryText.split("-")[1]}-500`
      case "Difícil":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "Diária":
        return "bg-blue-500/20 text-blue-500"
      case "Semanal":
        return "bg-purple-500/20 text-purple-500"
      case "Mensal":
        return "bg-yellow-500/20 text-yellow-500"
      case "Especial":
        return "bg-pink-500/20 text-pink-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "em_andamento":
        return <Target className="w-4 h-4" />
      case "concluida":
        return <CheckCircle className="w-4 h-4" />
      case "disponivel":
        return <Clock className="w-4 h-4" />
      case "expirada":
        return <XCircle className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">MISSÕES</h1>
          <p className="text-sm text-neutral-400">Complete desafios e ganhe XP para subir de nível</p>
        </div>
        <div className="flex gap-2">
          <Button
            className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
          >
            Ver Recompensas
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">EM ANDAMENTO</p>
                <p className="text-2xl font-bold text-white font-mono">4</p>
              </div>
              <Target className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CONCLUÍDAS</p>
                <p className="text-2xl font-bold text-green-500 font-mono">23</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">XP TOTAL</p>
                <p className="text-2xl font-bold text-white font-mono">4,250</p>
              </div>
              <Star className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">SEQUÊNCIA</p>
                <p className="text-2xl font-bold text-white font-mono">12</p>
              </div>
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {missoes.map((missao) => (
          <Card
            key={missao.id}
            className="bg-neutral-900 border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer"
            onClick={() => setSelectedMission(missao)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wider">{missao.title}</CardTitle>
                  <p className="text-xs text-neutral-400 font-mono">{missao.id}</p>
                </div>
                <div className="flex items-center gap-2">{getStatusIcon(missao.status)}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getStatusColor(missao.status)}>
                  {missao.status === "em_andamento"
                    ? "EM ANDAMENTO"
                    : missao.status === "concluida"
                      ? "CONCLUÍDA"
                      : missao.status === "disponivel"
                        ? "DISPONÍVEL"
                        : "EXPIRADA"}
                </Badge>
                <Badge className={getTypeColor(missao.type)}>{missao.type.toUpperCase()}</Badge>
                <Badge className={getDifficultyColor(missao.difficulty)}>{missao.difficulty.toUpperCase()}</Badge>
              </div>

              <p className="text-sm text-neutral-300">{missao.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Trophy className="w-3 h-3" />
                  <span>{missao.xp} XP</span>
                  <Clock className="w-3 h-3 ml-2" />
                  <span>{missao.timeLeft}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Target className="w-3 h-3" />
                  <span>Categoria: {missao.category}</span>
                </div>
              </div>

              {missao.status !== "disponivel" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Progresso</span>
                    <span className="text-white font-mono">
                      {missao.progress}/{missao.total}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div
                      className={`${themeColors.primaryBg} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${(missao.progress / missao.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mission Detail Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedMission.title}</CardTitle>
                <p className="text-sm text-neutral-400 font-mono">{selectedMission.id}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedMission(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">STATUS DA MISSÃO</h3>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(selectedMission.status)}>
                        {selectedMission.status === "em_andamento"
                          ? "EM ANDAMENTO"
                          : selectedMission.status === "concluida"
                            ? "CONCLUÍDA"
                            : selectedMission.status === "disponivel"
                              ? "DISPONÍVEL"
                              : "EXPIRADA"}
                      </Badge>
                      <Badge className={getTypeColor(selectedMission.type)}>{selectedMission.type.toUpperCase()}</Badge>
                      <Badge className={getDifficultyColor(selectedMission.difficulty)}>
                        {selectedMission.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DETALHES</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Categoria:</span>
                        <span className="text-white">{selectedMission.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Recompensa:</span>
                        <span className="text-white font-mono">{selectedMission.xp} XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Tempo Restante:</span>
                        <span className="text-white font-mono">{selectedMission.timeLeft}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Dificuldade:</span>
                        <Badge className={getDifficultyColor(selectedMission.difficulty)}>
                          {selectedMission.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">PROGRESSO</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Concluído</span>
                        <span className="text-white font-mono">
                          {selectedMission.progress}/{selectedMission.total}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3">
                        <div
                          className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${(selectedMission.progress / selectedMission.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESCRIÇÃO</h3>
                    <p className="text-sm text-neutral-300">{selectedMission.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                {selectedMission.status === "disponivel" ? (
                  <Button
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                  >
                    Iniciar Missão
                  </Button>
                ) : selectedMission.status === "em_andamento" ? (
                  <Button
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                  >
                    Continuar
                  </Button>
                ) : (
                  <Button disabled className="bg-neutral-700 text-neutral-400">
                    Missão Concluída
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Ver Dicas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
