import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { ErrorHandler, ProgressLogger, ErrorType } from "../shared/error-handling.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Interfaces para tipagem
interface GenerateCoverRequest {
  courseId: string;
  engine?: 'flux' | 'recraft';
  regenerate?: boolean;
}

interface CourseData {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
}

interface ReplicateResponse {
  id: string;
  status: string;
  urls: {
    get: string;
    cancel: string;
  };
}

/**
 * Valida os dados de entrada da requisição
 * @param body - Corpo da requisição
 * @returns Dados validados ou erro
 */
function validateRequest(body: unknown): { data?: GenerateCoverRequest; error?: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Corpo da requisição inválido' };
  }

  const { courseId, engine = 'flux', regenerate = false } = body;

  if (!courseId || typeof courseId !== 'string') {
    return { error: 'courseId é obrigatório e deve ser uma string' };
  }

  if (engine && !['flux', 'recraft'].includes(engine)) {
    return { error: 'engine deve ser "flux" ou "recraft"' };
  }

  return {
    data: {
      courseId,
      engine: engine as 'flux' | 'recraft',
      regenerate: Boolean(regenerate)
    }
  };
}

/**
 * Verifica se o usuário tem permissão para gerar capas
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @returns boolean indicando se tem permissão
 */
async function checkUserPermissions(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ authorized: boolean; role?: string }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      console.error('[AUTH] Erro ao buscar perfil:', error);
      return { authorized: false };
    }

    const authorized = ['admin', 'instructor'].includes(profile.role);
    return { authorized, role: profile.role };
  } catch (error) {
    console.error('[AUTH] Erro na verificação de permissões:', error);
    return { authorized: false };
  }
}

/**
 * Busca dados do curso
 * @param supabase - Cliente Supabase
 * @param courseId - ID do curso
 * @returns Dados do curso ou null
 */
async function getCourseData(
  supabase: ReturnType<typeof createClient>,
  courseId: string
): Promise<CourseData | null> {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('id, title, description, cover_image_url')
      .eq('id', courseId)
      .single();

    if (error || !course) {
      console.error('[COURSE] Erro ao buscar curso:', error);
      return null;
    }

    return course;
  } catch (error) {
    console.error('[COURSE] Erro inesperado ao buscar curso:', error);
    return null;
  }
}

/**
 * Gera um hash único baseado no ID e conteúdo do curso
 * @param courseId - ID do curso
 * @param title - Título do curso
 * @param description - Descrição do curso
 * @returns Hash único para o curso
 */
function generateCourseHash(courseId: string, title: string, description?: string): string {
  const content = `${courseId}-${title}-${description || ''}`;
  // Simples hash baseado no conteúdo
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Detecta a categoria principal do curso baseado no título e descrição
 * @param title - Título do curso
 * @param description - Descrição do curso
 * @returns Categoria detectada
 */
function detectCourseCategory(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  const categories: Record<string, { keywords: string[], priority: number }> = {
    'cybersecurity': {
      keywords: ['cibersegurança', 'cybersecurity', 'security', 'hacking', 'blue team', 'red team', 'penetration', 'firewall', 'malware', 'vulnerability'],
      priority: 10
    },
    'programming': {
      keywords: ['programação', 'programming', 'código', 'code', 'desenvolvimento', 'development', 'software', 'javascript', 'python', 'java', 'react', 'node'],
      priority: 9
    },
    'data_science': {
      keywords: ['dados', 'data', 'analytics', 'machine learning', 'ia', 'artificial intelligence', 'statistics', 'big data', 'analysis'],
      priority: 8
    },
    'design': {
      keywords: ['design', 'ui', 'ux', 'interface', 'visual', 'graphics', 'photoshop', 'figma', 'creative'],
      priority: 7
    },
    'business': {
      keywords: ['negócios', 'business', 'marketing', 'vendas', 'sales', 'gestão', 'management', 'empreendedorismo', 'entrepreneurship'],
      priority: 6
    },
    'web_development': {
      keywords: ['web', 'website', 'frontend', 'backend', 'html', 'css', 'responsive', 'api'],
      priority: 5
    },
    'mobile': {
      keywords: ['mobile', 'app', 'android', 'ios', 'smartphone', 'aplicativo'],
      priority: 4
    },
    'cloud': {
      keywords: ['cloud', 'aws', 'azure', 'google cloud', 'devops', 'kubernetes', 'docker'],
      priority: 3
    },
    'finance': {
      keywords: ['finanças', 'finance', 'investimento', 'investment', 'economia', 'economy', 'trading'],
      priority: 2
    },
    'education': {
      keywords: ['educação', 'education', 'ensino', 'teaching', 'pedagogia', 'learning'],
      priority: 1
    }
  };
  
  let bestMatch = 'general';
  let highestScore = 0;
  
  for (const [category, config] of Object.entries(categories)) {
    const matches = config.keywords.filter(keyword => text.includes(keyword)).length;
    const score = matches * config.priority;
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = category;
    }
  }
  
  return bestMatch;
}

