import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Interface para os dados do certificado
interface CertificateData {
  userCertificateId: string;
  userId: string; // This is the auth.users.id
  courseId?: string; // Optional courseId to check for completion
  trackId?: string; // Optional trackId to check for completion
  customData?: {
    userName: string;
    courseTitle: string;
    issueDate: string;
  }
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
    const { userCertificateId, userId, courseId, trackId, customData }: CertificateData = await req.json();

    if (!userId || (!courseId && !trackId)) {
      return new Response(JSON.stringify({ error: 'userId and either courseId or trackId are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Admins or the user themselves can request the certificate
    if (user.id !== userId) {
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!requesterProfile || !['admin', 'instructor'].includes(requesterProfile.role)) {
        return new Response(JSON.stringify({ error: 'Permission denied to access this certificate' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // --- 1. Validação de Conclusão ---
    // First, get the profile ID for the user requesting the certificate
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('user_id', userId)
      .single();

    if (profileError || !targetProfile) {
      return new Response(JSON.stringify({ error: 'Target user profile not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const profileId = targetProfile.id;

    // TODO: Implement track completion logic if needed
    if (trackId) {
       console.warn("Track completion validation is not yet implemented.");
    }

    if (courseId) {
      const { completed, error: completionError } = await checkCourseCompletion(supabase, profileId, courseId);
      if (completionError) throw completionError;

      if (!completed) {
        return new Response(JSON.stringify({ error: 'Usuário não concluiu os requisitos para este certificado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      return new Response(
        JSON.stringify({ success: false, error: 'Certificado não encontrado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    const cert = userCertificate as UserCertificate;

    // If a certificate URL already exists, return it
    if (cert.certificate_url) {
      return new Response(
        JSON.stringify({ success: true, certificateUrl: cert.certificate_url }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let certificateHtml;
    try {
      // --- 2. Integridade dos Dados ---
      const fallbackData = {
        userName: customData?.userName || targetProfile.full_name,
        courseTitle: customData?.courseTitle || cert.certificate.course.title,
        issueDate: customData?.issueDate || new Date().toLocaleDateString('pt-BR'),
      };

      // If course title is still missing, fetch it
      if (!fallbackData.courseTitle && courseId) {
        const { data: courseData } = await supabase.from('courses').select('title').eq('id', courseId).single();
        fallbackData.courseTitle = courseData?.title || 'Curso Desconhecido';
      }

      // Generate certificate HTML
      certificateHtml = generateCertificateHtml(cert, fallbackData);

      // PDF generation logic would go here.
      // For now, we simulate generation and return a mock URL.
      // In production, you should implement actual PDF generation.

      const mockPdfUrl = `https://example.com/certificates/${cert.id}.pdf`;

      // Update the record with the certificate URL
      const { error: updateError } = await supabase
        .from('user_certificates')
        .update({ certificate_url: mockPdfUrl })
        .eq('id', userCertificateId);

      if (updateError) {
        console.error('Erro ao atualizar URL do certificado:', updateError);
        // Decide if this should be a fatal error or just a warning
      }

      return new Response(
        JSON.stringify({
          success: true,
          certificateUrl: mockPdfUrl,
          html: certificateHtml // For debug/preview
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (pdfError) {
      console.error('Falha ao gerar o arquivo PDF do certificado:', pdfError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha ao gerar o arquivo PDF do certificado'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

  } catch (error) {
    console.error('Erro na geração do certificado:', error);
    
    // General error handler for issues like auth, bad input, etc.
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400, // Bad Request is a reasonable default
      }
    );
  }
});

async function checkCourseCompletion(supabase: any, profileId: string, courseId: string): Promise<{ completed: boolean, error: Error | null }> {
  try {
    // 1. Get all quizzes for the course
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('course_id', courseId);

    if (quizzesError) throw quizzesError;
    if (!quizzes || quizzes.length === 0) {
      // If there are no quizzes, course is considered completable by default
      return { completed: true, error: null };
    }

    const quizIds = quizzes.map(q => q.id);

    // 2. Get all *passed* quiz attempts for this user for these quizzes
    const { data: passedAttempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('quiz_id')
      .eq('user_id', profileId)
      .in('quiz_id', quizIds)
      .eq('is_passed', true);

    if (attemptsError) throw attemptsError;

    // 3. Check if the user has passed all quizzes
    const passedQuizIds = new Set(passedAttempts.map(a => a.quiz_id));
    const completed = quizIds.every(id => passedQuizIds.has(id));

    return { completed, error: null };
  } catch (error) {
    console.error('Error checking course completion:', error);
    return { completed: false, error };
  }
}

function generateCertificateHtml(userCertificate: UserCertificate, fallbackData: any): string {
  const { certificate } = userCertificate;

  const mainText = certificate.main_text
    .replace('{user_name}', fallbackData.userName)
    .replace('{course_title}', fallbackData.courseTitle)
    .replace('{issue_date}', fallbackData.issueDate);

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