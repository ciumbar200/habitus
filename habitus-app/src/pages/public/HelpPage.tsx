import { useI18n } from "../../lib/I18nContext";

const FAQS = [
  {
    role: "Inquilinos",
    items: [
      ["¿Puedo buscar habitación, coliving o grupo?", "Sí. El flujo de inquilino está pensado para esas tres búsquedas y se adapta al perfil de convivencia."],
      ["¿Tengo que completar el cuestionario?", "Es recomendable: mejora el matching y la visibilidad en resultados compatibles."],
    ],
  },
  {
    role: "Propietarios",
    items: [
      ["¿Recibo grupos ya formados?", "Sí. El objetivo es que puedas recibir grupos compatibles y alquilar con menos fricción."],
      ["¿Puedo publicar un piso privado?", "Sí. Puedes publicar en público o desbloquear grupos concretos desde el panel."],
    ],
  },
  {
    role: "Anfitriones",
    items: [
      ["¿Sirve para publicar una habitación?", "Sí. La publicación está pensada para una habitación dentro de una vivienda compartida."],
      ["¿Qué veo en las solicitudes?", "Perfil, presupuesto, fecha de entrada, duración y señales de compatibilidad."],
    ],
  },
  {
    role: "Operadores",
    items: [
      ["¿Puedo gestionar varias unidades?", "Sí. El panel del operador está preparado para inventario profesional, candidatos y pipeline."],
      ["¿Puedo usar API keys?", "Sí. Desde tu perfil puedes generarlas, revocarlas y prepararlas para integraciones técnicas."],
    ],
  },
];

export function HelpPage() {
  const t = useI18n();

  return (
    <main className="min-h-screen bg-stone-50 pt-24">
      <section className="mx-auto max-w-7xl px-margin-mobile pb-12 md:px-margin-desktop">
        <p className="section-eyebrow">{t.public.help}</p>
        <h1 className="section-title">{t.public.help}</h1>
        <p className="mt-4 max-w-3xl text-body-lg text-warm-slate">
          Preguntas y respuestas ampliadas para inquilinos, propietarios, anfitriones y operadores.
          La idea es que entiendas el flujo sin tener que abrir soporte.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-margin-mobile pb-20 md:px-margin-desktop">
        <div className="grid gap-6 md:grid-cols-2">
          {FAQS.map((section) => (
            <article key={section.role} className="rounded-xl border border-border-light bg-white p-6 card-shadow">
              <h2 className="text-headline-md text-deep-navy">{section.role}</h2>
              <div className="mt-4 space-y-3">
                {section.items.map(([question, answer]) => (
                  <details key={question} className="rounded-lg border border-border-light px-4 py-3">
                    <summary className="cursor-pointer text-label-md text-deep-navy">{question}</summary>
                    <p className="mt-2 text-body-sm text-warm-slate">{answer}</p>
                  </details>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