/**
 * Gera paleta de cores específica para cada categoria
 * @param category - Categoria do curso
 * @param courseHash - Hash único do curso
 * @returns Configuração de cores
 */
function getCategoryColorPalette(category: string, courseHash: string): { primary: string, secondary: string, accent: string } {
  const palettes: Record<string, { primary: string, secondary: string, accent: string }[]> = {
    'cybersecurity': [
      { primary: 'deep blue', secondary: 'electric red', accent: 'neon green' },
      { primary: 'dark navy', secondary: 'crimson', accent: 'cyan' },
      { primary: 'midnight blue', secondary: 'orange red', accent: 'lime green' }
    ],
    'programming': [
      { primary: 'forest green', secondary: 'purple', accent: 'gold' },
      { primary: 'teal', secondary: 'magenta', accent: 'yellow' },
      { primary: 'emerald', secondary: 'violet', accent: 'orange' }
    ],
    'data_science': [
      { primary: 'royal blue', secondary: 'turquoise', accent: 'silver' },
      { primary: 'steel blue', secondary: 'aqua', accent: 'white' },
      { primary: 'navy blue', secondary: 'light blue', accent: 'platinum' }
    ],
    'design': [
      { primary: 'coral', secondary: 'lavender', accent: 'mint green' },
      { primary: 'rose gold', secondary: 'periwinkle', accent: 'sage' },
      { primary: 'salmon', secondary: 'lilac', accent: 'seafoam' }
    ],
    'business': [
      { primary: 'charcoal', secondary: 'gold', accent: 'white' },
      { primary: 'slate gray', secondary: 'bronze', accent: 'cream' },
      { primary: 'graphite', secondary: 'copper', accent: 'ivory' }
    ],
    'web_development': [
      { primary: 'electric blue', secondary: 'lime', accent: 'hot pink' },
      { primary: 'cyan', secondary: 'chartreuse', accent: 'fuchsia' },
      { primary: 'azure', secondary: 'neon yellow', accent: 'magenta' }
    ],
    'mobile': [
      { primary: 'gradient blue to purple', secondary: 'bright orange', accent: 'white' },
      { primary: 'gradient teal to blue', secondary: 'coral', accent: 'light gray' },
      { primary: 'gradient purple to pink', secondary: 'yellow', accent: 'off-white' }
    ],
    'cloud': [
      { primary: 'sky blue', secondary: 'cloud white', accent: 'storm gray' },
      { primary: 'azure', secondary: 'snow white', accent: 'charcoal' },
      { primary: 'powder blue', secondary: 'pearl white', accent: 'slate' }
    ],
    'finance': [
      { primary: 'deep green', secondary: 'gold', accent: 'black' },
      { primary: 'emerald', secondary: 'silver', accent: 'dark gray' },
      { primary: 'forest green', secondary: 'bronze', accent: 'charcoal' }
    ],
    'education': [
      { primary: 'warm orange', secondary: 'soft blue', accent: 'cream' },
      { primary: 'golden yellow', secondary: 'gentle purple', accent: 'light beige' },
      { primary: 'sunset orange', secondary: 'sky blue', accent: 'vanilla' }
    ],
    'general': [
      { primary: 'modern blue', secondary: 'clean white', accent: 'subtle gray' },
      { primary: 'professional navy', secondary: 'crisp white', accent: 'light silver' },
      { primary: 'contemporary teal', secondary: 'pure white', accent: 'soft gray' }
    ]
  };
  
  const categoryPalettes = palettes[category] || palettes['general'];
  const hashNum = parseInt(courseHash.substring(0, 8), 16);
  const paletteIndex = hashNum % categoryPalettes.length;
  
  return categoryPalettes[paletteIndex];
}

/**
 * Gera estilo visual específico baseado na categoria e hash do curso
 * @param category - Categoria do curso
 * @param courseHash - Hash único do curso
 * @returns Configuração de estilo
 */
