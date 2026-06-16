import { useState } from "react";
import { ArrowRight, DownloadSimple, Lock } from "@phosphor-icons/react";
import { accessSignupUrl } from "../lib/accessLinks";

const GATE_KEY = "moon_lead_email";

interface Props {
  title: string;
  description: string;
  badge: string;
  children: React.ReactNode;
}

export function LeadMagnetPage({ title, description, badge, children }: Props) {
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(() => {
    try { return !!localStorage.getItem(GATE_KEY); } catch { return false; }
  });

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    try { localStorage.setItem(GATE_KEY, email); } catch {}
    setUnlocked(true);
    // Also feeds the signup funnel
    fetch(`${accessSignupUrl("inquilino")}&email=${encodeURIComponent(email)}`, {
      method: "HEAD", mode: "no-cors",
    }).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Print-only header */}
      <div className="hidden print:block mb-8">
        <p className="text-xs text-stone-400">moonsharedliving.com · {badge}</p>
        <h1 className="text-2xl font-bold text-stone-900 mt-1">{title}</h1>
      </div>

      {/* Screen header */}
      <div className="print:hidden bg-stone-950 text-white py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs font-semibold tracking-widest text-white/50 uppercase">{badge}</span>
          <h1 className="text-3xl font-bold mt-2 mb-2">{title}</h1>
          <p className="text-white/60">{description}</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {unlocked ? (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white font-semibold rounded-xl hover:bg-stone-700 transition-colors text-sm"
            >
              <DownloadSimple size={16} weight="bold" />
              Guardar como PDF / Imprimir
            </button>
          ) : (
            <form onSubmit={handleUnlock} className="flex items-center gap-2 w-full max-w-md">
              <Lock size={14} className="text-stone-400 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com para desbloquear"
                className="flex-1 text-sm px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-600"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white font-semibold rounded-lg text-sm hover:bg-stone-700 transition-colors shrink-0"
              >
                Descargar <ArrowRight size={13} weight="bold" />
              </button>
            </form>
          )}
          <span className="text-xs text-stone-400 hidden sm:block shrink-0">Gratis · moon</span>
        </div>
      </div>

      {/* Document */}
      <div className="max-w-2xl mx-auto px-4 py-8 print:px-0 print:py-0">
        <div className={`bg-white rounded-2xl shadow-sm border border-stone-100 p-8 print:shadow-none print:border-0 print:p-0 transition-all duration-300 ${!unlocked ? "blur-[2px] select-none pointer-events-none" : ""}`}>
          {children}
        </div>

        {!unlocked && (
          <div className="absolute inset-x-0 flex justify-center" style={{ top: "60%" }}>
            <div className="bg-stone-900 text-white rounded-2xl px-8 py-5 text-center shadow-xl max-w-sm mx-4">
              <Lock size={24} className="mx-auto mb-2 text-white/70" />
              <p className="font-semibold">Introduce tu email para ver el documento completo</p>
              <p className="text-white/50 text-xs mt-1">Sin spam. Gratis siempre.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {unlocked && (
        <div className="print:hidden bg-white border-t border-stone-100 py-8 px-4 mt-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-stone-600 text-sm mb-3">
              Gestiona gastos, incidencias y el acuerdo de tu piso con : moon
            </p>
            <a
              href={accessSignupUrl("inquilino")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white font-semibold rounded-xl text-sm hover:bg-stone-700 transition-colors"
            >
              Crear mi piso en moon <ArrowRight size={14} weight="bold" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
