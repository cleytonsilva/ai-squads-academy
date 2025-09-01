import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Interface para as propriedades do Error Boundary
 */
interface ErrorBoundaryProps {
  /** Componentes filhos */
  children: ReactNode;
  /** Componente de fallback personalizado */
  fallback?: ReactNode;
  /** Callback executado quando um erro ocorre */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Interface para o estado do Error Boundary
 */
interface ErrorBoundaryState {
  /** Se há um erro ativo */
  hasError: boolean;
  /** Detalhes do erro */
  error?: Error;
  /** Informações adicionais do erro */
  errorInfo?: ErrorInfo;
}

/**
 * Componente Error Boundary para capturar e tratar erros de React
 * Fornece uma interface amigável quando erros ocorrem
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Método estático para atualizar o estado quando um erro é capturado
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Método executado quando um erro é capturado
   * Registra o erro e executa callback personalizado se fornecido
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para monitoramento
    console.error('Error Boundary capturou um erro:', error, errorInfo);
    
    // Atualizar estado com informações do erro
    this.setState({
      error,
      errorInfo
    });

    // Executar callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Em produção, você pode enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error);
    }
  }

  /**
   * Reseta o estado do erro para tentar renderizar novamente
   */
  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  /**
   * Recarrega a página atual
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Se um fallback personalizado foi fornecido, usá-lo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface padrão de erro
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl font-semibold">
                Oops! Algo deu errado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Ocorreu um erro inesperado. Você pode tentar recarregar a página ou voltar mais tarde.
              </p>
              
              {/* Mostrar detalhes do erro apenas em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <pre className="text-xs overflow-auto max-h-32">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleReset} 
                  variant="outline" 
                  className="flex-1"
                  aria-label="Tentar novamente"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={this.handleReload} 
                  className="flex-1"
                  aria-label="Recarregar página"
                >
                  Recarregar Página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Se não há erro, renderizar os componentes filhos normalmente
    return this.props.children;
  }
}

/**
 * Hook para usar Error Boundary de forma mais simples
 * Retorna uma função para reportar erros manualmente
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Erro reportado manualmente:', error, errorInfo);
    
    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error);
    }
  };
}

/**
 * Componente wrapper para facilitar o uso do Error Boundary
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundaryWrapper({ children, fallback }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}