function getCategoryVisualStyle(category: string, courseHash: string): { style: string, elements: string, composition: string } {
  const styles: Record<string, { style: string, elements: string, composition: string }[]> = {
    'cybersecurity': [
      { 
        style: 'futuristic digital art with glitch effects', 
        elements: 'circuit patterns, shield icons, lock symbols, binary code overlay', 
        composition: 'dramatic diagonal composition with high contrast lighting' 
      },
      { 
        style: 'dark cyberpunk aesthetic with neon highlights', 
        elements: 'network nodes, firewall visualization, security badges, encrypted data streams', 
        composition: 'centered focal point with radiating security elements' 
      },
      { 
        style: 'military-grade security interface design', 
        elements: 'tactical grids, warning symbols, secure communication icons, armor plating textures', 
        composition: 'structured grid layout with bold geometric shapes' 
      }
    ],
    'programming': [
      { 
        style: 'clean code editor aesthetic with syntax highlighting', 
        elements: 'code brackets, function symbols, terminal windows, IDE interface elements', 
        composition: 'layered code blocks with depth and perspective' 
      },
      { 
        style: 'abstract algorithmic visualization', 
        elements: 'flowcharts, data structures, programming language logos, binary trees', 
        composition: 'interconnected nodes forming a complex network' 
      },
      { 
        style: 'modern developer workspace illustration', 
        elements: 'multiple monitors, keyboard close-ups, coffee cups, sticky notes with code', 
        composition: 'isometric perspective of a coding environment' 
      }
    ],
    'data_science': [
      { 
        style: 'scientific data visualization with charts and graphs', 
        elements: 'bar charts, pie charts, scatter plots, neural network diagrams', 
        composition: 'dashboard-style layout with multiple data panels' 
      },
      { 
        style: 'abstract mathematical representation', 
        elements: 'statistical formulas, data points, trend lines, correlation matrices', 
        composition: 'flowing data streams converging to insights' 
      },
      { 
        style: 'AI brain visualization with data connections', 
        elements: 'neural pathways, machine learning models, algorithm symbols, data clusters', 
        composition: 'central brain structure with radiating data connections' 
      }
    ],
    'design': [
      { 
        style: 'creative studio aesthetic with artistic tools', 
        elements: 'color palettes, design tools, sketches, typography samples', 
        composition: 'artistic workspace with scattered creative elements' 
      },
      { 
        style: 'minimalist geometric design principles', 
        elements: 'golden ratio spirals, grid systems, color theory wheels, font specimens', 
        composition: 'balanced asymmetrical layout with design principles' 
      },
      { 
        style: 'digital art creation process visualization', 
        elements: 'tablet stylus, layer panels, brush strokes, design software interfaces', 
        composition: 'creative process flow from concept to final design' 
      }
    ],
    'business': [
      { 
        style: 'corporate boardroom aesthetic with professional elements', 
        elements: 'business charts, handshake silhouettes, city skylines, growth arrows', 
        composition: 'executive perspective with upward trending elements' 
      },
      { 
        style: 'entrepreneurial startup environment', 
        elements: 'lightbulb ideas, rocket ships, target goals, success metrics', 
        composition: 'dynamic upward movement with innovation symbols' 
      },
      { 
        style: 'financial success visualization', 
        elements: 'dollar signs, profit graphs, investment symbols, market indicators', 
        composition: 'prosperity-focused layout with wealth indicators' 
      }
    ],
    'web_development': [
      { 
        style: 'responsive web design showcase', 
        elements: 'browser windows, mobile screens, HTML tags, CSS grid layouts', 
        composition: 'multi-device responsive layout demonstration' 
      },
      { 
        style: 'modern web technology stack visualization', 
        elements: 'framework logos, API connections, database symbols, cloud services', 
        composition: 'interconnected technology ecosystem' 
      },
      { 
        style: 'interactive web interface design', 
        elements: 'buttons, forms, navigation menus, user interaction flows', 
        composition: 'user journey through web interface elements' 
      }
    ],
    'mobile': [
      { 
        style: 'smartphone app interface showcase', 
        elements: 'mobile screens, app icons, touch gestures, notification badges', 
        composition: 'multiple phone screens showing app progression' 
      },
      { 
        style: 'mobile development environment', 
        elements: 'code editors, device emulators, app store interfaces, testing devices', 
        composition: 'development workflow from code to app store' 
      },
      { 
        style: 'cross-platform mobile solution', 
        elements: 'iOS and Android logos, unified codebase, platform bridges', 
        composition: 'unified development approach across platforms' 
      }
    ],
    'cloud': [
      { 
        style: 'cloud infrastructure visualization', 
        elements: 'server racks, cloud symbols, data flow arrows, network connections', 
        composition: 'distributed cloud architecture diagram' 
      },
      { 
        style: 'scalable cloud services representation', 
        elements: 'auto-scaling indicators, load balancers, microservices, containers', 
        composition: 'elastic cloud infrastructure scaling' 
      },
      { 
        style: 'cloud security and compliance focus', 
        elements: 'security shields, compliance badges, encrypted connections, audit trails', 
        composition: 'secure cloud environment with protection layers' 
      }
    ],
    'finance': [
      { 
        style: 'financial market analysis visualization', 
        elements: 'stock charts, trading indicators, market trends, currency symbols', 
        composition: 'financial dashboard with market data' 
      },
      { 
        style: 'investment portfolio management', 
        elements: 'portfolio pie charts, risk indicators, return graphs, asset allocation', 
        composition: 'balanced investment strategy visualization' 
      },
      { 
        style: 'banking and fintech innovation', 
        elements: 'digital wallets, blockchain symbols, payment processing, financial apps', 
        composition: 'modern financial technology ecosystem' 
      }
    ],
    'education': [
      { 
        style: 'modern classroom learning environment', 
        elements: 'interactive whiteboards, student devices, learning materials, progress indicators', 
        composition: 'collaborative learning space with technology integration' 
      },
      { 
        style: 'knowledge transfer visualization', 
        elements: 'books, graduation caps, lightbulb moments, skill progression paths', 
        composition: 'learning journey from basics to mastery' 
      },
      { 
        style: 'online education platform interface', 
        elements: 'video lessons, quiz interfaces, progress bars, achievement badges', 
        composition: 'digital learning experience flow' 
      }
    ],
    'general': [
      { 
        style: 'professional educational design', 
        elements: 'clean icons, progress indicators, learning symbols, modern typography', 
        composition: 'balanced educational layout with clear hierarchy' 
      },
      { 
        style: 'contemporary learning visualization', 
        elements: 'abstract knowledge symbols, growth arrows, achievement markers', 
        composition: 'upward learning progression with modern aesthetics' 
      },
      { 
        style: 'minimalist course representation', 
        elements: 'simple geometric shapes, subtle textures, clean lines', 
        composition: 'elegant simplicity with focus on content' 
      }
    ]
  };
  
  const categoryStyles = styles[category] || styles['general'];
  const hashNum = parseInt(courseHash.substring(0, 8), 16);
  const styleIndex = hashNum % categoryStyles.length;
  
  return categoryStyles[styleIndex];
}

