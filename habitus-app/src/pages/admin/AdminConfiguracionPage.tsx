import { es } from "@habitus/core";

export function AdminConfiguracionPage() {
  return (
    <div>
      <h1 className="text-headline-lg text-deep-navy">{es.admin.configTitle}</h1>
      <p className="mt-2 text-body-lg text-warm-slate">{es.admin.configSubtitle}</p>
      <div className="mt-8 rounded-xl border border-dashed border-border-light p-12 text-center text-warm-slate">
        Próximamente — feature flags y parámetros de plataforma.
      </div>
    </div>
  );
}
