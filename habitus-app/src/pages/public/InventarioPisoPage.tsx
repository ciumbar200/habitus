import { usePageMeta } from "../../hooks/usePageMeta";
import { LeadMagnetPage } from "../../components/LeadMagnetPage";

type ChecklistSection = { title: string; items: string[] };

const SECTIONS: ChecklistSection[] = [
  {
    title: "Cocina",
    items: [
      "Nevera/congelador — funcionamiento, estado interior",
      "Lavavajillas — ciclo de prueba, filtros",
      "Microondas — funcionamiento",
      "Horno / vitrocerámica / gas — quemadores, termostato",
      "Extractor de humos — filtros, motor",
      "Fregadero — grifo, desagüe, sifón sin fugas",
      "Armarios de cocina — puertas, bisagras, estado interior",
      "Encimera — grietas, manchas permanentes",
    ],
  },
  {
    title: "Baño(s)",
    items: [
      "Ducha/bañera — grifo, presión, desagüe, rejilla",
      "Inodoro — cisterna, asiento, sin fugas en base",
      "Lavabo — grifo, desagüe, espejo",
      "Toallero, barra de ducha, cortina",
      "Armario/botiquín — estado, cerradura",
      "Ventilación o ventana — funciona correctamente",
      "Azulejos — grietas, juntas en mal estado",
    ],
  },
  {
    title: "Salón / comedor",
    items: [
      "Sofá — estructura, manchas, desgarros",
      "Mesa y sillas — estabilidad, estado",
      "Televisión y mando (si se incluye)",
      "Muebles de salón — puertas, cajones",
      "Suelo — arañazos, manchas, baldosas rotas",
      "Ventanas — apertura, cierre, persianas/estores",
      "Puntos de luz y enchufes — funcionan",
    ],
  },
  {
    title: "Habitaciones (por habitación)",
    items: [
      "Cama / estructura — tornillos, estado del somier",
      "Colchón — manchas, deformaciones (si se incluye)",
      "Armario — puertas, cajones, barras",
      "Escritorio y silla (si se incluye)",
      "Ventana — apertura, persiana, oscurecimiento",
      "Puerta — cerradura, llave propia",
      "Suelo y paredes — estado general",
      "Puntos de luz y enchufes",
    ],
  },
  {
    title: "Zonas comunes y extras",
    items: [
      "Caldera / calefacción — funciona, revisión vigente",
      "Aire acondicionado (si hay) — filtros, mando",
      "Lavadora — ciclo de prueba, sin fugas",
      "Tendedero / secadora (si hay)",
      "Trastero o almacén — acceso, estado",
      "Terraza / balcón — barandilla, suelo, desagüe",
      "Caja de fusibles — ubicación, etiquetado",
      "Contadores (agua, luz, gas) — lectura inicial anotada",
      "Llaves entregadas — número y tipo",
      "Buzón — número, llave",
    ],
  },
  {
    title: "Estado de paredes y suelos (todo el piso)",
    items: [
      "Pintura — manchas, desconchones, agujeros",
      "Rodapiés — estado",
      "Puertas interiores — funciona el cierre, sin golpes",
      "Interruptores y enchufes — todos funcionan",
      "Instalación eléctrica — sin cables sueltos visibles",
      "Instalación de agua — sin humedad en paredes",
    ],
  },
];

function CheckRow({ item, n }: { item: string; n: number }) {
  return (
    <tr className={n % 2 === 0 ? "bg-white" : "bg-stone-50"}>
      <td className="border border-stone-200 px-3 py-2 text-center text-stone-300">☐</td>
      <td className="border border-stone-200 px-3 py-2 text-sm text-stone-700">{item}</td>
      <td className="border border-stone-200 px-3 py-2 text-xs text-stone-300 min-w-[140px]">______________</td>
    </tr>
  );
}

export function InventarioPisoPage() {
  usePageMeta(
    "Plantilla de inventario para piso compartido | : moon",
    "Checklist completo para el inventario de entrada y salida de un piso compartido. Descarga gratis y evita conflictos con la fianza.",
    "/recursos/inventario-piso",
  );

  return (
    <LeadMagnetPage
      title="Inventario del piso"
      description="Checklist completo de entrada/salida. Documenta el estado de cada habitación para proteger tu fianza y evitar conflictos."
      badge="Plantilla gratuita · moon"
    >
      <div className="print:prose-print">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-teal-500" />
          <span className="font-bold text-stone-800 text-lg">: moon</span>
        </div>
        <h1 className="text-xl font-bold text-stone-900 mt-3 mb-1">INVENTARIO DEL PISO COMPARTIDO</h1>
        <p className="text-xs text-stone-400 mb-6 italic">
          Rellena en el momento de entrada (y repite en la salida). Adjunta fotos fechadas a cada sección.
          Guarda una copia firmada por todos los convivientes y por el propietario/anfitrión.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Dirección</p>
            <p className="border-b border-stone-300 pb-1 text-teal-600">[______________________]</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Fecha de inventario</p>
            <p className="border-b border-stone-300 pb-1 text-teal-600">[___ / ___ / ______]</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Convivientes presentes</p>
            <p className="border-b border-stone-300 pb-1 text-teal-600">[______________________]</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Anfitrión / propietario</p>
            <p className="border-b border-stone-300 pb-1 text-teal-600">[______________________]</p>
          </div>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-6 break-inside-avoid">
            <h2 className="text-sm font-bold text-stone-900 bg-stone-100 px-3 py-2 rounded-t-lg mb-0">
              {section.title}
            </h2>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50">
                  <th className="border border-stone-200 px-3 py-1.5 w-8 text-center text-stone-400">✓</th>
                  <th className="border border-stone-200 px-3 py-1.5 text-left text-stone-600">Elemento</th>
                  <th className="border border-stone-200 px-3 py-1.5 text-left text-stone-600">Observaciones / estado</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item, i) => (
                  <CheckRow key={item} item={item} n={i} />
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="mt-8 pt-4 border-t border-stone-200">
          <h2 className="text-sm font-bold text-stone-900 mb-3">Firmas de conformidad</h2>
          <div className="grid grid-cols-2 gap-6">
            {["Conviviente 1", "Conviviente 2", "Conviviente 3", "Anfitrión / Propietario"].map((label) => (
              <div key={label} className="text-xs">
                <p className="text-stone-500 mb-1">{label}</p>
                <div className="border-b border-stone-300 h-8 mb-1" />
                <p className="text-stone-400">Firma y fecha</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-100 text-xs text-stone-400">
          moonsharedliving.com · Inventario de entrada/salida · moon shared living
        </div>
      </div>
    </LeadMagnetPage>
  );
}
