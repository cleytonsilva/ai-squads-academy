import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { Users as UsersIcon, Plus, Search, Filter, Edit, Trash2, Crown, User as UserIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'> & {
  auth_user?: {
    email: string;
    created_at: string;
    last_sign_in_at?: string;
  };
};

interface CreateUserData {
  email: string;
  display_name: string;
  role: 'student' | 'admin' | 'instructor';
}

export default function UserManagement() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    display_name: '',
    role: 'student'
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/');
      return;
    }

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, authLoading, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles data
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Erro ao carregar usuários');
        return;
      }

      // Since we can't directly join with auth.users, we'll fetch auth data separately
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        // Continue with profiles data only
        setUsers(profiles || []);
        return;
      }

      // Merge profile data with auth data
      const usersWithAuth = profiles?.map(profile => {
        const authUser = authUsers.users.find(u => u.id === profile.user_id);
        return {
          ...profile,
          auth_user: authUser ? {
            email: authUser.email || '',
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at
          } : undefined
        };
      }) || [];

      setUsers(usersWithAuth);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!newUser.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }
    
    if (!newUser.display_name.trim()) {
      toast.error('Nome de exibição é obrigatório');
      return;
    }
    
    setCreatingUser(true);
    
    try {
      console.log('Tentando criar usuário:', { email: newUser.email, role: newUser.role });
      
      // Create auth user with a temporary password
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: Math.random().toString(36).slice(-8) + 'A1!', // Senha temporária forte
        email_confirm: true,
        user_metadata: {
          display_name: newUser.display_name
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        toast.error('Erro ao criar usuário: ' + authError.message);
        return;
      }

      if (!authData.user) {
        console.error('No user data returned from auth creation');
        toast.error('Erro ao criar usuário - dados não retornados');
        return;
      }

      console.log('Usuário auth criado com sucesso:', authData.user.id);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          display_name: newUser.display_name,
          role: newUser.role,
          xp: 0,
          email: newUser.email
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        toast.error('Erro ao criar perfil do usuário: ' + profileError.message);
        
        // Tentar limpar o usuário auth se o perfil falhou
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Error cleaning up auth user:', cleanupError);
        }
        return;
      }

      console.log('Perfil criado com sucesso');
      toast.success('Usuário criado com sucesso! Uma senha temporária foi gerada.');
      setShowCreateModal(false);
      setNewUser({
        email: '',
        display_name: '',
        role: 'student'
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeletingUserId(userId);
      console.log('Tentando excluir usuário:', userId);
      
      // First delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        console.error('Erro ao excluir perfil:', profileError);
        throw profileError;
      }

      // Then delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Erro ao excluir usuário de autenticação:', authError);
        throw authError;
      }

      toast.success('Usuário excluído com sucesso!');
      fetchUsers(); // Reload the users list
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'student' | 'admin' | 'instructor') => {
    try {
      setUpdatingRoleUserId(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating role:', error);
        toast.error('Erro ao atualizar papel do usuário');
        return;
      }

      toast.success('Papel do usuário atualizado com sucesso');
      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar papel do usuário');
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const email = user.auth_user?.email || '';
    const displayName = user.display_name || '';
    const matchesSearch = email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesFilter;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'instructor': return 'Instrutor';
      case 'student': return 'Aluno';
      default: return role;
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-gray-600 mt-2">
              Gerencie usuários, papéis e permissões
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alunos</p>
                <p className="text-xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'student').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Instrutores</p>
                <p className="text-xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'instructor').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Administradores</p>
                <p className="text-xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuários por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os papéis</option>
                <option value="admin">Administrador</option>
                <option value="instructor">Instrutor</option>
                <option value="student">Aluno</option>
              </select>
            </div>
          </div>
        </div> 
       {/* Users Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Papel
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    XP
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último acesso
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-gray-200 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum usuário encontrado</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {(user.display_name || user.auth_user?.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.display_name || 'Sem nome'}</p>
                            <p className="text-sm text-gray-500">{user.auth_user?.email || 'Email não disponível'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.user_id, e.target.value as any)}
                            disabled={updatingRoleUserId === user.user_id || deletingUserId === user.user_id}
                            className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${getRoleColor(user.role)}`}
                          >
                            <option value="student">Aluno</option>
                            <option value="instructor">Instrutor</option>
                            <option value="admin">Administrador</option>
                          </select>
                          {updatingRoleUserId === user.user_id && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{user.xp || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {user.auth_user?.last_sign_in_at 
                            ? new Date(user.auth_user.last_sign_in_at).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleDeleteUser(user.user_id)}
                            disabled={deletingUserId === user.user_id || updatingRoleUserId === user.user_id}
                            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Excluir usuário"
                          >
                            {deletingUserId === user.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Criar Novo Usuário</h2>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="usuario@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de Exibição
                  </label>
                  <input
                    type="text"
                    value={newUser.display_name}
                    onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome do usuário"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Papel
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="student">Aluno</option>
                    <option value="instructor">Instrutor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {creatingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{creatingUser ? 'Criando...' : 'Criar Usuário'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}