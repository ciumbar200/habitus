import { Link } from "react-router-dom";
import { es } from "@habitus/core";

const UPDATED = "21 de mayo de 2026";

type LegalPageProps = {
  kind: "privacy" | "terms" | "notice";
};

const CONTENT: Record<LegalPageProps["kind"], { title: string; sections: { h: string; p: string }[] }> =
  {
    privacy: {
      title: es.legal.privacy,
      sections: [
        {
          h: "Responsable del tratamiento",
          p: ": moon shared living es responsable del tratamiento de tus datos personales conforme al RGPD y la LOPDGDD.",
        },
        {
          h: "Datos que recogemos",
          p: "Identificación (nombre, email), perfil de convivencia, mensajes, solicitudes de alquiler, datos de grupos y gastos compartidos del piso.",
        },
        {
          h: "Finalidad",
          p: "Gestionar tu cuenta, emparejar inquilinos compatibles, facilitar solicitudes y contratos, y mejorar el servicio.",
        },
        {
          h: "Conservación",
          p: "Conservamos los datos mientras mantengas tu cuenta activa y el tiempo necesario para obligaciones legales.",
        },
        {
          h: "Tus derechos",
          p: "Puedes acceder, rectificar, suprimir y oponerte al tratamiento escribiendo a privacidad@moonsharedliving.com.",
        },
      ],
    },
    terms: {
      title: es.legal.terms,
      sections: [
        {
          h: "Objeto",
          p: ": moon shared living es una plataforma tecnológica de matching para vivienda compartida y coliving. No prestamos intermediación inmobiliaria tradicional salvo acuerdo expreso.",
        },
        {
          h: "Uso de la plataforma",
          p: "Debes proporcionar información veraz, respetar a otros usuarios y usar la app conforme a la ley y las normas de convivencia.",
        },
        {
          h: "Grupos y gastos",
          p: "El gestor de gastos del piso es informativo. Los pagos entre convivientes se realizan fuera de la plataforma salvo futuras integraciones.",
        },
        {
          h: "Contratos",
          p: "Los contratos de alquiler se generan entre las partes. : moon facilita la firma digital cuando esté disponible.",
        },
        {
          h: "Limitación de responsabilidad",
          p: "No garantizamos la disponibilidad continua del servicio durante la fase beta.",
        },
      ],
    },
    notice: {
      title: es.legal.notice,
      sections: [
        {
          h: "Titular",
          p: ": moon shared living — plataforma de prop tech para convivencia compartida en España.",
        },
        {
          h: "Contacto",
          p: "info@moonsharedliving.com",
        },
        {
          h: "Marco legal",
          p: "LSSI-CE, RGPD y normativa de alquiler de vivienda (LAU) aplicable en España.",
        },
      ],
    },
  };

export function LegalPage({ kind }: LegalPageProps) {
  const doc = CONTENT[kind];

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-28">
      <Link to="/" className="text-label-md text-teal-accent hover:underline">
        ← Inicio
      </Link>
      <h1 className="mt-6 text-headline-lg text-deep-navy">{doc.title}</h1>
      <p className="mt-2 text-body-sm text-warm-slate">
        {es.legal.updated}: {UPDATED}
      </p>
      <div className="prose prose-stone mt-10 max-w-none space-y-8">
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-headline-md text-deep-navy">{s.h}</h2>
            <p className="mt-2 text-body-md text-warm-slate">{s.p}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