/**
 * Gera elementos visuais únicos baseados no hash do curso
 * @param hashSegments - Segmentos do hash do curso
 * @param category - Categoria do curso
 * @returns Objeto com elementos visuais únicos
 */
function generateUniqueVisualElements(hashSegments: string[], category: string): {
  colorVariation: string;
  specificElements: string;
  layoutPattern: string;
  signature: string;
  themeVariation: string;
} {
  // Converter segmentos do hash em números para determinismo
  const hashNumbers = hashSegments.slice(0, 5).map(seg => parseInt(seg, 16) % 100);
  
  // Variações de cor baseadas no hash
  const colorVariations = [
    'subtle gradient overlay',
    'geometric color blocks',
    'soft color transitions',
    'vibrant accent highlights',
    'monochromatic depth layers',
    'complementary color harmony',
    'analogous color flow',
    'triadic color balance'
  ];
  
  // Elementos específicos por categoria
  const categoryElements = {
    'cybersecurity': ['code snippets', 'terminal windows', 'IDE interfaces', 'algorithm flowcharts', 'binary patterns'],
    'programming': ['code snippets', 'terminal windows', 'IDE interfaces', 'algorithm flowcharts', 'binary patterns'],
    'design': ['design tools', 'color palettes', 'typography samples', 'grid systems', 'creative brushes'],
    'business': ['charts and graphs', 'business icons', 'growth arrows', 'meeting rooms', 'strategy boards'],
    'data_science': ['data visualizations', 'neural networks', 'statistical charts', 'machine learning models', 'data pipelines'],
    'web_development': ['browser windows', 'responsive layouts', 'framework logos', 'API connections', 'code structures'],
    'mobile': ['smartphone screens', 'app interfaces', 'touch gestures', 'platform icons', 'device mockups'],
    'cloud': ['server racks', 'network diagrams', 'cloud symbols', 'infrastructure icons', 'scaling indicators'],
    'finance': ['financial charts', 'currency symbols', 'trading indicators', 'investment icons', 'market graphs'],
    'education': ['learning symbols', 'progress indicators', 'knowledge icons', 'academic elements', 'study materials'],
    'general': ['abstract shapes', 'geometric patterns', 'modern icons', 'clean lines', 'minimalist elements']
  };
  
  // Padrões de layout únicos
  const layoutPatterns = [
    'asymmetric composition',
    'golden ratio alignment',
    'diagonal flow pattern',
    'circular focal arrangement',
    'triangular hierarchy',
    'grid-based structure',
    'organic flow layout',
    'minimalist centered design'
  ];
  
  // Assinaturas visuais únicas
  const signatures = [
    'distinctive corner accent',
    'unique border treatment',
    'custom icon integration',
    'signature color splash',
    'geometric pattern overlay',
    'abstract shape integration',
    'custom typography treatment',
    'unique shadow effects'
  ];
  
  // Variações temáticas
  const themeVariations = [
    'modern tech aesthetic',
    'creative studio vibe',
    'professional corporate',
    'innovative startup',
    'academic institution',
    'artistic workshop',
    'digital agency style',
    'futuristic design'
  ];
  
  const elements = categoryElements[category] || categoryElements['general'];
  
  return {
    colorVariation: colorVariations[hashNumbers[0] % colorVariations.length],
    specificElements: elements[hashNumbers[1] % elements.length],
    layoutPattern: layoutPatterns[hashNumbers[2] % layoutPatterns.length],
    signature: signatures[hashNumbers[3] % signatures.length],
    themeVariation: themeVariations[hashNumbers[4] % themeVariations.length]
  };
}

