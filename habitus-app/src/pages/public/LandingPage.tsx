import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { fetchCompatQuiz, homePathForRole } from "@habitus/core";
import { redirectAfterAuth } from "../../lib/returnTo";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../../components/PageState";
import { ArrowRight, CheckCircle, Users, Shield, Heart, MapPin, ChatCircle, House, Target, User, Buildings, Funnel, Clock, Star } from "@phosphor-icons/react";
import { es } from "@habitus/core";

// Real photos from Unsplash - co-living, people, Barcelona/Madrid vibe
const HERO_IMAGES = [
  { url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80", alt: "Co-living space" },
  { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80", alt: "Roommates sharing" },
  { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80", alt: "Barcelona apartment" },
];

const TESTIMONIALS = [
  {
    name: "María García",
    role: "Diseñadora, 28",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    text: "Llegué de Valencia sin conocer a nadie. Encontré un piso en Gracia con dos compañeras que ahora son amigas. El cuestionario de compatibilidad realmente funciona.",
    location: "Barcelona"
  },
  {
    name: "Carlos Ruiz",
    role: "Profesional, 35",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    text: "Después de mi separación, necesitaba volver a empezar. Habitus me conectó con personas en situación similar. No es solo alquilar, es construir comunidad.",
    location: "Madrid"
  },
  {
    name: "Elena Chen",
    role: "Estudiante, 24",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    text: "Mi experiencia anterior de piso compartida fue un desastre. Con Habitus sabía exactamente qué esperar antes de mudarme. Me siento en casa.",
    location: "Barcelona"
  }
];

export function LandingPage() {
  const { user, profile, loading, profileReady } = useAuth();
  const [dest, setDest] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Auto-rotate hero images
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Hero Section with Real Photos */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-stone-50 to-emerald-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(199,91,57,0.1),transparent_50%)] animate-pulse-slow" />
        </div>

        {/* Image Gallery Background */}
        <div className="absolute inset-0 opacity-20">
          {HERO_IMAGES.map((img, i) => (
            <div
              key={i}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                i === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${img.url})` }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-32 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content with Stagger Animation */}
            <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 rounded-full bg-terracotta/10 px-4 py-2 mb-8 animate-fade-in">
                <div className="h-2 w-2 rounded-full bg-terracotta animate-pulse" />
                <span className="text-sm font-medium text-terracotta">Barcelona · Madrid</span>
              </div>

              <h1 className="font-serif text-5xl lg:text-7xl font-medium text-stone-900 leading-[1.1] tracking-tight">
                <span className="inline-block animate-slide-up" style={{ animationDelay: '100ms' }}>
                  Elige con quién
                </span>
                <br />
                <span className="inline-block text-terracotta animate-slide-up" style={{ animationDelay: '200ms' }}>
                  vives
                </span>,
                <br />
                <span className="inline-block animate-slide-up" style={{ animationDelay: '300ms' }}>
                  no solo dónde.
                </span>
              </h1>

              <p className="mt-8 text-xl text-stone-600 leading-relaxed max-w-xl animate-fade-in" style={{ animationDelay: '400ms' }}>
                Comparte piso con personas compatibles por hábitos, valores y ritmo de vida.
                <span className="block mt-2 text-stone-500">Estudiantes, expats, profesionales.</span>
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
                <Link
                  to="/access"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-white font-medium hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/20 hover:shadow-xl hover:shadow-stone-900/30 hover:-translate-y-0.5"
                >
                  Crear cuenta gratis
                  <ArrowRight weight="bold" className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/como-funciona"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-stone-200 px-8 py-4 text-stone-700 font-medium hover:border-stone-300 hover:bg-white transition-all hover:-translate-y-0.5"
                >
                  Cómo funciona
                </Link>
              </div>

              {/* Trust Badges with Animation */}
              <div className="mt-8 flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
                {[
                  { icon: Target, text: "92% compatibilidad media" },
                  { icon: Shield, text: "Identidad verificada" },
                  { icon: ChatCircle, text: "24/7 soporte humano" }
                ].map((badge, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                    style={{ animationDelay: `${600 + i * 100}ms` }}
                  >
                    <badge.icon size={16} weight="fill" className="text-terracotta" />
                    <span className="text-sm text-stone-600">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual - Photo Card Stack */}
            <div className="relative animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="relative">
                {/* Background Cards */}
                <div className="absolute -top-4 -left-4 right-4 bottom-4 -z-10 rounded-3xl bg-amber-200/50 transform rotate-3 animate-float" style={{ animationDelay: '0s' }} />
                <div className="absolute -top-2 -left-2 right-2 bottom-2 -z-10 rounded-3xl bg-emerald-200/50 transform -rotate-2 animate-float" style={{ animationDelay: '1s' }} />

                {/* Main Card with Photo */}
                <div className="relative rounded-3xl bg-white overflow-hidden shadow-2xl shadow-stone-200/50 transform hover:scale-[1.02] transition-transform duration-500">
                  <div className="aspect-[4/3] relative">
                    <img
                      src={HERO_IMAGES[currentImageIndex].url}
                      alt={HERO_IMAGES[currentImageIndex].alt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Compatibility Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <House size={24} weight="fill" />
                        </div>
                        <div>
                          <p className="font-serif text-lg">Hogar compatible</p>
                          <p className="text-sm text-white/80">92% de afinidad</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {[
                          { label: "Ritmo", value: "Tranquilo" },
                          { label: "Horarios", value: "Similar" },
                          { label: "Valores", value: "Muy alineados" }
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="px-3 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm"
                          >
                            <span className="text-white/70">{item.label}: </span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Image Indicators */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {HERO_IMAGES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`h-2 rounded-full transition-all ${i === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator with Bounce */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-400 animate-bounce-slow">
          <span className="text-xs tracking-widest uppercase">Descubre</span>
          <div className="h-12 w-px bg-stone-300" />
        </div>
      </section>

      {/* Testimonials Section - EMPATHY */}
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-terracotta font-medium mb-4 tracking-wider uppercase text-sm">Historias reales</p>
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900">
              Personas como tú<br />encontraron su lugar
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className="group relative rounded-3xl bg-gradient-to-br from-stone-50 to-stone-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-lg"
                  />
                  <div>
                    <p className="font-serif text-lg text-stone-900">{testimonial.name}</p>
                    <p className="text-sm text-stone-500">{testimonial.role} · {testimonial.location}</p>
                  </div>
                </div>

                <blockquote className="text-stone-600 leading-relaxed mb-4">
                  "{testimonial.text}"
                </blockquote>

                <div className="flex items-center gap-1 text-terracotta">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} weight="fill" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props with Icons */}
      <section className="py-32 bg-stone-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-emerald-700 font-medium mb-4 tracking-wider uppercase text-sm">Por qué Habitus</p>
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900">
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
                <h3 className="font-serif text-2xl text-stone-900 mb-3">{prop.title}</h3>
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
              <p className="text-terracotta font-medium mb-4 tracking-wider uppercase text-sm">Cómo funciona</p>
              <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-8">
                4 pasos hacia<br />tu nuevo hogar
              </h2>

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
                    <span className="font-serif text-5xl text-stone-200 group-hover:text-terracotta/30 transition-colors font-medium">
                      {step.num}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl text-stone-900 mb-1">{step.title}</h3>
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
                  <p className="font-serif text-2xl text-stone-700">Tu comunidad te espera</p>
                  <Link
                    to="/access"
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
            <h2 className="font-serif text-4xl lg:text-5xl">
              ¿Cómo usas Habitus?
            </h2>
            <p className="mt-6 text-stone-400 text-lg">
              Distintos roles, misma misión: convivencia mejor
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { role: "inquilino", icon: User, title: "Inquilino", desc: "Busco piso y compañeros compatibles" },
              { role: "anfitrion", icon: Users, title: "Anfitrión", desc: "Gestiono convivencia en mi piso" },
              { role: "propietario", icon: Buildings, title: "Propietario", desc: "Publico y administro mis pisos" }
            ].map((item) => (
              <Link
                key={item.role}
                to={`/access?role=${item.role}`}
                className="group relative rounded-2xl bg-stone-800 p-8 hover:bg-stone-700 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-terracotta/0 to-terracotta/10 group-hover:from-terracotta/10 group-hover:to-emerald-700/10 transition-all duration-500" />

                <div className="relative">
                  <div className="text-4xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 text-terracotta">
                    <item.icon size={40} weight="fill" />
                  </div>
                  <h3 className="font-serif text-2xl mb-2">{item.title}</h3>
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
          <h2 className="font-serif text-4xl lg:text-6xl text-white mb-6 animate-fade-in-up">
            Tu próximo hogar<br />te espera
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Únete a miles de personas que ya encontraron su lugar y compañeros con Habitus.
          </p>
          <Link
            to="/access"
            className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-stone-900 font-medium text-lg hover:bg-stone-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            Crear cuenta gratis
            <ArrowRight weight="bold" className="w-6 h-6" />
          </Link>

          {/* Social Proof */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/60 text-sm animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center gap-2">
              <Users size={24} weight="fill" />
              <span>2,500+ miembros</span>
            </div>
            <div className="flex items-center gap-2">
              <House size={24} weight="fill" />
              <span>800+ espacios</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={24} weight="fill" />
              <span>4.8/5 satisfacción</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
