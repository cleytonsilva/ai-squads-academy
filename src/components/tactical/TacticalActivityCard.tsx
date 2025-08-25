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
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.map((atividade, index) => (
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
  );
}