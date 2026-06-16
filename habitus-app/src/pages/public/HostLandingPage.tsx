import { Link } from "react-router-dom";
import { accessSignupUrl, howItWorksUrl } from "../../lib/accessLinks";
import { HOST_HERO_IMAGE } from "../../lib/brandAssets";
import { MarketingPhotoHero } from "../../components/public/MarketingPhotoHero";
import { ArrowRight, CheckCircle, Users, Shield, ChatCircle, House, User } from "@phosphor-icons/react";
import { useI18n } from "../../lib/I18nContext";
import { usePageMeta } from "../../hooks/usePageMeta";

export function HostLandingPage() {
  const t = useI18n();
  usePageMeta(t.public.meta.hostsTitle, t.public.meta.hostsDescription, "/anfitriones");
  const hl = t.public.hostLanding;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white overflow-x-hidden">
      <MarketingPhotoHero
        image={HOST_HERO_IMAGE}
        badge={hl.badge}
        title={
          <>
            <span className="block">{hl.heroLine1}</span>
            <span className="hero-display-accent block">{hl.heroLine2}</span>
          </>
        }
        subtitle={
          <>
            {hl.heroSubtitle}
            <span className="mt-2 block text-stone-300">{hl.heroAudience}</span>
          </>
        }
        stats={[
          { value: hl.stat3Value, label: hl.stat1 },
          { value: hl.stat4Value, label: hl.stat2 },
          { value: "24/7", label: hl.stat3 },
        ]}
        actions={
          <>
            <Link
              to={accessSignupUrl("anfitrion")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 font-medium text-white shadow-lg shadow-emerald-900/30 transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
            >
              {hl.ctaMain}
              <ArrowRight weight="bold" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={howItWorksUrl("anfitrion")}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              {hl.ctaSecondary}
            </Link>
          </>
        }
      />

      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="section-eyebrow">{hl.benefitsTitle}</p>
            <h2 className="section-title">{hl.benefitsSubtitle}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: CheckCircle,
                title: hl.benefit1Title,
                desc: hl.benefit1Text,
                color: "text-emerald-600",
                bg: "bg-emerald-100"
              },
              {
                icon: ChatCircle,
                title: hl.benefit2Title,
                desc: hl.benefit2Text,
                color: "text-blue-600",
                bg: "bg-blue-100"
              },
              {
                icon: Shield,
                title: hl.benefit3Title,
                desc: hl.benefit3Text,
                color: "text-amber-600",
                bg: "bg-amber-100"
              },
              {
                icon: Users,
                title: hl.benefit4Title,
                desc: hl.benefit4Text,
                color: "text-purple-600",
                bg: "bg-purple-100"
              }
            ].map((benefit, i) => (
              <div
                key={i}
                className="group flex gap-6 items-center p-6 rounded-2xl bg-stone-50 hover:bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`h-20 w-20 shrink-0 rounded-2xl ${benefit.bg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <benefit.icon size={40} weight="thin" className={benefit.color} />
                </div>
                <div className="flex-1">
                  <h3 className="card-title mb-2">{benefit.title}</h3>
                  <p className="text-stone-600 leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="section-eyebrow">{hl.processTitle}</p>
            <h2 className="section-title">{hl.processSubtitle}</h2>
            <Link
              to={howItWorksUrl("anfitrion")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
            >
              {hl.processGuide}
              <ArrowRight weight="bold" className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "01", title: hl.step1Title, desc: hl.step1Text, icon: User },
              { num: "02", title: hl.step2Title, desc: hl.step2Text, icon: CheckCircle },
              { num: "03", title: hl.step3Title, desc: hl.step3Text, icon: House },
              { num: "04", title: hl.step4Title, desc: hl.step4Text, icon: Users }
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="relative inline-block mb-4">
                  <span className="step-number text-emerald-100 group-hover:text-emerald-200 transition-colors">
                    {step.num}
                  </span>
                  <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                    <step.icon size={20} weight="bold" className="text-emerald-700" />
                  </div>
                </div>
                <h3 className="card-title mb-2">{step.title}</h3>
                <p className="text-stone-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-gradient-to-br from-stone-50 to-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="section-title lg:text-5xl xl:text-[3.25rem] mb-6">
            {hl.finalCtaTitle}<br />{hl.finalCtaSubtitle}
          </h2>
          <p className="text-lg text-stone-600 mb-10 sm:text-xl">
            {hl.finalCtaText}
          </p>
          <Link
            to={accessSignupUrl("anfitrion")}
            className="group inline-flex items-center gap-3 rounded-full bg-emerald-700 px-10 py-5 text-white font-medium text-lg hover:bg-emerald-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            {hl.finalCtaButton}
            <ArrowRight weight="bold" className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </main>
  );
}
