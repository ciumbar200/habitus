'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Wand2, Video, FileText, Mail, Share2, Loader2, Copy, Check } from 'lucide-react'
import type { ContentType } from '@/lib/prompts'

type Template = {
  type: ContentType
  icon: typeof FileText
  title: string
  platform?: string
  prompts: string[]
}

const templates: Template[] = [
  {
    type: 'blog',
    icon: FileText,
    title: 'Artículo SEO',
    prompts: ['5 tips para anfitriones', 'Guía co-living Barcelona', 'Rentabilidad habitaciones'],
  },
  {
    type: 'social',
    icon: Share2,
    title: 'Post Instagram',
    platform: 'instagram',
    prompts: ['Reel tour habitación', 'Testimonio huésped', 'Before/After reforma'],
  },
  {
    type: 'video',
    icon: Video,
    title: 'Video TikTok',
    platform: 'tiktok',
    prompts: ['Día en la vida', 'Room tour', 'Hacks hosting'],
  },
  {
    type: 'email',
    icon: Mail,
    title: 'Secuencia Email',
    prompts: ['Cold outreach propietarios', 'Onboarding anfitriones', 'Newsletter mensual'],
  },
]

export function AIContentGenerator() {
  const [topic, setTopic] = useState('Guía co-living Barcelona 2026')
  const [contentType, setContentType] = useState<ContentType>('blog')
  const [platform, setPlatform] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [output, setOutput] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate(overrideTopic?: string, type?: ContentType, overridePlatform?: string) {
    const finalTopic = (overrideTopic ?? topic).trim()
    const finalType = type ?? contentType
    const finalPlatform = overridePlatform ?? platform

    if (!finalTopic) {
      setError('Escribe un tema antes de generar.')
      return
    }

    setLoading(true)
    setError(null)
    setWarning(null)
    setCopied(false)

    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: finalType,
          topic: finalTopic,
          platform: finalPlatform,
          tone: 'friendly',
          target: 'anfitrion',
        }),
      })

      const data = (await res.json()) as {
        content?: string
        error?: string
        warning?: string
        source?: string
      }

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Error HTTP ${res.status}`)
      }

      setOutput(data.content ?? '')
      setSource(data.source ?? null)
      setWarning(data.warning ?? null)
      setTopic(finalTopic)
      setContentType(finalType)
      if (finalPlatform) setPlatform(finalPlatform)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar contenido.')
      setOutput(null)
    } finally {
      setLoading(false)
    }
  }

  async function copyOutput() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card variant="moon">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-[#c9a962]" />
            Generador de Contenido IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-white/70 mb-1 block">Tema</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
              placeholder="Ej. Cómo encontrar habitación en Barcelona"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => {
              const Icon = template.icon
              const active = contentType === template.type
              return (
                <div
                  key={template.type}
                  className={`p-4 rounded-lg border transition-colors ${
                    active
                      ? 'bg-[#c9a962]/15 border-[#c9a962]/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      setContentType(template.type)
                      setPlatform(template.platform)
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-[#c9a962]/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[#c9a962]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{template.title}</h4>
                        <Badge variant="moon" className="text-xs mt-1">
                          {active ? 'Seleccionado' : 'Claude'}
                        </Badge>
                      </div>
                    </div>
                  </button>
                  <div className="space-y-2">
                    {template.prompts.map((prompt, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                        className="w-full justify-start text-sm h-8 text-white/90 hover:text-white hover:bg-white/10"
                        onClick={() => void generate(prompt, template.type, template.platform)}
                      >
                        <Wand2 className="h-3 w-3 mr-2" />
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <Button
            className="w-full"
            size="lg"
            variant="moon"
            disabled={loading}
            onClick={() => void generate()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando con Claude…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar contenido
              </>
            )}
          </Button>

          {error && (
            <p className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          )}
          {warning && (
            <p className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-2 text-sm text-amber-100">
              {warning}
            </p>
          )}
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Resultado</CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Fuente: {source === 'anthropic' ? 'Claude (Anthropic API)' : 'Borrador local'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void copyOutput()}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-slate-800 dark:text-slate-200 max-h-[480px] overflow-y-auto">
              {output}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
