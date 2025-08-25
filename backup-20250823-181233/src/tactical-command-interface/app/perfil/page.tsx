"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { User, Camera, Settings, Palette, Trophy, BookOpen, Target } from "lucide-react"
import { useTheme } from "../contexts/theme-context"

export default function PerfilPage() {
  const [activeTab, setActiveTab] = useState("perfil")
  const [profileData, setProfileData] = useState({
    name: "João Silva",
    email: "joao.silva@email.com",
    bio: "Estudante dedicado focado no ENEM 2025",
    school: "Colégio Exemplo",
    grade: "3º Ano",
    birthDate: "2006-05-15",
    city: "São Paulo",
    state: "SP",
    goals: "Medicina na USP",
  })

  const { currentTheme, setTheme, getThemeColors } = useTheme()
  const themeColors = getThemeColors()

  const themes = [
    { id: "orange", name: "Laranja", color: "bg-orange-500" },
    { id: "blue", name: "Azul", color: "bg-blue-500" },
    { id: "yellow", name: "Amarelo", color: "bg-yellow-500" },
    { id: "purple", name: "Roxo", color: "bg-purple-500" },
    { id: "green", name: "Verde", color: "bg-green-500" },
    { id: "red", name: "Vermelho", color: "bg-red-500" },
  ]

  const avatarOptions = [
    "/placeholder.svg?height=100&width=100&text=Avatar1",
    "/placeholder.svg?height=100&width=100&text=Avatar2",
    "/placeholder.svg?height=100&width=100&text=Avatar3",
    "/placeholder.svg?height=100&width=100&text=Avatar4",
    "/placeholder.svg?height=100&width=100&text=Avatar5",
    "/placeholder.svg?height=100&width=100&text=Avatar6",
  ]

  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0])

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const userStats = {
    level: 15,
    xp: 2847,
    nextLevelXp: 3000,
    coursesCompleted: 12,
    coursesInProgress: 5,
    totalStudyHours: 247,
    achievementsUnlocked: 23,
    simuladosCompleted: 18,
    averageScore: 785,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">MEU PERFIL</h1>
          <p className="text-sm text-neutral-400">Gerencie suas informações pessoais e configurações</p>
        </div>
      </div>

      {/* Profile Overview */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={selectedAvatar || "/placeholder.svg"} alt="Avatar" />
                <AvatarFallback>
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
              >
                <Camera className="w-4 h-4 mr-2" />
                Alterar Avatar
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">{profileData.name}</h2>
                <p className="text-neutral-400">{profileData.email}</p>
                <p className="text-sm text-neutral-500 mt-2">{profileData.bio}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white font-mono">Nv.{userStats.level}</div>
                  <div className="text-xs text-neutral-500">Nível</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white font-mono">{userStats.xp}</div>
                  <div className="text-xs text-neutral-500">XP Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white font-mono">{userStats.coursesCompleted}</div>
                  <div className="text-xs text-neutral-500">Cursos Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white font-mono">{userStats.totalStudyHours}h</div>
                  <div className="text-xs text-neutral-500">Horas de Estudo</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Progresso para o próximo nível</span>
                  <span className="text-white font-mono">
                    {userStats.xp}/{userStats.nextLevelXp} XP
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div
                    className={`${themeColors.primaryBg} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${(userStats.xp / userStats.nextLevelXp) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-700">
        {[
          { id: "perfil", label: "Informações Pessoais", icon: User },
          { id: "avatar", label: "Avatar", icon: Camera },
          { id: "tema", label: "Tema", icon: Palette },
          { id: "estatisticas", label: "Estatísticas", icon: Trophy },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? `${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "perfil" && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">INFORMAÇÕES PESSOAIS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm text-neutral-300">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm text-neutral-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="school" className="text-sm text-neutral-300">
                    Escola
                  </Label>
                  <Input
                    id="school"
                    value={profileData.school}
                    onChange={(e) => handleInputChange("school", e.target.value)}
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="grade" className="text-sm text-neutral-300">
                    Série
                  </Label>
                  <Select value={profileData.grade} onValueChange={(value) => handleInputChange("grade", value)}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1º Ano">1º Ano</SelectItem>
                      <SelectItem value="2º Ano">2º Ano</SelectItem>
                      <SelectItem value="3º Ano">3º Ano</SelectItem>
                      <SelectItem value="Cursinho">Cursinho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="birthDate" className="text-sm text-neutral-300">
                    Data de Nascimento
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={profileData.birthDate}
                    onChange={(e) => handleInputChange("birthDate", e.target.value)}
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-sm text-neutral-300">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    value={profileData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm text-neutral-300">
                    Estado
                  </Label>
                  <Input
                    id="state"
                    value={profileData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="bg-neutral-800 border-neutral-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="goals" className="text-sm text-neutral-300">
                    Objetivos
                  </Label>
                  <Input
                    id="goals"
                    value={profileData.goals}
                    onChange={(e) => handleInputChange("goals", e.target.value)}
                    className="bg-neutral-800 border-neutral-600 text-white"
                    placeholder="Ex: Medicina na USP"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="text-sm text-neutral-300">
                Biografia
              </Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="bg-neutral-800 border-neutral-600 text-white"
                rows={3}
                placeholder="Conte um pouco sobre você..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
              >
                Salvar Alterações
              </Button>
              <Button
                variant="outline"
                className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "avatar" && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">ESCOLHER AVATAR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {avatarOptions.map((avatar, index) => (
                <div
                  key={index}
                  className={`relative cursor-pointer rounded-lg p-2 transition-colors ${
                    selectedAvatar === avatar
                      ? `border-2 ${themeColors.primaryText.replace("text-", "border-")}`
                      : "border-2 border-neutral-700 hover:border-neutral-500"
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <Avatar className="w-full aspect-square">
                    <AvatarImage src={avatar || "/placeholder.svg"} alt={`Avatar ${index + 1}`} />
                    <AvatarFallback>
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  {selectedAvatar === avatar && (
                    <div
                      className={`absolute -top-1 -right-1 w-4 h-4 ${themeColors.primaryBg} rounded-full flex items-center justify-center`}
                    >
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button
                className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
              >
                Salvar Avatar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "tema" && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PERSONALIZAR TEMA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-300 mb-4">Escolha sua cor preferida</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`relative cursor-pointer rounded-lg p-4 transition-colors border-2 ${
                        currentTheme === theme.id ? "border-white" : "border-neutral-700 hover:border-neutral-500"
                      }`}
                      onClick={() => setTheme(theme.id)}
                    >
                      <div className={`w-full h-12 ${theme.color} rounded-lg mb-2`}></div>
                      <p className="text-xs text-center text-neutral-300">{theme.name}</p>
                      {currentTheme === theme.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-black rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-neutral-800 rounded-lg">
                <h4 className="text-sm font-medium text-neutral-300 mb-2">Prévia do Tema</h4>
                <div className="space-y-2">
                  <Button
                    className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                  >
                    Botão Principal
                  </Button>
                  <div className="flex gap-2">
                    <Badge
                      className={`${
                        themeColors.primaryText.split("-")[1] === "orange"
                          ? "bg-orange-500/20 text-orange-500"
                          : themeColors.primaryText.split("-")[1] === "blue"
                            ? "bg-blue-500/20 text-blue-500"
                            : themeColors.primaryText.split("-")[1] === "yellow"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : themeColors.primaryText.split("-")[1] === "purple"
                                ? "bg-purple-500/20 text-purple-500"
                                : themeColors.primaryText.split("-")[1] === "green"
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      Badge Colorido
                    </Badge>
                    <Badge className="bg-neutral-700 text-neutral-300">Badge Neutro</Badge>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-2">
                    <div className={`${themeColors.primaryBg} h-2 rounded-full w-3/4`}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "estatisticas" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">ESTATÍSTICAS GERAIS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-neutral-800 rounded">
                  <BookOpen className="w-8 h-8 text-white mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white font-mono">{userStats.coursesCompleted}</div>
                  <div className="text-xs text-neutral-500">Cursos Concluídos</div>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded">
                  <Target className="w-8 h-8 text-white mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white font-mono">{userStats.coursesInProgress}</div>
                  <div className="text-xs text-neutral-500">Em Andamento</div>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded">
                  <Trophy className="w-8 h-8 text-white mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white font-mono">{userStats.achievementsUnlocked}</div>
                  <div className="text-xs text-neutral-500">Conquistas</div>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded">
                  <Settings className="w-8 h-8 text-white mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white font-mono">{userStats.simuladosCompleted}</div>
                  <div className="text-xs text-neutral-500">Simulados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">DESEMPENHO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-neutral-400">Média dos Simulados</span>
                  <span className="text-white font-mono">{userStats.averageScore}/1000</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-3">
                  <div
                    className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                    style={{ width: `${(userStats.averageScore / 1000) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-neutral-400">Horas de Estudo</span>
                  <span className="text-white font-mono">{userStats.totalStudyHours}h</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-3">
                  <div
                    className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min((userStats.totalStudyHours / 500) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-neutral-400">Progresso do Nível</span>
                  <span className="text-white font-mono">
                    {userStats.xp}/{userStats.nextLevelXp} XP
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-3">
                  <div
                    className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                    style={{ width: `${(userStats.xp / userStats.nextLevelXp) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
