import { usePageMeta } from "../../hooks/usePageMeta";
import { LeadMagnetPage } from "../../components/LeadMagnetPage";

function Field({ children }: { children: string }) {
  return <span className="text-teal-600 font-semibold">[{children}]</span>;
}

function Heading2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-stone-900 mt-7 mb-2 pb-1 border-b border-stone-100">{children}</h2>;
}

export function AcuerdoConvivenciaPage() {
  usePageMeta(
    "Plantilla de Acuerdo de Convivencia para pisos compartidos | : moon",
    "Descarga gratis el acuerdo de convivencia de moon: gastos, normas, incidencias y aceptación digital. Listo para imprimir o firmar en moon.",
    "/recursos/acuerdo-convivencia",
  );

  return (
    <LeadMagnetPage
      title="Acuerdo de Convivencia"
      description="Plantilla completa para regular gastos, normas, incidencias y salida de convivientes. Rellena los campos y firma en moon."
      badge="Plantilla gratuita · moon"
    >
      <div className="prose prose-stone prose-sm max-w-none print:prose-print">
        <div className="not-prose mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-teal-500" />
            <span className="font-bold text-stone-800 text-lg">: moon</span>
          </div>
          <p className="text-xs text-stone-400 italic">
            Plantilla orientativa entre convivientes. No es contrato de arrendamiento ni asesoría legal.
            Rellena los campos <span className="text-teal-600">[...]</span> y aceptad en moon (equivale a firma digital).
          </p>
        </div>

        <h1 className="not-prose text-xl font-bold text-stone-900 mb-6">ACUERDO DE CONVIVENCIA</h1>

        <Heading2>1. Partes y vivienda</Heading2>
        <ul className="text-sm text-stone-700 space-y-1">
          <li><strong>Vivienda:</strong> <Field>dirección completa, piso, puerta</Field>, <Field>barrio</Field>, <Field>ciudad</Field>.</li>
          <li><strong>Contrato principal:</strong> a nombre de <Field>titular</Field>, duración <Field>…</Field>. Este acuerdo se extingue con el contrato.</li>
        </ul>
        <div className="not-prose overflow-x-auto mt-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50">
                <th className="border border-stone-200 px-3 py-2 text-left font-semibold">Nombre</th>
                <th className="border border-stone-200 px-3 py-2 text-left font-semibold">DNI/NIE</th>
                <th className="border border-stone-200 px-3 py-2 text-left font-semibold">Habitación</th>
                <th className="border border-stone-200 px-3 py-2 text-left font-semibold">Rol</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((n) => (
                <tr key={n}>
                  <td className="border border-stone-200 px-3 py-2 text-teal-600">[Nombre {n}]</td>
                  <td className="border border-stone-200 px-3 py-2 text-teal-600">[…]</td>
                  <td className="border border-stone-200 px-3 py-2 text-teal-600">[Hab. {n}]</td>
                  <td className="border border-stone-200 px-3 py-2 text-teal-600">{n === 1 ? "Lead" : "Miembro"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Heading2>2. Duración y entrada/salida</Heading2>
        <ul className="text-sm text-stone-700 space-y-1">
          <li><strong>Vigencia:</strong> desde <Field>fecha</Field> hasta finalización del contrato principal.</li>
          <li><strong>Preaviso de salida:</strong> <Field>30</Field> días mínimos. El conviviente que sale participa en la liquidación final de moon Gastos.</li>
          <li><strong>Nuevo conviviente:</strong> requiere acuerdo de la mayoría, perfil moon verificado y aceptación de este acuerdo.</li>
        </ul>

        <Heading2>3. Reparto de gastos (moon Gastos)</Heading2>
        <ul className="text-sm text-stone-700 space-y-1">
          <li><strong>Alquiler:</strong> método acordado <Field>equal / proportional / custom</Field>. Se registra en moon Gastos.</li>
          <li><strong>Suministros</strong> (luz, agua, gas, internet): a partes iguales, pagados por <Field>quién</Field> y repartidos automáticamente.</li>
          <li><strong>Comunes</strong> (limpieza, papel): a partes iguales; bote común de <Field>X</Field> €/mes.</li>
          <li><strong>Privados</strong> (comida personal): cada uno lo suyo.</li>
          <li><strong>Liquidación:</strong> al final de cada mes con <code className="text-xs bg-stone-100 px-1 rounded">computeSuggestedTransfers</code>. Nadie debe dinero a nadie al cerrar el mes.</li>
        </ul>

        <Heading2>4. Normas de convivencia</Heading2>
        <ul className="text-sm text-stone-700 space-y-1">
          <li><strong>Limpieza:</strong> rotación semanal de zonas comunes (cocina, baño, salón, basura).</li>
          <li><strong>Ruido:</strong> silencio relativo de <Field>23:00</Field> a <Field>08:00</Field>. Fiestas con aviso <Field>24</Field> h y acuerdo.</li>
          <li><strong>Visitas:</strong> estancias &lt;<Field>3</Field> noches OK con aviso. Más días: avisar al grupo.</li>
          <li><strong>Mascotas:</strong> <Field>permitidas / no</Field>. El dueño responde de daños y limpieza.</li>
          <li><strong>Fumar:</strong> <Field>no dentro del piso</Field>.</li>
        </ul>

        <Heading2>5. Mantenimiento e incidencias</Heading2>
        <ul className="text-sm text-stone-700 space-y-1">
          <li>Cualquier avería se reporta en el grupo de moon con el botón <strong>"Reportar incidencia"</strong>.</li>
          <li><strong>Urgencias</strong> (gas, agua, eléctrica): llamar al <Field>112 / compañía</Field>, luego reportar en moon.</li>
          <li><strong>Reparaciones &lt;<Field>50</Field> €:</strong> las decide el grupo, repartidas en moon Gastos.</li>
          <li><strong>Reparaciones mayores:</strong> responsabilidad del titular. El lead contacta con pruebas del historial de incidencias.</li>
          <li><em>Un historial limpio alimenta el Moon Score del grupo.</em></li>
        </ul>

        <Heading2>6. Privacidad y resolución de conflictos</Heading2>
        <ul className="text-sm text-stone-700 space-y-1">
          <li>Cero tolerancia a comportamientos discriminatorios o acosadores.</li>
          <li>Escalado: (1) hablar directamente → (2) reunión de grupo con el lead → (3) mediación externa.</li>
          <li>El Moon Score y el historial de incidencias son referencias objetivas, no verdades absolutas.</li>
        </ul>

        <Heading2>7. Fin del acuerdo y endoso</Heading2>
        <p className="text-sm text-stone-700">
          Al terminar la convivencia: liquidación final en moon Gastos, inventario de la habitación, y —si fue buena— <strong>endoso mutuo en moon</strong> (alimenta el Moon Score portable de cada uno para su próximo piso).
        </p>

        <Heading2>Aceptación</Heading2>
        <p className="text-xs text-stone-500 mb-3">La aceptación digital en moon equivale a firma. Cada conviviente confirma haber leído este acuerdo.</p>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50">
                <th className="border border-stone-200 px-3 py-2 text-left font-semibold">Conviviente</th>
                <th className="border border-stone-200 px-3 py-2 text-left font-semibold">Fecha</th>
                <th className="border border-stone-200 px-3 py-2 text-left font-semibold">Aceptación</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((n) => (
                <tr key={n}>
                  <td className="border border-stone-200 px-3 py-2 text-teal-600">[Nombre {n}]</td>
                  <td className="border border-stone-200 px-3 py-2 text-teal-600">[fecha]</td>
                  <td className="border border-stone-200 px-3 py-2 text-stone-400">✓ pendiente</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="not-prose mt-8 pt-4 border-t border-stone-100 text-xs text-stone-400">
          moonsharedliving.com · Plantilla de Acuerdo de Convivencia · moon shared living
        </div>
      </div>
    </LeadMagnetPage>
  );
}
