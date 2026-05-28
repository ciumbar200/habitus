import { es } from "@habitus/core";

export function AdminGruposPage() {
  return (
    <div>
      <h1 className="text-headline-lg text-deep-navy">{es.admin.groupsTitle}</h1>
      <p className="mt-2 text-body-lg text-warm-slate">{es.admin.groupsSubtitle}</p>
      <div className="mt-8 rounded-xl border border-dashed border-border-light p-12 text-center text-warm-slate">
        Próximamente — moderación y gestión de grupos de convivencia.
      </div>
    </div>
  );
}
