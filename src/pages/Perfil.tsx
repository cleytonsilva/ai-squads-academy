import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Camera, Settings, Palette, Trophy, BookOpen, Target, Upload, X, Shield, Lock, Code, Database, Server, Cpu } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useStudentData } from "@/hooks/useStudentData";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  name: string;
  email: string;
  bio?: string;
  school?: string;
  grade?: string;
  birth_date?: string;
  city?: string;
  state?: string;
  goals?: string;
  avatar_url?: string;
}

export default function PerfilPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("perfil");
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    bio: "",
    school: "",
    grade: "",
    birth_date: "",
    city: "",
    state: "",
    goals: "",
    avatar_url: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { currentTheme, setTheme, getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { profile, refetch: refetchProfile } = useCurrentProfile();
  const { studentData, refetch: refetchStudentData } = useStudentData();

  const themes = [
    { id: "orange", name: "Laranja", color: "bg-orange-500" },
    { id: "blue", name: "Azul", color: "bg-blue-500" },
    { id: "yellow", name: "Amarelo", color: "bg-yellow-500" },
    { id: "purple", name: "Roxo", color: "bg-purple-500" },
    { id: "green", name: "Verde", color: "bg-green-500" },
    { id: "red", name: "Vermelho", color: "bg-red-500" },
  ];

  const avatarOptions = [
    { type: 'icon', icon: Shield, name: 'Segurança' },
    { type: 'icon', icon: Lock, name: 'Criptografia' },
    { type: 'icon', icon: Code, name: 'Desenvolvimento' },
    { type: 'icon', icon: Database, name: 'Banco de Dados' },
    { type: 'icon', icon: Server, name: 'Servidor' },
    { type: 'icon', icon: Cpu, name: 'Processamento' },
  ];

  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função para renderizar avatar baseado no tipo
  const renderAvatar = (avatarUrl: string | null, className: string = "w-12 h-12") => {
    if (avatarUrl?.startsWith('icon:')) {
      const iconName = avatarUrl.replace('icon:', '');
      const avatarOption = avatarOptions.find(option => option.name === iconName);
      if (avatarOption) {
        const IconComponent = avatarOption.icon;
        return <IconComponent className={className} />;
      }
    }
    return <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="Avatar" />;
  };

  // Carregar dados do perfil
  useEffect(() => {
    const loadProfileData = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        
        // Buscar dados completos do perfil
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.id)
          .single();

        if (error) throw error;

        if (profileData) {
          setProfileData({
            name: profileData.full_name || "",
            email: profileData.email || "",
            bio: profileData.bio || "",
            school: profileData.school || "",
            grade: profileData.grade || "",
            birth_date: profileData.birth_date || "",
            city: profileData.city || "",
            state: profileData.state || "",
            goals: profileData.goals || "",
            avatar_url: profileData.avatar_url || ""
          });
          
          if (profileData.avatar_url) {
            setSelectedAvatar(profileData.avatar_url);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do perfil",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [profile?.id]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;

    try {
      setSaving(true);
      
      // Preparar dados para atualização, removendo campos que não existem na tabela
      const updateData: any = {
        full_name: profileData.name,
        bio: profileData.bio,
        avatar_url: selectedAvatar,
        updated_at: new Date().toISOString()
      };
      
      // Adicionar campos opcionais apenas se existirem na tabela
      if (profileData.school) updateData.school = profileData.school;
      if (profileData.grade) updateData.grade = profileData.grade;
      if (profileData.city) updateData.city = profileData.city;
      if (profileData.state) updateData.state = profileData.state;
      if (profileData.goals) updateData.goals = profileData.goals;
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!"
      });
      await refetchProfile();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar perfil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!profile?.id) return;

    try {
      setSaving(true);
      
      // Usar a imagem carregada ou avatar selecionado
      const avatarToSave = uploadedImage || (selectedAvatar ? `icon:${selectedAvatar.name}` : null);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Avatar atualizado com sucesso!"
      });
      await refetchProfile();
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar avatar",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        setSelectedAvatar(''); // Limpar seleção de avatar padrão
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveUploadedImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Estatísticas do usuário
  const userStats = {
    level: studentData?.current_level || 1,
    xp: studentData?.total_xp || 0,
    nextLevelXp: (studentData?.current_level || 1) * 1000,
    coursesCompleted: studentData?.courses_completed || 0,
    coursesInProgress: studentData?.courses_in_progress || 0,
    totalStudyHours: studentData?.total_study_hours || 0,
    achievementsUnlocked: studentData?.achievements_unlocked || 0,
    simuladosCompleted: studentData?.assessments_completed || 0,
    averageScore: studentData?.average_score || 0,
  };

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="animate-pulse">
          <div className={`h-8 ${themeColors.muted} rounded w-1/4 mb-4`}></div>
          <div className={`h-32 ${themeColors.muted} rounded mb-6`}></div>
          <div className={`h-96 ${themeColors.muted} rounded`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${themeColors.foreground} tracking-wider`}>MEU PERFIL</h1>
          <p className={`text-sm ${themeColors.mutedForeground}`}>Gerencie suas informações pessoais e configurações</p>
        </div>
      </div>

      {/* Profile Overview */}
      <Card className={`${themeColors.card} ${themeColors.border}`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                {uploadedImage ? (
                  <AvatarImage src={uploadedImage} alt="Avatar" />
                ) : profile?.avatar_url?.startsWith('icon:') ? (
                  <AvatarFallback className={`${themeColors.cardBg} ${themeColors.cardForeground}`}>
                    {(() => {
                      const iconName = profile.avatar_url.replace('icon:', '');
                      const avatarOption = avatarOptions.find(option => option.name === iconName);
                      if (avatarOption) {
                        const IconComponent = avatarOption.icon;
                        return <IconComponent className="w-12 h-12" />;
                      }
                      return <User className="w-12 h-12" />;
                    })()}
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt="Avatar" />
                    <AvatarFallback>
                      <User className="w-12 h-12" />
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("avatar")}
                className={`${themeColors.border} ${themeColors.mutedForeground} hover:${themeColors.muted} hover:${themeColors.cardForeground} bg-transparent`}
              >
                <Camera className="w-4 h-4 mr-2" />
                Alterar Avatar
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className={`text-xl font-bold ${themeColors.foreground}`}>{profileData.name || 'Nome não informado'}</h2>
                <p className={`${themeColors.mutedForeground}`}>{profileData.email}</p>
                <p className={`text-sm ${themeColors.mutedForeground} mt-2`}>{profileData.bio || 'Biografia não informada'}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>Nv.{userStats.level}</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>Nível</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{userStats.xp.toLocaleString()}</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>XP Total</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{userStats.coursesCompleted}</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>Cursos Concluídos</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{userStats.totalStudyHours}h</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>Horas de Estudo</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={`${themeColors.mutedForeground}`}>Progresso para o próximo nível</span>
                  <span className={`${themeColors.foreground} font-mono`}>
                    {userStats.xp}/{userStats.nextLevelXp} XP
                  </span>
                </div>
                <div className={`w-full ${themeColors.muted} rounded-full h-2`}>
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
      <div className={`flex gap-2 border-b ${themeColors.border}`}>
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
            className={`
              inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium 
              ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 
              focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
              h-10 px-4 py-2
              ${
                activeTab === tab.id
                  ? `${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`
                  : `${themeColors.mutedForeground} hover:${themeColors.foreground} hover:${themeColors.muted}`
              }
            `}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            <span>{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "perfil" && (
        <Card className={`${themeColors.card} ${themeColors.border}`}>
          <CardHeader>
            <CardTitle className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider`}>INFORMAÇÕES PESSOAIS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className={`text-sm ${themeColors.cardForeground}`}>
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`${themeColors.muted} ${themeColors.border} ${themeColors.foreground}`}
                />
              </div>
              
              <div>
                <Label htmlFor="email" className={`text-sm ${themeColors.cardForeground}`}>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className={`${themeColors.muted} ${themeColors.border} ${themeColors.foreground} opacity-50`}
                />
              </div>

              <div>
                <Label htmlFor="bio" className={`text-sm ${themeColors.cardForeground}`}>
                  Biografia
                </Label>
                <Textarea
                  id="bio"
                  value={profileData.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  className={`${themeColors.muted} ${themeColors.border} ${themeColors.foreground}`}
                  rows={4}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button
                variant="outline"
                className={`${themeColors.border} ${themeColors.mutedForeground} hover:${themeColors.muted} hover:${themeColors.cardForeground} bg-transparent`}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "avatar" && (
        <Card className={`${themeColors.card} ${themeColors.border}`}>
          <CardHeader>
            <CardTitle className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider`}>ESCOLHER AVATAR</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Seção de Upload de Imagem */}
            <div className="mb-6">
              <h3 className={`text-sm font-medium ${themeColors.cardForeground} mb-4`}>Fazer Upload de Imagem</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {uploadedImage ? (
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={uploadedImage} alt="Imagem enviada" />
                      <AvatarFallback>
                        <User className="w-8 h-8 text-black" />
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={handleRemoveUploadedImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={handleUploadClick}
                    className={`w-20 h-20 border-2 border-dashed ${themeColors.border} rounded-full flex items-center justify-center cursor-pointer hover:${themeColors.border.replace("border-", "border-").replace("-700", "-500")} transition-colors`}
                  >
                    <Upload className={`w-6 h-6 ${themeColors.mutedForeground}`} />
                  </div>
                )}
                <div className="flex-1">
                  <Button
                    onClick={handleUploadClick}
                    variant="outline"
                    className={`${themeColors.border} ${themeColors.cardForeground} hover:${themeColors.accent}`}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {uploadedImage ? 'Trocar Imagem' : 'Escolher Imagem'}
                  </Button>
                  <p className={`text-xs ${themeColors.mutedForeground} mt-2`}>
                    Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Divisor */}
            <div className={`border-t ${themeColors.border} my-6`}></div>

            {/* Seção de Avatares Padrão */}
            <div>
              <h3 className={`text-sm font-medium ${themeColors.cardForeground} mb-4`}>Avatares Padrão</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {avatarOptions.map((avatar, index) => {
                  const IconComponent = avatar.icon;
                  const isSelected = selectedAvatar?.name === avatar.name && !uploadedImage;
                  
                  return (
                    <div
                      key={index}
                      className={`relative cursor-pointer rounded-lg p-2 transition-colors ${
                        isSelected
                          ? `border-2 ${themeColors.primaryText.replace("text-", "border-")}`
                          : `border-2 ${themeColors.border} hover:${themeColors.border.replace("border-", "border-").replace("-700", "-500")}`
                      }`}
                      onClick={() => {
                        setSelectedAvatar(avatar);
                        setUploadedImage(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      title={avatar.name}
                    >
                      <Avatar className="w-full aspect-square">
                        <AvatarFallback className={`${themeColors.cardBg} ${themeColors.cardForeground}`}>
                          <IconComponent className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <div
                          className={`absolute -top-1 -right-1 w-4 h-4 ${themeColors.primaryBg} rounded-full flex items-center justify-center`}
                        >
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-6">
              <Button
                  onClick={handleSaveAvatar}
                  disabled={saving}
                  className={`${themeColors.primaryBg} hover:${themeColors.primaryBg.replace("bg-", "bg-").replace("-500", "-600")} text-white`}
                >
                  {saving ? "Salvando..." : "Salvar Avatar"}
                </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "tema" && (
        <Card className={`${themeColors.card} ${themeColors.border}`}>
          <CardHeader>
            <CardTitle className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider`}>PERSONALIZAR TEMA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className={`text-sm font-medium ${themeColors.cardForeground} mb-4`}>Escolha sua cor preferida</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`relative cursor-pointer rounded-lg p-4 transition-colors border-2 ${
                        currentTheme === theme.id ? `${themeColors.foreground.replace("text-", "border-")}` : `${themeColors.border} hover:${themeColors.border.replace("border-", "border-").replace("-700", "-500")}`
                      }`}
                      onClick={() => setTheme(theme.id)}
                    >
                      <div className={`w-full h-12 ${theme.color} rounded-lg mb-2`}></div>
                      <p className={`text-xs text-center ${themeColors.cardForeground}`}>{theme.name}</p>
                      {currentTheme === theme.id && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 ${themeColors.foreground.replace("text-", "bg-")} rounded-full flex items-center justify-center`}>
                          <div className={`w-2 h-2 ${themeColors.background.replace("bg-", "bg-")} rounded-full`}></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 ${themeColors.muted} rounded-lg`}>
                <h4 className={`text-sm font-medium ${themeColors.cardForeground} mb-2`}>Prévia do Tema</h4>
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
                    <Badge className={`${themeColors.muted} ${themeColors.cardForeground}`}>Badge Neutro</Badge>
                  </div>
                  <div className={`w-full ${themeColors.muted} rounded-full h-2`}>
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
          <Card className={`${themeColors.card} ${themeColors.border}`}>
            <CardHeader>
              <CardTitle className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider`}>ESTATÍSTICAS GERAIS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`text-center p-4 ${themeColors.muted} rounded`}>
                  <BookOpen className={`w-8 h-8 ${themeColors.foreground} mx-auto mb-2`} />
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{userStats.coursesCompleted}</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>Cursos Concluídos</div>
                </div>
                <div className={`text-center p-4 ${themeColors.muted} rounded`}>
                  <Target className={`w-8 h-8 ${themeColors.foreground} mx-auto mb-2`} />
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{userStats.coursesInProgress}</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>Em Andamento</div>
                </div>
                <div className={`text-center p-4 ${themeColors.muted} rounded`}>
                  <Trophy className={`w-8 h-8 ${themeColors.foreground} mx-auto mb-2`} />
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{userStats.achievementsUnlocked}</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>Conquistas</div>
                </div>
                <div className={`text-center p-4 ${themeColors.muted} rounded`}>
                  <Settings className={`w-8 h-8 ${themeColors.foreground} mx-auto mb-2`} />
                  <div className={`text-2xl font-bold ${themeColors.foreground} font-mono`}>{userStats.simuladosCompleted}</div>
                  <div className={`text-xs ${themeColors.mutedForeground}`}>Simulados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${themeColors.card} ${themeColors.border}`}>
            <CardHeader>
              <CardTitle className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider`}>DESEMPENHO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={`${themeColors.mutedForeground}`}>Média dos Simulados</span>
                  <span className={`${themeColors.foreground} font-mono`}>{userStats.averageScore}/1000</span>
                </div>
                <div className={`w-full ${themeColors.muted} rounded-full h-3`}>
                  <div
                    className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                    style={{ width: `${(userStats.averageScore / 1000) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={`${themeColors.mutedForeground}`}>Horas de Estudo</span>
                  <span className={`${themeColors.foreground} font-mono`}>{userStats.totalStudyHours}h</span>
                </div>
                <div className={`w-full ${themeColors.muted} rounded-full h-3`}>
                  <div
                    className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min((userStats.totalStudyHours / 500) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={`${themeColors.mutedForeground}`}>Progresso do Nível</span>
                  <span className={`${themeColors.foreground} font-mono`}>
                    {userStats.xp}/{userStats.nextLevelXp} XP
                  </span>
                </div>
                <div className={`w-full ${themeColors.muted} rounded-full h-3`}>
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
  );
}