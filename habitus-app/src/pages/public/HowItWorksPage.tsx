import { Link } from "react-router-dom";
import { es } from "@habitus/core";
import { Icon } from "../../components/Icon";

export function HowItWorksPage() {
  const pillars = [
    { title: es.public.pillar1Title, text: es.public.pillar1Text },
    { title: es.public.pillar2Title, text: es.public.pillar2Text },
    { title: es.public.pillar3Title, text: es.public.pillar3Text },
  ];

  return (
    <main className="mx-auto max-w-3xl px-margin-mobile pb-20 pt-28 md:px-margin-desktop">
      <h1 className="text-headline-lg text-deep-navy">{es.public.howItWorksTitle}</h1>
      <p className="mt-4 text-body-lg text-warm-slate">{es.public.howItWorksIntro}</p>

      <section className="mt-10 rounded-xl border border-border-light bg-surface-container-low p-6">
        <h2 className="text-headline-md text-deep-navy">{es.public.groupsTitle}</h2>
        <p className="mt-2 text-body-md text-warm-slate">{es.public.groupsIntro}</p>
        <ul className="mt-4 space-y-2">
          {[es.public.groupsStep1, es.public.groupsStep2, es.public.groupsStep3].map((s) => (
            <li key={s} className="flex gap-2 text-body-sm text-warm-slate">
              <Icon name="check" className="text-teal-accent" />
              {s}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 space-y-8">
        {pillars.map((p) => (
          <section key={p.title}>
            <h2 className="text-headline-md text-deep-navy">{p.title}</h2>
            <p className="mt-2 text-body-md text-warm-slate">{p.text}</p>
          </section>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-headline-md text-deep-navy">{es.public.audiencesTitle}</h2>
        <ul className="mt-4 space-y-2">
          {es.public.audiences.map((a) => (
            <li key={a} className="text-body-md text-warm-slate">
              · {a}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-label-sm text-warm-slate">{es.public.notInsurance}</p>
      <Link
        to="/access"
        className="mt-8 inline-block rounded-lg bg-deep-navy px-6 py-3 text-label-md text-white"
      >
        {es.public.ctaStartFree}
      </Link>
    </main>
  );
}
