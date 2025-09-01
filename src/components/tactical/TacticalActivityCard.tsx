import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/theme-context";

interface Activity {
  time: string;
  action: string;
  subject: string;
  course?: string | null;
}

interface TacticalActivityCardProps {
  activities: Activity[];
  title?: string;
}

export function TacticalActivityCard({ activities, title = "ATIVIDADES RECENTES" }: TacticalActivityCardProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  return (
    <Card className={`${themeColors.card} ${themeColors.border}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.map((atividade, index) => (
            <div
              key={index}
              className={`text-xs border-l-2 border-${themeColors.primaryText.split("-")[1]}-500 pl-3 ${themeColors.muted.replace('bg-', 'hover:bg-')} p-2 rounded transition-colors`}
            >
              <div className={`${themeColors.mutedForeground} font-mono`}>{atividade.time}</div>
              <div className={themeColors.foreground}>
                Você {atividade.action} <span className={themeColors.primaryText}>{atividade.subject}</span>
                {atividade.course && (
                  <span>
                    {" "}
                    em <span className={`${themeColors.foreground} font-mono`}>{atividade.course}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}