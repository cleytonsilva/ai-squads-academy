import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira seu email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setEmail('');
  };

  return (
    <main className="min-h-screen container mx-auto py-10">
      <Helmet>
        <title>Recuperar Senha | Esquads</title>
        <meta name="description" content="Recupere sua senha da plataforma Esquads." />
        <link rel="canonical" href={`${window.location.origin}/auth/forgot-password`} />
      </Helmet>

      <h1 className="sr-only">Recuperar Senha - Esquads</h1>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-2">
              <Link 
                to="/auth" 
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar ao login
              </Link>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
              <CardDescription className="mt-2">
                {emailSent 
                  ? "Email de recuperação enviado"
                  : "Digite seu email para receber as instruções de recuperação"
                }
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            {emailSent ? (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Enviamos um link de recuperação para <strong>{email}</strong>. 
                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleTryAgain}
                      variant="outline"
                      className="w-full"
                    >
                      Tentar com outro email
                    </Button>
                    
                    <Button 
                      onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                      disabled={loading}
                      variant="ghost"
                      className="w-full"
                    >
                      {loading ? "Reenviando..." : "Reenviar email"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !email.trim()}
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Lembrou da senha?{' '}
                <Link 
                  to="/auth" 
                  className="font-medium text-primary hover:underline"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ForgotPassword;