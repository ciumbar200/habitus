import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/PageState";
import { useAuth } from "../context/AuthContext";
import {
  fetchMyVerification, startBasicVerification, startStripeIdentity,
  submitBasicVerification, type VerificationCheck,
} from "../lib/verification";

const inputClass = "w-full rounded-lg border border-border-light bg-white px-4 py-3 text-body-sm";

export function VerificationPage() {
  const { user, loading, refreshProfile } = useAuth();
  const [check, setCheck] = useState<VerificationCheck | null>(null);
  const [consent, setConsent] = useState(false);
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfieCode, setSelfieCode] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (user) fetchMyVerification().then(setCheck).catch(() => undefined); }, [user]);
  if (loading) return <main className="flex min-h-screen items-center justify-center"><LoadingState /></main>;
  if (!user) return <Navigate to="/access" replace />;

  const submitted = check && ["basic_manual_review", "basic_ai_reviewed", "basic_approved"].includes(check.status);
  const needsStripe = check?.status === "advanced_required" || check?.status === "stripe_failed";
  const stripeInProgress = check?.verification_type === "stripe_identity" && check.status === "stripe_pending";
  const stripeVerified = check?.status === "stripe_verified";

  async function beginBasic() {
    if (!consent) { setError("Debes aceptar el consentimiento para continuar."); return; }
    setBusy(true); setError(null);
    try { setCheck(await startBasicVerification()); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo iniciar la verificación."); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!check || !front || !selfie || !selfieCode) { setError("Completa el documento frontal, la selfie y la selfie con código."); return; }
    setBusy(true); setError(null);
    try {
      await submitBasicVerification(check.id, { documentFront: front, documentBack: back, selfie, selfieCode });
      setCheck(await fetchMyVerification());
      await refreshProfile();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo enviar la verificación."); }
    finally { setBusy(false); }
  }

  async function beginStripe() {
    setBusy(true); setError(null);
    try { await startStripeIdentity(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo iniciar Stripe Identity."); setBusy(false); }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-margin-mobile pb-20 pt-24 md:px-margin-desktop">
      <span className="text-label-md uppercase tracking-wider text-teal-accent">Confianza y seguridad</span>
      <h1 className="mt-2 text-display-md text-deep-navy">Verifica tu perfil</h1>
      <p className="mt-3 max-w-2xl text-body-lg text-warm-slate">Elige el nivel adecuado. La verificación básica siempre requiere revisión manual del equipo MoOn.</p>

      {error && <p className="mt-5 rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">{error}</p>}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-border-light bg-white p-6 card-shadow">
          <Icon name="shield" className="text-[30px] text-teal-accent" />
          <h2 className="mt-3 text-headline-md text-deep-navy">MoOn Basic Trust</h2>
          <p className="mt-2 text-body-sm text-warm-slate">Revisión básica de identidad para aumentar la confianza en MoOn. Un miembro del equipo revisará tu información antes de mostrar el badge.</p>
        </section>
        <section className="rounded-2xl border border-border-light bg-white p-6 card-shadow">
          <Icon name="verified_user" className="text-[30px] text-deep-navy" />
          <h2 className="mt-3 text-headline-md text-deep-navy">Verificación avanzada</h2>
          <p className="mt-2 text-body-sm text-warm-slate">Verificación profesional recomendada antes de firmar contrato, reservar habitación o publicar propiedades.</p>
          <button type="button" disabled={busy} onClick={beginStripe} className="mt-5 rounded-lg border border-deep-navy px-4 py-2.5 text-label-md text-deep-navy disabled:opacity-50">
            Iniciar con Stripe Identity
          </button>
          {needsStripe && <p className="mt-3 text-label-sm text-amber-700">Se requiere verificación avanzada para continuar con operaciones críticas.</p>}
        </section>
      </div>

      {stripeVerified ? (
        <section className="mt-8 rounded-2xl border border-teal-accent/30 bg-teal-accent/5 p-6">
          <h2 className="text-headline-md text-deep-navy">Identidad verificada</h2>
          <p className="mt-2 text-body-md text-warm-slate">Stripe ha confirmado la verificación profesional de tu identidad.</p>
        </section>
      ) : stripeInProgress ? (
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-headline-md text-deep-navy">Stripe Identity pendiente</h2>
          <p className="mt-2 text-body-md text-warm-slate">Completa la sesión de Stripe o espera a que se procese el resultado. El badge solo cambiará tras el webhook firmado.</p>
          <button type="button" disabled={busy} onClick={beginStripe} className="mt-4 rounded-lg border border-deep-navy px-4 py-2 text-label-md text-deep-navy">Reanudar verificación</button>
        </section>
      ) : needsStripe ? (
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-headline-md text-deep-navy">Verificación avanzada requerida</h2>
          <p className="mt-2 text-body-md text-warm-slate">Inicia o repite Stripe Identity para completar el nivel de confianza requerido.</p>
          <button type="button" disabled={busy} onClick={beginStripe} className="mt-4 rounded-lg bg-deep-navy px-5 py-3 text-label-md text-white disabled:opacity-50">Continuar con Stripe Identity</button>
        </section>
      ) : submitted ? (
        <section className="mt-8 rounded-2xl border border-teal-accent/30 bg-teal-accent/5 p-6">
          <h2 className="text-headline-md text-deep-navy">Verificación recibida</h2>
          <p className="mt-2 text-body-md text-warm-slate">Hemos recibido tu verificación. La revisaremos y te avisaremos cuando esté aprobada.</p>
        </section>
      ) : !check || check.status === "unverified" || check.status === "basic_rejected" ? (
        <section className="mt-8 rounded-2xl border border-border-light bg-white p-6">
          <h2 className="text-headline-md text-deep-navy">1. Consentimiento</h2>
          <label className="mt-4 flex items-start gap-3 text-body-sm text-warm-slate">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>Usaremos estas imágenes solo para revisar tu identidad básica dentro de MoOn. Podemos aplicar una pre-revisión automatizada opcional, pero la decisión final siempre la tomará una persona. No compartiremos tu documento con otros usuarios. Puedes solicitar el borrado según nuestra política de privacidad.</span>
          </label>
          <button type="button" disabled={busy || !consent} onClick={beginBasic} className="mt-5 rounded-lg bg-deep-navy px-5 py-3 text-label-md text-white disabled:opacity-50">Continuar</button>
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-border-light bg-white p-6">
          <h2 className="text-headline-md text-deep-navy">Completa MoOn Basic Trust</h2>
          <p className="mt-2 text-body-sm text-warm-slate">Escribe el código <strong className="text-deep-navy">{check.liveness_code}</strong> en un papel y sostenlo de forma visible en la última selfie.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FileField label="2. Documento frontal" required onChange={setFront} className={inputClass} />
            <FileField label="3. Documento trasero (opcional)" onChange={setBack} className={inputClass} />
            <FileField label="4. Selfie" required imagesOnly onChange={setSelfie} className={inputClass} />
            <FileField label={`5. Selfie sosteniendo el código ${check.liveness_code}`} required imagesOnly onChange={setSelfieCode} className={inputClass} />
          </div>
          <button type="button" disabled={busy} onClick={submit} className="mt-6 rounded-lg bg-deep-navy px-6 py-3 text-label-md text-white disabled:opacity-50">{busy ? "Enviando…" : "Enviar para revisión manual"}</button>
        </section>
      )}
    </main>
  );
}

function FileField({ label, required, imagesOnly, onChange, className }: { label: string; required?: boolean; imagesOnly?: boolean; onChange: (file: File | null) => void; className: string }) {
  return <label className="block text-label-md text-deep-navy">{label}{required && " *"}<input type="file" required={required} accept={imagesOnly ? "image/jpeg,image/png,image/webp" : "image/jpeg,image/png,image/webp,application/pdf"} onChange={(e) => onChange(e.target.files?.[0] ?? null)} className={`mt-2 ${className}`} /></label>;
}
