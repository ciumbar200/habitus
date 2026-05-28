import { Link } from "react-router-dom";
import { useI18n } from "../../lib/I18nContext";

export function DocumentationPage() {
  const t = useI18n();

  return (
    <main className="min-h-screen bg-stone-50 pt-24">
      <section className="mx-auto max-w-7xl px-margin-mobile pb-16 md:px-margin-desktop">
        <p className="section-eyebrow">{t.public.documentation}</p>
        <h1 className="section-title">{t.public.documentation}</h1>
        <p className="mt-4 max-w-3xl text-body-lg text-warm-slate">
          Documentación práctica para operadores y desarrolladores que quieren conectar inventario,
          automatizar importaciones y preparar integraciones externas con MOON.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-margin-mobile pb-16 md:grid-cols-2 md:px-margin-desktop">
        <article className="rounded-xl border border-border-light bg-white p-6 card-shadow">
          <h2 className="text-headline-md text-deep-navy">API para developers</h2>
          <p className="mt-2 text-body-md text-warm-slate">
            Cada operador puede generar claves desde su perfil. La clave se muestra una sola vez y sirve
            como credencial técnica para importaciones, sincronizaciones y futuros endpoints de operador.
          </p>
          <div className="mt-4 space-y-3 text-body-sm text-warm-slate">
            <p>
              1. Crea una clave en tu perfil de operador.
            </p>
            <p>
              2. Guarda el secreto fuera del navegador y úsalo en tus automatizaciones.
            </p>
            <p>
              3. Revoca la clave cuando dejes de usarla.
            </p>
          </div>
        </article>

        <article className="rounded-xl border border-border-light bg-white p-6 card-shadow">
          <h2 className="text-headline-md text-deep-navy">Autenticación</h2>
          <p className="mt-2 text-body-md text-warm-slate">
            El panel usa sesión Supabase para gestionar las claves. El endpoint actual de claves es
            <code className="mx-1 rounded bg-stone-100 px-1.5 py-0.5">/api/operator/api-keys</code>.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-stone-900 p-4 text-sm text-stone-100">
{`curl -X POST http://127.0.0.1:5173/api/operator/api-keys \\
  -H "Authorization: Bearer <supabase_session_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"label":"Importaciones Moon"}'`}
          </pre>
        </article>

        <article className="rounded-xl border border-border-light bg-white p-6 card-shadow">
          <h2 className="text-headline-md text-deep-navy">Permisos</h2>
          <ul className="mt-2 space-y-2 text-body-md text-warm-slate">
            <li>Leer inventario</li>
            <li>Crear y actualizar inventario</li>
            <li>Consultar solicitudes</li>
          </ul>
        </article>

        <article className="rounded-xl border border-border-light bg-white p-6 card-shadow">
          <h2 className="text-headline-md text-deep-navy">Siguientes pasos</h2>
          <p className="mt-2 text-body-md text-warm-slate">
            Esta base ya permite gestionar credenciales. El siguiente paso natural es publicar endpoints
            de operador para importaciones y consulta de inventario usando estas claves.
          </p>
          <Link
            to="/profile"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-deep-navy px-5 py-3 text-label-md text-white"
          >
            Ir al perfil
          </Link>
        </article>
      </section>
    </main>
  );
}