/**
 * Extrai palavras-chave específicas do curso para personalização adicional
 * @param title - Título do curso
 * @param description - Descrição do curso
 * @returns Array de palavras-chave específicas
 */
function extractSpecificKeywords(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const words = text.split(/\s+/);
  
  // Lista expandida de palavras irrelevantes
  const stopWords = [
    'curso', 'course', 'para', 'with', 'and', 'the', 'this', 'that', 'como', 'how',
    'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma',
    'o', 'a', 'os', 'as', 'é', 'são', 'foi', 'foram', 'ser', 'estar', 'ter',
    'introduction', 'básico', 'basic', 'avançado', 'advanced', 'intermediário', 'intermediate'
  ];
  
  // Palavras técnicas prioritárias que devem ser mantidas
  const techKeywords = [
    'javascript', 'python', 'react', 'node', 'typescript', 'html', 'css', 'sql',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'api', 'rest', 'graphql',
    'mongodb', 'postgresql', 'mysql', 'redis', 'nginx', 'apache', 'linux',
    'cybersecurity', 'security', 'blockchain', 'ai', 'ml', 'data', 'analytics',
    'devops', 'cicd', 'git', 'github', 'gitlab', 'jenkins', 'terraform'
  ];
  
  // Filtrar palavras relevantes
  const relevantWords = words.filter(word => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    return cleanWord.length > 2 && 
           !stopWords.includes(cleanWord) &&
           (techKeywords.includes(cleanWord) || cleanWord.length > 4);
  });
  
  // Priorizar palavras técnicas conhecidas
  const prioritizedWords = relevantWords.sort((a, b) => {
    const aIsTech = techKeywords.includes(a.toLowerCase());
    const bIsTech = techKeywords.includes(b.toLowerCase());
    if (aIsTech && !bIsTech) return -1;
    if (!aIsTech && bIsTech) return 1;
    return b.length - a.length; // Palavras mais longas primeiro
  });
  
  return prioritizedWords.slice(0, 4); // Máximo 4 palavras específicas
}

/**
 * Gera prompt único e específico para criação de capa do curso
 * @param course - Dados do curso
 * @param engine - Engine a ser usado
 * @returns Prompt personalizado e único para geração
 */
