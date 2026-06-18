import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";

export function ContractsHubPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const role = profile?.accountRole;

  return (
    <main className="mx-auto max-w-7xl px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
      <section className="mb-stack-lg">
        <span className="text-label-md uppercase tracking-wider text-teal-accent">Contratos</span>
        <h1 className="text-headline-lg text-deep-navy">Hub de contratos</h1>
        <p className="mt-2 max-w-2xl text-body-lg text-warm-slate">
          Acceso directo a contratos de habitación y de piso para el rol {role ?? "activo"}.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate("/panel/anfitriones/contratos")}
          className="rounded-xl border border-border-light bg-surface-container-lowest p-6 text-left card-shadow hover:shadow-md"
        >
          <p className="text-label-md uppercase tracking-wider text-teal-accent">Contratos habitación</p>
          <p className="mt-2 text-body-sm text-warm-slate">
            Gestión de contratos anfitrión-inquilino, firma y PDF.
          </p>
          <p className="mt-4 text-label-md text-deep-navy">Abrir lista de contratos</p>
        </button>

        <button
          type="button"
          onClick={() => navigate("/panel/propietarios/contratos")}
          className="rounded-xl border border-border-light bg-surface-container-lowest p-6 text-left card-shadow hover:shadow-md"
        >
          <p className="text-label-md uppercase tracking-wider text-teal-accent">Contratos piso</p>
          <p className="mt-2 text-body-sm text-warm-slate">
            Contratos propietario-grupo, aceptaciones y seguimiento.
          </p>
          <p className="mt-4 text-label-md text-deep-navy">Abrir lista de contratos</p>
        </button>
      </div>

      <div className="mt-stack-lg flex flex-wrap gap-3">
        <Link
          to="/panel/anfitriones/contratos/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-deep-navy px-6 py-3 text-label-md text-white"
        >
          <Icon name="add" />
          Nuevo contrato habitación
        </Link>
        <Link
          to="/panel/propietarios/contratos/nuevo"
          className="inline-flex items-center gap-2 rounded-lg border border-border-light px-6 py-3 text-label-md text-deep-navy hover:bg-surface-container"
        >
          <Icon name="add" />
          Nuevo contrato piso
        </Link>
      </div>
    </main>
  );
}
