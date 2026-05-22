import { Link } from "react-router-dom";
import { es } from "@habitus/core";
import { Icon } from "../../components/Icon";

const OWNER_IMAGES = [
  { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80", alt: "Modern apartment building" },
  { url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80", alt: "Luxury apartment" },
  { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80", alt: "Property exterior" },
];

const OWNER_TESTIMONIALS = [
  {
    name: "Roberto Sánchez",
    role: "Propietario de 3 pisos",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    text: "Gestionaba 5 pisos compartidos y era un caos constante. Con Habitus, los grupos están pre-validados y los conflictos se redujeron un 80%. Ahora tengo tiempo para buscar más propiedades.",
    location: "Madrid"
  },
  {
    name: "Inmobiliaria Horizon",
    role: "Agencia, 40 propiedades",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
    text: "Nuestra cartera de pisos compartidos generaba más problemas que beneficios. Desde que implementamos Habitus, nuestros clientes propietarios están mucho más satisfechos.",
    location: "Barcelona"
  }
];

export function OwnerLandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-100 to-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-white to-stone-50">
          <div className="absolute top-20 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/3 rounded-full bg-amber-200/30 blur-3xl animate-float" />
          <div className="absolute bottom-20 left-0 h-80 w-80 translate-y-1/3 -translate-x-1/4 rounded-full bg-stone-300/30 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-32 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-stone-200 px-4 py-2 mb-8">
                <span className="h-2 w-2 rounded-full bg-stone-700 animate-pulse" />
                <span className="text-sm font-medium text-stone-800">Para propietarios y agencias</span>
              </div>

              <h1 className="font-serif text-5xl lg:text-7xl font-medium text-stone-900 leading-[1.1] tracking-tight">
                Tu cartera de pisos,
                <br />
                <span className="text-stone-600">bajo control</span>.
              </h1>

              <p className="mt-8 text-xl text-stone-600 leading-relaxed max-w-xl">
                Gestiona múltiples propiedades, asigna anfitriones y recibe grupos de inquilinos pre-validados.
                <span className="block mt-2 text-stone-500">Menos gestión, más seguridad.</span>
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/access?role=propietario"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-white font-medium hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/20 hover:shadow-xl hover:-translate-y-0.5"
                >
                  Registrarse
                  <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/access?role=agencia"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-stone-300 px-8 py-4 text-stone-700 font-medium hover:border-stone-400 hover:bg-white transition-all hover:-translate-y-0.5"
                >
                  Soy agencia
                </Link>
              </div>
            </div>

            {/* Visual - Portfolio Dashboard */}
            <div className="relative animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="absolute -top-4 -left-4 right-4 bottom-4 -z-10 rounded-3xl bg-stone-300/40 transform -rotate-1 animate-float" />
              <div className="relative rounded-3xl bg-white overflow-hidden shadow-2xl shadow-stone-200/50 border border-stone-100">
                {/* Dashboard Header */}
                <div className="p-6 bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg text-stone-900">Mis pisos</h3>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm">5 publicados</span>
                  </div>
                </div>

                {/* Property List */}
                <div className="p-6 space-y-3">
                  {[
                    { name: "Piso Gracia", status: "92% compatibilidad", color: "bg-emerald-100 text-emerald-800", img: OWNER_IMAGES[0].url },
                    { name: "Loft Malasaña", status: "87% compatibilidad", color: "bg-emerald-100 text-emerald-800", img: OWNER_IMAGES[1].url },
                    { name: "Ática Eixample", status: "Nuevas solicitudes", color: "bg-amber-100 text-amber-800", img: OWNER_IMAGES[2].url },
                    { name: "Estudio Chamberí", status: "95% compatibilidad", color: "bg-emerald-100 text-emerald-800", img: OWNER_IMAGES[0].url },
                    { name: "Piso Lavapiés", status: "Grupo alineado", color: "bg-blue-100 text-blue-800", img: OWNER_IMAGES[1].url }
                  ].map((prop, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prop.img}
                          alt={prop.name}
                          className="h-10 w-10 rounded-lg object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                        <span className="text-stone-700">{prop.name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${prop.color}`}>{prop.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Benefits */}
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20">
            <div>
              <p className="text-stone-500 font-medium mb-4 tracking-wider uppercase text-sm">Para propietarios</p>
              <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-8">
                Gestión profesional<br />de convivencia
              </h2>

              <div className="space-y-6">
                {[
                  {
                    title: "Anfitriones asignados",
                    desc: "Designa quién gestiona la convivencia en cada piso. Tú controlas, ellos actúan.",
                    icon: "👤"
                  },
                  {
                    title: "Grupos pre-validados",
                    desc: "Los grupos de inquilinos pasan por cuestionario de compatibilidad antes de solicitar.",
                    icon: "👥"
                  },
                  {
                    title: "Vistas por rol",
                    desc: "Panel de propietario con métricas: solicitudes, ingresos estimados, estado de cada piso.",
                    icon: "📊"
                  },
                  {
                    title: "Verificación opcional",
                    desc: "Confirma identidad y titularidad para generar más confianza en tus anuncios.",
                    icon: "✓"
                  }
                ].map((benefit, i) => (
                  <div
                    key={i}
                    className="flex gap-4 group hover:bg-stone-50 rounded-xl p-4 -mx-4 transition-all duration-300"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-stone-100 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-stone-200 transition-all duration-300">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-900 mb-1">{benefit.title}</h3>
                      <p className="text-stone-600 text-sm">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="bg-stone-900 rounded-3xl p-12 text-white overflow-hidden relative">
              {/* Animated Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

              <div className="relative">
                <h3 className="font-serif text-2xl mb-8">Resultados con Habitus</h3>
                <div className="space-y-8">
                  {[
                    { label: "Menor rotación de inquilinos", value: "68%", color: "from-amber-400 to-orange-500" },
                    { label: "Reducción de conflictos", value: "73%", color: "from-emerald-400 to-teal-500" },
                    { label: "Solicitudes más cualificadas", value: "3x", color: "from-blue-400 to-indigo-500" },
                    { label: "Ahorro de tiempo en gestión", value: "12h/mes", color: "from-purple-400 to-pink-500" }
                  ].map((stat, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between mb-2">
                        <span className="text-stone-400">{stat.label}</span>
                        <span className="font-serif text-2xl group-hover:scale-110 transition-transform duration-300">{stat.value}</span>
                      </div>
                      <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${stat.color} rounded-full group-hover:w-full transition-all duration-1000`}
                          style={{ width: `${60 + i * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-gradient-to-br from-stone-100 to-stone-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-stone-600 font-medium mb-4 tracking-wider uppercase text-sm">Casos de éxito</p>
            <h2 className="font-serif text-4xl lg:text-5xl text-stone-900">
              Propietarios que modernizaron<br />su gestión
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {OWNER_TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className="group relative rounded-3xl bg-white p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-16 w-16 rounded-full object-cover ring-4 ring-stone-200 shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  <div>
                    <p className="font-serif text-lg text-stone-900">{testimonial.name}</p>
                    <p className="text-sm text-stone-500">{testimonial.role}</p>
                    <p className="text-xs text-emerald-600">{testimonial.location}</p>
                  </div>
                </div>

                <blockquote className="text-stone-600 leading-relaxed mb-4">
                  "{testimonial.text}"
                </blockquote>

                <div className="flex items-center gap-2 text-amber-600">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agency Section */}
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-gradient-to-br from-stone-100 to-stone-200 rounded-3xl p-12 lg:p-16 shadow-xl relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-stone-300/50 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-2 rounded-full bg-white text-stone-700 text-sm font-medium mb-6 shadow-sm">
                  Para agencias inmobiliarias
                </span>
                <h2 className="font-serif text-4xl lg:text-5xl text-stone-900 mb-6">
                  Gestiona la cartera<br />de tus clientes
                </h2>
                <p className="text-stone-600 text-lg mb-8">
                  Dashboard multi-cliente, asignación de anfitriones y control total sobre las propiedades que gestionas.
                </p>
                <Link
                  to="/access?role=agencia"
                  className="group inline-flex items-center gap-2 rounded-full bg-stone-900 px-8 py-4 text-white font-medium hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Registrar agencia
                  <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h4 className="font-medium text-stone-900 mb-4">Funciones para agencias</h4>
                <ul className="space-y-3">
                  {[
                    "Vista agregada de toda tu cartera",
                    "Gestión por cliente independiente",
                    "Asignación de anfitriones por piso",
                    "Reportes de ocupación y métricas",
                    "Solicitudes organizadas por propiedad"
                  ].map((feature, i) => (
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

      {/* CTA */}
      <section className="py-32 bg-stone-900 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-serif text-4xl lg:text-6xl mb-6">
            Tu cartera, optimizada
          </h2>
          <p className="text-xl text-stone-400 mb-10">
            Únete a propietarios y agencias que ya modernizaron la gestión de sus pisos compartidos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/access?role=propietario"
              className="group inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-stone-900 font-medium text-lg hover:bg-stone-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Soy propietario
              <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/access?role=agencia"
              className="group inline-flex items-center gap-3 rounded-full border-2 border-stone-700 px-10 py-5 text-white font-medium text-lg hover:bg-stone-800 transition-all hover:-translate-y-1"
            >
              Soy agencia
              <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
