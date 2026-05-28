import { Check, Shield, Users, Camera } from "@phosphor-icons/react";
import { useI18n } from "../../lib/I18nContext";

/**
 * Spacest-style verification section: highlights trust signals prominently
 * Shows verification process: visit → photos → guarantee
 */
export function VerificationSection() {
  const t = useI18n();
  const copy = t.public.verificationSection;
  const steps = [
    {
      icon: Camera,
      ...copy.steps[0],
    },
    {
      icon: Shield,
      ...copy.steps[1],
    },
    {
      icon: Users,
      ...copy.steps[2],
    },
    {
      icon: Check,
      ...copy.steps[3],
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 mb-4">
            <Shield className="text-emerald-600" size={18} weight="fill" />
            <span className="text-sm font-semibold text-emerald-800">{copy.badge}</span>
          </div>
          <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-4 text-lg text-stone-600">
            {copy.subtitle}
          </p>
        </div>

        {/* Verification Stats */}
        <div className="grid grid-cols-2 gap-4 mb-12 sm:grid-cols-4">
          {copy.stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{stat.value}</p>
              <p className="mt-1 text-sm text-stone-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Verification Steps */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              {/* Step number */}
              <div className="absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {i + 1}
              </div>

              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100">
                <step.icon size={28} className="text-emerald-600" weight="duotone" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-stone-900 mb-2">{step.title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{step.description}</p>

              {/* Checkmark */}
              <div className="mt-4 flex items-center gap-2 text-emerald-600">
                <Check size={16} weight="bold" />
                <span className="text-xs font-medium">{copy.verified}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-stone-500 mb-4">
            {copy.ownerHint}
          </p>
          <a
            href="/propietarios"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-lg"
          >
            {copy.ownerCta}
            <Check size={18} weight="bold" />
          </a>
        </div>
      </div>
    </section>
  );
}
