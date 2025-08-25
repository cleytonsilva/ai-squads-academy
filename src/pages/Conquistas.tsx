import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Medal, Award, Crown, Shield } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useStudentData } from "@/hooks/useStudentData";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { supabase } from "@/integrations/supabase/client";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  rarity: 'Comum' | 'Raro' | 'Épico' | 'Lendário';
  xp_reward: number;
  icon_name: string;
  total_required: number;
  unlocked: boolean;
  unlocked_date?: string;
  progress: number;
  created_at: string;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  unlocked_at?: string;
  created_at: string;
}

const iconMap = {
  Trophy,
  Star,
  Medal,
  Award,
  Crown,
  Shield
};

export default function ConquistasPage() {
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  const { profile } = useCurrentProfile();
  const { studentData } = useStudentData();

  // Buscar conquistas e progresso do usuário
  useEffect(() => {
    const fetchAchievementsAndProgress = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);

        // Buscar todas as conquistas ativas
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (achievementsError) throw achievementsError;

        // Buscar progresso do usuário nas conquistas
        let userAchievementsData = [];
        try {
          const { data, error: userAchievementsError } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', profile.id);
          
          if (userAchievementsError) {
            console.warn('Tabela user_achievements não encontrada, usando dados padrão:', userAchievementsError);
            userAchievementsData = [];
          } else {
            userAchievementsData = data || [];
          }
        } catch (error) {
          console.warn('Erro ao acessar user_achievements, usando dados padrão:', error);
          userAchievementsData = [];
        }

        setUserAchievements(userAchievementsData || []);

        // Combinar dados das conquistas com progresso do usuário
        const achievementsWithProgress = achievementsData?.map(achievement => {
          const userAchievement = userAchievementsData?.find(ua => ua.achievement_id === achievement.id);
          
          return {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            category: achievement.category,
            rarity: achievement.rarity as Achievement['rarity'],
            xp_reward: achievement.xp_reward,
            icon_name: achievement.icon_name || 'Trophy',
            total_required: achievement.total_required,
            unlocked: !!userAchievement?.unlocked_at,
            unlocked_date: userAchievement?.unlocked_at ? 
              new Date(userAchievement.unlocked_at).toLocaleDateString('pt-BR') : undefined,
            progress: userAchievement?.progress || 0,
            created_at: achievement.created_at
          };
        }) || [];

        setAchievements(achievementsWithProgress);
      } catch (error) {
        console.error('Erro ao buscar conquistas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievementsAndProgress();
  }, [profile?.id]);

  const categories = ["todas", ...new Set(achievements.map(a => a.category))];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Comum":
        return "bg-gray-500/20 text-gray-400";
      case "Raro":
        return "bg-blue-500/20 text-blue-400";
      case "Épico":
        return "bg-purple-500/20 text-purple-400";
      case "Lendário":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-neutral-500/20 text-neutral-300";
    }
  };

  const filteredConquistas = achievements.filter(
    (conquista) => selectedCategory === "todas" || conquista.category === selectedCategory,
  );

  const unlockedCount = achievements.filter((c) => c.unlocked).length;
  const totalXP = achievements.filter((c) => c.unlocked).reduce((sum, c) => sum + c.xp_reward, 0);
  const progressPercentage = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-neutral-700 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-neutral-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
                <p className="text-2xl font-bold text-neutral-300 font-mono">{achievements.length}</p>
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
                <p className="text-2xl font-bold text-white font-mono">{totalXP.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-white font-mono">{progressPercentage}%</p>
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
          const IconComponent = iconMap[conquista.icon_name as keyof typeof iconMap] || Trophy;
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
                  <Badge className="bg-neutral-800 text-neutral-300">{conquista.xp_reward} XP</Badge>
                </div>

                <p className="text-sm text-neutral-300">{conquista.description}</p>

                {conquista.unlocked ? (
                  <div className="text-xs text-neutral-400">
                    Desbloqueada em: <span className="text-white font-mono">{conquista.unlocked_date}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Progresso</span>
                      <span className="text-white font-mono">
                        {conquista.progress}/{conquista.total_required}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div
                        className={`${themeColors.primaryBg} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${(conquista.progress / conquista.total_required) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
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
                  {(() => {
                    const IconComponent = iconMap[selectedAchievement.icon_name as keyof typeof iconMap] || Trophy;
                    return <IconComponent className="w-8 h-8 text-white" />;
                  })()}
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
                    <Badge className="bg-neutral-800 text-neutral-300">{selectedAchievement.xp_reward} XP</Badge>
                  </div>
                </div>

                {selectedAchievement.unlocked ? (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DATA DE DESBLOQUEIO</h3>
                    <p className="text-sm text-white font-mono">{selectedAchievement.unlocked_date}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">PROGRESSO</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Concluído</span>
                        <span className="text-white font-mono">
                          {selectedAchievement.progress}/{selectedAchievement.total_required}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-3">
                        <div
                          className={`${themeColors.primaryBg} h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${(selectedAchievement.progress / selectedAchievement.total_required) * 100}%` }}
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
  );
}