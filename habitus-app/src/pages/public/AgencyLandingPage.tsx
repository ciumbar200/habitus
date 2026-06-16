import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Warning,
  ChartLineUp,
  Star,
  CheckCircle,
  ArrowSquareOut,
  Buildings,
  CalendarCheck,
} from "@phosphor-icons/react";
import { usePageMeta } from "../../hooks/usePageMeta";

const DEMO_EMAIL = "hola@moonsharedliving.com";
const DEMO_SUBJECT = "Demo moon para operadores — quiero una llamada";
const DEMO_BODY =
  "Hola,\n\nMe interesa ver cómo moon puede ayudar a mis pisos.\n\nNombre:\nEmpresa / nº de pisos:\nMejor horario para llamar:\n\nGracias.";

function demoHref() {
  return `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(DEMO_SUBJECT)}&body=${encodeURIComponent(DEMO_BODY)}`;
}

function ValueCard({
  icon: Icon,
  color,
  title,
  body,
  proof,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  body: string;
  proof: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-7 flex flex-col gap-4">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={22} weight="duotone" className="text-white" />
      </div>
      <div>
        <h3 className="font-bold text-stone-900 text-lg mb-1">{title}</h3>
        <p className="text-stone-600 text-sm leading-relaxed">{body}</p>
      </div>
      <p className="text-xs text-stone-400 border-t border-stone-100 pt-3">{proof}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-full bg-stone-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
        {n}
      </div>
      <div className="pt-1">
        <p className="font-semibold text-stone-800">{title}</p>
        <p className="text-sm text-stone-500 mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-stone-100 pb-5">
      <p className="font-semibold text-stone-800 mb-1">{q}</p>
      <p className="text-stone-500 text-sm leading-relaxed">{a}</p>
    </div>
  );
}

