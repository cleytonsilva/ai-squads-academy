import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/theme-context";

interface TacticalChartProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function TacticalChart({ title, children, className = "" }: TacticalChartProps) {
  return (
    <Card className={`bg-neutral-900 border-neutral-700 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface WeeklyPerformanceChartProps {
  data?: Array<{ day: string; value: number }>;
}

export function TacticalWeeklyChart({ data }: WeeklyPerformanceChartProps) {
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();
  
  // Dados padrão se não fornecidos
  const defaultData = [
    { day: "Seg", value: 85 },
    { day: "Ter", value: 92 },
    { day: "Qua", value: 78 },
    { day: "Qui", value: 95 },
    { day: "Sex", value: 88 },
    { day: "Sáb", value: 82 },
    { day: "Dom", value: 90 }
  ];
  
  const chartData = data || defaultData;
  
  return (
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
          points={chartData.map((item, index) => {
            const x = 50 + (index * 50);
            const y = 180 - (item.value * 1.6); // Inverter Y e escalar
            return `${x},${y}`;
          }).join(" ")}
          fill="none"
          stroke={`var(--${themeColors.primaryText.split("-")[1]}-500)`}
          strokeWidth="3"
        />
        
        {/* Data points */}
        {chartData.map((item, index) => {
          const x = 50 + (index * 50);
          const y = 180 - (item.value * 1.6);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={`var(--${themeColors.primaryText.split("-")[1]}-500)`}
              className="opacity-80"
            />
          );
        })}
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
        {chartData.map((item, index) => (
          <span key={index}>{item.day}</span>
        ))}
      </div>
    </div>
  );
}

interface CourseProgressItem {
  id: string;
  name: string;
  progress: number;
}

interface TacticalCourseProgressProps {
  courses: CourseProgressItem[];
}

export function TacticalCourseProgress({ courses }: TacticalCourseProgressProps) {
  return (
    <div className="space-y-2">
      {courses.map((curso) => (
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
  );
}