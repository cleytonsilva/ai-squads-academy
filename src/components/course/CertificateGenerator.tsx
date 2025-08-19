'use client';

import React, { useState, useRef } from 'react';
import { Certificate, Course, UserProfile } from '@/types/course';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Award,
  Download,
  Share2,
  Calendar,
  User,
  BookOpen,
  Star,
  Trophy,
  Printer,
  Mail,
  Link,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CertificateGeneratorProps {
  course: Course;
  userProfile: UserProfile;
  completionDate: string;
  finalScore?: number;
  totalXP?: number;
  onGenerated?: (certificate: Certificate) => void;
}

interface CertificateData {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number?: string;
  issued_at: string;
  completion_date?: string;
  final_score?: number;
  total_xp?: number;
  certificate_url?: string;
  verification_code: string;
  is_valid?: boolean;
  metadata?: any;
  created_at: string;
  updated_at?: string;
}

export default function CertificateGenerator({
  course,
  userProfile,
  completionDate,
  finalScore,
  totalXP,
  onGenerated
}: CertificateGeneratorProps) {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const generateCertificate = async () => {
    try {
      setLoading(true);

      // Generate unique certificate number and verification code
      const certificateNumber = `AC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const verificationCode = Math.random().toString(36).substring(2, 15).toUpperCase();

      const certificateData = {
        user_id: userProfile.user_id,
        course_id: course.id,
        certificate_number: certificateNumber,
        issued_at: new Date().toISOString(),
        completion_date: completionDate,
        verification_code: verificationCode,
        metadata: {
          final_score: finalScore,
          total_xp: totalXP,
          generated_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };

      // Save certificate to database
      const { data, error } = await supabase
        .from('certificates')
        .insert(certificateData)
        .select()
        .single();

      if (error) throw error;

      setCertificate(data);
      toast.success('Certificado gerado com sucesso!');

      if (onGenerated) {
        onGenerated(data);
      }
    } catch (error: any) {
      console.error('Erro ao gerar certificado:', error);
      toast.error('Erro ao gerar certificado');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async () => {
    if (!certificate || !certificateRef.current) return;

    try {
      // In a real implementation, you would use a library like html2canvas or jsPDF
      // For now, we'll simulate the download
      const link = document.createElement('a');
      link.href = '#'; // Would be the actual PDF/image URL
      link.download = `certificado-${certificate.certificate_number}.pdf`;
      link.click();
      
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao fazer download do certificado');
    }
  };

  const shareCertificate = async (platform: 'linkedin' | 'twitter' | 'email' | 'link') => {
    if (!certificate) return;

    setSharing(true);
    
    const certificateUrl = `${window.location.origin}/certificate/verify/${certificate.verification_code}`;
    const shareText = `Acabei de concluir o curso "${course.title}" na AI Squads Academy! 🎓 #aprendizado #certificação`;

    try {
      switch (platform) {
        case 'linkedin':
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}&title=${encodeURIComponent(shareText)}`,
            '_blank'
          );
          break;
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(certificateUrl)}`,
            '_blank'
          );
          break;
        case 'email':
          window.open(
            `mailto:?subject=${encodeURIComponent('Meu Certificado - ' + course.title)}&body=${encodeURIComponent(shareText + '\n\n' + certificateUrl)}`,
            '_blank'
          );
          break;
        case 'link':
          await navigator.clipboard.writeText(certificateUrl);
          toast.success('Link copiado para a área de transferência!');
          break;
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao compartilhar certificado');
    } finally {
      setSharing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!certificate) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Parabéns! Curso Concluído
            </h2>
            <p className="text-gray-600 mb-6">
              Você completou com sucesso o curso <strong>{course.title}</strong>.
              Gere seu certificado oficial para comprovar sua conquista!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {finalScore ? `${Math.round(finalScore)}%` : '100%'}
              </div>
              <div className="text-sm text-gray-600">Pontuação Final</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {totalXP || 0} XP
              </div>
              <div className="text-sm text-gray-600">XP Total Ganho</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatDate(completionDate)}
              </div>
              <div className="text-sm text-gray-600">Data de Conclusão</div>
            </div>
          </div>

          <Button
            onClick={generateCertificate}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Gerando Certificado...
              </>
            ) : (
              <>
                <Award className="w-5 h-5 mr-2" />
                Gerar Certificado
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Certificate Preview */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            ref={certificateRef}
            className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-12 relative overflow-hidden"
            style={{ aspectRatio: '1.414/1' }} // A4 ratio
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-10 left-10 w-32 h-32 border-4 border-blue-300 rounded-full"></div>
              <div className="absolute top-20 right-20 w-24 h-24 border-4 border-purple-300 rounded-full"></div>
              <div className="absolute bottom-20 left-20 w-28 h-28 border-4 border-yellow-300 rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-20 h-20 border-4 border-green-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="text-center mb-8 relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">AI Squads Academy</h1>
                  <p className="text-lg text-gray-600">Certificado de Conclusão</p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="text-center mb-8 relative z-10">
              <p className="text-lg text-gray-700 mb-4">Certificamos que</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 border-b-2 border-gray-300 pb-2 inline-block">
                {userProfile.full_name || 'Usuário'}
              </h2>
              <p className="text-lg text-gray-700 mb-2">concluiu com sucesso o curso</p>
              <h3 className="text-2xl font-bold text-blue-600 mb-6">
                {course.title}
              </h3>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Data de Conclusão</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(completionDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pontuação Final</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {finalScore ? `${Math.round(finalScore)}%` : '100%'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between relative z-10">
              <div className="text-left">
                <div className="border-t-2 border-gray-400 pt-2 w-48">
                  <p className="text-sm font-semibold text-gray-900">AI Squads Academy</p>
                  <p className="text-xs text-gray-600">Plataforma de Ensino</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-2">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <p className="text-xs text-gray-600">Certificado Oficial</p>
              </div>
              
              <div className="text-right">
                <div className="border-t-2 border-gray-400 pt-2 w-48">
                  <p className="text-sm font-semibold text-gray-900">Nº {certificate.certificate_number || 'N/A'}</p>
                  <p className="text-xs text-gray-600">Código: {certificate.verification_code}</p>
                </div>
              </div>
            </div>

            {/* Verification URL */}
            <div className="text-center mt-6 relative z-10">
              <p className="text-xs text-gray-500">
                Verifique a autenticidade em: {window.location.origin}/certificate/verify/{certificate.verification_code}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Certificado Gerado</h3>
                <p className="text-sm text-gray-600">
                  Certificado Nº {certificate.certificate_number}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={downloadCertificate}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sharing Options */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar Conquista
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => shareCertificate('linkedin')}
              disabled={sharing}
              className="flex items-center justify-center"
            >
              <div className="w-5 h-5 bg-blue-600 rounded mr-2"></div>
              LinkedIn
            </Button>
            
            <Button
              variant="outline"
              onClick={() => shareCertificate('twitter')}
              disabled={sharing}
              className="flex items-center justify-center"
            >
              <div className="w-5 h-5 bg-blue-400 rounded mr-2"></div>
              Twitter
            </Button>
            
            <Button
              variant="outline"
              onClick={() => shareCertificate('email')}
              disabled={sharing}
              className="flex items-center justify-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            
            <Button
              variant="outline"
              onClick={() => shareCertificate('link')}
              disabled={sharing}
              className="flex items-center justify-center"
            >
              <Link className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Details */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Detalhes do Certificado</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Número do Certificado:</span>
                <span className="font-mono text-sm">{certificate.certificate_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Código de Verificação:</span>
                <span className="font-mono text-sm">{certificate.verification_code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data de Emissão:</span>
                <span className="text-sm">{formatDate(certificate.issued_at)}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Curso:</span>
                <span className="text-sm font-medium">{course.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nível:</span>
                <Badge variant="secondary" className="capitalize">
                  {course.difficulty_level}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Válido
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}