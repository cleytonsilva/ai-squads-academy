import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Trash2,
  Eye,
  EyeOff,
  Play,
  Bug,
  Database,
  Shield,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  AuthDiagnostic, 
  quickAuthDiagnostic, 
  fullAuthDiagnostic,
  type DiagnosticReport,
  type DiagnosticResult
} from '@/utils/authDiagnostic';

/**
 * Página de debug para sistema de autenticação
 */
const AuthDebug: React.FC = () => {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [testCredentials, setTestCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  /**
   * Adiciona log à lista
   */
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  /**
   * Carrega informações da sessão atual
   */
  const loadSessionInfo = async () => {
    try {
      const { data: session, error } = await supabase.auth.getSession();
      if (error) {
        addLog(`Erro ao carregar sessão: ${error.message}`);
        setSessionInfo({ error: error.message });
      } else {
        setSessionInfo(session);
        addLog('Informações de sessão carregadas');
      }
    } catch (error: any) {
      addLog(`Erro inesperado: ${error.message}`);
      setSessionInfo({ error: error.message });
    }
  };

  /**
   * Executa diagnóstico rápido
   */
  const runQuickDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    addLog('Iniciando diagnóstico rápido...');
    
    try {
      const report = await quickAuthDiagnostic();
      setDiagnosticReport(report);
      addLog(`Diagnóstico concluído: ${report.overall}`);
      toast.success('Diagnóstico concluído');
    } catch (error: any) {
      addLog(`Erro no diagnóstico: ${error.message}`);
      toast.error('Erro ao executar diagnóstico');
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  /**
   * Executa diagnóstico completo com credenciais
   */
  const runFullDiagnostic = async () => {
    if (!testCredentials.email || !testCredentials.password) {
      toast.error('Forneça email e senha para o teste completo');
      return;
    }

    setIsRunningDiagnostic(true);
    addLog('Iniciando diagnóstico completo...');
    
    try {
      const report = await fullAuthDiagnostic(testCredentials.email, testCredentials.password);
      setDiagnosticReport(report);
      addLog(`Diagnóstico completo concluído: ${report.overall}`);
      toast.success('Diagnóstico completo concluído');
    } catch (error: any) {
      addLog(`Erro no diagnóstico: ${error.message}`);
      toast.error('Erro ao executar diagnóstico');
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  /**
   * Testa login manual
   */
  const testManualLogin = async () => {
    if (!testCredentials.email || !testCredentials.password) {
      toast.error('Forneça email e senha');
      return;
    }

    addLog(`Tentando login com: ${testCredentials.email}`);
    
    try {
      await signIn(testCredentials.email, testCredentials.password);
      addLog('Login realizado com sucesso');
      toast.success('Login realizado com sucesso');
      await loadSessionInfo();
    } catch (error: any) {
      addLog(`Erro no login: ${error.message}`);
      toast.error(`Erro no login: ${error.message}`);
    }
  };

  /**
   * Limpa dados de sessão
   */
  const clearSessionData = () => {
    AuthDiagnostic.clearSessionData();
    addLog('Dados de sessão limpos');
    toast.success('Dados de sessão limpos');
    loadSessionInfo();
  };

  /**
   * Faz logout
   */
  const handleLogout = async () => {
    try {
      await signOut();
      addLog('Logout realizado');
      toast.success('Logout realizado');
      await loadSessionInfo();
    } catch (error: any) {
      addLog(`Erro no logout: ${error.message}`);
      toast.error(`Erro no logout: ${error.message}`);
    }
  };

  /**
   * Baixa relatório de diagnóstico
   */
  const downloadReport = () => {
    if (!diagnosticReport) return;
    
    const reportText = AuthDiagnostic.generateTextReport(diagnosticReport);
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-diagnostic-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório baixado');
  };

  /**
   * Renderiza ícone de status
   */
  const renderStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  /**
   * Renderiza badge de status
   */
  const renderStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default',
      issues: 'secondary',
      critical: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Carregar informações iniciais
  useEffect(() => {
    loadSessionInfo();
    addLog('Página de debug carregada');
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="h-8 w-8" />
            Debug de Autenticação
          </h1>
          <p className="text-muted-foreground mt-2">
            Ferramenta de diagnóstico para investigar problemas de login
          </p>
        </div>
        
        {user && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Logado como:</p>
            <p className="font-medium">{user.email}</p>
            <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2">
              Fazer Logout
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="diagnostic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diagnostic" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Diagnóstico
          </TabsTrigger>
          <TabsTrigger value="manual-test" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Teste Manual
          </TabsTrigger>
          <TabsTrigger value="session" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sessão
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Aba de Diagnóstico */}
        <TabsContent value="diagnostic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico Automático</CardTitle>
              <CardDescription>
                Execute testes automáticos para identificar problemas no sistema de autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={runQuickDiagnostic} 
                  disabled={isRunningDiagnostic}
                  className="flex items-center gap-2"
                >
                  {isRunningDiagnostic ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Diagnóstico Rápido
                </Button>
                
                <Button 
                  onClick={runFullDiagnostic} 
                  disabled={isRunningDiagnostic}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isRunningDiagnostic ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  Diagnóstico Completo
                </Button>
                
                {diagnosticReport && (
                  <Button 
                    onClick={downloadReport} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Relatório
                  </Button>
                )}
              </div>

              {/* Credenciais para teste completo */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Email para Teste</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testCredentials.email}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-password">Senha para Teste</Label>
                  <div className="relative">
                    <Input
                      id="test-password"
                      type={showPassword ? "text" : "password"}
                      value={testCredentials.password}
                      onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="senha123"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Resultados do Diagnóstico */}
              {diagnosticReport && (
                <div className="space-y-4">
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Resultados do Diagnóstico</h3>
                    {renderStatusBadge(diagnosticReport.overall)}
                  </div>

                  {/* Resumo */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{diagnosticReport.summary.total}</div>
                        <p className="text-xs text-muted-foreground">Total de Testes</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{diagnosticReport.summary.success}</div>
                        <p className="text-xs text-muted-foreground">Sucessos</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">{diagnosticReport.summary.warnings}</div>
                        <p className="text-xs text-muted-foreground">Avisos</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">{diagnosticReport.summary.errors}</div>
                        <p className="text-xs text-muted-foreground">Erros</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de Resultados */}
                  <div className="space-y-2">
                    {diagnosticReport.results.map((result, index) => (
                      <Alert key={index} className={`
                        ${result.status === 'success' ? 'border-green-200 bg-green-50' : ''}
                        ${result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
                        ${result.status === 'error' ? 'border-red-200 bg-red-50' : ''}
                      `}>
                        <div className="flex items-start gap-3">
                          {renderStatusIcon(result.status)}
                          <div className="flex-1">
                            <AlertTitle className="text-sm font-medium">
                              {result.test}
                            </AlertTitle>
                            <AlertDescription className="text-sm">
                              {result.message}
                            </AlertDescription>
                            {result.details && (
                              <details className="mt-2">
                                <summary className="text-xs cursor-pointer text-muted-foreground">
                                  Ver detalhes
                                </summary>
                                <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                                  {JSON.stringify(result.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>

                  {/* Recomendações */}
                  {diagnosticReport.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Recomendações:</h4>
                      <ul className="space-y-1">
                        {diagnosticReport.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Teste Manual */}
        <TabsContent value="manual-test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teste Manual de Login</CardTitle>
              <CardDescription>
                Teste o processo de login manualmente com credenciais específicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-email">Email</Label>
                  <Input
                    id="manual-email"
                    type="email"
                    value={testCredentials.email}
                    onChange={(e) => setTestCredentials(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="manual-password"
                      type={showPassword ? "text" : "password"}
                      value={testCredentials.password}
                      onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="senha123"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={testManualLogin} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Testar Login
                </Button>
                
                {user && (
                  <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Fazer Logout
                  </Button>
                )}
                
                <Button onClick={clearSessionData} variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpar Sessão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Sessão */}
        <TabsContent value="session" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Sessão</CardTitle>
              <CardDescription>
                Visualize o estado atual da sessão de autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={loadSessionInfo} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar Informações
              </Button>
              
              {sessionInfo && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Estado da Autenticação:</h4>
                    <div className="flex items-center gap-2">
                      {user ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Usuário autenticado</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>Usuário não autenticado</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Dados da Sessão:</h4>
                    <pre className="text-xs p-4 bg-muted rounded overflow-auto max-h-96">
                      {JSON.stringify(sessionInfo, null, 2)}
                    </pre>
                  </div>
                  
                  {user && (
                    <div>
                      <h4 className="font-semibold mb-2">Dados do Usuário:</h4>
                      <pre className="text-xs p-4 bg-muted rounded overflow-auto">
                        {JSON.stringify(user, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Logs */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Debug</CardTitle>
              <CardDescription>
                Acompanhe as operações realizadas durante os testes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={() => setLogs([])} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar Logs
                </Button>
              </div>
              
              <Textarea 
                value={logs.join('\n')} 
                readOnly 
                className="min-h-96 font-mono text-xs"
                placeholder="Logs aparecerão aqui..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthDebug;