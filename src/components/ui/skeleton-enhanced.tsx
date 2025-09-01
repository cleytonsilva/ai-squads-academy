import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Interface para propriedades do SkeletonCard
 */
interface SkeletonCardProps {
  /** Classes CSS adicionais */
  className?: string;
  /** Se deve mostrar avatar */
  showAvatar?: boolean;
  /** Número de linhas de texto */
  lines?: number;
  /** Se deve mostrar botões */
  showActions?: boolean;
}

/**
 * Componente de skeleton para cards
 */
export function SkeletonCard({ 
  className, 
  showAvatar = false, 
  lines = 3, 
  showActions = false 
}: SkeletonCardProps) {
  return (
    <div className={cn('p-4 space-y-3', className)}>
      {/* Avatar e título */}
      <div className="flex items-center space-x-3">
        {showAvatar && (
          <Skeleton className="h-10 w-10 rounded-full" />
        )}
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      {/* Linhas de conteúdo */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'h-3',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )} 
          />
        ))}
      </div>
      
      {/* Botões de ação */}
      {showActions && (
        <div className="flex space-x-2 pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      )}
    </div>
  );
}

/**
 * Interface para propriedades do SkeletonList
 */
interface SkeletonListProps {
  /** Número de itens */
  count?: number;
  /** Classes CSS adicionais */
  className?: string;
  /** Se deve mostrar avatar nos itens */
  showAvatar?: boolean;
}

/**
 * Componente de skeleton para listas
 */
export function SkeletonList({ 
  count = 5, 
  className, 
  showAvatar = false 
}: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
          {showAvatar && (
            <Skeleton className="h-8 w-8 rounded-full" />
          )}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Interface para propriedades do SkeletonTable
 */
interface SkeletonTableProps {
  /** Número de linhas */
  rows?: number;
  /** Número de colunas */
  columns?: number;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente de skeleton para tabelas
 */
export function SkeletonTable({ 
  rows = 5, 
  columns = 4, 
  className 
}: SkeletonTableProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Cabeçalho da tabela */}
      <div className="flex space-x-4 p-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Linhas da tabela */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                'h-3 flex-1',
                colIndex === 0 ? 'w-1/4' : '',
                colIndex === columns - 1 ? 'w-16' : ''
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Interface para propriedades do SkeletonForm
 */
interface SkeletonFormProps {
  /** Número de campos */
  fields?: number;
  /** Classes CSS adicionais */
  className?: string;
  /** Se deve mostrar botões */
  showButtons?: boolean;
}

/**
 * Componente de skeleton para formulários
 */
export function SkeletonForm({ 
  fields = 4, 
  className, 
  showButtons = true 
}: SkeletonFormProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}
      
      {showButtons && (
        <div className="flex space-x-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  );
}

/**
 * Interface para propriedades do SkeletonChart
 */
interface SkeletonChartProps {
  /** Classes CSS adicionais */
  className?: string;
  /** Altura do gráfico */
  height?: string;
}

/**
 * Componente de skeleton para gráficos
 */
export function SkeletonChart({ 
  className, 
  height = 'h-64' 
}: SkeletonChartProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Título do gráfico */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Área do gráfico */}
      <div className={cn('relative', height)}>
        <Skeleton className="absolute inset-0 rounded-lg" />
        
        {/* Barras simuladas */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between space-x-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={cn(
                'w-8 bg-muted-foreground/20',
                `h-${Math.floor(Math.random() * 20) + 8}`
              )} 
            />
          ))}
        </div>
      </div>
      
      {/* Legenda */}
      <div className="flex justify-center space-x-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Interface para propriedades do SkeletonProfile
 */
interface SkeletonProfileProps {
  /** Classes CSS adicionais */
  className?: string;
  /** Se deve mostrar informações detalhadas */
  detailed?: boolean;
}

/**
 * Componente de skeleton para perfis de usuário
 */
export function SkeletonProfile({ 
  className, 
  detailed = false 
}: SkeletonProfileProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Avatar e informações básicas */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          {detailed && <Skeleton className="h-3 w-24" />}
        </div>
      </div>
      
      {detailed && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-8 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
          
          {/* Informações adicionais */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </>
      )}
    </div>
  );
}