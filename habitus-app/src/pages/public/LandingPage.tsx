import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { fetchCompatQuiz, homePathForRole } from "@habitus/core";
import { redirectAfterAuth } from "../../lib/returnTo";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../lib/I18nContext";
import { usePageMeta } from "../../hooks/usePageMeta";
import { LoadingState } from "../../components/PageState";
import { ArrowRight, Users, Shield, Heart, ChatCircle, House, Target, User } from "@phosphor-icons/react";
import { accessSignupUrl, howItWorksUrl } from "../../lib/accessLinks";
import { LandingMainHero } from "../../components/public/LandingMainHero";
import { HeroAsidePanel } from "../../components/public/HeroAsidePanel";
import { Reveal } from "../../components/public/Reveal";
import { COMMUNITY_WAIT_IMAGE } from "../../lib/brandAssets";

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 5}s`,
  animationDuration: `${5 + Math.random() * 5}s`,
}));

export function LandingPage() {
  const { user, profile, loading, profileReady } = useAuth();
  const [dest, setDest] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const t = useI18n();
  usePageMeta(t.public.meta.homeTitle, t.public.meta.homeDescription, "/");

  useEffect(() => {
    if (loading || (user && !profileReady)) return;
    if (!user?.id) {
      setReady(true);
      setDest(null);
      return;
    }
    fetchCompatQuiz(user.id)
      .then((quiz) => {
        setDest(redirectAfterAuth(profile, quiz));
      })
      .catch(() => setDest(homePathForRole(profile?.accountRole)))
      .finally(() => setReady(true));
  }, [loading, profileReady, user?.id, profile]);

  if (loading || (user && (!profileReady || !ready))) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center pt-24">
        <LoadingState />
      </main>
    );
  }

  if (dest && dest !== "/") {
    return <Navigate to={dest} replace />;
  }

  return (
    <main className="min-h-screen bg-stone-50 overflow-x-hidden">
      <LandingMainHero
        badge={t.public.landing.badge}
        title={
          <>
            <span className="block">{t.public.landing.heroLine1}</span>
            <span className="hero-display-accent block">{t.public.landing.heroLine2}</span>
          </>
        }
        subtitle={
          <>
            {t.public.landing.heroSubtitle}
            <span className="mt-2 block text-stone-300">{t.public.landing.heroAudience}</span>
          </>
        }
        stats={[
          { value: "92%", label: t.public.landing.statCompat },
          { value: "100%", label: t.public.landing.statVerified },
          { value: "24/7", label: t.public.landing.statSupport },
        ]}
        aside={<HeroAsidePanel />}
        actions={
          <>
            <Link
              to={accessSignupUrl("inquilino")}
              className="btn-shine group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-stone-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-stone-100 hover:shadow-xl sm:px-8 sm:py-4 sm:text-base"
            >
              {t.public.landing.ctaStartFree}
              <ArrowRight weight="bold" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={accessSignupUrl("anfitrion")}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20 sm:px-8 sm:py-4 sm:text-base"
            >
              {t.public.landing.ctaPublishSpace}
            </Link>
          </>
        }
      />

      {/* Value Props with Icons */}
      <section className="py-32 bg-gradient-to-b from-stone-100 to-stone-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-20">
            <p className="section-eyebrow">{t.public.landing.pillarsTitle}</p>
            <h2 className="section-title">
              {t.public.landing.pillarsSubtitle}
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: t.public.landing.pillar1Title,
                desc: t.public.landing.pillar1Text,
                color: "from-amber-100 to-orange-50",
                iconColor: "text-amber-600",
              },
              {
                icon: Users,
                title: t.public.landing.pillar2Title,
                desc: t.public.landing.pillar2Text,
                color: "from-emerald-100 to-teal-50",
                iconColor: "text-emerald-600",
              },
              {
                icon: Shield,
                title: t.public.landing.pillar3Title,
                desc: t.public.landing.pillar3Text,
                color: "from-blue-100 to-indigo-50",
                iconColor: "text-blue-600",
              }
            ].map((prop, i) => (
              <Reveal key={i} delay={i * 120} from="up">
                <div className="group relative h-full rounded-3xl border border-stone-200/70 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-stone-300/80 hover:shadow-xl">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${prop.color} flex items-center justify-center mb-6 ring-1 ring-stone-900/5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <prop.icon size={32} weight="duotone" className={prop.iconColor} />
                  </div>
                  <h3 className="card-title mb-3">{prop.title}</h3>
                  <p className="text-stone-600 leading-relaxed">{prop.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works with Visual Steps */}
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <Reveal from="left">
              <p className="section-eyebrow">{t.public.landing.howItWorks}</p>
              <h2 className="section-title mb-8">
                {t.public.landing.stepsTitle}
              </h2>
              <Link
                to={howItWorksUrl("inquilino")}
                className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-terracotta hover:underline"
              >
                {t.public.landing.stepsGuide}
                <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <div className="space-y-8">
                {[
                  {
                    num: "01",
                    title: t.public.landing.step1Title,
                    desc: t.public.landing.step1Text,
                    icon: User,
                  },
                  {
                    num: "02",
                    title: t.public.landing.step2Title,
                    desc: t.public.landing.step2Text,
                    icon: House,
                  },
                  {
                    num: "03",
                    title: t.public.landing.step3Title,
                    desc: t.public.landing.step3Text,
                    icon: ChatCircle,
                  },
                  {
                    num: "04",
                    title: t.public.landing.step4Title,
                    desc: t.public.landing.step4Text,
                    icon: Heart,
                  }
                ].map((step, i) => (
                  <Reveal key={i} delay={i * 90} from="left">
                    <div className="flex gap-6 group hover:bg-stone-50 rounded-2xl p-4 -mx-4 transition-all duration-300">
                      <span className="step-number group-hover:text-terracotta/40 transition-colors">
                        {step.num}
                      </span>
                      <div className="flex-1">
                        <h3 className="card-title mb-1">{step.title}</h3>
                        <p className="text-stone-600">{step.desc}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        <step.icon size={20} weight="bold" className="text-stone-400" />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            <Reveal from="right" delay={120} className="relative">
              <div className="group relative aspect-square overflow-hidden rounded-3xl bg-stone-900 ring-1 ring-stone-900/10 shadow-xl">
                <img
                  src={COMMUNITY_WAIT_IMAGE}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/marketing/main-hero-v2.jpg";
                  }}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 text-left sm:p-10">
                  <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {t.public.landing.communityWait}
                  </p>
                  <Link
                    to={accessSignupUrl("inquilino")}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-stone-900 shadow-lg transition-all hover:-translate-y-0.5 hover:gap-3 hover:bg-stone-100 group/cta"
                  >
                    {t.public.landing.startNow}
                    <ArrowRight weight="bold" className="w-5 h-5 group-hover/cta:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-32 bg-stone-900 text-white overflow-hidden relative">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-terracotta rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-700 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="section-title-light">
              {t.public.landing.rolesTitle}
            </h2>
            <p className="mt-6 text-stone-400 text-lg">
              {t.public.landing.rolesSubtitle}
            </p>
          </Reveal>

          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {[
              { href: accessSignupUrl("inquilino"), icon: User, title: t.public.landing.roleTenantTitle, desc: t.public.landing.roleTenantDesc },
              { href: "/anfitriones", icon: Users, title: t.public.landing.roleHostTitle, desc: t.public.landing.roleHostDesc },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 120} from="up">
                <Link
                  to={item.href}
                  className="group relative block h-full rounded-2xl bg-stone-800 p-8 ring-1 ring-white/5 hover:ring-white/15 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-terracotta/10 overflow-hidden"
                >
                  {/* Hover Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-terracotta/0 to-terracotta/10 group-hover:from-terracotta/10 group-hover:to-emerald-700/10 transition-all duration-500" />

                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta/15 text-terracotta ring-1 ring-terracotta/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-terracotta/25">
                      <item.icon size={28} weight="fill" />
                    </div>
                    <h3 className="card-title-light mb-2">{item.title}</h3>
                    <p className="text-stone-400 text-sm">{item.desc}</p>
                    <ArrowRight
                      weight="bold"
                      className="mt-4 text-terracotta opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                      size={20}
                    />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA with Animation */}
      <section className="py-32 relative overflow-hidden bg-gradient-to-br from-terracotta via-orange-600 to-terracotta-dark animate-gradient-drift">
        {/* Soft radial highlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(255,255,255,0.22), transparent 70%)",
          }}
        />
        {/* Animated Particles */}
        <div className="absolute inset-0">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-particle"
              style={{
                left: p.left,
                top: p.top,
                animationDelay: p.animationDelay,
                animationDuration: p.animationDuration,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Reveal as="h2" className="section-title-light lg:text-5xl xl:text-[3.25rem] mb-6">
            {t.public.landing.ctaBlockTitle}
          </Reveal>
          <Reveal as="p" delay={120} className="text-lg text-white/80 mb-10 max-w-2xl mx-auto sm:text-xl">
            {t.public.landing.ctaBlockSubtitle}
          </Reveal>
          <Reveal
            delay={240}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              to={accessSignupUrl("inquilino")}
              className="btn-shine group inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-stone-900 font-semibold text-lg hover:bg-stone-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              {t.public.landing.ctaStartFree}
              <ArrowRight weight="bold" className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={accessSignupUrl("anfitrion")}
              className="inline-flex items-center gap-3 rounded-full border-2 border-white/40 bg-white/10 px-10 py-5 font-medium text-lg text-white backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white/20"
            >
              {t.public.landing.ctaPublishSpace}
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
