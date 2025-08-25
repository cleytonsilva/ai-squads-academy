"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, BookOpen, Clock, Users, Star, Play } from "lucide-react"
import { useTheme } from "../contexts/theme-context"

export default function CursosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState(null)
  const { getThemeColors } = useTheme()
  const themeColors = getThemeColors()

  const cursos = [
    {
      id: "MATH-101",
      title: "Matemática Básica",
      description: "Fundamentos da matemática para ensino médio",
      instructor: "Prof. Ana Silva",
      duration: "40 horas",
      students: 1250,
      rating: 4.8,
      progress: 85,
      category: "Exatas",
      level: "Básico",
      status: "em_andamento",
    },
    {
      id: "PORT-201",
      title: "Português Avançado",
      description: "Gramática, literatura e redação para vestibulares",
      instructor: "Prof. Carlos Santos",
      duration: "60 horas",
      students: 980,
      rating: 4.9,
      progress: 60,
      category: "Linguagens",
      level: "Avançado",
      status: "em_andamento",
    },
    {
      id: "HIST-301",
      title: "História do Brasil",
      description: "Da colonização aos dias atuais",
      instructor: "Prof. Maria Oliveira",
      duration: "50 horas",
      students: 750,
      rating: 4.7,
      progress: 92,
      category: "Humanas",
      level: "Intermediário",
      status: "em_andamento",
    },
    {
      id: "PHYS-101",
      title: "Física Fundamental",
      description: "Mecânica, termodinâmica e eletromagnetismo",
      instructor: "Prof. João Costa",
      duration: "45 horas",
      students: 650,
      rating: 4.6,
      progress: 45,
      category: "Exatas",
      level: "Básico",
      status: "em_andamento",
    },
    {
      id: "CHEM-201",
      title: "Química Orgânica",
      description: "Compostos orgânicos e reações químicas",
      instructor: "Prof. Laura Mendes",
      duration: "35 horas",
      students: 420,
      rating: 4.5,
      progress: 0,
      category: "Exatas",
      level: "Intermediário",
      status: "disponivel",
    },
    {
      id: "BIO-101",
      title: "Biologia Celular",
      description: "Estrutura e função das células",
      instructor: "Prof. Pedro Lima",
      duration: "30 horas",
      students: 890,
      rating: 4.8,
      progress: 100,
      category: "Biológicas",
      level: "Básico",
      status: "concluido",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "em_andamento":
        return `bg-${themeColors.primaryText.split("-")[1]}-500/20 text-${themeColors.primaryText.split("-")[1]}-500`
      case "concluido":
        return "bg-green-500/20 text-green-500"
      case "disponivel":
        return "bg-neutral-500/20 text-neutral-300"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const filteredCursos = cursos.filter(
    (curso) =>
      curso.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curso.instructor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">MEUS CURSOS</h1>
          <p className="text-sm text-neutral-400">Gerencie seus cursos e acompanhe seu progresso</p>
        </div>
        <div className="flex gap-2">
          <Button
            className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
          >
            Explorar Cursos
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar cursos..."
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
                <p className="text-xs text-neutral-400 tracking-wider">EM ANDAMENTO</p>
                <p className="text-2xl font-bold text-white font-mono">5</p>
              </div>
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CONCLUÍDOS</p>
                <p className="text-2xl font-bold text-green-500 font-mono">12</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">HORAS ESTUDADAS</p>
                <p className="text-2xl font-bold text-white font-mono">247h</p>
              </div>
              <Clock className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCursos.map((curso) => (
          <Card
            key={curso.id}
            className="bg-neutral-900 border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer"
            onClick={() => setSelectedCourse(curso)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white tracking-wider">{curso.title}</CardTitle>
                  <p className="text-xs text-neutral-400">{curso.instructor}</p>
                </div>
                <Badge className={getStatusColor(curso.status)}>
                  {curso.status === "em_andamento"
                    ? "EM ANDAMENTO"
                    : curso.status === "concluido"
                      ? "CONCLUÍDO"
                      : "DISPONÍVEL"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-neutral-300">{curso.description}</p>

              <div className="flex items-center gap-4 text-xs text-neutral-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{curso.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{curso.students}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span>{curso.rating}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Badge className="bg-neutral-800 text-neutral-300 text-xs">{curso.category}</Badge>
                <Badge className="bg-neutral-800 text-neutral-300 text-xs">{curso.level}</Badge>
              </div>

              {curso.status !== "disponivel" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Progresso</span>
                    <span className="text-white font-mono">{curso.progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div
                      className={`${themeColors.primaryBg} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${curso.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {curso.status === "disponivel" ? (
                  <Button
                    size="sm"
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white flex-1`}
                  >
                    Iniciar Curso
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white flex-1`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Continuar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">{selectedCourse.title}</CardTitle>
                <p className="text-sm text-neutral-400">{selectedCourse.instructor}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedCourse(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESCRIÇÃO</h3>
                    <p className="text-sm text-neutral-300">{selectedCourse.description}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DETALHES</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Duração:</span>
                        <span className="text-white">{selectedCourse.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Estudantes:</span>
                        <span className="text-white">{selectedCourse.students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Avaliação:</span>
                        <span className="text-white">{selectedCourse.rating}/5.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Nível:</span>
                        <span className="text-white">{selectedCourse.level}</span>
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
                        <span className="text-white font-mono">{selectedCourse.progress}%</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3">
                        <div
                          className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${selectedCourse.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">CATEGORIAS</h3>
                    <div className="flex gap-2">
                      <Badge className="bg-neutral-800 text-neutral-300">{selectedCourse.category}</Badge>
                      <Badge className="bg-neutral-800 text-neutral-300">{selectedCourse.level}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button
                  className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                >
                  {selectedCourse.status === "disponivel" ? "Iniciar Curso" : "Continuar Estudos"}
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Ver Conteúdo
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Favoritar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
