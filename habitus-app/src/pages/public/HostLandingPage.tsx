import { Link } from "react-router-dom";
import { accessSignupUrl, howItWorksUrl } from "../../lib/accessLinks";
import { HOST_HERO_IMAGE } from "../../lib/brandAssets";
import { MarketingPhotoHero } from "../../components/public/MarketingPhotoHero";
import { ArrowRight, CheckCircle, Users, Shield, MapPin, ChatCircle, House, User, Star } from "@phosphor-icons/react";

const HOST_TESTIMONIALS = [
  {
    name: "Carmen López",
    role: "Anfitriona desde 2022",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
    text: "Solía tener problemas con inquilinos que no encajaban. Desde que uso : moon, todas las personas que han pasado por mi piso han sido una bendición. El cuestionario realmente funciona.",
    location: "Madrid, Chamberí"
  },
  {
    name: "Jordi Martínez",
    role: "Anfitrión desde 2023",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    text: "Como profesional que comparte piso, necesito tranquilidad. : moon me ha conectado con personas que respetan los horarios y el ritmo de vida que busco.",
    location: "Barcelona, Gracia"
  }
];

export function HostLandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white overflow-x-hidden">
      <MarketingPhotoHero
        image={HOST_HERO_IMAGE}
        badge="Para anfitriones"
        title={
          <>
            Gestiona tu piso
            <span className="block text-emerald-300">con personas que encajan.</span>
          </>
        }
        subtitle={
          <>
            Publica tu habitación, indica tu estilo de convivencia y recibe solicitudes de inquilinos compatibles.
            <span className="mt-2 block text-stone-300">Menos rotación, más tranquilidad.</span>
          </>
        }
        stats={[
          { value: "87%", label: "Menos conflictos" },
          { value: "2.5×", label: "Permanencia media" },
          { value: "24/7", label: "Soporte humano" },
        ]}
        actions={
          <>
            <Link
              to={accessSignupUrl("anfitrion")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-4 font-medium text-white shadow-lg shadow-emerald-900/30 transition-all hover:-translate-y-0.5 hover:bg-emerald-500"
            >
              Ser anfitrión
              <ArrowRight weight="bold" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={howItWorksUrl("anfitrion")}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              Cómo funciona
            </Link>
          </>
        }
      />

      {/* Benefits for Hosts */}
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-emerald-700 font-medium mb-4 tracking-wider uppercase text-sm">Ventajas para anfitriones</p>
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900">
              Convivencia sin estrés
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "Filtra por compatibilidad",
                desc: "El cuestionario de hábitos asegura que los solicitantes encajen con tu estilo de vida.",
                color: "text-emerald-600",
                bg: "bg-emerald-100"
              },
              {
                icon: ChatCircle,
                title: "Conoce antes de aceptar",
                desc: "Chatea con candidatos, revisa sus perfiles completos y toma decisiones informadas.",
                color: "text-blue-600",
                bg: "bg-blue-100"
              },
              {
                icon: Shield,
                title: "Menos rotación",
                desc: "Las buenas elecciones de convivencia significan inquilinos que se quedan más tiempo.",
                color: "text-amber-600",
                bg: "bg-amber-100"
              },
              {
                icon: Users,
                title: "Apoyo humano",
                desc: "El equipo : moon te acompaña en momentos de duda sobre convivencia.",
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
                  <h3 className="font-serif text-2xl text-stone-900 mb-2">{benefit.title}</h3>
                  <p className="text-stone-600 leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials from Hosts */}
      <section className="py-32 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-emerald-700 font-medium mb-4 tracking-wider uppercase text-sm">Historias de anfitriones</p>
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900">
              Lo que dicen quienes<br />ya comparten su piso
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {HOST_TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className="group relative rounded-3xl bg-white p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-16 w-16 rounded-full object-cover ring-4 ring-emerald-100 shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  <div>
                    <p className="font-serif text-lg text-stone-900">{testimonial.name}</p>
                    <p className="text-sm text-stone-500">{testimonial.role}</p>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                      <MapPin size={12} weight="fill" />
                      {testimonial.location}
                    </div>
                  </div>
                </div>

                <blockquote className="text-stone-600 leading-relaxed mb-4">
                  "{testimonial.text}"
                </blockquote>

                <div className="flex items-center gap-1 text-emerald-600">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} weight="fill" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works for Hosts */}
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900">
              Tu camino al anfitrión
            </h2>
            <Link
              to={howItWorksUrl("anfitrion")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
            >
              Ver guía paso a paso
              <ArrowRight weight="bold" className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "01", title: "Crea tu perfil", desc: "Define tu estilo como anfitrión.", icon: User },
              { num: "02", title: "Cuestionario", desc: "Completa el de convivencia.", icon: CheckCircle },
              { num: "03", title: "Publica", desc: "Sube fotos y detalles.", icon: House },
              { num: "04", title: "Elige", desc: "Revisa solicitudes compatibles.", icon: Users }
            ].map((step, i) => (
              <div
                key={i}
                className="text-center group"
              >
                <div className="relative inline-block mb-4">
                  <span className="font-serif text-6xl text-emerald-100 group-hover:text-emerald-200 transition-colors">
                    {step.num}
                  </span>
                  <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                    <step.icon size={20} weight="bold" className="text-emerald-700" />
                  </div>
                </div>
                <h3 className="font-serif text-xl text-stone-900 mb-2">{step.title}</h3>
                <p className="text-stone-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Results */}
      <section className="py-32 bg-emerald-700 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {[
              { value: "87%", label: "menos conflictos", icon: "📉" },
              { value: "2.5x", label: "permanencia media", icon: "🏠" },
              { value: "24/7", label: "soporte humano", icon: "💬" }
            ].map((stat, i) => (
              <div
                key={i}
                className="group"
              >
                <div className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-300">{stat.icon}</div>
                <p className="font-serif text-5xl mb-2 group-hover:scale-110 transition-transform duration-300">{stat.value}</p>
                <p className="text-emerald-200">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
            Anfitriones que usan : moon reportan mayor satisfacción y menos estrés en la gestión de convivencia.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-gradient-to-br from-stone-50 to-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-serif text-4xl lg:text-6xl text-stone-900 mb-6">
            Comparte tu espacio<br />con tranquilidad
          </h2>
          <p className="text-xl text-stone-600 mb-10">
            Únete a anfitriones que ya transformaron su experiencia de compartir piso.
          </p>
          <Link
            to={accessSignupUrl("anfitrion")}
            className="group inline-flex items-center gap-3 rounded-full bg-emerald-700 px-10 py-5 text-white font-medium text-lg hover:bg-emerald-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Ser anfitrión gratis
            <ArrowRight weight="bold" className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </main>
  );
}