function generatePrompt(course: CourseData, engine: 'flux' | 'recraft'): string {
  // Gerar hash único para o curso
  const courseHash = generateCourseHash(course.id, course.title, course.description);
  
  // Detectar categoria do curso
  const category = detectCourseCategory(course.title, course.description);
  
  // Obter paleta de cores específica
  const colorPalette = getCategoryColorPalette(category, courseHash);
  
  // Obter estilo visual específico
  const visualStyle = getCategoryVisualStyle(category, courseHash);
  
  // Extrair palavras-chave específicas do curso
  const specificKeywords = extractSpecificKeywords(course.title, course.description);
  
  // Configurações base por engine
  const engineConfigs = {
    flux: {
      aspectRatio: '16:9 aspect ratio',
      quality: 'ultra-high quality, 8K resolution, sharp details, professional photography quality',
      format: 'suitable for web display, optimized file size'
    },
    recraft: {
      aspectRatio: '1920x1080 pixels',
      quality: 'high-resolution vector art, crisp details, scalable design',
      format: 'optimized for digital platforms, web-ready format'
    }
  };
  
  const config = engineConfigs[engine];
  
  // Gerar elementos únicos baseados no hash
  const hashSegments = courseHash.match(/.{1,2}/g) || [];
  const uniqueElements = generateUniqueVisualElements(hashSegments, category);
  
  // Construir prompt único e detalhado
  const promptParts = [
    // Identificação única do curso
    `[COURSE-ID: ${course.id}] [HASH: ${courseHash.substring(0, 8)}]`,
    
    // Estilo principal baseado na categoria com elementos únicos
    `Create a ${visualStyle.style} with unique visual signature`,
    
    // Título e contexto específico do curso
    `for "${course.title}"`,
    
    // Descrição específica se disponível
    course.description ? `Context: ${course.description.substring(0, 150)}` : '',
    
    // Palavras-chave específicas do curso
    specificKeywords.length > 0 ? `Focus on: ${specificKeywords.join(', ')}` : '',
    
    // Paleta de cores única com variações
    `Color scheme: ${colorPalette.primary} primary, ${colorPalette.secondary} secondary, ${colorPalette.accent} accent with ${uniqueElements.colorVariation}`,
    
    // Elementos visuais específicos da categoria
    `Visual elements: ${visualStyle.elements}, ${uniqueElements.specificElements}`,
    
    // Composição específica com layout único
    `Layout: ${visualStyle.composition} with ${uniqueElements.layoutPattern}`,
    
    // Elementos únicos baseados no hash
    `Unique signature: ${uniqueElements.signature}`,
    
    // Especificações técnicas
    `Format: ${config.aspectRatio}, ${config.quality}, ${config.format}`,
    
    // Categoria específica para diferenciação
    `Theme: ${category} education with distinctive ${uniqueElements.themeVariation}`,
    
    // Diretrizes de qualidade aprimoradas
    'Style: Professional, modern, memorable, distinctive visual identity that stands out from other course covers',
    
    // Restrições específicas
    'Avoid: Generic templates, stock photos, text overlays, cluttered designs, similar layouts to other courses',
    
    // Garantias de unicidade aprimoradas
    `Ensure: Completely unique design signature, impossible to confuse with other courses, memorable visual identity specific to course ${course.id}`
  ];
  
  // Filtrar partes vazias e juntar
  const prompt = promptParts.filter(Boolean).join(' ');
  
  // Log para debugging (apenas os primeiros 200 caracteres)
  console.log(`[PROMPT] Generated unique prompt for course ${course.id} (${category}): ${prompt.substring(0, 200)}...`);
  
  return prompt;
}

/**
 * Implementa delay para retry com backoff exponencial
 * @param attempt - Número da tentativa (começando em 0)
 * @returns Promise que resolve após o delay
 */
function delay(attempt: number): Promise<void> {
  const baseDelay = 1000; // 1 segundo
  const maxDelay = 10000; // 10 segundos
  const delayTime = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  return new Promise(resolve => setTimeout(resolve, delayTime));
}

/**
 * Chama a API do Replicate para gerar imagem com retry automático
 * @param prompt - Prompt para geração
 * @param engine - Engine a ser usado
 * @param replicateToken - Token da API
 * @param webhookUrl - URL do webhook
 * @param maxRetries - Número máximo de tentativas
 * @returns Resposta da API ou erro
 */
