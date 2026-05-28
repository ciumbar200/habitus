// Video AI Integration - Generación de contenido visual

export interface VideoGenerationRequest {
  script: string
  duration: number
  style: 'minimal' | 'dynamic' | 'cinematic' | 'trend'
  platform: 'tiktok' | 'instagram' | 'youtube'
}

// Servicios de video IA compatibles
export const VIDEO_AI_SERVICES = {
  heygen: {
    name: 'HeyGen',
    capabilities: ['avatar', 'text-to-speech', 'templates'],
    url: 'https://www.heygen.com',
  },
  synthesia: {
    name: 'Synthesia',
    capabilities: ['avatar', 'text-to-speech', 'multi-language'],
    url: 'https://www.synthesia.io',
  },
  runway: {
    name: 'Runway ML',
    capabilities: ['gen-3', 'video-editing', 'text-to-video'],
    url: 'https://runwayml.com',
  },
  veed: {
    name: 'Veed.io',
    capabilities: ['editing', 'subtitles', 'templates'],
    url: 'https://www.veed.io',
  },
}

// Generar video con HeyGen
export async function generateHeyGenVideo(script: string, avatarId?: string) {
  // TODO: POST https://api.heygen.com/v1/video.generate
  return {
    videoId: '',
    status: 'processing',
    estimatedTime: 300, // segundos
  }
}

// Generar video con Runway Gen-3
export async function generateRunwayVideo(prompt: string, duration: number) {
  // TODO: POST https://api.runwayml.com/v1/generate
  return {
    videoId: '',
    status: 'processing',
  }
}

// Añadir subtítulos automáticos
export async function addSubtitles(videoUrl: string) {
  // TODO: Usar Veed o similar para subtítulos
  return {
    subtitledVideoUrl: '',
  }
}

// Crear thumbnail atractivo
export async function generateThumbnail(videoTitle: string, style: string) {
  // TODO: Generar con DALL-E 3 o Midjourney
  return {
    thumbnailUrl: '',
  }
}

// Templates de video para : moon
export const VIDEO_TEMPLATES = {
  roomTour: {
    name: 'Room Tour',
    duration: 60,
    prompts: [
      'Habitación moderna en co-living Barcelona',
      'Espacio acogedor con luz natural',
      'Área común elegante',
    ],
    music: 'upbeat-trendy',
  },
  hostTips: {
    name: '5 Tips Anfitriones',
    duration: 45,
    prompts: [
      'Texto tip #1',
      'Texto tip #2',
      'Texto tip #3',
    ],
    music: 'motivational',
  },
  testimonial: {
    name: 'Testimonio Huésped',
    duration: 30,
    prompts: [
      'Huésped feliz',
      'Experiencia positiva',
      'Recomendación',
    ],
    music: 'warm-acoustic',
  },
  dayInLife: {
    name: 'Día en Co-living',
    duration: 90,
    prompts: [
      'Desayuno comunitario',
      'Espacio trabajo',
      'Noche social',
    ],
    music: 'lifestyle-vlog',
  },
}
