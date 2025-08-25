import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Activity, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface GenerationEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
}

interface GenerationStats {
  total_predictions: number;
  successful_predictions: number;
  failed_predictions: number;
  pending_predictions: number;
  average_generation_time: number;
  success_rate: number;
}

export default function GenerationMonitor() {
  const [events, setEvents] = useState<GenerationEvent[]>([]);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Carregar eventos e estatísticas
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Carregar eventos recentes
      const { data: eventsData, error: eventsError } = await supabase
        .from('generation_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('Erro ao carregar eventos:', eventsError);
        toast.error('Erro ao carregar eventos');
        return;
      }

      setEvents(eventsData || []);

      // Carregar estatísticas
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_generation_stats');

      if (statsError) {
        console.error('Erro ao carregar estatísticas:', statsError);
        // Calcular estatísticas básicas dos eventos
        const basicStats = calculateBasicStats(eventsData || []);
        setStats(basicStats);
      } else {
        setStats(statsData);
      }

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estatísticas básicas dos eventos
  const calculateBasicStats = (events: GenerationEvent[]): GenerationStats => {
    const predictions = events.filter(e => e.event_type === 'prediction_completed' || e.event_type === 'prediction_failed');
    const successful = events.filter(e => e.event_type === 'prediction_completed');
    const failed = events.filter(e => e.event_type === 'prediction_failed');
    const pending = events.filter(e => e.event_type === 'prediction_created');

    return {
      total_predictions: predictions.length,
      successful_predictions: successful.length,
      failed_predictions: failed.length,
      pending_predictions: pending.length,
      average_generation_time: 0, // Seria necessário calcular com base nos timestamps
      success_rate: predictions.length > 0 ? (successful.length / predictions.length) * 100 : 0
    };
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Obter ícone do evento
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'generation_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'prediction_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'prediction_failed':
      case 'webhook_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cache_invalidated':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Obter cor do badge do evento
  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'prediction_completed':
        return 'default';
      case 'prediction_failed':
      case 'webhook_failed':
        return 'destructive';
      case 'generation_progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Auto-refresh
  useEffect(() => {
    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, 10000); // Refresh a cada 10 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Escutar novos eventos em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('generation_monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'generation_events'
        },
        (payload) => {
          const newEvent = payload.new as GenerationEvent;
          setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Manter apenas 50 eventos
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Geração</h2>
          <p className="text-muted-foreground">Acompanhe o status das gerações de imagens em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Predições</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_predictions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.success_rate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bem-sucedidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successful_predictions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Falharam</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed_predictions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getEventBadgeVariant(event.event_type)}>
                        {event.event_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(event.created_at)}
                      </span>
                    </div>
                    <div className="text-sm">
                      {event.event_data?.course_id && (
                        <span className="font-medium">Curso: {event.event_data.course_id}</span>
                      )}
                      {event.event_data?.prediction_id && (
                        <span className="ml-2 text-muted-foreground">
                          Predição: {event.event_data.prediction_id.substring(0, 8)}...
                        </span>
                      )}
                      {event.event_data?.error && (
                        <div className="text-red-600 mt-1">
                          Erro: {event.event_data.error}
                        </div>
                      )}
                      {event.event_data?.status && (
                        <div className="text-muted-foreground mt-1">
                          Status: {event.event_data.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {events.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum evento encontrado
                </div>
              )}
              
              {isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando eventos...
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}