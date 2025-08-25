"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "../contexts/theme-context"

export default function DashboardPage() {
  const { getThemeColors } = useTheme()
  const themeColors = getThemeColors()

  return (
    <div className="p-6 space-y-6">
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progresso dos Cursos */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PROGRESSO DOS CURSOS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">5</div>
                <div className="text-xs text-neutral-500">Em Andamento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">12</div>
                <div className="text-xs text-neutral-500">Concluídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">3</div>
                <div className="text-xs text-neutral-500">Favoritos</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { id: "MATH-101", name: "Matemática Básica", progress: 85 },
                { id: "PORT-201", name: "Português Avançado", progress: 60 },
                { id: "HIST-301", name: "História do Brasil", progress: 92 },
                { id: "PHYS-101", name: "Física Fundamental", progress: 45 },
              ].map((curso) => (
                <div
                  key={curso.id}
                  className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    <div>
                      <div className="text-xs text-white font-mono">{curso.id}</div>
                      <div className="text-xs text-neutral-500">{curso.name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-white font-mono">{curso.progress}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">ATIVIDADES RECENTES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {[
                {
                  time: "17/06/2025 14:30",
                  action: "completou a lição",
                  subject: "Equações de 2º Grau",
                  course: "Matemática Básica",
                },
                {
                  time: "17/06/2025 13:15",
                  action: "iniciou simulado",
                  subject: "ENEM 2024 - Linguagens",
                  course: null,
                },
                {
                  time: "16/06/2025 20:45",
                  action: "conquistou medalha",
                  subject: "Estudante Dedicado",
                  course: null,
                },
                {
                  time: "16/06/2025 19:30",
                  action: "finalizou exercícios",
                  subject: "Análise Sintática",
                  course: "Português Avançado",
                },
                {
                  time: "16/06/2025 18:20",
                  action: "assistiu videoaula",
                  subject: "República Velha",
                  course: "História do Brasil",
                },
              ].map((atividade, index) => (
                <div
                  key={index}
                  className={`text-xs border-l-2 border-${themeColors.primaryText.split("-")[1]}-500 pl-3 hover:bg-neutral-800 p-2 rounded transition-colors`}
                >
                  <div className="text-neutral-500 font-mono">{atividade.time}</div>
                  <div className="text-white">
                    Você {atividade.action} <span className={themeColors.primaryText}>{atividade.subject}</span>
                    {atividade.course && (
                      <span>
                        {" "}
                        em <span className="text-white font-mono">{atividade.course}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Estudo */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              ESTATÍSTICAS DE ESTUDO
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* Gráfico Circular de Progresso */}
            <div className="relative w-32 h-32 mb-4">
              <div className="absolute inset-0 border-4 border-white rounded-full opacity-60"></div>
              <div className="absolute inset-2 border-2 border-white rounded-full opacity-40"></div>
              <div className="absolute inset-4 border border-white rounded-full opacity-20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">78%</div>
                  <div className="text-xs text-neutral-400">Progresso</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-neutral-500 space-y-1 w-full font-mono">
              <div className="flex justify-between">
                <span>Tempo de estudo hoje:</span>
                <span className="text-white">2h 45min</span>
              </div>
              <div className="flex justify-between">
                <span>Sequência de dias:</span>
                <span className="text-white">12 dias</span>
              </div>
              <div className="flex justify-between">
                <span>XP ganho hoje:</span>
                <span className={themeColors.primaryText}>+245 XP</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Desempenho */}
        <Card className="lg:col-span-8 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">DESEMPENHO SEMANAL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 relative">
              {/* Chart Grid */}
              <div className="absolute inset-0 grid grid-cols-7 grid-rows-6 opacity-20">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>

              {/* Chart Line */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  points="50,120 100,100 150,110 200,90 250,95 300,85 350,100"
                  fill="none"
                  stroke={`var(--${themeColors.primaryText.split("-")[1]}-500)`}
                  strokeWidth="3"
                />
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-500 -ml-8 font-mono">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-neutral-500 -mb-6 font-mono">
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximas Atividades */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PRÓXIMAS ATIVIDADES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  type: "Simulado",
                  title: "ENEM 2024 - Matemática",
                  date: "18/06/2025",
                  time: "14:00",
                  priority: "high",
                },
                {
                  type: "Prova",
                  title: "Avaliação - História",
                  date: "19/06/2025",
                  time: "10:00",
                  priority: "medium",
                },
                {
                  type: "Entrega",
                  title: "Redação - Meio Ambiente",
                  date: "20/06/2025",
                  time: "23:59",
                  priority: "high",
                },
              ].map((atividade, index) => (
                <div
                  key={index}
                  className="p-3 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-400 uppercase tracking-wider">{atividade.type}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded uppercase tracking-wider ${
                        atividade.priority === "high"
                          ? "bg-red-500/20 text-red-500"
                          : "bg-neutral-500/20 text-neutral-300"
                      }`}
                    >
                      {atividade.priority}
                    </span>
                  </div>
                  <div className="text-sm text-white font-medium mb-1">{atividade.title}</div>
                  <div className="text-xs text-neutral-400 font-mono">
                    {atividade.date} às {atividade.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
