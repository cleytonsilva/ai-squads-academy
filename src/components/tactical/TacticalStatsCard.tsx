import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/theme-context";

interface TacticalStatsCardProps {
  title: string;
  children: React.ReactNode;
}

export function TacticalStatsCard({ title, children }: TacticalStatsCardProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  
  return (
    <Card className={`${themeColors.card} ${themeColors.border}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm font-medium ${themeColors.mutedForeground} tracking-wider`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {children}
      </CardContent>
    </Card>
  );
}

interface CircularProgressProps {
  percentage: number;
  label?: string;
}

export function TacticalCircularProgress({ percentage, label = "Progresso" }: CircularProgressProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  
  return (
    <>
      {/* Gráfico Circular de Progresso */}
      <div className="relative w-32 h-32 mb-4">
        <div className={`absolute inset-0 border-4 ${themeColors.foreground.replace('text-', 'border-')} rounded-full opacity-60`}></div>
        <div className={`absolute inset-2 border-2 ${themeColors.foreground.replace('text-', 'border-')} rounded-full opacity-40`}></div>
        <div className={`absolute inset-4 border ${themeColors.foreground.replace('text-', 'border-')} rounded-full opacity-20`}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-xl font-bold ${themeColors.foreground}`}>{percentage}%</div>
            <div className={`text-xs ${themeColors.mutedForeground}`}>{label}</div>
          </div>
        </div>
      </div>
    </>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function TacticalStatRow({ label, value, highlight = false }: StatRowProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  
  return (
    <div className="flex justify-between">
      <span>{label}:</span>
      <span className={highlight ? themeColors.primaryText : themeColors.foreground}>{value}</span>
    </div>
  );
}

export function TacticalStatsGrid({ children }: { children: React.ReactNode }) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  
  return (
    <div className={`text-xs ${themeColors.mutedForeground} space-y-1 w-full font-mono`}>
      {children}
    </div>
  );
}