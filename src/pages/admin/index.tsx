import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Settings,
  Shield,
  BarChart3,
  FileText,
  Calendar,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import TemplateManagement from '@/components/admin/TemplateManagement';
import BadgeManagement from '@/components/admin/BadgeManagement';
import ChallengeManagement from '@/components/admin/ChallengeManagement';

// Interfaces para tipagem
interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalBadges: number;
  totalCertificates: number;
  activeUsers: number;
  completedCourses: number;
  recentSignups: number;
  monthlyRevenue: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'course_completion' | 'badge_earned' | 'certificate_issued';
  description: string;
  user_name: string;
  created_at: string;
}

interface UserManagement {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string;
  is_active: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  is_published: boolean;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'instructor';
}

interface CreateCourseForm {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
}

interface AdminAction {
  id: string;
  action: string;
  target: string;
  user_id: string;
  timestamp: string;
  details: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalBadges: 0,
    totalCertificates: 0,
    activeUsers: 0,
    completedCourses: 0,
    recentSignups: 0,
    monthlyRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  
  // Estados para diálogos e formulários
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showCreateCourseDialog, setShowCreateCourseDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [showDeleteCourseDialog, setShowDeleteCourseDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Formulários
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  
  const [createCourseForm, setCreateCourseForm] = useState<CreateCourseForm>({
    title: '',
    description: '',
    level: 'beginner',
    is_published: false
  });
  
  // Estados de carregamento
  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);
  
  // Deep link das abas do admin via query string (?tab=)
  const [searchParams, setSearchParams] = useSearchParams();
  const allowedTabs = useMemo(() => new Set(['overview','users','courses','templates','challenges','analytics','settings']), []);
  const getTabFromSearch = () => {
    const tab = searchParams.get('tab');
    return tab && allowedTabs.has(tab) ? tab : 'overview';
  };
  const [activeTab, setActiveTab] = useState<string>(getTabFromSearch());

  // Mantém o estado em sincronia quando a URL muda (voltar/avançar do navegador ou links externos)
  useEffect(() => {
    const next = getTabFromSearch();
    if (next !== activeTab) {
      setActiveTab(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Atualiza a URL quando a aba ativa muda (sem criar histórico desnecessário)
  useEffect(() => {
    const current = searchParams.get('tab');
    const isDefault = activeTab === 'overview';
    const params = new URLSearchParams(searchParams);
    if (isDefault) {
      if (current !== null) {
        params.delete('tab');
        setSearchParams(params, { replace: true });
      }
    } else if (current !== activeTab) {
      params.set('tab', activeTab);
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /**
   * Verifica se o usuário é administrador
   */
  useEffect(() => {
    if (!authLoading && user) {
      checkAdminAccess();
    } else if (!authLoading && !user) {
      navigate('/auth/login');
    }
  }, [user, authLoading, navigate]);

  /**
   * Carrega dados de cursos quando necessário
   */
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'instructor') && activeTab === 'courses') {
      loadCourses();
    }
  }, [user, activeTab]);

  const checkAdminAccess = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (profile?.role !== 'admin' && profile?.role !== 'instructor') {
        toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
        navigate('/');
        return;
      }

      loadDashboardData();
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      toast.error('Erro ao verificar permissões');
      navigate('/');
    }
  };

  /**
   * Carrega dados do dashboard
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar estatísticas
      const [usersCount, coursesCount, badgesCount, certificatesCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('badges').select('id', { count: 'exact', head: true }),
        supabase.from('certificate_templates').select('id', { count: 'exact', head: true }),
      ]);

      // Usuários ativos (logaram nos últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsersCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

      // Cursos concluídos
      const { count: completedCoursesCount } = await supabase
        .from('course_completions')
        .select('id', { count: 'exact', head: true });

      // Novos usuários este mês
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { count: recentSignupsCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString());

      setStats({
        totalUsers: usersCount.count || 0,
        totalCourses: coursesCount.count || 0,
        totalBadges: badgesCount.count || 0,
        totalCertificates: certificatesCount.count || 0,
        activeUsers: activeUsersCount || 0,
        completedCourses: completedCoursesCount || 0,
        recentSignups: recentSignupsCount || 0,
        monthlyRevenue: 0, // TODO: Implementar quando tiver sistema de pagamentos
      });

      // Carregar atividade recente
      await loadRecentActivity();
      
      // Carregar usuários para gerenciamento
      await loadUsers();
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carrega atividade recente
   */
  const loadRecentActivity = async () => {
    try {
      // Simular atividade recente - em produção, isso viria de uma view ou tabela de logs
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'user_signup',
          description: 'Novo usuário cadastrado',
          user_name: 'João Silva',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'course_completion',
          description: 'Curso "React Avançado" concluído',
          user_name: 'Maria Santos',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          type: 'badge_earned',
          description: 'Badge "Primeiro Curso" conquistado',
          user_name: 'Pedro Costa',
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ];

      setRecentActivity(activities);
    } catch (error) {
      console.error('Erro ao carregar atividade recente:', error);
    }
  };

