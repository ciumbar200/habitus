import { usePageMeta } from "../../hooks/usePageMeta";
import { LeadMagnetPage } from "../../components/LeadMagnetPage";

function Tip({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-3 mb-4 break-inside-avoid">
      <div className="w-7 h-7 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div>
        <p className="font-semibold text-stone-800 text-sm">{title}</p>
        <p className="text-stone-600 text-sm leading-relaxed mt-0.5">{body}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7 break-inside-avoid">
      <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide border-b border-stone-200 pb-1 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-4 bg-stone-50 rounded-xl">
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="text-xs text-stone-500 mt-1">{label}</p>
    </div>
  );
}

export function GuiaConvivenciaPage() {
  usePageMeta(
    "Guía de convivencia en pisos compartidos 2026 | : moon",
    "10 reglas no escritas de los pisos que funcionan. Guía práctica para convivir sin conflictos en pisos compartidos.",
    "/recursos/guia-convivencia",
  );

  return (
    <LeadMagnetPage
      title="Guía de convivencia en pisos compartidos"
      description="Las 10 reglas no escritas de los pisos que funcionan. Práctica, directa y sin perorata."
      badge="Guía gratuita · moon 2026"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-teal-500" />
          <span className="font-bold text-stone-800 text-lg">: moon</span>
        </div>
        <h1 className="text-xl font-bold text-stone-900 mt-3 mb-1">
          Guía de convivencia en pisos compartidos
        </h1>
        <p className="text-xs text-stone-500 italic mb-6">
          Barcelona · Europa · 2026 — Las reglas que nadie te enseñó pero todos esperan que sepas.
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8 print:grid-cols-3">
          <Stat value="82%" label="de los conflictos de piso son evitables con comunicación" />
          <Stat value="1 de 3" label="personas ha perdido fianza por no hacer inventario" />
          <Stat value="€340" label="es el coste medio de un conflicto de convivencia en España" />
        </div>

        <Section title="Antes de firmar nada">
          <Tip n={1} title="Conoce a tus compañeros antes de firmar"
            body="Una videollamada de 20 minutos evita 6 meses de mal rollo. Pregunta por horarios, hábitos de limpieza, si tiene mascota, si fuma, si trabaja en casa. No preguntes por parejas o ideología — además de incómodo, puede ser discriminatorio." />
          <Tip n={2} title="Firma siempre el acuerdo de convivencia"
            body="No es un contrato de arrendamiento — no necesita notario. Es un pacto entre convivientes sobre gastos, limpieza, ruido y cómo se sale del piso. Sin él, las conversaciones difíciles no tienen referencia y siempre gana quien más aguanta." />
          <Tip n={3} title="Haz el inventario el día que entras (con fotos)"
            body="Foto de cada raya, mancha y mueble roto antes de deshacer la maleta. Mándalas por un grupo de mensajería con fecha. El 80% de los conflictos de fianza vienen de 'eso ya estaba roto'. Las fotos tienen fecha automática. Tu dinero, tus fotos." />
        </Section>

        <Section title="El dinero del piso">
          <Tip n={4} title="Registra todos los gastos desde el primer día"
            body="Usar una app (moon Gastos, Splitwise, lo que sea) desde el día 1 evita que las deudas se acumulen y que nadie recuerde quién pagó qué. La regla: si no está registrado, no existe. Sin registros, el más organizado siempre pierde." />
          <Tip n={5} title="El alquiler no siempre va a partes iguales"
            body="Si las habitaciones son distintas (m², exterior, baño propio), el alquiler proporcional es más justo — y paradójicamente genera menos resentimiento. moon tiene una calculadora de reparto por peso de habitación. Acuerda el método antes de firmar." />
          <Tip n={6} title="Cierra las cuentas cada mes, no solo cuando alguien se va"
            body="Las deudas acumuladas son la causa #1 de peleas en pisos. Liquidar al final de cada mes (aunque sea con una transferencia de 8€) mantiene el tablero limpio y las relaciones intactas." />
        </Section>

        <Section title="La convivencia día a día">
          <Tip n={7} title="La limpieza: rotación, no jerarquía"
            body="El sistema que más funciona: rotación semanal de zonas (cocina, baño, salón, basura) escrita en algún sitio visible. No elegir quién limpia mejor — elegir quién limpia esta semana. La frialdad de un turno evita el 'a ver quién aguanta más'." />
          <Tip n={8} title="Las zonas comunes son de todos, las habitaciones son de uno"
            body="La habitación es territorio privado e inviolable. Las zonas comunes se usan y se dejan como se encontraron. Esta es la única norma que, si se respeta, hace que las demás sean secundarias." />
          <Tip n={9} title="Reporta los problemas cuando son pequeños"
            body="Una avería en la lavadora es una avería. Una avería que no se reporta y deja daño es un conflicto con el propietario. En moon puedes reportar incidencias (lavadora, fuga, caldera, ruido) con categoría y urgencia — y queda registrado para el historial del grupo." />
        </Section>

        <Section title="Cuando hay tensión (y siempre habrá alguna)">
          <Tip n={10} title="Di las cosas antes de que duelan"
            body="El silencio en un piso compartido no es respeto — es deuda emocional. La mayoría de los conflictos escalan porque nadie lo dijo a tiempo. Protocolo probado: (1) díselo directamente a esa persona. (2) Si no funciona, reunión de grupo. (3) Si tampoco, mediación externa. No saltes el orden." />
        </Section>

        <div className="bg-stone-950 text-white rounded-2xl p-6 mt-6 break-inside-avoid">
          <h3 className="font-bold text-base mb-2">El Moon Score: tu reputación como conviviente</h3>
          <p className="text-white/70 text-sm leading-relaxed">
            moon acumula evidencia de cómo eres como compañero de piso: incidencias bien gestionadas, gastos al día, endosos de excompañeros. Ese historial te sigue de piso en piso — como un LinkedIn de la convivencia. Cuanto antes empieces a construirlo, mejor partida en el próximo piso.
          </p>
        </div>

        <div className="mt-8 pt-4 border-t border-stone-100 text-xs text-stone-400">
          moonsharedliving.com · Guía de convivencia · moon shared living 2026
        </div>
      </div>
    </LeadMagnetPage>
  );
}
