import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const mode = searchParams.get('mode');
    return (mode === 'register' || mode === 'signup') ? 'signup' : 'login';
  });

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // O redirecionamento será feito automaticamente pelo useAuth
      return;
    }
  }, [isAuthenticated, authLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast("Login realizado", { description: "Bem-vindo de volta!" });
    } catch (err: any) {
      toast("Erro ao entrar", { description: err.message, className: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!username.trim()) {
      toast("Campo obrigatório", { description: "Nome de usuário é obrigatório", className: "destructive" });
      return;
    }
    
    if (!fullName.trim()) {
      toast("Campo obrigatório", { description: "Nome completo é obrigatório", className: "destructive" });
      return;
    }
    
    // Validação do formato do username (apenas letras, números e underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast("Formato inválido", { description: "Nome de usuário deve conter apenas letras, números e underscore", className: "destructive" });
      return;
    }
    
    // Validação do tamanho do username
    if (username.length < 3 || username.length > 20) {
      toast("Tamanho inválido", { description: "Nome de usuário deve ter entre 3 e 20 caracteres", className: "destructive" });
      return;
    }
    
    // Validação da aceitação dos termos
    if (!acceptTerms) {
      toast("Termos obrigatórios", { description: "Você deve aceitar os termos e a política de privacidade", className: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      // Passar dados adicionais para o signUp
      await signUp(email, password, {
        username: username.trim(),
        full_name: fullName.trim(),
        display_name: fullName.trim()
      });
      toast("Confirme seu email", { description: "Enviamos um link de confirmação." });
    } catch (err: any) {
      toast("Erro no cadastro", { description: err.message, className: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen container mx-auto py-10">
      <Helmet>
        <title>Login e Cadastro | Esquads</title>
        <meta name="description" content="Acesse a plataforma Esquads para estudar cibersegurança e tecnologia." />
        <link rel="canonical" href={`${window.location.origin}/auth`} />
      </Helmet>

      <h1 className="sr-only">Login e Cadastro - Esquads</h1>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo à Esquads</CardTitle>
            <CardDescription>Entre ou crie sua conta para começar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">Email</Label>
                    <Input id="email-login" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">Senha</Label>
                    <div className="relative">
                      <Input 
                        id="password-login" 
                        type={showPassword ? "text" : "password"} 
                        autoComplete="current-password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
                  
                  <div className="text-center mt-4">
                    <Link 
                      to="/auth/forgot-password" 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Esqueceu sua senha?
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname-signup">Nome Completo *</Label>
                    <Input 
                      id="fullname-signup" 
                      type="text" 
                      autoComplete="name" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Digite seu nome completo"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username-signup">Nome de Usuário *</Label>
                    <Input 
                      id="username-signup" 
                      type="text" 
                      autoComplete="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value.toLowerCase())} 
                      placeholder="Digite seu nome de usuário"
                      pattern="[a-zA-Z0-9_]+"
                      minLength={3}
                      maxLength={20}
                      required 
                    />
                    <p className="text-xs text-muted-foreground">Apenas letras, números e underscore. Entre 3-20 caracteres.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email *</Label>
                    <Input id="email-signup" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Digite seu email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Senha *</Label>
                    <div className="relative">
                      <Input 
                        id="password-signup" 
                        type={showPassword ? "text" : "password"} 
                        autoComplete="new-password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Digite sua senha"
                        minLength={6}
                        required 
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
                  </div>
                  
                  {/* Checkbox de aceitação dos termos */}
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="accept-terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      required
                    />
                    <label htmlFor="accept-terms" className="text-sm text-muted-foreground leading-5">
                      Ao criar uma conta, você aceita nossos{" "}
                      <Link 
                        to="/terms-of-service" 
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Termos de Uso
                      </Link>
                      {" "}e{" "}
                      <Link 
                        to="/privacy-policy" 
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Política de Privacidade
                      </Link>
                      .
                    </label>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading || !acceptTerms}>{loading ? "Cadastrando..." : "Cadastrar"}</Button>
                </form>

              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Auth;
