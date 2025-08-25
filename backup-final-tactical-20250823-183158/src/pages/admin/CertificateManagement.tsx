import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { Trophy, Plus, Search, FileText, Download, Edit, Trash2, BookOpen, Users, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Certificate = Tables<'certificates'> & {
  course?: {
    title: string;
    id: string;
  };
  profile?: {
    display_name: string | null;
    user_id: string;
    auth_user?: {
      email: string;
    };
  };
};

type Course = Tables<'courses'>;

interface CertificateTemplate {
  name: string;
  description: string;
  requirements: string;
  type: string;
}

export default function CertificateManagement() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [deletingCertificateId, setDeletingCertificateId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/');
      return;
    }

    if (currentUser) {
      fetchCertificates();
      fetchCourses();
    }
  }, [currentUser, authLoading, navigate]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      
      const { data: certificatesData, error } = await supabase
        .from('certificates')
        .select(`
          *,
          courses(title, id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching certificates:', error);
        toast.error('Erro ao carregar certificados');
        return;
      }

      // Get auth user data for profiles
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        setCertificates(certificatesData || []);
        return;
      }

      // Merge certificate data with auth data
      const certificatesWithAuth = certificatesData?.map(cert => {
        const authUser = authUsers.users.find(u => u.id === cert.user_id);
        return {
          ...cert,
          course: cert.courses,
          auth_user: authUser ? {
            email: authUser.email || ''
          } : undefined
        };
      }) || [];

      setCertificates(certificatesWithAuth);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Erro ao carregar certificados');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('id, title, is_published')
        .eq('is_published', true)
        .order('title');

      if (error) {
        console.error('Error fetching courses:', error);
        toast.error('Erro ao carregar cursos');
        return;
      }

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Erro ao carregar cursos');
    }
  };

  const handleGenerateCertificate = async (courseId: string, userId: string) => {
    try {
      setGeneratingCertificate(true);
      const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { error } = await supabase
        .from('certificates')
        .insert({
          course_id: courseId,
          user_id: userId,
          certificate_number: certificateNumber,
          issued_at: new Date().toISOString(),
          metadata: {
            template: selectedTemplate?.type || 'default',
            generated_by: currentUser?.id,
            generated_at: new Date().toISOString()
          }
        });

      if (error) {
        console.error('Error generating certificate:', error);
        toast.error('Erro ao gerar certificado');
        return;
      }

      toast.success('Certificado gerado com sucesso');
      fetchCertificates();
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Erro ao gerar certificado');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este certificado?')) return;

    try {
      setDeletingCertificateId(certificateId);
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', certificateId);

      if (error) {
        console.error('Error deleting certificate:', error);
        toast.error('Erro ao excluir certificado');
        return;
      }

      toast.success('Certificado excluído com sucesso');
      setCertificates(certificates.filter(c => c.id !== certificateId));
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error('Erro ao excluir certificado');
    } finally {
      setDeletingCertificateId(null);
    }
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      // This would integrate with a certificate generation service
      // For now, we'll just show a success message
      toast.success('Download do certificado iniciado');
      
      // In a real implementation, you would:
      // 1. Generate PDF certificate using the metadata
      // 2. Download the file
      // 3. Track the download in analytics
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Erro ao baixar certificado');
    }
  };

  const filteredCertificates = certificates.filter(certificate => {
    const courseName = certificate.course?.title || '';
    const userName = certificate.auth_user?.email || '';
    const certificateNumber = certificate.certificate_number || '';
    
    return courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const predefinedTemplates: CertificateTemplate[] = [
    {
      name: 'Conclusão de Curso',
      description: 'Certificado padrão para conclusão de curso',
      requirements: 'Completar todas as aulas e obter nota mínima de 70%',
      type: 'course_completion'
    },
    {
      name: 'Excelência Acadêmica',
      description: 'Para alunos com desempenho excepcional',
      requirements: 'Obter nota superior a 90% em todas as avaliações',
      type: 'excellence'
    },
    {
      name: 'Participação Ativa',
      description: 'Para alunos engajados na plataforma',
      requirements: 'Completar 5 cursos e 10 desafios',
      type: 'engagement'
    }
  ];

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
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Certificados</h1>
            <p className="text-gray-600 mt-2">
              Gerencie certificados emitidos e templates disponíveis
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Certificado</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Certificados</p>
                <p className="text-xl font-bold text-gray-900">{certificates.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Este Mês</p>
                <p className="text-xl font-bold text-gray-900">
                  {certificates.filter(c => {
                    const thisMonth = new Date();
                    const certDate = new Date(c.issued_at);
                    return certDate.getMonth() === thisMonth.getMonth() && 
                           certDate.getFullYear() === thisMonth.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cursos com Certificados</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Set(certificates.map(c => c.course_id)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Usuários Certificados</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Set(certificates.map(c => c.user_id)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Templates */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Templates de Certificados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {predefinedTemplates.map((template, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowCreateModal(true);
                }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <p className="text-xs text-purple-600 font-medium">{template.requirements}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar certificados por curso, usuário ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div> 
       {/* Certificates Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emitido em
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
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
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-gray-200 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {certificates.length === 0 ? 'Nenhum certificado emitido ainda' : 'Nenhum certificado encontrado'}
                      </p>
                      {certificates.length === 0 && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all flex items-center space-x-2 mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Gerar Primeiro Certificado</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCertificates.map((certificate) => (
                    <tr key={certificate.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Certificado de Conclusão</p>
                            <p className="text-sm text-gray-500">
                              {certificate.metadata && typeof certificate.metadata === 'object' && 'template' in certificate.metadata
                                ? String(certificate.metadata.template).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                : 'Padrão'
                              }
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {certificate.profile?.display_name || 'Nome não disponível'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {certificate.profile?.auth_user?.email || 'Email não disponível'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {certificate.course?.title || 'Curso não encontrado'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">
                          {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono text-gray-900">
                          {certificate.certificate_number || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDownloadCertificate(certificate)}
                            className="p-2 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-colors"
                            title="Baixar certificado"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCertificate(certificate.id)}
                            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Excluir certificado"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Generate Certificate Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {selectedTemplate ? `Gerar ${selectedTemplate.name}` : 'Gerar Certificado'}
              </h2>
              
              {selectedTemplate && (
                <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">{selectedTemplate.name}</h3>
                  <p className="text-sm text-purple-700 mb-2">{selectedTemplate.description}</p>
                  <p className="text-xs text-purple-600">
                    <span className="font-medium">Requisitos:</span> {selectedTemplate.requirements}
                  </p>
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const courseId = formData.get('courseId') as string;
                const userId = formData.get('userId') as string;
                
                if (courseId && userId) {
                  handleGenerateCertificate(courseId, userId);
                  setShowCreateModal(false);
                  setSelectedTemplate(null);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Curso *
                  </label>
                  <select
                    name="courseId"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Selecione um curso</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID do Usuário *
                  </label>
                  <input
                    type="text"
                    name="userId"
                    required
                    placeholder="Digite o ID do usuário"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Você pode encontrar o ID do usuário na página de gestão de usuários
                  </p>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedTemplate(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
                  >
                    Gerar Certificado
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