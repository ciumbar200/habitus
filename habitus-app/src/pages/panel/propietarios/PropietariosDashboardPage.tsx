import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../../../components/Icon";
import { PublishListingModal } from "../../../components/panel/PublishListingModal";
import { useAuth } from "../../../context/AuthContext";

export function PropietariosDashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <section className="mb-stack-lg">
        <h2 className="text-label-md uppercase tracking-wider text-teal-accent">Panel de propietarios</h2>
        <h1 className="text-headline-lg text-deep-navy">Ingresos, contratos y presupuesto</h1>
        <p className="mt-2 max-w-2xl text-body-lg text-warm-slate">
          Acceso rápido a ingresos, contratos, publicaciones y control de gastos del piso.
        </p>
      </section>

      <div className="mb-stack-lg grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => navigate("/panel/propietarios/ingresos")}
          className="rounded-xl border border-border-light bg-surface-container-lowest p-6 text-left card-shadow hover:shadow-md"
        >
          <p className="text-label-md uppercase tracking-wider text-teal-accent">Ingresos</p>
          <p className="mt-2 text-body-sm text-warm-slate">Métricas, proyección y rentas pendientes.</p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/panel/propietarios/contratos")}
          className="rounded-xl border border-border-light bg-surface-container-lowest p-6 text-left card-shadow hover:shadow-md"
        >
          <p className="text-label-md uppercase tracking-wider text-teal-accent">Contratos</p>
          <p className="mt-2 text-body-sm text-warm-slate">Pisos, grupos y estado de firma.</p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/panel/propietarios/ingresos")}
          className="rounded-xl border border-border-light bg-surface-container-lowest p-6 text-left card-shadow hover:shadow-md"
        >
          <p className="text-label-md uppercase tracking-wider text-teal-accent">Presupuesto</p>
          <p className="mt-2 text-body-sm text-warm-slate">Gastos, mensualización y margen neto.</p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/panel/espacios")}
          className="rounded-xl border border-border-light bg-surface-container-lowest p-6 text-left card-shadow hover:shadow-md"
        >
          <p className="text-label-md uppercase tracking-wider text-teal-accent">Publicaciones</p>
          <p className="mt-2 text-body-sm text-warm-slate">Gestión de anuncios y visibilidad.</p>
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setPublishOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-6 py-3 text-label-md text-white"
        >
          <Icon name="add" />
          Publicar piso
        </button>
        <Link
          to="/panel/propietarios/ingresos"
          className="inline-flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy hover:bg-surface-container"
        >
          <Icon name="payments" />
          Ver ingresos
        </Link>
        <Link
          to="/panel/propietarios/contratos"
          className="inline-flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy hover:bg-surface-container"
        >
          <Icon name="assignment" />
          Ver contratos
        </Link>
      </div>

      <div className="mt-stack-lg rounded-xl border border-border-light bg-surface-container-lowest p-6 card-shadow">
        <p className="text-body-md text-warm-slate">
          {profile?.displayName ? `${profile.displayName}, ` : ""}usa este panel como entrada directa al flujo de propietario.
        </p>
      </div>

      <PublishListingModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublished={() => {
          // El modal ya redirige según el estado del anuncio.
        }}
      />
    </main>
  );
}
