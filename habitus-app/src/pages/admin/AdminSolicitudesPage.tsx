import { es } from "@habitus/core";

export function AdminSolicitudesPage() {
  return (
    <div>
      <h1 className="text-headline-lg text-deep-navy">{es.admin.applicationsTitle}</h1>
      <p className="mt-2 text-body-lg text-warm-slate">{es.admin.applicationsSubtitle}</p>
      <div className="mt-8 rounded-xl border border-dashed border-border-light p-12 text-center text-warm-slate">
        Próximamente — pipeline de solicitudes con cambio de estado.
      </div>
    </div>
  );
}
