import { Link } from "react-router-dom";
import { accessSignupUrl, howItWorksUrl } from "../../lib/accessLinks";
import { OWNER_HERO_IMAGE } from "../../lib/brandAssets";
import { MarketingPhotoHero } from "../../components/public/MarketingPhotoHero";
import { Icon } from "../../components/Icon";
import {
  ArrowRight,
  Briefcase,
  ChartLineUp,
  CheckCircle,
  CurrencyEur,
  Shield,
  ShieldCheck,
  UserCircle,
  Users,
} from "@phosphor-icons/react";
import { VerificationSection } from "../../components/public/VerificationSection";
import { useI18n } from "../../lib/I18nContext";

export function OwnerLandingPage() {
  const t = useI18n();
  const ol = t.public.ownerLanding;

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-100 to-white overflow-x-hidden">
      <MarketingPhotoHero
        image={OWNER_HERO_IMAGE}
        badge={ol.badge}
        title={
          <>
            <span className="block">{ol.heroLine1}</span>
            <span className="hero-display-accent block">{ol.heroLine2}</span>
          </>
        }
        subtitle={
          <>
            {ol.heroSubtitle}
            <span className="mt-2 block text-stone-300">{ol.heroAudience}</span>
          </>
        }
        stats={[
          { value: ol.stat3Value, label: ol.stat1 },
          { value: ol.stat4Value, label: ol.stat2 },
          { value: "24/7", label: ol.stat3 },
        ]}
        actions={
          <>
            <Link
              to={accessSignupUrl("propietario")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-medium text-stone-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-stone-100"
            >
              {ol.ctaMain}
              <ArrowRight weight="bold" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={howItWorksUrl("propietario")}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              {ol.ctaSecondary}
            </Link>
            <Link
              to="/operadores"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              {t.public.agencies}
            </Link>
          </>
        }
      />

      <section className="py-24 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 mb-4">
              <Shield className="text-emerald-600" size={18} weight="fill" />
              <span className="text-sm font-semibold text-emerald-800">{ol.guaranteesBadge}</span>
            </div>
            <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl">
              {ol.guaranteesTitle}
            </h2>
            <p className="mt-4 text-lg text-stone-600">
              {ol.guaranteesSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 mb-6">
                <CurrencyEur className="text-emerald-600" size={28} weight="duotone" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">{ol.guaranteeRentTitle}</h3>
              <p className="text-stone-600 mb-4 leading-relaxed">
                {ol.guaranteeRentText}
              </p>
              <div className="rounded-lg bg-emerald-50 p-4">
                <p className="text-sm text-stone-600">{ol.guaranteeRentMetricLabel}</p>
                <p className="text-2xl font-bold text-emerald-600">{ol.guaranteeRentMetricValue}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 mb-6">
                <ShieldCheck className="text-blue-600" size={28} weight="duotone" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">{ol.guaranteeDamageTitle}</h3>
              <p className="text-stone-600 mb-4 leading-relaxed">
                {ol.guaranteeDamageText}
              </p>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-stone-600">{ol.guaranteeDamageMetricLabel}</p>
                <p className="text-2xl font-bold text-blue-600">{ol.guaranteeDamageMetricValue}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 mb-6">
                <Briefcase className="text-amber-600" size={28} weight="duotone" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">{ol.guaranteeServicesTitle}</h3>
              <p className="text-stone-600 mb-4 leading-relaxed">
                {ol.guaranteeServicesText}
              </p>
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-sm text-stone-600">{ol.guaranteeServicesMetricLabel}</p>
                <p className="text-2xl font-bold text-amber-600">{ol.guaranteeServicesMetricValue}</p>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-2xl bg-stone-900 p-8 text-white text-center">
            <p className="text-stone-400 mb-2">{ol.savingsTitle}</p>
            <p className="text-4xl font-bold text-emerald-400 mb-4">{ol.savingsValue}</p>
            <p className="text-sm text-stone-300 mb-6">
              {ol.savingsText}
            </p>
            <Link
              to={accessSignupUrl("propietario")}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-600"
            >
              {ol.savingsCta}
              <ArrowRight weight="bold" size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Verification Section - For landlords */}
      <VerificationSection />

      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20">
            <div>
              <p className="section-eyebrow">{ol.managementEyebrow}</p>
              <h2 className="section-title mb-8">
                {ol.managementTitleLine1}<br />{ol.managementTitleLine2}
              </h2>

              <div className="space-y-6">
                {ol.managementBenefits.map((benefit, i) => {
                  const BenefitIcon = [UserCircle, Users, ChartLineUp, CheckCircle][i] ?? CheckCircle;
                  return (
                  <div
                    key={i}
                    className="flex gap-4 group hover:bg-stone-50 rounded-xl p-4 -mx-4 transition-all duration-300"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-stone-100 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-stone-200 transition-all duration-300">
                      <BenefitIcon size={20} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-900 mb-1">{benefit.title}</h3>
                      <p className="text-stone-600 text-sm">{benefit.desc}</p>
                    </div>
                  </div>
                )})}
              </div>
            </div>

            <div className="bg-stone-900 rounded-3xl p-12 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

              <div className="relative">
                <h3 className="card-title-light mb-8">{ol.ownerPanelTitle}</h3>
                <div className="space-y-8">
                  {ol.ownerPanelStats.map((stat, i) => {
                    const color = [
                      "from-amber-400 to-orange-500",
                      "from-emerald-400 to-teal-500",
                      "from-blue-400 to-indigo-500",
                      "from-purple-400 to-pink-500",
                    ][i] ?? "from-stone-400 to-stone-500";
                    return (
                    <div key={i} className="group">
                      <div className="flex justify-between mb-2">
                        <span className="text-stone-400">{stat.label}</span>
                        <span className="font-sans text-xl font-bold tracking-[-0.02em] group-hover:scale-110 transition-transform duration-300 sm:text-2xl">{stat.value}</span>
                      </div>
                      <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color} rounded-full group-hover:w-full transition-all duration-1000`}
                          style={{ width: `${60 + i * 10}%` }}
                        />
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl p-12 lg:p-16 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-stone-300/50 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-2 rounded-full bg-white text-stone-700 text-sm font-medium mb-6 shadow-sm">
                  {ol.agencyBoxBadge}
                </span>
                <h2 className="section-title mb-6">
                  {ol.agencyBoxTitleLine1}<br />{ol.agencyBoxTitleLine2}
                </h2>
                <p className="text-stone-600 text-lg mb-8">
                  {ol.agencyBoxText}
                </p>
                <Link
                  to="/operadores"
                  className="group inline-flex items-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-white font-medium hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {ol.agencyBoxCta}
                  <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h4 className="font-medium text-stone-900 mb-4">{ol.agencyFeaturesTitle}</h4>
                <ul className="space-y-3">
                  {ol.agencyFeatures.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-stone-700 group hover:translate-x-1 transition-transform duration-300"
                    >
                      <span className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs text-emerald-700">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-stone-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="section-title-light lg:text-5xl xl:text-[3.25rem] mb-6">
            {ol.finalCtaTitle},<br />{ol.finalCtaSubtitle}
          </h2>
          <p className="text-lg text-stone-400 mb-10 sm:text-xl">
            {ol.finalCtaText}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={accessSignupUrl("propietario")}
              className="group inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-stone-900 font-medium text-lg hover:bg-stone-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              {ol.finalCtaButton}
              <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to={accessSignupUrl("agencia")}
              className="group inline-flex items-center gap-3 rounded-full border-2 border-stone-700 px-10 py-5 text-white font-medium text-lg hover:bg-stone-800 transition-all hover:-translate-y-1"
            >
              {t.public.agencies}
              <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