async function callReplicateAPI(
  prompt: string,
  engine: 'flux' | 'recraft',
  replicateToken: string,
  webhookUrl: string,
  maxRetries: number = 3
): Promise<{ data?: ReplicateResponse; error?: string }> {
  // IDs de versão específicos dos modelos do Replicate
  const modelVersions = {
    flux: '80a09d66baa990429c2f5ae8a4306bf778a1b3775afd01cc2cc8bdbe9033769c', // black-forest-labs/flux-1.1-pro
    recraft: '0fea59248a8a1ddb8197792577f6627ec65482abc49f50c6e9da40ca8729d24d'  // recraft-ai/recraft-v3
  };

  const inputs = {
    flux: {
      prompt,
      aspect_ratio: '16:9',
      output_quality: 90,
      safety_tolerance: 2
    },
    recraft: {
      prompt,
      style: 'realistic_image',
      size: '1920x1080',
      output_format: 'webp'
    }
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[REPLICATE] Tentativa ${attempt + 1}/${maxRetries + 1} para ${engine}`);

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${replicateToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: modelVersions[engine],
          input: inputs[engine],
          webhook: webhookUrl,
          webhook_events_filter: ['start', 'output', 'logs', 'completed']
        })
      });

      if (!response.ok) {
        let errorDetail = `Status ${response.status}: ${response.statusText}`;
        try {
            const errorBody = await response.json();
            if (errorBody && errorBody.detail) {
                errorDetail = errorBody.detail;
            }
        } catch (e) {
            // Se o corpo não for JSON ou não tiver 'detail', usa o texto plano
            errorDetail = await response.text();
        }

        const error = new Error(`API Error: ${errorDetail}`);
        
        // Não retry para erros 4xx (exceto 429 - rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          console.error('[REPLICATE] Erro não recuperável:', response.status, errorDetail);
          return { error: `Erro na API do Replicate: ${errorDetail}` };
        }
        
        lastError = error;
        console.error(`[REPLICATE] Tentativa ${attempt + 1} falhou:`, response.status, errorDetail);
        
        if (attempt < maxRetries) {
          await delay(attempt);
          continue;
        }
      } else {
        const data = await response.json();
        console.log('[REPLICATE] Predição criada com sucesso:', data.id);
        return { data };
      }
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[REPLICATE] Erro na tentativa ${attempt + 1}:`, lastError.message);
      
      if (attempt < maxRetries) {
        await delay(attempt);
        continue;
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  const errorMessage = lastError?.message || 'Erro desconhecido';
  console.error('[REPLICATE] Todas as tentativas falharam:', errorMessage);
  return { error: `Erro ao conectar com Replicate após ${maxRetries + 1} tentativas: ${errorMessage}` };
}

/**
 * Salva predição no banco de dados com retry
 * @param supabase - Cliente Supabase
 * @param predictionData - Dados da predição
 * @param courseId - ID do curso
 * @param engine - Engine usado
 * @param prompt - Prompt usado
 * @param maxRetries - Número máximo de tentativas
 * @returns Sucesso ou erro
 */
async function savePrediction(
  supabase: ReturnType<typeof createClient>,
  predictionData: ReplicateResponse,
  courseId: string,
  engine: string,
  prompt: string,
  maxRetries: number = 2
): Promise<{ success: boolean; error?: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DB] Tentativa ${attempt + 1}/${maxRetries + 1} para salvar predição`);

      const { error } = await supabase
        .from('replicate_predictions')
        .insert({
          prediction_id: predictionData.id,
          course_id: courseId,
          prediction_type: 'course_cover',
          status: predictionData.status,
          model_name: engine,
          input_data: {
            prompt,
            engine,
            type: 'course_cover',
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      if (error) {
        lastError = new Error(error.message || String(error));
        console.error(`[DB] Tentativa ${attempt + 1} falhou:`, error.message);
        
        // Se é erro de constraint (predição já existe), não retry
        if (error.code === '23505') {
          console.log('[DB] Predição já existe, considerando como sucesso');
          return { success: true };
        }
        
        if (attempt < maxRetries) {
          await delay(attempt);
          continue;
        }
      } else {
        console.log('[DB] Predição salva com sucesso:', predictionData.id);
        return { success: true };
      }
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[DB] Erro inesperado na tentativa ${attempt + 1}:`, lastError.message);
      
      if (attempt < maxRetries) {
        await delay(attempt);
        continue;
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  const errorMessage = lastError?.message || 'Erro desconhecido';
  console.error('[DB] Todas as tentativas de salvamento falharam:', errorMessage);
  return { success: false, error: errorMessage };
}

/**
 * Notifica o frontend sobre o progresso da geração
 * @param supabase - Cliente Supabase
 * @param courseId - ID do curso
 * @param status - Status atual
 * @param details - Detalhes adicionais
 */
