import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Buildings,
  ChartLineUp,
  CheckCircle,
  MapPin,
  Shield,
  Star,
  Users,
  UserCircle,
} from "@phosphor-icons/react";
import { accessSignupUrl, howItWorksUrl } from "../../lib/accessLinks";
import { AGENCY_HERO_IMAGE } from "../../lib/brandAssets";
import { MarketingPhotoHero } from "../../components/public/MarketingPhotoHero";

const AGENCY_TESTIMONIALS = [
  {
    name: "Inmobiliaria Horizon",
    role: "40 propiedades en cartera",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
    text: "Gestionábamos pisos compartidos con demasiada fricción. : moon nos da una vista unificada por cliente, anfitriones asignados y solicitudes filtradas por compatibilidad.",
    location: "Barcelona",
  },
  {
    name: "Grupo Norte Living",
    role: "Agencia boutique, Madrid",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    text: "Nuestros propietarios institucionales piden menos rotación y más control. Con : moon entregamos informes claros y grupos pre-validados antes de cada entrada.",
    location: "Madrid",
  },
];

export function AgencyLandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-stone-100 to-white">
      <MarketingPhotoHero
        image={AGENCY_HERO_IMAGE}
        badge="Para agencias inmobiliarias"
        title={
          <>
            La cartera de tus clientes,
            <span className="block text-orange-200">en un solo panel.</span>
          </>
        }
        subtitle={
          <>
            Publica y opera pisos compartidos para múltiples propietarios con compatibilidad, anfitriones
            asignados y métricas por inmueble.
            <span className="mt-2 block text-stone-300">Menos incidencias, más retención de cartera.</span>
          </>
        }
        stats={[
          { value: "Multi", label: "Cliente por cartera" },
          { value: "3×", label: "Solicitudes cualificadas" },
          { value: "24/7", label: "Soporte humano" },
        ]}
        actions={
          <>
            <Link
              to={accessSignupUrl("agencia")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-medium text-stone-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-stone-100"
            >
              Registrar agencia
              <ArrowRight weight="bold" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to={howItWorksUrl("agencia")}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              Cómo funciona
            </Link>
            <Link
              to="/propietarios"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-medium text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              Soy propietario
            </Link>
          </>
        }
      />

      <section className="bg-white py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-20 max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-stone-500">
              Ventajas para agencias
            </p>
            <h2 className="font-serif text-4xl text-stone-900 lg:text-5xl">Opera convivencia a escala</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                icon: Buildings,
                title: "Cartera multi-cliente",
                desc: "Separa propiedades por propietario con vistas agregadas y permisos claros para tu equipo.",
                color: "text-stone-700",
                bg: "bg-stone-100",
              },
              {
                icon: UserCircle,
                title: "Anfitriones por piso",
                desc: "Asigna quién gestiona la convivencia en cada inmueble sin perder visibilidad desde agencia.",
                color: "text-emerald-700",
                bg: "bg-emerald-100",
              },
              {
                icon: CheckCircle,
                title: "Grupos pre-validados",
                desc: "Los inquilinos pasan por cuestionario de compatibilidad antes de solicitar un espacio.",
                color: "text-amber-700",
                bg: "bg-amber-100",
              },
              {
                icon: ChartLineUp,
                title: "Métricas por propiedad",
                desc: "Ocupación, solicitudes pendientes e ingresos estimados en un panel pensado para operaciones.",
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
                  <h3 className="mb-2 font-serif text-2xl text-stone-900">{benefit.title}</h3>
                  <p className="leading-relaxed text-stone-600">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-stone-100 to-stone-200 py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-stone-600">
              Casos de éxito
            </p>
            <h2 className="font-serif text-4xl text-stone-900 lg:text-5xl">
              Agencias que ya operan con : moon
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {AGENCY_TESTIMONIALS.map((testimonial) => (
              <div
                key={testimonial.name}
                className="group relative rounded-3xl bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-6 flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-16 w-16 rounded-full object-cover shadow-lg ring-4 ring-stone-200 transition-transform duration-300 group-hover:scale-110"
                  />
                  <div>
                    <p className="font-serif text-lg text-stone-900">{testimonial.name}</p>
                    <p className="text-sm text-stone-500">{testimonial.role}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-stone-600">
                      <MapPin size={12} weight="fill" />
                      {testimonial.location}
                    </div>
                  </div>
                </div>
                <blockquote className="mb-4 leading-relaxed text-stone-600">
                  &ldquo;{testimonial.text}&rdquo;
                </blockquote>
                <div className="flex items-center gap-1 text-amber-600">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} weight="fill" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="font-serif text-4xl text-stone-900 lg:text-5xl">Tu camino como agencia</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              { num: "01", title: "Alta de agencia", desc: "Perfil y cartera inicial.", icon: Briefcase },
              { num: "02", title: "Importa pisos", desc: "Por cliente y zona.", icon: Buildings },
              { num: "03", title: "Asigna anfitriones", desc: "Convivencia delegada.", icon: Users },
              { num: "04", title: "Opera solicitudes", desc: "Filtra por compatibilidad.", icon: Shield },
            ].map((step) => (
              <div key={step.num} className="group text-center">
                <div className="relative mb-4 inline-block">
                  <span className="font-serif text-6xl text-stone-200 transition-colors group-hover:text-stone-300">
                    {step.num}
                  </span>
                  <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12">
                    <step.icon size={20} weight="bold" className="text-stone-700" />
                  </div>
                </div>
                <h3 className="mb-2 font-serif text-xl text-stone-900">{step.title}</h3>
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
          <h2 className="mb-6 font-serif text-4xl lg:text-6xl">
            Moderniza la gestión
            <br />
            de pisos compartidos
          </h2>
          <p className="mb-10 text-xl text-stone-400">
            Únete a agencias que ya reducen rotación y conflictos con compatibilidad real.
          </p>
          <Link
            to={accessSignupUrl("agencia")}
            className="group inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-lg font-medium text-stone-900 shadow-xl transition-all hover:-translate-y-1 hover:bg-stone-100 hover:shadow-2xl"
          >
            Registrar agencia gratis
            <ArrowRight weight="bold" className="h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </main>
  );
}
