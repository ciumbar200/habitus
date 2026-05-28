// Claude Skills Integration - Generación de contenido con AI

export interface ContentGenerationRequest {
  type: 'blog' | 'social' | 'email' | 'video'
  topic: string
  platform?: string
  tone?: 'professional' | 'casual' | 'friendly' | 'persuasive'
  target?: 'anfitrion' | 'propietario' | 'agencia'
}

// Generar blog post con skill copywriting
export async function generateBlogPost(topic: string, keywords: string[]) {
  // TODO: Integrar con Claude Skill /copywriting
  // Prompt structure: "Escribe un artículo de blog sobre {topic} optimizado para SEO con keywords: {keywords.join(', ')}"

  return {
    title: '',
    content: '',
    metaDescription: '',
    slug: '',
  }
}

// Generar posts para redes sociales
export async function generateSocialPosts(platform: 'instagram' | 'tiktok' | 'linkedin', topic: string) {
  // TODO: Integrar con Claude Skill /social-content

  return {
    captions: [],
    hashtags: [],
    visualIdeas: [],
  }
}

// Generar secuencia de email
export async function generateEmailSequence(type: 'anfitrion' | 'propietario', stages: number) {
  // TODO: Integrar con Claude Skill /email-sequence

  return {
    emails: [], // Array de { subject, body, delay_days }
  }
}

// Generar script para video
export async function generateVideoScript(topic: string, duration: number) {
  // TODO: Integrar con Claude Skill + Video IA

  return {
    script: '',
    scenes: [], // { description, duration, visual_notes }
    voiceover: '',
  }
}

// Prompt templates para cada tipo de contenido
const PROMPTS = {
  blog: (topic: string) => `
Escribe un artículo de blog de 1500 palabras sobre "${topic}" para : moon shared living, plataforma de co-living en Europa.

Estructura:
1. Title atractivo (H1)
2. Introducción enganchante
3. 3-5 secciones con H2/H3
4. Conclusiones con CTA

Tono: Profesional pero accesible
Keywords SEO: co-living, habitación compartida, Barcelona, Madrid, income pasivo
  `,

  social: (platform: string, topic: string) => `
Genera 5 opciones de captions para ${platform} sobre "${topic}".

Para cada opción incluye:
- Hook inicial (15 caracteres)
- Cuerpo del mensaje (100-150 caracteres)
- Hashtags relevantes (5-10)
- Call to action

Tono: Enganchador, auténtico, orientado a conversión
  `,

  email: (type: string, stage: number) => `
Email ${stage} de secuencia de 5 emails para ${type === 'anfitrion' ? 'anfitriones' : 'propietarios'}.

Objetivo: ${stage === 1 ? 'Presentar : moon' : stage === 2 ? 'Mostrar beneficios' : stage === 3 ? 'Prueba social' : stage === 4 ? 'Oferta especial' : 'Última oportunidad'}

Incluye:
- Subject line (menos de 50 caracteres)
- Preheader
- Body (100-200 palabras)
- CTA claro
  `,

  video: (topic: string) => `
Genera script de video de 60 segundos sobre "${topic}" para TikTok/Instagram Reels.

Formato:
- Hook visual (0-3s)
- Intro (3-10s)
- Contenido principal (10-50s)
- CTA final (50-60s)

Incluye notas visuales y sugerencias de edición.
  `,
}
