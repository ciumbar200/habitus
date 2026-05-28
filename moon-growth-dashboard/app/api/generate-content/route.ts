import { NextResponse } from "next/server";
import {
  buildContentPrompt,
  fallbackDraft,
  type GenerateContentInput,
} from "@/lib/prompts";

async function generateWithAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("NO_API_KEY");

  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Anthropic HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };

  const text = data.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) throw new Error("Respuesta vacía de Claude.");
  return text;
}

export async function POST(req: Request) {
  let body: GenerateContentInput;
  try {
    body = (await req.json()) as GenerateContentInput;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.topic?.trim()) {
    return NextResponse.json({ error: "Falta el tema (topic)." }, { status: 400 });
  }

  const validTypes = new Set(["blog", "social", "email", "video"]);
  if (!validTypes.has(body.type)) {
    return NextResponse.json({ error: "type inválido." }, { status: 400 });
  }

  const prompt = buildContentPrompt(body);

  try {
    const content = await generateWithAnthropic(prompt);
    return NextResponse.json({
      content,
      source: "anthropic",
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    if (message === "NO_API_KEY") {
      return NextResponse.json({
        content: fallbackDraft(body),
        source: "fallback",
        warning:
          "ANTHROPIC_API_KEY no configurada. Mostrando borrador local. Añádela en .env.local y reinicia el servidor.",
      });
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
