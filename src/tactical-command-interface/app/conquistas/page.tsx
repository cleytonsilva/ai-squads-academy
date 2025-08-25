"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Medal, Award, Crown, Shield } from "lucide-react"
import { useTheme } from "../contexts/theme-context"

export default function ConquistasPage() {
  const [selectedCategory, setSelectedCategory] = useState("todas")
  const [selectedAchievement, setSelectedAchievement] = useState(null)
  const { getThemeColors } = useTheme()
  const themeColors = getThemeColors()

  const conquistas = [
    {
      id: "ACH-001",
      title: "Primeiro Passo",
      description: "Complete seu primeiro curso",
      category: "Iniciante",
      rarity: "Comum",
      xp: 100,
      unlocked: true,
      unlockedDate: "15/06/2025",
      icon: Trophy,
      progress: 1,
      total: 1,
    },
    {
      id: "ACH-002",
      title: "Estudante Dedicado",
      description: "Estude por 7 dias consecutivos",
      category: "Disciplina",
      rarity: "Raro",
      xp: 250,
      unlocked: true,
      unlockedDate: "10/06/2025",
      icon: Medal,
      progress: 7,
      total: 7,
    },
    {
      id: "ACH-003",
      title: "Mestre da Matemática",
      description: "Complete 50 exercícios de matemática",
      category: "Matéria",
      rarity: "Épico",
      xp: 500,
      unlocked: true,
      unlockedDate: "08/06/2025",
      icon: Crown,
      progress: 50,
      total: 50,
    },
    {
      id: "ACH-004",
      title: "Velocista",
      description: "Complete um simulado em menos de 30 minutos",
      category: "Desempenho",
      rarity: "Raro",
      xp: 300,
      unlocked: false,
      unlockedDate: null,
      icon: Star,
      progress: 0,
      total: 1,
    },
    {
      id: "ACH-005",
      title: "Perfeccionista",
      description: "Obtenha 100% de acerto em 10 simulados",
      category: "Desempenho",
      rarity: "Lendário",
      xp: 1000,
      unlocked: false,
      unlockedDate: null,
      icon: Shield,
      progress: 3,
      total: 10,
    },
    {
      id: "ACH-006",
      title: "Maratonista",
      description: "Estude por mais de 5 horas em um dia",
      category: "Disciplina",
      rarity: "Épico",
      xp: 400,
      unlocked: false,
      unlockedDate: null,
      icon: Award,
      progress: 0,
      total: 1,
    },
    {
      id: "ACH-007",
      title: "Colecionador",
      description: "Complete cursos de 5 matérias diferentes",
      category: "Exploração",
      rarity: "Raro",
      xp: 350,
      unlocked: false,
      unlockedDate: null,
      icon: Trophy,
      progress: 3,
      total: 5,
    },
    {
      id: "ACH-008",
      title: "Guru da Redação",
      description: "Escreva 20 redações com nota acima de 900",
      category: "Matéria",
      rarity: "Lendário",
      xp: 800,
      unlocked: false,
      unlockedDate: null,
      icon: Crown,
      progress: 5,
      total: 20,
    },
  ]

  const categories = ["todas", "Iniciante", "Disciplina", "Matéria", "Desempenho", "Exploração"]

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "Comum":
        return "bg-gray-500/20 text-gray-400"
      case "Raro":
        return "bg-blue-500/20 text-blue-400"
      case "Épico":
        return "bg-purple-500/20 text-purple-400"
      case "Lendário":
        return "bg-yellow-500/20 text-yellow-400"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const filteredConquistas = conquistas.filter(
    (conquista) => selectedCategory === "todas" || conquista.category === selectedCategory,
  )

  const unlockedCount = conquistas.filter((c) => c.unlocked).length
  const totalXP = conquistas.filter((c) => c.unlocked).reduce((sum, c) => sum + c.xp, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">CONQUISTAS</h1>
          <p className="text-sm text-neutral-400">Desbloqueie conquistas e mostre seu progresso</p>
        </div>
        <div className="flex gap-2">
          <Button
            className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
          >
            Ver Ranking
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">DESBLOQUEADAS</p>
                <p className="text-2xl font-bold text-white font-mono">{unlockedCount}</p>
              </div>
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL</p>
                <p className="text-2xl font-bold text-neutral-300 font-mono">{conquistas.length}</p>
              </div>
              <Medal className="w-8 h-8 text-neutral-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">XP GANHO</p>
                <p className="text-2xl font-bold text-white font-mono">{totalXP}</p>
              </div>
              <Star className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">PROGRESSO</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {Math.round((unlockedCount / conquistas.length) * 100)}%
                </p>
              </div>
              <Award className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? `${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`
                    : "border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                }
              >
                {category === "todas" ? "Todas" : category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredConquistas.map((conquista) => {
          const IconComponent = conquista.icon
          return (
            <Card
              key={conquista.id}
              className={`bg-neutral-900 border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer ${
                !conquista.unlocked ? "opacity-60" : ""
              }`}
              onClick={() => setSelectedAchievement(conquista)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${conquista.unlocked ? themeColors.primaryBg : "bg-neutral-700"}`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white tracking-wider">{conquista.title}</CardTitle>
                      <p className="text-xs text-neutral-400">{conquista.category}</p>
                    </div>
                  </div>
                  {conquista.unlocked && <Badge className="bg-green-500/20 text-green-500">DESBLOQUEADA</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={getRarityColor(conquista.rarity)}>{conquista.rarity.toUpperCase()}</Badge>
                  <Badge className="bg-neutral-800 text-neutral-300">{conquista.xp} XP</Badge>
                </div>

                <p className="text-sm text-neutral-300">{conquista.description}</p>

                {conquista.unlocked ? (
                  <div className="text-xs text-neutral-400">
                    Desbloqueada em: <span className="text-white font-mono">{conquista.unlockedDate}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Progresso</span>
                      <span className="text-white font-mono">
                        {conquista.progress}/{conquista.total}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div
                        className={`${themeColors.primaryBg} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${(conquista.progress / conquista.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded ${selectedAchievement.unlocked ? themeColors.primaryBg : "bg-neutral-700"}`}
                >
                  <selectedAchievement.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white tracking-wider">
                    {selectedAchievement.title}
                  </CardTitle>
                  <p className="text-sm text-neutral-400">{selectedAchievement.category}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedAchievement(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESCRIÇÃO</h3>
                  <p className="text-sm text-neutral-300">{selectedAchievement.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">RARIDADE</h3>
                    <Badge className={getRarityColor(selectedAchievement.rarity)}>
                      {selectedAchievement.rarity.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">RECOMPENSA</h3>
                    <Badge className="bg-neutral-800 text-neutral-300">{selectedAchievement.xp} XP</Badge>
                  </div>
                </div>

                {selectedAchievement.unlocked ? (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DATA DE DESBLOQUEIO</h3>
                    <p className="text-sm text-white font-mono">{selectedAchievement.unlockedDate}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">PROGRESSO</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Concluído</span>
                        <span className="text-white font-mono">
                          {selectedAchievement.progress}/{selectedAchievement.total}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3">
                        <div
                          className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${(selectedAchievement.progress / selectedAchievement.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
