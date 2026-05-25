import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { fetchCompatQuiz, homePathForRole } from "@habitus/core";
import { redirectAfterAuth } from "../../lib/returnTo";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../../components/PageState";
import { ArrowRight, Briefcase, Users, Shield, Heart, ChatCircle, House, Target, User, Buildings } from "@phosphor-icons/react";
import { accessSignupUrl, howItWorksUrl } from "../../lib/accessLinks";
import { LandingMainHero, type HeroListingSlide } from "../../components/public/LandingMainHero";

const HERO_LISTINGS: HeroListingSlide[] = [
  {
    url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80",
    alt: "Salón luminoso en piso compartido de Gracia",
    title: "Piso en Gracia",
    location: "Barcelona",
    affinity: "94%",
    tags: [
      { label: "Ritmo", value: "Tranquilo" },
      { label: "Horarios", value: "Similar" },
      { label: "Valores", value: "Muy alineados" },
    ],
  },
  {
    url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    alt: "Habitación en apartamento moderno de Madrid",
    title: "Habitación en Chamberí",
    location: "Madrid",
    affinity: "91%",
    tags: [
      { label: "Ritmo", value: "Activo" },
      { label: "Horarios", value: "Flexibles" },
      { label: "Valores", value: "Alineados" },
    ],
  },
  {
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    alt: "Cocina compartida con compañeros de piso",
    title: "Casa en Poblenou",
    location: "Barcelona",
    affinity: "89%",
    tags: [
      { label: "Ritmo", value: "Social" },
      { label: "Horarios", value: "Diurnos" },
      { label: "Valores", value: "Compatibles" },
    ],
  },
];

