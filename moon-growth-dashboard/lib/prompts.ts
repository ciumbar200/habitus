export type ContentType = "blog" | "social" | "email" | "video";

export type GenerateContentInput = {
  type: ContentType;
  topic: string;
  platform?: string;
  tone?: "professional" | "casual" | "friendly" | "persuasive";
  target?: "anfitrion" | "propietario" | "agencia";
};

export function buildContentPrompt(input: GenerateContentInput): string {
  const topic = input.topic.trim();
  const tone = input.tone ?? "friendly";
  const target = input.target ?? "anfitrion";
  const platform = input.platform ?? "instagram";

  const brand = ": moon shared living";
  const toneLine = `Tono: ${tone}. Marca: ${brand}. Audiencia: ${target}.`;

  switch (input.type) {
    case "blog":
      return `${toneLine}

Escribe un artículo de blog en español (1500-2000 palabras) sobre "${topic}".

Estructura obligatoria en Markdown:
- # Título SEO (H1)
- Meta description (1 línea)
- Introducción enganchante
- 3-5 secciones con ## H2
- Conclusión con CTA hacia moonsharedliving.com
- Keywords: co-living, habitación compartida, Barcelona, Madrid, alquiler habitaciones`;

    case "social":
      return `${toneLine}

Genera contenido para ${platform} sobre "${topic}".

Formato Markdown:
## Opción 1-3 (cada una con hook, cuerpo, hashtags, CTA)
## Ideas visuales (3 bullets)
## Mejor hora de publicación`;

    case "email":
      return `${toneLine}

Genera una secuencia de 3 emails de outreach para ${target === "propietario" ? "propietarios" : target === "agencia" ? "agencias" : "anfitriones"} sobre "${topic}".

Formato Markdown por email:
### Email N — Asunto
Preheader | Cuerpo (120-180 palabras) | CTA`;

    case "video":
      return `${toneLine}

Genera un guion de video vertical (60s) para TikTok/Reels sobre "${topic}".

Formato Markdown:
## Hook (0-3s)
## Intro (3-10s)
## Escenas principales (con timestamps)
## CTA final
## Notas de edición / B-roll`;

    default:
      return `Genera contenido sobre "${topic}" para ${brand}.`;
  }
}

export function fallbackDraft(input: GenerateContentInput): string {
  const topic = input.topic.trim();
  const typeLabels: Record<ContentType, string> = {
    blog: "Artículo SEO",
    social: "Post redes sociales",
    email: "Secuencia email",
    video: "Guion video",
  };

  return `# ${typeLabels[input.type]} — ${topic}

> Borrador local (sin API key). Añade \`ANTHROPIC_API_KEY\` en \`.env.local\` para generación con Claude.

## Resumen
Contenido orientado a **: moon shared living** sobre *${topic}*.

## Próximos pasos
1. Configura \`ANTHROPIC_API_KEY\` en el dashboard
2. Pulsa de nuevo **Generar**
3. Revisa, edita y publica en el calendario de contenido

## Esquema sugerido
${buildContentPrompt(input).split("\n").slice(0, 8).join("\n")}
`;
}
