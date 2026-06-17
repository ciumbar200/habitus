export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readTime: number;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "buscar-habitacion-barcelona-guia-2026",
    title: "Buscar Habitación en Barcelona: Guía Completa 2026",
    excerpt: "Encuentra no solo un lugar para dormir, sino un hogar donde encajes. Todo lo que necesitas saber para buscar habitación en Barcelona sin errores.",
    category: "Guías",
    tags: ["barcelona", "buscar habitación", "guía", "inquilinos"],
    author: "Equipo moon",
    publishedAt: "2026-01-23",
    readTime: 15,
    featuredImage: "/blog/buscar-habitacion-barcelona.svg",
    seoTitle: "Buscar Habitación en Barcelona 2026: Guía Completa",
    seoDescription: "Guía completa para buscar habitación en Barcelona. Evita errores, encuentra compañeros compatibles y conoce tus derechos como inquilino.",
    content: `
# Buscar Habitación en Barcelona: Guía Completa 2026

## Encuentra no solo un lugar para dormir, sino un hogar donde encajes

Llegas a Barcelona con una mochila llena de sueños y el corazón partido en dos: mitad emoción, mitad ansiedad. La ciudad es preciosa, sí. Pero encontrar una habitación aquí... eso es otra historia.

Si estás leyendo esto, probablemente ya sabes lo que es:
- Pasar horas en Idealista, Spotahero o Facebook Marketplace
- Enviar mensajes que nunca reciben respuesta
- Ver habitaciones que prometen "luminoso y acogedor" y son sótanos con una ventana que da a un pozo
- Sentir que la soledad de la búsqueda está pesando más que las maletas

No estás solo. Según datos recientes, el mercado de alquiler compartido en Barcelona ha visto un **aumento del 40% en la demanda** en el último año, mientras que la oferta de habitaciones decentes se mantiene estancada.

## Los 5 errores que cometen todos al buscar habitación

### Error #1: Fijarse solo en el precio

El problema no es gastar 450€ o 600€ en una habitación. El problema es gastar 450€ o 600€ en una habitación que te amarga la existencia.

**La matemática de la infelicidad:**
- Habitación barata + compañeros tóxicos = Depresión garantizada
- Habitación un poco más cara + compañeros compatibles = Inversión en salud mental

### Error #2: Ignorar el momento de la visita

¿Sabes qué te dice más de una vivienda que 50 fotos? Visitarla a las 9PM un martes.

- **¿Cómo suena el aislamiento?** ¿Oyes al vecino de arriba como si estuviera en tu salón?
- **¿Cómo huele?** ¿A comidas especiadas (normal) o a humedad (preocupante)?
- **¿Cómo está la luz?** ¿Tu habitación tiene luz natural directa?

### Error #3: No hablar con los futuros compañeros

Parece obvio, pero el 70% de las personas que se mudan a pisos compartidos en Barcelona **nunca han tenido una conversación real** con sus futuros compañeros antes de firmar.

## Barrios de Barcelona: Dónde vive tu tribu

### Gracia: El pueblo dentro de la ciudad

**Para quién es:**
- Estudiantes que quieren ambiente y fiesta
- Personas que buscan comunidad y vida de barrio
- Quienes no les importa subir cuestas

**Precio medio:** 500-700€

### Poblenou: Creatividad y mar

**Para quién es:**
- Profesionales del tech y creativos
- Gente que trabaja desde casa
- Quienes quieren mar cerca

**Precio medio:** 550-750€

### Sant Antoni: El equilibrium perfecto

**Para quién es:**
- Quienes quieren centro pero no caos
- Amantes de la gastronomía
- Personas que buscan barrio en transformación

**Precio medio:** 600-800€

## El algoritmo de la compatibilidad real

En : moon, hemos identificado **5 dimensiones de compatibilidad** que predicen el éxito:

1. **Ritmo circadiano** - horarios y energía
2. **Estilo de limpieza** - el conflicto #1
3. **Uso de espacios** - salón como salón vs dormitorio
4. **Comunicación** - cómo gestionas conflictos
5. **Estilo de vida** - valores y hábitos

## Preguntas que DEBES hacer antes de mudarte

### Sobre la habitación:
1. ¿Cuántos años tiene el edificio?
2. ¿Hay ascensor?
3. ¿Cómo es el aislamiento?
4. ¿Hay humedades?

### Sobre los compañeros:
1. ¿Hace cuánto viven allí?
2. ¿Qué hacen en su tiempo libre?
3. ¿Alguien trabaja desde casa?
4. ¿Hay parejas que vienen a dormir?

### Sobre las normas:
1. ¿Qué reglas hay sobre invitados?
2. ¿Cómo funcionan las celebraciones?
3. ¿Cómo se gestiona la limpieza?

## Derechos del inquilino que debes conocer

### La fianza
- **Legalmente:** Máximo 2 meses de alquiler
- **Ilegal:** Pedir más de 2 meses
- **Devolución:** 30 días después de terminar contrato

## Tu plan de acción para 30 días

### Día 1-7: Investigación
- [ ] Define tu presupuesto máximo
- [ ] Haz lista de 3 barrios objetivo
- [ ] Define tus non-negotiables
- [ ] Crea tu perfil en : moon

### Día 8-21: Búsqueda
- [ ] Reserva 2-3 horas diarias para buscar
- [ ] Agenda 3-5 visitas por semana
- [ ] Usa la lista de preguntas
- [ ] No te apresures

### Día 22-30: Decisión
- [ ] Haz tabla comparativa
- [ ] Vuelve a visitar tu primera opción
- [ ] Revisa el contrato con calma
- [ ] Firma y prepárate

## En : moon, filtramos por compatibilidad

Nuestro sistema analiza:
- ✅ Tus ritmos y horarios
- ✅ Tu estilo de limpieza
- ✅ Tus valores de convivencia
- ✅ Tus preferencias de vida

Y te empareja con:
- 🏠 Habitaciones que encajan con tu estilo
- 👥 Compañeros con alta afinidad
- 📍 Barrios que vibran como tú

[**Crear cuenta gratis en : moon**](/access?role=inquilino)
    `
  },
  {
    slug: "gracia-vs-poblenou-donde-vive-tu-tribu",
    title: "Gracia vs Poblenou: Dónde Vive Tu Tribu en Barcelona",
    excerpt: "Dos barrios, dos almas. Descubre cuál encaja con tu estilo de vida y encuentra tu lugar en Barcelona.",
    category: "Barrios",
    tags: ["barcelona", "gracia", "poblenou", "barrios", "comparativa"],
    author: "Equipo moon",
    publishedAt: "2026-01-23",
    readTime: 12,
    featuredImage: "/blog/gracia-vs-poblenou.svg",
    seoTitle: "Gracia vs Poblenou: ¿Dónde vivir en Barcelona?",
    seoDescription: "Comparativa completa entre Gracia y Poblenou. Precios, vibe, tipo de personas. Descubre qué barrio es para ti.",
    content: `
# Gracia vs Poblenou: Dónde Vive Tu Tribu en Barcelona

## Dos barrios, dos almas totalmente distintas

Estás mirando el mapa de Barcelona con las cejas fruncidas. Todos te dicen que estos son los barrios "de moda" para compartir piso, pero cuando buscas información, todo es contradictorio.

Vamos a cortar el rollo. Esta es una comparativa honesta para ayudarte a decidir dónde pasarás los próximos 12-24 meses de tu vida.

## Gracia en 3 minutos

### La verdad sobre Gracia

**Lo bueno:**
- Vida de barrio real: mercados, comercios, abuelos en bancos
- Comunidad fuerte: si vives aquí 6 meses, conocerás a tu panadero
- Cultura y arte: teatros, espacios culturales
- Fiesta Mayor en agosto

**Lo no tan bueno:**
- Todo es cuesta (prepárate las pantorrillas)
- En agosto todo cierra
- El parking es imposible

**Precio medio:** 500-700€

## Poblenou en 3 minutos

### La verdad sobre Poblenou

**Lo bueno:**
- Edificios más nuevos y luminosos
- 5-10 minutos andando a la playa
- Comunidad de profesionales del tech
- Espacios coworking por todas partes

**Lo no tan bueno:**
- En transformación permanente (obras)
- De noche puede estar vacío
- Transporte más limitado

**Precio medio:** 550-750€

## Tabla comparativa rápida

| Aspecto | Gracia | Poblenou |
|---------|--------|----------|
| **Precio** | 500-700€ | 550-750€ |
| **Transporte** | Excelente | Bueno pero limitado |
| **Vida social** | Muy alta | Media |
| **Ambiente work** | Limitado | Excelente |
| **Playa** | 25-30 min | 5-10 min |
| **Ruido** | Medio-alto | Medio-bajo |

## Para quién es cada barrio

### Gracia es para ti si:
✅ Eres estudiante o joven profesional
✅ Valoras la vida de barrio
✅ No tienes coche
✅ Quieres sentir que vives en un pueblo

### Poblenou es para ti si:
✅ Trabajas en tech/creativo/remoto
✅ El mar es tu happy place
✅ Prefieres edificios nuevos
✅ Valoras la tranquilidad

## Test rápido: ¿Gracia o Poblenou?

1. Un sábado perfecto empieza con:
   - A) Desayunar en una plaza llena de gente → Gracia
   - B) Café tranquilo con libro → Poblenou

2. Cuando buscas piso, priorizas:
   - A) Sentirme parte de una comunidad → Gracia
   - B) Tener espacio y condiciones modernas → Poblenou

3. Con respecto al mar:
   - A) Me gusta ir cuando quiero → Gracia
   - B) Sería increíble poder ir andando → Poblenou

¿Mayoría A? **Gracia es tu barrio.**

¿Mayoría B? **Poblenou es tu barrio.**

## Compatibilidad de compañeros por barrio

### Compañeros típicos en Gracia
- Estudiantes, jóvenes profesionales (22-30 años)
- Gente que organiza cenas comunes
- Personas que pasan tiempo en el salón
- Nivel de ruido: Medio-alto

### Compañeros típicos en Poblenou
- Profesionales del tech/creativo (26-35 años)
- Gente que trabaja desde casa
- Valoran la tranquilidad durante el día
- Nivel de ruido: Medio-bajo

## Encuentra compañeros compatibles en : moon

En : moon no solo te mostramos habitaciones. Te mostramos **compatibilidad real** antes de mudarte.

[**Explorar habitaciones en Gracia y Poblenou**](/alojamientos)
[**Crear cuenta gratis**](/access?role=inquilino)
    `
  },
  {
    slug: "test-compatibilidad-companeros-piso",
    title: "Test de Compatibilidad: ¿Qué Tipo de Compañero de Piso Eres?",
    excerpt: "Descubre tu estilo de convivencia y con quién encajas. Test completo de 40 preguntas.",
    category: "Test",
    tags: ["compatibilidad", "test", "compañeros", "convivencia"],
    author: "Equipo moon",
    publishedAt: "2026-01-23",
    readTime: 10,
    featuredImage: "/blog/compatibilidad-companeros.svg",
    seoTitle: "Test de Compatibilidad para Compañeros de Piso",
    seoDescription: "Descubre qué tipo de compañero eres y con quién encajas. Test completo basado en 5 dimensiones de compatibilidad.",
    content: `
# Test de Compatibilidad: ¿Qué Tipo de Compañero de Piso Eres?

## La pregunta no es: ¿Eres buena persona?

La pregunta es: **¿Eres buen compañero de piso?**

Y son cosas muy distintas. Puedes ser leal y generoso con tus amigos, pero vivir contigo puede ser una pesadilla si:
- Dejas los platos sucios "solo 5 minutos"
- Tienes llamadas a las 2AM en el salón
- Compras la leche y te la bebes entera sin preguntar

Este test no es para juzgarte. Es para ayudarte a entender tu estilo de convivencia.

## Las 5 dimensiones de la compatibilidad

### 1. Ritmo Circadiano (horarios)

**El conflicto silencioso:** Tú eres madrugador, tu compañero nocturno.

**Preguntas clave:**
- ¿A qué hora te acuestas/levantas?
- ¿Trabajas desde casa? ¿Qué horarios?
- ¿Eres ligero o pesado del sueño?

### 2. Estilo de Limpieza

**La realidad:** El 80% de conflictos giran alrededor de la limpieza.

**Preguntas clave:**
- ¿Con qué frecuencia limpias zonas comunes?
- ¿Qué consideras "limpio"?
- ¿Cómo gestionas tus espacios?

### 3. Uso de Espacios Compartidos

**El salón como salón vs dormitorio adicional:**

- Rara vez lo usas
- Lo usas como oficina permanente
- Lo usas para citas regulares
- Es el corazón de tu vida social

### 4. Comunicación de Conflictos

- **Afrontativo:** "Hablemos del problema"
- **Pasivo-agresivo:** Notas, gestas
- **Evitativo:** Lo odio internamente hasta explotar

### 5. Estilo de Vida y Valores

- Fumadores vs no fumadores
- Omnívoros vs veganos
- Sociales vs introvertidos
- Música vs silencio

## El Test Completo

Responde estas preguntas y descubre tu tipo.

### Sección 1: Ritmo y Horarios

1. ¿A qué hora te acuestas normalmente?
   - A) Antes de 23:00 (4 puntos)
   - B) 23:00-01:00 (3 puntos)
   - C) Después de 01:00 (2 puntos)
   - D) Horarios variables (1 punto)

2. ¿Trabajas desde casa?
   - A) Nunca (4 puntos)
   - B) Ocasionalmente (3 puntos)
   - C) Regularmente (2 puntos)
   - D) Siempre (1 punto)

### Sección 2: Limpieza

3. ¿Con qué frecuencia limpias zonas comunes?
   - A) A diario/bisemanal (4 puntos)
   - B) Un par veces/semana (3 puntos)
   - C) Una vez/semana (2 puntos)
   - D) Cada dos semanas o menos (1 punto)

### Sección 3: Espacios

4. ¿Cuánto tiempo pasas en zonas comunes?
   - A) Muy poco (4 puntos)
   - B) Un poco (3 puntos)
   - C) Regularmente (2 puntos)
   - D) Mucho (1 punto)

### Sección 4: Comunicación

5. Cuando hay un problema, ¿qué haces?
   - A) Lo digo directamente (4 puntos)
   - B) Busco momento para hablar (3 puntos)
   - C) Dejo notas (2 puntos)
   - D) Lo guardo (1 punto)

### Sección 5: Estilo de vida

6. ¿Tienes pareja que viene a dormir?
   - A) No tengo (4 puntos)
   - B) Viene rara vez (3 puntos)
   - C) 1-2 noches/semana (2 puntos)
   - D) 3+ noches/semana (1 punto)

## Resultados: Los 4 Tipos de Compañeros

Suma tus puntos:

### 110-160 puntos: EL ESTRUCTURADO
Rutinas claras, valoras el orden. Compatible con otros Estructurados.

### 80-109 puntos: EL ORGANIZADO FLEXIBLE
Buenos hábitos pero adaptable. Compatible con casi todos.

### 50-79 puntos: EL ESPONTÁNEO LIBRE
Vives el día a día. Compatible con otros Espontáneos.

### Menos de 50: EL DESORGANIZADO
Hábitos esporádicos. Compatible con muy pocos.

## Compatibilidad por Tipo

| Tu Tipo | Mejor Match | Compatible con esfuerzo | Alta fricción |
|---------|-------------|------------------------|----------------|
| Estructurado | Estructurado | Org. Flexible | Espontáneo |
| Org. Flexible | Todos | Estructurado, Espontáneo | Desorganizado |
| Espontáneo | Espontáneo | Org. Flexible | Estructurado |
| Desorganizado | Desorganizado | Espontáneo | Casi todos |

## Encuentra tu compatibilidad en : moon

Nuestro sistema analiza tu tipo y te muestra compañeros con alta afinidad.

[**Completar test de compatibilidad**](/quiz)
[**Crear cuenta gratis**](/access?role=inquilino)
    `
  },
  {
    slug: "senales-mal-companero-piso-red-flags",
    title: "25 Señales de Mal Compañero de Piso: Red Flags que Debes Huir",
    excerpt: "Detecta personas tóxicas antes de mudarte y salvarte de 12 meses de infierno.",
    category: "Guías",
    tags: ["red flags", "compañeros", "advertencias", "convivencia"],
    author: "Equipo moon",
    publishedAt: "2026-01-23",
    readTime: 13,
    featuredImage: "/blog/red-flags-companero.svg",
    seoTitle: "Señales de Mal Compañero: 25 Red Flags al Buscar Piso",
    seoDescription: "Aprende a detectar señales de alerta antes de mudarte. 25 red flags que indican mal compañero de piso.",
    content: `
# 25 Señales de Mal Compañero de Piso: Red Flags que Debes Huir

## Cómo detectar personas tóxicas antes de mudarte

Todos hemos oído las historias de terror:
- La compañera que usaba tu crema hidratante "solo una vez"
- El compañero que traía gente a casa a las 3AM un martes
- Quien se comía tu comida y negaba haberlo hecho

Estas historias son reales. Pero lo que nadie te dice es que **casi todas estas señales eran detectables antes de mudarse.**

## Señales durante la visita

### 🚩 Señal #1: No te deja hablar con el compañero actual

**Lo que dicen:** "Bueno, él se va en días, así que no podrás conocerlo."
**Lo que significa:** La convivencia fue un desastre.

### 🚩 Señal #2: El piso huele mal

- Humedad
- Tabaco impregnado
- Basura acumulada

### 🚩 Señal #3: Notas pasivo-agresivas

Post-its en la nevera: "POR FAVOR LIMPIA DESPUÉS DE USAR"

### 🚩 Señal #4: Te hablan mal del compañero que se va

"Menos mal se va, era un pesado."

### 🚩 Señal #5: No saben respuestas básicas

"¿De quién es el router?" "No sé."

## Señales en la comunicación

### 🚩 Señal #6: Tardan muchísimo en responder

### 🚩 Señal #7: Responden de forma evasiva

Preguntas específicas obtienen respuestas vagas.

### 🚩 Señal #8: Se contradicen entre mensajes

### 🚩 Señal #9: No responden todas tus preguntas

### 🚩 Señal #10: Lenguaje excesivamente informal

## Señales en el anuncio

### 🚩 Señal #11: Anuncio demasiado corto

### 🚩 Señal #12: Anuncio excesivamente demandante

"BUSCAMOS PERSONA PERFECTA, LIMPIA, RESPONSABLE..."

### 🚩 Señal #13: Fotos no corresponden

### 🚩 Señal #14: Precio sospechosamente bajo

### 🚩 Señal #15: "Buscamos a alguien especial" sin definir

## Señales sutiles

### 🚩 Señal #16: No pueden decirte qué les gusta del piso

### 🚩 Señal #17: Se quejan del barrio constantemente

### 🚩 Señal #18: No pueden decirte la última vez que hubo conflicto

### 🚩 Señal #19: Parecen ansiosos por que te mudures YA

### 🚩 Señal #20: No conocen detalles del contrato

## Señales del propietario/anfitrión

### 🚩 Señal #21: El propietario vive allí y todo decide

### 🚩 Señal #22: Habitaciones claramente desiguales

Tú pagas 500€ por habitación pequeña, el anfitrión tiene la suite por mismo precio.

### 🚩 Señal #23: Depósitos ilegales

Fianza de 3 meses (ilegal en España).

### 🚩 Señal #24: Contrato sin revisar

### 🚩 Señal #25: Falta total de transparencia

## Señales Verdes: Cómo se ve un buen compañero

✅ Te dejan hablar con el compañero actual
✅ Responden preguntas con detalles
✅ Pueden decirte qué les gusta del piso
✅ Hay evidencia de que resuelven conflictos
✅ El piso se siente cuidado
✅ Te dan tiempo para decidir

## En : moon, filtramos por compatibilidad

Analizamos estilos de convivencia antes de conectar.

[**Explorar con compatibilidad real**](/alojamientos)
[**Crear cuenta gratis**](/access?role=inquilino)
    `
  },
  {
    slug: "repartir-alquiler-habitaciones-distintas",
    title: "Cómo repartir el alquiler cuando las habitaciones no son iguales",
    excerpt: "El reparto a partes iguales parece justo, pero cuando las habitaciones son distintas crea resentimiento. Esta es la fórmula que usan los pisos que no tienen peleas.",
    category: "Guías",
    tags: ["gastos", "alquiler", "convivencia", "dinero", "habitaciones"],
    author: "Equipo moon",
    publishedAt: "2026-06-17",
    readTime: 7,
    featuredImage: "/blog/repartir-alquiler.svg",
    seoTitle: "Cómo repartir el alquiler cuando las habitaciones no son iguales | moon",
    seoDescription: "Fórmula justa para dividir el alquiler en pisos con habitaciones de diferente tamaño o calidad. Calculadora incluida.",
    content: `
# Cómo repartir el alquiler cuando las habitaciones no son iguales

## El problema con «a partes iguales»

Piso de 1.200 €/mes. Tres habitaciones: una exterior de 16 m² con baño propio, una interior de 10 m² y un cuarto pequeño de 8 m² que antes era un trastero. Los tres pagan 400 €.

¿Es eso justo?

No lo es. Y todos lo saben. El que tiene la habitación grande acepta callado porque le conviene, y el que tiene el trastero aguanta porque necesita el piso. Esa tensión silenciosa es la que explota a los seis meses.

El reparto «a partes iguales» solo funciona cuando las habitaciones son de verdad iguales. En el 80% de los pisos compartidos, no lo son.

## La fórmula del reparto proporcional por peso

La solución no es complicada. Se asigna un **peso** a cada habitación según su valor relativo, y el alquiler se divide en proporción.

**Factores que suben el peso:**
- Metros cuadrados (el factor principal)
- Ventana exterior vs interior
- Baño propio vs compartido
- Terraza o balcón privado
- Armario empotrado, más almacenaje
- Orientación (sur/este = más luz)

**Factores que bajan el peso:**
- Interior, sin ventana natural
- Dimensiones irregulares
- Sin armario
- Más lejos del baño compartido

### Ejemplo práctico

| Habitación | Descripción | Peso | % del total | Alquiler a pagar |
|---|---|---|---|---|
| Hab. 1 | 16 m², exterior, baño propio | 5 | 45% | **540 €** |
| Hab. 2 | 10 m², exterior, baño compartido | 3 | 27% | **325 €** |
| Hab. 3 | 8 m², interior, baño compartido | 2 | 18% | **216 €** |
| Zonas comunes | — | 1 | 9% | (entre todos) |

**Total: 1.081 €** (el resto: suministros y fondo común)

> La función \`computeFairSplit\` de moon hace este cálculo automáticamente. Puedes usarla en la [calculadora de alquiler justo](/calculadora-alquiler) sin necesidad de registrarte.

## Cómo tener la conversación

La mayoría de la gente no tiene el problema de la fórmula — tiene el problema de **cómo proponerlo** sin que parezca que solo te beneficias a ti.

**Lo que funciona:**

1. **Proponlo antes de firmar**, no después. «Oye, las habitaciones son bastante distintas, ¿cómo lo repartimos?» es mucho más fácil de decir sin contrato firmado.

2. **Usa una herramienta neutral**. No tu cálculo manual. Una calculadora (como la de moon) donde todos meten los datos y la fórmula sale sola elimina el sesgo percibido.

3. **Déjalo por escrito en el acuerdo de convivencia**. «El método de reparto acordado es: proporcional por peso de habitación (calculadora moon, configuración del día X)». Así no hay que re-negociar cada mes.

4. **Revísalo si cambia algo**. Si alguien cede la habitación grande o entra un nuevo compañero, recalculad.

## Los errores más comunes

**Error #1: Repartir suministros también por peso**
Los suministros (luz, agua, internet) son de uso común y se reparten a partes iguales. Solo el alquiler va por habitación.

**Error #2: No revisar cuando alguien se va**
Si el que tenía la habitación grande se va y entra alguien en la pequeña, hay que recalcular. Muchos pisos olvidan esto y el nuevo conviviente acaba pagando lo mismo que el anterior aunque tenga una habitación diferente.

**Error #3: Hacer el cálculo sin que todos estén presentes**
Cada persona debe ver el proceso. «Yo calculé y te toca X» genera desconfianza aunque el cálculo sea perfecto.

## El reparto bien hecho construye confianza

Un piso donde el dinero está bien repartido tiene menos conflictos en todo lo demás. No porque el dinero sea lo más importante, sino porque cuando la parte económica está resuelta de forma justa, el resto de la convivencia se afronta desde una base más sana.

[**Usar la calculadora de alquiler justo →**](/calculadora-alquiler)

[**Descargar plantilla de acuerdo de convivencia →**](/recursos/acuerdo-convivencia)
    `,
  },
  {
    slug: "liquidar-piso-sin-pelearte",
    title: "Cómo liquidar un piso compartido sin pelearte con nadie",
    excerpt: "El momento de ajustar cuentas al terminar la convivencia es el que más conflictos genera. Aquí está el proceso exacto para cerrarlo limpio y sin drama.",
    category: "Guías",
    tags: ["gastos", "convivencia", "liquidación", "fianza", "salida"],
    author: "Equipo moon",
    publishedAt: "2026-06-17",
    readTime: 8,
    featuredImage: "/blog/liquidar-piso.svg",
    seoTitle: "Cómo liquidar un piso compartido sin peleas — guía paso a paso | moon",
    seoDescription: "Proceso completo para liquidar las cuentas de un piso compartido: gastos pendientes, fianza, inventario y endosos. Sin conflictos.",
    content: `
# Cómo liquidar un piso compartido sin pelearte con nadie

## Por qué la liquidación es el momento más peligroso

Lleváis 10 meses viviendo juntos sin grandes problemas. Luego alguien dice «me voy en 30 días» y de repente aparecen deudas que nadie recuerda, gastos que «alguien pagó pero no está en la app», la fianza que el propietario retiene por una mancha que «ya estaba antes»...

La liquidación de un piso es el momento donde se concentra el máximo potencial de conflicto. No porque la gente sea mala, sino porque hay dinero real en juego, hay prisa, y casi nunca hay un proceso acordado de antemano.

Este artículo es ese proceso.

## El proceso en 5 pasos (en orden)

### Paso 1: Cuadrar los gastos compartidos

Antes de hablar de fianza o de quién paga qué, hay que tener los gastos del piso completamente cuadrados.

**Si usas moon Gastos (o cualquier app de gastos):**
- Marca todos los gastos como confirmados
- Calcula los saldos: quién debe a quién y cuánto
- Ejecuta el «settle up» con el mínimo de transferencias posible
- Registra cada transferencia como «liquidada» en la app

**Si no usáis app:**
- Haz una tabla con todas las deudas conocidas
- Llegad a un acuerdo sobre cuáles son reales y cuáles se compensan
- Haced las transferencias y guardad los comprobantes

**La regla de oro:** nada de «luego te lo doy» o «lo compensamos con lo de X». Cada deuda se cierra con dinero real o con un acuerdo explícito firmado por ambas partes.

### Paso 2: El inventario de salida

Si hicisteis el inventario de entrada, ahora toca comparar.

**Qué comprobáis:**
- Estado de cada habitación vs el registro de entrada
- Electrodomésticos y mobiliario común
- Paredes, suelos, puertas
- Llaves entregadas

**Regla de deterioro normal:**
La LAU distingue entre deterioro por uso normal (no descontable de fianza) y daños (sí descontables). Una pared descolorida después de 1 año es desgaste normal. Un agujero en la pared es daño.

> Si hicisteis fotos en la entrada (con la [plantilla de inventario de moon](/recursos/inventario-piso)), esto es sencillo. Si no las hicisteis, tendréis que negociar sin pruebas.

### Paso 3: La fianza

La fianza es la principal fuente de conflictos al salir de un piso. El proceso correcto:

1. **Limpieza a fondo** antes de entregar las llaves — no «bastante limpio», sino limpio. Es lo que más retenciones genera.
2. **Entrega de llaves con acta firmada** — el propietario/anfitrión firma que recibe las llaves y el piso en X estado. Sin acta, no tienes prueba.
3. **Plazo legal**: el propietario tiene 30 días para devolver la fianza o justificar retenciones (en Cataluña: 1 mes).
4. **Si retiene sin justificación**: burofax al propietario y, si no responde, vía judicial (proceso monitorio, no necesita abogado para importes pequeños).

**Lo que el propietario puede descontar:**
- Daños reales (no desgaste normal)
- Facturas de luz/agua/gas pendientes
- Llaves no devueltas

**Lo que NO puede descontar:**
- Limpieza básica si el piso se entregó limpio
- Pintura si lleváis más de un año (desgaste normal)
- Reparaciones que corresponden al propietario por LAU

### Paso 4: Los gastos del último mes

El mes de salida tiene trampas:
- ¿Quién paga la última factura de luz que llegará después de salir?
- ¿Cómo se reparte el mes si alguien se va a mitad?
- ¿Qué pasa con la compra del bote común que quedaba?

**La solución más limpia:**
- El que se va paga su parte proporcional hasta el día que sale (si es a mitad de mes, divide por 30)
- Se reserva un pequeño fondo para la última factura de suministros (se reparte cuando llega)
- El bote común sobrante se divide entre todos

Ponedlo por escrito aunque sean 20 €. Es la cantidad pequeña la que genera el conflicto grande.

### Paso 5: El endoso (y por qué importa)

El endoso mutuo es lo último que hacéis antes de cerrar el grupo en moon.

Después de una convivencia de meses, tienes información única sobre esa persona: cómo paga, cómo mantiene los espacios comunes, cómo gestiona los conflictos. Eso vale. Y en moon, ese endoso se convierte en parte del Moon Score portable — la reputación que acompaña al compañero en su próximo piso.

No es solo un gesto amable. Es el dato más valioso que puedes darle (y recibir).

## Señales de que va a haber problema

Estas señales antes de la liquidación predicen conflicto:

- 🚩 Deudas que no se registraron en su momento y ahora «según quién se acuerde»
- 🚩 Propietario que no responde mensajes cuando preguntáis por la fianza
- 🚩 Compañero que «ya se fue» pero quedan cosas suyas en el piso
- 🚩 Nadie recuerda si se pagó la última factura de gas

Si ves alguna de estas señales, actúa antes de que la situación se complique: burofax, acta notarial, mediación de consumo. No es dramático — es prevención.

## Plantillas útiles

- [Acuerdo de convivencia (incluye cláusula de salida)](/recursos/acuerdo-convivencia)
- [Inventario de entrada/salida](/recursos/inventario-piso)
- [Calculadora de reparto de alquiler](/calculadora-alquiler)

---

*La mejor forma de que la liquidación sea fácil es haber llevado bien los gastos durante toda la convivencia. moon Gastos hace eso automáticamente.*

[**Crear mi piso en moon →**](/access?signup=1&role=inquilino)
    `,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}

export function getBlogPosts(category?: string): BlogPost[] {
  if (category) {
    return blogPosts.filter(post => post.category === category);
  }
  return blogPosts;
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const current = getBlogPost(currentSlug);
  if (!current) return [];

  return blogPosts
    .filter(post => post.slug !== currentSlug)
    .filter(post => post.tags.some(tag => current.tags.includes(tag)))
    .slice(0, limit);
}