export function AgencyLandingPage() {
  usePageMeta(
    "moon para operadores de co-living — ocupación verificada y gestión integrada",
    "Asigna habitaciones con confianza: Moon Score del inquilino, incidencias integradas y panel de ocupación. moon para operadores de co-living en Barcelona y Madrid.",
    "/operadores",
  );

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-stone-950 text-white pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/60 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 uppercase tracking-widest">
            <Buildings size={12} />
            moon para operadores
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            Deja de asignar habitaciones<br />
            <span className="text-white/50">a ciegas.</span>
          </h1>

          <p className="text-white/60 text-xl max-w-2xl leading-relaxed mb-10">
            moon da a los operadores de co-living la señal que siempre faltó: el historial verificado del inquilino.
            Antes de que entre al piso.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={demoHref()}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-stone-900 font-bold rounded-xl hover:bg-stone-100 transition-colors text-base"
            >
              <CalendarCheck size={18} weight="bold" />
              Agendar llamada de 15 min
            </a>
            <Link
              to="/panel"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base"
            >
              Ver el panel de operador
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Quick social proof */}
          <div className="flex flex-wrap gap-6 mt-12 pt-10 border-t border-white/10">
            {[
              { val: "100%", label: "de inquilinos con identidad verificada" },
              { val: "Moon Score", label: "historial de convivencia portable" },
              { val: "€0", label: "para el inquilino — ellos pagan solos" },
            ].map(({ val, label }) => (
              <div key={val}>
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-white/40 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain section */}
      <section className="bg-stone-50 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">
            El problema que tienen todos los operadores
          </h2>
          <p className="text-stone-600 leading-relaxed">
            La foto de DNI y una llamada de 10 minutos no te dicen si alguien paga a tiempo,
            gestiona bien las incidencias o va a generar conflictos en el piso.
            El <strong>80% de los problemas de ocupación</strong> tienen raíces en información que existía
            antes de que el inquilino entrase — y que nadie te dio.
          </p>
        </div>
      </section>

      {/* 3 Value props */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Lo que moon da al operador</p>
            <h2 className="text-3xl font-bold text-stone-900">
              Tres señales que Badi e Idealista no tienen
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ValueCard
              icon={ShieldCheck}
              color="bg-teal-600"
              title="Ocupación verificada"
              body="Cada inquilino en moon tiene identidad verificada (IdentityBadge) y un Moon Score real: historial de convivencias anteriores, incidencias gestionadas, endosos de excompañeros. Antes de asignar habitación, no una promesa."
              proof="Equivalente al «credit score del inquilino» que ya es estándar en EEUU y UK — moon lo trae a España ahora."
            />
            <ValueCard
              icon={Warning}
              color="bg-amber-600"
              title="Gestión de incidencias integrada"
              body="Los inquilinos reportan averías, fugas, ruido o limpieza desde la app del grupo. Tú recibes el ticket categorizado con foto, severidad y estado. No más WhatsApp con fotos sin contexto a las 11PM."
              proof="El historial de incidencias es prueba documentada para la aseguradora y para el propietario. Nadie más lo ofrece."
            />
            <ValueCard
              icon={ChartLineUp}
              color="bg-stone-700"
              title="Panel de ocupación con señal de calidad"
              body="Un dashboard con el Moon Score de cada inquilino activo, deudas de gastos pendientes y alertas de incidencias abiertas. No gestión de CRM genérica — señal específica de co-living."
              proof="Diseñado con y para operadores de co-living en Barcelona y Madrid. No adaptado de un SaaS genérico."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-stone-50 py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 mb-10 text-center">Cómo funciona para el operador</h2>
          <div className="flex flex-col gap-8">
            <Step
              n={1}
              title="Das de alta tus espacios (15 min)"
              body="Añades tus pisos y habitaciones en el panel de operador. Moon se encarga de la visibilidad para inquilinos. Sin código, sin integraciones."
            />
            <Step
              n={2}
              title="Los inquilinos aplican con Moon Score visible"
              body="Cada solicitud muestra el perfil verificado: identidad, historial de convivencias, endosos, Moon Score numérico. Apruebas o rechazas con criterio real, no con instinto."
            />
            <Step
              n={3}
              title="Gestionas el piso desde el panel"
              body="Las incidencias del grupo llegan a tu panel categorizadas. Asignas responsables, marcas resoluciones. El historial es prueba automática para propietarios y aseguradoras."
            />
            <Step
              n={4}
              title="Acuerdas con moon la tarifa (hablamos)"
              body="Los inquilinos son siempre gratuitos — ellos son los que construyen el moat. Para operadores, el modelo es por piso activo gestionado. Sin coste de alta, hablamos cuando el producto encaje con tu operación."
            />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 mb-8 text-center">moon vs las alternativas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-stone-500 font-normal border-b border-stone-200">Capacidad</th>
                  <th className="py-3 px-4 font-bold text-stone-900 border-b border-stone-200 text-center">moon</th>
                  <th className="py-3 px-4 font-normal text-stone-400 border-b border-stone-200 text-center">Badi</th>
                  <th className="py-3 px-4 font-normal text-stone-400 border-b border-stone-200 text-center">Idealista</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Moon Score / historial de convivencia", true, false, false],
                  ["Identidad verificada del inquilino", true, "parcial", false],
                  ["Gestión de incidencias integrada", true, false, false],
                  ["Panel de ocupación por operador", true, false, false],
                  ["Acuerdo de convivencia digital", true, false, false],
                  ["Gastos compartidos integrados", true, false, false],
                  ["Gratis para inquilinos", true, true, true],
                ].map(([cap, moon, badi, ide]) => (
                  <tr key={String(cap)} className="border-b border-stone-100">
                    <td className="py-3 px-4 text-stone-700">{cap}</td>
                    <td className="py-3 px-4 text-center">
                      {moon === true ? <CheckCircle size={18} className="text-teal-600 mx-auto" weight="fill" /> : <span className="text-stone-400 text-xs">{moon}</span>}
                    </td>
                    <td className="py-3 px-4 text-center text-stone-400 text-xs">
                      {badi === true ? <CheckCircle size={18} className="text-stone-300 mx-auto" weight="fill" /> : badi === false ? "—" : badi}
                    </td>
                    <td className="py-3 px-4 text-center text-stone-400 text-xs">
                      {ide === true ? <CheckCircle size={18} className="text-stone-300 mx-auto" weight="fill" /> : ide === false ? "—" : ide}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonial placeholder — honest */}
      <section className="bg-stone-900 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(n => <Star key={n} size={18} weight="fill" className="text-amber-400" />)}
          </div>
          <p className="text-white/80 text-lg italic leading-relaxed mb-6">
            "Llevamos años asignando habitaciones con una entrevista y un PDF de nómina.
            La idea de ver el historial real de convivencia antes de la firma cambia completamente
            cómo cualificamos a los inquilinos."
          </p>
          <p className="text-white/40 text-sm">Operador de co-living, Barcelona · feedback en conversación inicial</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 mb-10">Preguntas frecuentes</h2>
          <div className="flex flex-col gap-6">
            <FaqItem
              q="¿Cuánto cuesta para el operador?"
              a="Los inquilinos son siempre gratuitos. El modelo para operadores es por piso activo gestionado — aún en beta, lo acordamos en la conversación según volumen. Sin coste de alta ni permanencia."
            />
            <FaqItem
              q="¿Sustituye moon al contrato de arrendamiento?"
              a="No. Moon es la capa de gestión y reputación encima del contrato. El contrato lo firmas tú con el inquilino como siempre. Moon te da la señal para decidir con quién firmarlo."
            />
            <FaqItem
              q="¿Qué pasa si el inquilino no tiene Moon Score?"
              a="El perfil igualmente muestra identidad verificada y cuestionario de compatibilidad. El Moon Score crece con el tiempo — como un historial de crédito, los nuevos en el mercado empiezan sin score y lo construyen."
            />
            <FaqItem
              q="¿Está disponible fuera de Barcelona y Madrid?"
              a="En 2026, solo Barcelona y Madrid. La expansión a Valencia y otras ciudades depende de la masa crítica de inquilinos — no queremos abrir ciudades sin liquidez en ambas caras del marketplace."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-stone-950 text-white py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">¿Tienes pisos en Barcelona o Madrid?</h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Agenda una llamada de 15 minutos. Te enseñamos el panel en vivo,
            discutimos cómo encaja con tu operación y acordamos si tiene sentido.
            Sin pitch, sin presión.
          </p>
          <a
            href={demoHref()}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-stone-900 font-bold rounded-xl hover:bg-stone-100 transition-colors text-base"
          >
            <CalendarCheck size={20} weight="bold" />
            Agendar llamada
            <ArrowSquareOut size={16} />
          </a>
          <p className="text-white/30 text-xs mt-4">{DEMO_EMAIL}</p>
        </div>
      </section>
    </main>
  );
}