export function LandingPage() {
  const { user, profile, loading, profileReady } = useAuth();
  const [dest, setDest] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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
        badge="Barcelona · Madrid"
        title={
          <>
            <span className="block">Elige con quién vives,</span>
            <span className="hero-display-accent block">no solo dónde.</span>
          </>
        }
        subtitle={
          <>
            Comparte piso con personas compatibles por hábitos, valores y ritmo de vida.
            <span className="mt-2 block text-stone-300">Estudiantes, expats, profesionales.</span>
          </>
        }
        stats={[
          { value: "92%", label: "Compatibilidad media" },
          { value: "100%", label: "Identidad verificada" },
          { value: "24/7", label: "Soporte humano" },
        ]}
        listings={HERO_LISTINGS}
        actions={
          <>
            <Link
              to="/alojamientos"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-stone-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-stone-100 sm:px-8 sm:py-4 sm:text-base"
            >
              Explorar hogares
              <ArrowRight weight="bold" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={accessSignupUrl("inquilino")}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20 sm:px-8 sm:py-4 sm:text-base"
            >
              Crear cuenta gratis
            </Link>
            <Link
              to={howItWorksUrl("inquilino")}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20 sm:px-8 sm:py-4 sm:text-base md:inline-flex"
            >
              Cómo funciona
            </Link>
          </>
        }
      />

      {/* Value Props with Icons */}
      <section className="py-32 bg-stone-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="section-eyebrow">Por qué : moon</p>
            <h2 className="section-title">
              Vivir acompañado,<br />sin sorpresas
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Compatibilidad real",
                desc: "Cuestionario de hábitos y valores. Afinidad con compañeros, anfitriones y espacios — con desglose claro.",
                color: "from-amber-100 to-orange-50",
                iconColor: "text-amber-600",
                iconBg: "bg-amber-100"
              },
              {
                icon: Users,
                title: "Grupos que alquilan juntos",
                desc: "Forma equipo, reparte el alquiler con transparencia y presentaos mejor al propietario.",
                color: "from-emerald-100 to-teal-50",
                iconColor: "text-emerald-600",
                iconBg: "bg-emerald-100"
              },
              {
                icon: Shield,
                title: "Identidad verificada",
                desc: "Verificación de identidad, perfiles completos y mensajes antes de dar el paso.",
                color: "from-blue-100 to-indigo-50",
                iconColor: "text-blue-600",
                iconBg: "bg-blue-100"
              }
            ].map((prop, i) => (
              <div
                key={i}
                className="group relative rounded-3xl p-8 bg-gradient-to-br hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${prop.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <prop.icon size={32} weight="thin" className={prop.iconColor} />
                </div>
                <h3 className="card-title mb-3">{prop.title}</h3>
                <p className="text-stone-600 leading-relaxed">{prop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works with Visual Steps */}
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="section-eyebrow">Cómo funciona</p>
              <h2 className="section-title mb-8">
                4 pasos hacia<br />tu nuevo hogar
              </h2>
              <Link
                to={howItWorksUrl("inquilino")}
                className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-terracotta hover:underline"
              >
                Ver guía completa para inquilinos
                <ArrowRight weight="bold" className="h-4 w-4" />
              </Link>

              <div className="space-y-8">
                {[
                  {
                    num: "01",
                    title: "Crea tu perfil",
                    desc: "Cuéntanos tu estilo de vida, rutinas y preferencias de convivencia.",
                    icon: User,
                    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=100&q=80"
                  },
                  {
                    num: "02",
                    title: "Descubre espacios",
                    desc: "Explora pisos con tu afinidad para las personas que ya viven allí.",
                    icon: House,
                    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100&q=80"
                  },
                  {
                    num: "03",
                    title: "Conecta",
                    desc: "Chatea con anfitriones y envía solicitudes a los lugares que te gusten.",
                    icon: ChatCircle,
                    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80"
                  },
                  {
                    num: "04",
                    title: "Múdate",
                    desc: "Firma tu contrato digital y convive con compañeros compatibles.",
                    icon: Heart,
                    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=100&q=80"
                  }
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-6 group hover:bg-stone-50 rounded-2xl p-4 -mx-4 transition-all duration-300"
                  >
                    <span className="step-number group-hover:text-stone-300 transition-colors">
                      {step.num}
                    </span>
                    <div className="flex-1">
                      <h3 className="card-title mb-1">{step.title}</h3>
                      <p className="text-stone-600">{step.desc}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <step.icon size={20} weight="bold" className="text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-terracotta/20 to-emerald-700/20 p-12 flex items-center justify-center">
                <div className="text-center">
                  <House size={64} weight="fill" className="text-stone-700 mx-auto mb-4 animate-float-slow" />
                  <p className="card-title text-stone-700">Tu comunidad te espera</p>
                  <Link
                    to={accessSignupUrl("inquilino")}
                    className="inline-flex items-center gap-2 mt-6 text-terracotta font-medium hover:gap-4 transition-all group"
                  >
                    Empezar ahora
                    <ArrowRight weight="bold" className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
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
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="section-title-light">
              ¿Cómo usas : moon?
            </h2>
            <p className="mt-6 text-stone-400 text-lg">
              Distintos roles, misma misión: convivencia mejor
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: accessSignupUrl("inquilino"), icon: User, title: "Inquilino", desc: "Busco piso y compañeros compatibles" },
              { href: "/anfitriones", icon: Users, title: "Anfitrión", desc: "Gestiono convivencia en mi piso" },
              { href: "/propietarios", icon: Buildings, title: "Propietario", desc: "Publico y administro mis pisos" },
              { href: "/agencias", icon: Briefcase, title: "Agencia", desc: "Opero la cartera de mis clientes" },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className="group relative rounded-2xl bg-stone-800 p-8 hover:bg-stone-700 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-terracotta/0 to-terracotta/10 group-hover:from-terracotta/10 group-hover:to-emerald-700/10 transition-all duration-500" />

                <div className="relative">
                  <div className="text-4xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 text-terracotta">
                    <item.icon size={40} weight="fill" />
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
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA with Animation */}
      <section className="py-32 bg-gradient-to-br from-terracotta to-orange-600 relative overflow-hidden">
        {/* Animated Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="section-title-light lg:text-5xl xl:text-[3.25rem] mb-6 animate-fade-in-up">
            Tu próximo hogar<br />te espera
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto sm:text-xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Crea tu perfil, explora espacios compatibles y da el paso con confianza.
          </p>
          <Link
            to={accessSignupUrl("inquilino")}
            className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-stone-900 font-medium text-lg hover:bg-stone-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            Crear cuenta gratis
            <ArrowRight weight="bold" className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </main>
  );
}