async function notifyProgress(
  supabase: ReturnType<typeof createClient>,
  courseId: string,
  status: string,
  details?: unknown
): Promise<void> {
  try {
    await supabase
      .from('generation_events')
      .insert({
        event_type: 'generation_progress',
        event_data: {
          course_id: courseId,
          status,
          details,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('[PROGRESS] Erro ao notificar progresso:', error);
    // Não falhar a função por causa de notificação
  }
}

/**
 * Função principal da Edge Function
 */
serve(async (req) => {
  // Permite requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apenas aceita requisições POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Validação de chaves de ambiente
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !REPLICATE_API_TOKEN) {
      const missingVars = [];
      if (!SUPABASE_URL) missingVars.push("SUPABASE_URL");
      if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
      if (!REPLICATE_API_TOKEN) missingVars.push("REPLICATE_API_TOKEN");

      const error = ErrorHandler.createError(
        ErrorType.VALIDATION,
        `Variáveis de ambiente não configuradas: ${missingVars.join(', ')}`,
        { function: 'generate-course-cover' },
        { missingVars }
      );

      return new Response(
        JSON.stringify({ error: error.message, details: error.details }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Lê e valida o corpo da requisição
    console.log('[REQUEST] Iniciando validação da requisição.');
    const body = await req.json();
    const validation = validateRequest(body);
    
    if (validation.error) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { courseId, engine, regenerate } = validation.data!;
    console.log('[REQUEST] Validação bem-sucedida:', { courseId, engine, regenerate });

    // Cria cliente do Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verifica autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autorização necessário" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extrai o token JWT
    const token = authHeader.replace('Bearer ', '');
    
    // Verificar se é Service Role Key (bypass auth para testes)
    const isServiceRole = token === SUPABASE_SERVICE_ROLE_KEY;
    
    let user = null;
    if (!isServiceRole) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        return new Response(
          JSON.stringify({ error: "Token inválido ou expirado" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      user = authUser;
      
      // Verifica permissões do usuário
      const { authorized, role } = await checkUserPermissions(supabase, user.id);
      console.log(`[AUTH] Verificação de permissão para userId: ${user.id}. Resultado: ${authorized ? 'Autorizado' : 'Não autorizado'} (Role: ${role})`);
      if (!authorized) {
        return new Response(
          JSON.stringify({ 
            error: "Acesso negado. Apenas administradores e instrutores podem gerar capas.",
            userRole: role 
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.log('[AUTH] Usando Service Role Key - bypass de autenticação');
    }

    // Busca dados do curso
    console.log(`[COURSE] Buscando dados para o cursoId: ${courseId}.`);
    const course = await getCourseData(supabase, courseId);
    if (!course) {
      return new Response(
        JSON.stringify({ error: "Curso não encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log('[COURSE] Dados do curso encontrados:', { id: course.id, title: course.title });

    // Verifica se já existe capa e se deve regenerar
    if (course.cover_image_url && !regenerate) {
      return new Response(
        JSON.stringify({ 
          message: "Curso já possui capa. Use regenerate=true para gerar nova capa.",
          existingCover: course.cover_image_url
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Notificar início da geração
    await notifyProgress(supabase, courseId, 'starting', { engine });

    // Gera prompt para a IA
    const prompt = generatePrompt(course, engine);
    console.log('[GENERATION] Prompt gerado:', prompt);

    // Constrói URL do webhook
    const webhookUrl = `${SUPABASE_URL}/functions/v1/replicate-webhook`;

    // Notificar que está chamando a API
    await notifyProgress(supabase, courseId, 'calling_api', { engine, prompt: prompt.substring(0, 100) + '...' });

    // Chama API do Replicate com retry
    const replicateResult = await callReplicateAPI(
      prompt,
      engine,
      REPLICATE_API_TOKEN,
      webhookUrl,
      3 // máximo 3 tentativas
    );

    if (replicateResult.error) {
      // Notificar erro
      await notifyProgress(supabase, courseId, 'failed', { error: replicateResult.error });
      
      return new Response(
        JSON.stringify({ error: replicateResult.error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Notificar que a predição foi criada
    await notifyProgress(supabase, courseId, 'prediction_created', { 
      predictionId: replicateResult.data!.id,
      engine 
    });

    // Salva predição no banco
    const saveResult = await savePrediction(
      supabase,
      replicateResult.data!,
      courseId,
      engine,
      prompt
    );

    if (!saveResult.success) {
      console.error('[GENERATION] Erro ao salvar predição:', saveResult.error);
      // Não falha a requisição, apenas loga o erro
    }

    console.log('[GENERATION] Geração de capa iniciada com sucesso:', {
      courseId,
      predictionId: replicateResult.data!.id,
      engine
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Geração de capa iniciada com sucesso",
        predictionId: replicateResult.data!.id,
        courseId,
        engine,
        status: replicateResult.data!.status
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error("[GENERATION] Erro inesperado na função principal:", errorObj.message);
    console.error("[GENERATION] Stack Trace:", errorObj.stack);
    return new Response(
      JSON.stringify({ 
        error: "Erro interno do servidor",
        details: errorObj.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});