  /**
   * Carrega lista de usuários
   */
  const loadUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedUsers: UserManagement[] = usersData.map(user => ({
        ...user,
        full_name: user.name || user.email,
        last_sign_in_at: user.updated_at,
        is_active: user.updated_at ? 
          new Date(user.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
          false,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  /**
   * Carrega lista de cursos
   */
  const loadCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('id, title, description, status, created_at, updated_at, is_published')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    }
  };

  /**
   * Registra ação administrativa para auditoria
   */
  const logAdminAction = async (action: string, target: string, details: string) => {
    try {
      const { error } = await supabase
        .from('admin_actions')
        .insert({
          action,
          target,
          user_id: user?.id,
          details,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao registrar ação administrativa:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar ação administrativa:', error);
    }
  };

  /**
   * Atualiza role do usuário
   */
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Registra ação administrativa
      await logAdminAction('UPDATE_USER_ROLE', userId, `Role alterado para: ${newRole}`);

      toast.success('Role do usuário atualizada!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast.error('Erro ao atualizar role do usuário');
    }
  };

  /**
   * Cria novo usuário
   */
  const createUser = async () => {
    if (!createUserForm.name || !createUserForm.email || !createUserForm.password) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    if (createUserForm.password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    setCreatingUser(true);
    try {
      // Cria usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: createUserForm.email,
        password: createUserForm.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Cria perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: createUserForm.name,
          email: createUserForm.email,
          role: createUserForm.role
        });

      if (profileError) throw profileError;

      // Registra ação administrativa
      await logAdminAction('CREATE_USER', authData.user.id, `Usuário criado: ${createUserForm.email} (${createUserForm.role})`);

      // Limpa formulário e fecha diálogo
      setCreateUserForm({ name: '', email: '', password: '', role: 'user' });
      setShowCreateUserDialog(false);
      
      // Recarrega lista de usuários
      await loadUsers();
      
      toast.success('Usuário criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário. Verifique os dados e tente novamente.');
    } finally {
      setCreatingUser(false);
    }
  };

  /**
   * Exclui usuário
   */
  const deleteUser = async () => {
    if (!selectedUser) return;

    // Verifica se não está tentando excluir a si mesmo
    if (selectedUser.id === user?.id) {
      toast.error('Você não pode excluir sua própria conta!');
      return;
    }

    setDeletingUser(true);
    try {
      // Remove perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      // Remove usuário do Auth (requer privilégios de admin)
      const { error: authError } = await supabase.auth.admin.deleteUser(selectedUser.id);
      
      if (authError) {
        console.warn('Erro ao remover usuário do Auth:', authError);
      }

      // Registra ação administrativa
      await logAdminAction('DELETE_USER', selectedUser.id, `Usuário excluído: ${selectedUser.email}`);

      // Atualiza lista local
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      // Fecha diálogo
      setShowDeleteUserDialog(false);
      setSelectedUser(null);
      
      toast.success('Usuário excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário. Tente novamente.');
    } finally {
      setDeletingUser(false);
    }
  };

  /**
   * Cria novo curso
   */
  const createCourse = async () => {
    if (!createCourseForm.title || !createCourseForm.description) {
      alert('Título e descrição são obrigatórios');
      return;
    }

    setCreatingCourse(true);
    try {
      const { data: courseData, error } = await supabase
        .from('courses')
        .insert({
          title: createCourseForm.title,
          description: createCourseForm.description,
          level: createCourseForm.level,
          is_published: createCourseForm.is_published,
          status: createCourseForm.is_published ? 'published' : 'draft',
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Registra ação administrativa
      await logAdminAction('CREATE_COURSE', courseData.id, `Curso criado: ${createCourseForm.title}`);

      // Limpa formulário e fecha diálogo
      setCreateCourseForm({ title: '', description: '', level: 'beginner', is_published: false });
      setShowCreateCourseDialog(false);
      
      // Recarrega lista de cursos
      await loadCourses();
      
      alert('Curso criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      alert('Erro ao criar curso. Tente novamente.');
    } finally {
      setCreatingCourse(false);
    }
  };

  /**
   * Exclui curso
   */
  const deleteCourse = async () => {
    if (!selectedCourse) return;

    setDeletingCourse(true);
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', selectedCourse.id);

      if (error) throw error;

      // Registra ação administrativa
      await logAdminAction('DELETE_COURSE', selectedCourse.id, `Curso excluído: ${selectedCourse.title}`);

      // Atualiza lista local
      setCourses(courses.filter(c => c.id !== selectedCourse.id));
      
      // Fecha diálogo
      setShowDeleteCourseDialog(false);
      setSelectedCourse(null);
      
      alert('Curso excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      alert('Erro ao excluir curso. Tente novamente.');
    } finally {
      setDeletingCourse(false);
    }
  };

  /**
   * Formata data para exibição
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Retorna ícone para tipo de atividade
   */
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <Users className="h-4 w-4" />;
      case 'course_completion':
        return <BookOpen className="h-4 w-4" />;
      case 'badge_earned':
        return <Award className="h-4 w-4" />;
      case 'certificate_issued':
        return <Award className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, cursos e configurações da plataforma
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Shield className="h-3 w-3" />
          <span>Administrador</span>
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="challenges">Desafios</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.recentSignups} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cursos Ativos</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedCourses} concluídos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates de Badges</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBadges}</div>
                <p className="text-xs text-muted-foreground">
                  Disponíveis para conquista
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Certificados</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCertificates}</div>
                <p className="text-xs text-muted-foreground">
                  Templates disponíveis
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Acesso Rápido */}
          <Card>
            <CardHeader>
              <CardTitle>Acesso Rápido</CardTitle>
              <CardDescription>
                Acesse rapidamente as principais funcionalidades administrativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setShowCreateUserDialog(true)}
                >
                  <UserPlus className="h-6 w-6" />
                  <span>Criar Usuário</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setShowCreateCourseDialog(true)}
                >
                  <Plus className="h-6 w-6" />
                  <span>Criar Curso</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => navigate('/admin/achievements')}
                >
                  <Award className="h-6 w-6" />
                  <span>Gerenciar Badges e Certificados</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setActiveTab('templates')}
                >
                  <FileText className="h-6 w-6" />
                  <span>Templates</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setActiveTab('challenges')}
                >
                  <TrendingUp className="h-6 w-6" />
                  <span>Desafios</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Atividade Recente */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas ações realizadas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user_name} • {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gerenciamento de Usuários */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
            <Button onClick={() => setShowCreateUserDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Usuário
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Usuários Cadastrados ({users.length})</CardTitle>
              <CardDescription>
                Visualize e gerencie usuários da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{user.full_name || user.email}</h4>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline">{user.role || 'user'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Cadastrado em {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={user.role || 'user'}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="instructor">Instrutor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteUserDialog(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum usuário encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gerenciamento de Cursos */}
        <TabsContent value="courses" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gerenciamento de Cursos</h2>
            <Button onClick={() => setShowCreateCourseDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Curso
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Cursos Cadastrados ({courses.length})</CardTitle>
              <CardDescription>
                Visualize e gerencie cursos da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{course.title}</h4>
                          <Badge variant={course.is_published ? 'default' : 'secondary'}>
                            {course.is_published ? 'Publicado' : 'Rascunho'}
                          </Badge>
                          <Badge variant="outline">{course.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{course.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Criado em {formatDate(course.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowDeleteCourseDialog(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum curso encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          {/* Seção de Templates e Badges */}
          <div className="space-y-8">
            {/* Gerenciamento de Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Badges</CardTitle>
                <CardDescription>
                  Gerencie badges, templates e concessões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BadgeManagement />
              </CardContent>
            </Card>

            {/* Gerenciamento de Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Templates</CardTitle>
                <CardDescription>
                  Gerencie templates de certificados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateManagement />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Desafios */}
        <TabsContent value="challenges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Desafios</CardTitle>
              <CardDescription>
                Gerencie desafios e competições da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChallengeManagement />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análises */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Análises e Métricas</span>
              </CardTitle>
              <CardDescription>
                Insights sobre o uso da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Engajamento de Usuários</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usuários Ativos (30 dias)</span>
                      <span className="font-medium">{stats.activeUsers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Atividade</span>
                      <span className="font-medium">
                        {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Conclusão de Cursos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cursos Concluídos</span>
                      <span className="font-medium">{stats.completedCourses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Conclusão</span>
                      <span className="font-medium">
                        {stats.totalCourses > 0 ? Math.round((stats.completedCourses / (stats.totalUsers * stats.totalCourses)) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurações do Sistema</span>
              </CardTitle>
              <CardDescription>
                Configure parâmetros globais da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Configurações Gerais</h4>
                  <p className="text-sm text-muted-foreground">
                    As configurações do sistema serão implementadas em versões futuras.
                    Atualmente, você pode gerenciar usuários e templates através das outras abas.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Backup e Manutenção</h4>
                  <p className="text-sm text-muted-foreground">
                    Funcionalidades de backup automático e manutenção do sistema
                    serão adicionadas em atualizações futuras.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para criar usuário */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário na plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={createUserForm.name}
                onChange={(e) => setCreateUserForm({ ...createUserForm, name: e.target.value })}
                placeholder="Digite o nome completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                placeholder="Digite o email"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                placeholder="Digite a senha (mín. 8 caracteres)"
              />
            </div>
            <div>
              <Label htmlFor="role">Função</Label>
              <Select
                value={createUserForm.role}
                onValueChange={(value: 'user' | 'admin' | 'instructor') => 
                  setCreateUserForm({ ...createUserForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="instructor">Instrutor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateUserDialog(false)}
              disabled={creatingUser}
            >
              Cancelar
            </Button>
            <Button onClick={createUser} disabled={creatingUser}>
              {creatingUser ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para excluir usuário */}
      <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Confirmar Exclusão</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{selectedUser?.full_name || selectedUser?.email}</strong>?
              <br /><br />
              <span className="text-red-600 font-medium">
                Esta ação não pode ser desfeita e todos os dados do usuário serão permanentemente removidos.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              disabled={deletingUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingUser ? 'Excluindo...' : 'Excluir Usuário'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para excluir curso */}
      <AlertDialog open={showDeleteCourseDialog} onOpenChange={setShowDeleteCourseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Confirmar Exclusão</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o curso <strong>{selectedCourse?.title}</strong>?
              <br /><br />
              <span className="text-red-600 font-medium">
                Esta ação não pode ser desfeita e todos os dados do curso serão permanentemente removidos.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCourse}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteCourse}
              disabled={deletingCourse}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingCourse ? 'Excluindo...' : 'Excluir Curso'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para criar curso */}
      <Dialog open={showCreateCourseDialog} onOpenChange={setShowCreateCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Curso</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo curso na plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="course-title">Título do Curso</Label>
              <Input
                id="course-title"
                value={createCourseForm.title}
                onChange={(e) => setCreateCourseForm({ ...createCourseForm, title: e.target.value })}
                placeholder="Digite o título do curso"
              />
            </div>
            <div>
              <Label htmlFor="course-description">Descrição</Label>
              <Input
                id="course-description"
                value={createCourseForm.description}
                onChange={(e) => setCreateCourseForm({ ...createCourseForm, description: e.target.value })}
                placeholder="Digite a descrição do curso"
              />
            </div>
            <div>
              <Label htmlFor="course-level">Nível</Label>
              <Select
                value={createCourseForm.level}
                onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                  setCreateCourseForm({ ...createCourseForm, level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="course-published"
                checked={createCourseForm.is_published}
                onChange={(e) => setCreateCourseForm({ ...createCourseForm, is_published: e.target.checked })}
              />
              <Label htmlFor="course-published">Publicar imediatamente</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateCourseDialog(false)}
              disabled={creatingCourse}
            >
              Cancelar
            </Button>
            <Button onClick={createCourse} disabled={creatingCourse}>
              {creatingCourse ? 'Criando...' : 'Criar Curso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}