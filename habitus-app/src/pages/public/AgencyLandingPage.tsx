import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Buildings,
  ChartLineUp,
  CheckCircle,
  Shield,
  Users,
  UserCircle,
} from "@phosphor-icons/react";
import { accessSignupUrl, howItWorksUrl } from "../../lib/accessLinks";
import { AGENCY_HERO_IMAGE } from "../../lib/brandAssets";
import { MarketingPhotoHero } from "../../components/public/MarketingPhotoHero";
import { useI18n } from "../../lib/I18nContext";

export function AgencyLandingPage() {
  const t = useI18n();
  const al = t.public.agencyLanding;

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-stone-100 to-white">
      <MarketingPhotoHero
        image={AGENCY_HERO_IMAGE}
        badge={al.badge}
        title={
          <>
            <span className="block">{al.heroLine1}</span>
            <span className="hero-display-accent block">{al.heroLine2}</span>
          </>
        }
        subtitle={
          <>
            {al.heroSubtitle}
            <span className="mt-2 block text-stone-300">{al.heroAudience}</span>
          </>
        }
        stats={[
          { value: al.stat3Value, label: al.stat1 },
          { value: al.stat4Value, label: al.stat2 },
          { value: "24/7", label: al.stat3 },
        ]}
        actions={
          <>
            <Link
              to={accessSignupUrl("agencia")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-medium text-stone-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-stone-100"
            >
              {al.ctaMain}
              <ArrowRight weight="bold" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={howItWorksUrl("agencia")}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              {al.ctaSecondary}
            </Link>
            <Link
              to="/propietarios"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              {t.public.owners}
            </Link>
          </>
        }
      />

      <section className="bg-white py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-20 max-w-3xl text-center">
            <p className="section-eyebrow">{al.benefitsTitle}</p>
            <h2 className="section-title">{al.benefitsSubtitle}</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                icon: Buildings,
                title: al.benefit1Title,
                desc: al.benefit1Text,
                color: "text-stone-700",
                bg: "bg-stone-100",
              },
              {
                icon: UserCircle,
                title: al.benefit2Title,
                desc: al.benefit2Text,
                color: "text-emerald-700",
                bg: "bg-emerald-100",
              },
              {
                icon: CheckCircle,
                title: al.benefit3Title,
                desc: al.benefit3Text,
                color: "text-amber-700",
                bg: "bg-amber-100",
              },
              {
                icon: ChartLineUp,
                title: al.benefit4Title,
                desc: al.benefit4Text,
                color: "text-blue-700",
                bg: "bg-blue-100",
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="group flex items-center gap-6 rounded-2xl bg-stone-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg"
              >
                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ${benefit.bg} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <benefit.icon size={40} weight="thin" className={benefit.color} />
                </div>
                <div className="flex-1">
                  <h3 className="card-title mb-2">{benefit.title}</h3>
                  <p className="leading-relaxed text-stone-600">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="section-eyebrow">{al.processTitle}</p>
            <h2 className="section-title">{al.processSubtitle}</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              { num: "01", title: al.step1Title, desc: al.step1Text, icon: Briefcase },
              { num: "02", title: al.step2Title, desc: al.step2Text, icon: Buildings },
              { num: "03", title: al.step3Title, desc: al.step3Text, icon: Users },
              { num: "04", title: al.step4Title, desc: al.step4Text, icon: Shield },
            ].map((step) => (
              <div key={step.num} className="group text-center">
                <div className="relative mb-4 inline-block">
                  <span className="step-number group-hover:text-stone-300 transition-colors">
                    {step.num}
                  </span>
                  <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">
                    <step.icon size={20} weight="bold" className="text-stone-700" />
                  </div>
                </div>
                <h3 className="card-title mb-2">{step.title}</h3>
                <p className="text-sm text-stone-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-stone-900 py-32 text-white">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-96 w-96 animate-float rounded-full bg-terracotta/20 blur-3xl" />
          <div
            className="absolute bottom-0 left-0 h-96 w-96 animate-float rounded-full bg-emerald-500/10 blur-3xl"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="section-title-light lg:text-5xl xl:text-[3.25rem] mb-6">
            {al.finalCtaTitle},
            <br />
            {al.finalCtaSubtitle}
          </h2>
          <p className="mb-10 text-lg text-stone-400 sm:text-xl">
            {al.finalCtaText}
          </p>
          <Link
            to={accessSignupUrl("agencia")}
            className="group inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-lg font-medium text-stone-900 shadow-xl transition-all hover:-translate-y-1 hover:bg-stone-100 hover:shadow-2xl"
          >
            {al.finalCtaButton}
            <ArrowRight weight="bold" className="h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </main>
  );
}
