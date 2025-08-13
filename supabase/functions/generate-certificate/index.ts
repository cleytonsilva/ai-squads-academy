import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Interface para os dados do certificado
interface CertificateData {
  userCertificateId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
}

interface CertificateTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  background_color: string;
  text_color: string;
  font_family: string;
  border_style: string;
  signature_line: boolean;
  main_text: string;
  footer_text: string;
  course: {
    title: string;
    description: string;
  };
}

interface UserCertificate {
  id: string;
  user_id: string;
  certificate_id: string;
  issued_at: string;
  certificate_url?: string;
  certificate: CertificateTemplate;
  user: {
    full_name: string;
    email: string;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Obter dados da requisição
    const { userCertificateId, userId }: CertificateData = await req.json();

    if (!userCertificateId || !userId) {
      throw new Error('ID do certificado e do usuário são obrigatórios');
    }

    // Verificar se o usuário tem permissão para acessar este certificado
    if (user.id !== userId) {
      // Verificar se é admin ou instrutor
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'instructor'].includes(profile.role)) {
        throw new Error('Sem permissão para acessar este certificado');
      }
    }

    // Buscar dados do certificado
    const { data: userCertificate, error: certError } = await supabase
      .from('user_certificates')
      .select(`
        id,
        user_id,
        certificate_id,
        issued_at,
        certificate_url,
        certificate:certificates (
          id,
          title,
          subtitle,
          description,
          background_color,
          text_color,
          font_family,
          border_style,
          signature_line,
          main_text,
          footer_text,
          course:courses (
            title,
            description
          )
        ),
        user:profiles (
          full_name,
          email
        )
      `)
      .eq('id', userCertificateId)
      .single();

    if (certError || !userCertificate) {
      throw new Error('Certificado não encontrado');
    }

    const cert = userCertificate as UserCertificate;

    // Se já existe URL do certificado, retornar ela
    if (cert.certificate_url) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          certificateUrl: cert.certificate_url 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Gerar HTML do certificado
    const certificateHtml = generateCertificateHtml(cert);

    // Aqui você pode integrar com um serviço de geração de PDF
    // Por exemplo: Puppeteer, jsPDF, ou um serviço externo como HTMLtoPDF
    
    // Por enquanto, vamos simular a geração e retornar uma URL fictícia
    // Em produção, você deve implementar a geração real do PDF
    
    const mockPdfUrl = `https://example.com/certificates/${cert.id}.pdf`;
    
    // Atualizar o registro com a URL do certificado
    const { error: updateError } = await supabase
      .from('user_certificates')
      .update({ certificate_url: mockPdfUrl })
      .eq('id', userCertificateId);

    if (updateError) {
      console.error('Erro ao atualizar URL do certificado:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        certificateUrl: mockPdfUrl,
        html: certificateHtml // Para debug/preview
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro na geração do certificado:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function generateCertificateHtml(userCertificate: UserCertificate): string {
  const { certificate, user, issued_at } = userCertificate;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const mainText = certificate.main_text
    .replace('{user_name}', user.full_name)
    .replace('{course_title}', certificate.course.title)
    .replace('{issue_date}', formatDate(issued_at));

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${certificate.title}</title>
        <style>
            @page {
                size: A4 landscape;
                margin: 0;
            }
            
            body {
                margin: 0;
                padding: 40px;
                font-family: ${certificate.font_family || 'serif'};
                background-color: ${certificate.background_color || '#ffffff'};
                color: ${certificate.text_color || '#000000'};
                min-height: calc(100vh - 80px);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                box-sizing: border-box;
            }
            
            .certificate-container {
                width: 100%;
                max-width: 800px;
                border: 8px ${certificate.border_style || 'solid'} ${certificate.text_color || '#000000'};
                padding: 60px;
                position: relative;
            }
            
            .certificate-title {
                font-size: 48px;
                font-weight: bold;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 3px;
            }
            
            .certificate-subtitle {
                font-size: 24px;
                margin-bottom: 40px;
                font-style: italic;
            }
            
            .certificate-main-text {
                font-size: 18px;
                line-height: 1.6;
                margin-bottom: 40px;
                max-width: 600px;
            }
            
            .course-info {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 30px;
            }
            
            .issue-date {
                font-size: 16px;
                margin-bottom: 40px;
            }
            
            .signature-line {
                width: 300px;
                border-top: 2px solid ${certificate.text_color || '#000000'};
                margin: 40px auto 10px;
                padding-top: 10px;
                font-size: 14px;
            }
            
            .footer-text {
                font-size: 12px;
                margin-top: 40px;
                opacity: 0.8;
                max-width: 600px;
            }
            
            .decorative-border {
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                bottom: 20px;
                border: 2px solid ${certificate.text_color || '#000000'};
                opacity: 0.3;
            }
        </style>
    </head>
    <body>
        <div class="certificate-container">
            <div class="decorative-border"></div>
            
            <h1 class="certificate-title">${certificate.title}</h1>
            
            ${certificate.subtitle ? `<h2 class="certificate-subtitle">${certificate.subtitle}</h2>` : ''}
            
            <div class="certificate-main-text">
                ${mainText}
            </div>
            
            <div class="course-info">
                Curso: ${certificate.course.title}
            </div>
            
            <div class="issue-date">
                Emitido em ${formatDate(issued_at)}
            </div>
            
            ${certificate.signature_line ? `
                <div class="signature-line">
                    Assinatura Digital Verificada
                </div>
            ` : ''}
            
            ${certificate.footer_text ? `
                <div class="footer-text">
                    ${certificate.footer_text}
                </div>
            ` : ''}
        </div>
    </body>
    </html>
  `;
}

/* 
Para implementar a geração real de PDF, você pode:

1. Usar Puppeteer (recomendado):
   - Instalar: https://deno.land/x/puppeteer@16.2.0/mod.ts
   - Gerar PDF a partir do HTML
   - Fazer upload para Supabase Storage

2. Usar jsPDF:
   - Mais limitado para layouts complexos
   - Boa para certificados simples

3. Usar serviço externo:
   - HTMLtoPDF API
   - PDFShift
   - Outros serviços de conversão

Exemplo com Puppeteer:

import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

async function generatePdfWithPuppeteer(html: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
  });
  
  await browser.close();
  return pdf;
}
*/