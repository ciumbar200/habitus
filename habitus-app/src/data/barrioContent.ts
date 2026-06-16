export interface BarrioContent {
  ciudad: string;
  barrio: string;
  precioMedio: { min: number; max: number };
  ambiente: string;
  transporte: string[];
  perfilConviviente: string;
  pros: string[];
  cons: string[];
  moonTip: string;
  seoTitle: string;
  seoDescription: string;
}

const data: Record<string, Record<string, BarrioContent>> = {
  barcelona: {
    gracia: {
      ciudad: "Barcelona",
      barrio: "Gràcia",
      precioMedio: { min: 480, max: 680 },
      ambiente:
        "Gràcia es el barrio de las plazas llenas de terrazas y los vecinos que llevan décadas. Tiene alma de pueblo dentro de la ciudad: mercado local, teatros de barrio y la Festa Major de agosto que lo para todo. Alta densidad de jóvenes profesionales, artistas y Erasmus.",
      transporte: ["Metro L3 (Fontana, Diagonal)", "Metro L4 (Joanic)", "Bus V17, 39, H6"],
      perfilConviviente:
        "Mayoritariamente 22–32 años. Mezcla de estudiantes de máster, creativos y nómadas digitales. Alta rotación de Erasmus en septiembre. Les importa el ambiente de barrio, no el lujo. Nivel medio de ruido — se valoran los pisos con buen aislamiento.",
      pros: [
        "Vida social sin salir del barrio",
        "Mercado de l'Abaceria y mercadillos",
        "Conexión directa a Diagonal y universidades (UB, UPF)",
        "Arquitectura modernista, plantas altas luminosas",
      ],
      cons: [
        "Pendientes — todo es cuesta arriba desde el metro",
        "Ruido en fin de semana en calles alrededor de plazas",
        "Agosto: el barrio se vacía y cierra la mitad de negocios",
        "Parking imposible",
      ],
      moonTip:
        "En Gràcia el compatibilidad de horarios importa más que en otros barrios. Si eres madrugador, prioriza pisos en calles tranquilas alejadas de Plaça del Sol y Virreina.",
      seoTitle: "Habitación compartida en Gràcia, Barcelona 2026 — precios y barrio",
      seoDescription:
        "Busca habitación compartida en Gràcia (Barcelona). Precio medio 480–680 €/mes, transporte, ambiente y cómo encontrar compañeros compatibles con moon.",
    },
    poblenou: {
      ciudad: "Barcelona",
      barrio: "Poblenou",
      precioMedio: { min: 520, max: 750 },
      ambiente:
        "Poblenou es el distrito de innovación @22 transformado en barrio residencial joven. Edificios nuevos o rehabilitados de fábricas, comunidad fuerte de tech y creativos, y la playa a 10 minutos andando. Menos turismo que el centro, más espacio y luz.",
      transporte: [
        "Metro L4 (Llacuna, Poblenou, Selva de Mar)",
        "Tram T4 (hasta el Fòrum)",
        "Bicing extenso",
        "Bus 26, 36",
      ],
      perfilConviviente:
        "Mayoritariamente 26–36 años. Desarrolladores, diseñadores, profesionales en startups o en remoto. Valoran la tranquilidad diurna para trabajar desde casa. Menos Erasmus, más contratos indefinidos. Suelen quedarse más de un año.",
      pros: [
        "Playa a 10 min andando",
        "Pisos más nuevos y con mejor calidad de construcción",
        "Ambiente tranquilo de lunes a viernes",
        "Comunidad de coworking y networking espontáneo",
      ],
      cons: [
        "En obras permanentes (22@)",
        "Noche menos animada — hay que ir a Rambla del Poblenou",
        "Transporte menos frecuente en hora punta que el centro",
        "Algo lejos de las universidades del centro",
      ],
      moonTip:
        "Poblenou tiene la tasa de renovación de contratos más alta de Barcelona. Si buscas compañero de largo plazo y Moon Score alto, este barrio concentra el perfil más estable.",
      seoTitle: "Habitación compartida en Poblenou, Barcelona 2026 — precios y barrio",
      seoDescription:
        "Busca habitación compartida en Poblenou (Barcelona). Precio medio 520–750 €/mes. Barrio tech y creativo, cerca del mar. Encuentra compañeros compatibles con moon.",
    },
    eixample: {
      ciudad: "Barcelona",
      barrio: "Eixample",
      precioMedio: { min: 600, max: 900 },
      ambiente:
        "Eixample es el corazón geográfico de Barcelona con la cuadrícula perfecta de Cerdà. Alta densidad de servicios, Passeig de Gràcia y todo tipo de opciones gastronómicas. Barrio premium con precios altos pero pisos amplios de techos altos y mucha luz.",
      transporte: [
        "Metro L1, L2, L3, L4, L5 (malla completa)",
        "Bus H10, V15, 54, 58",
        "FGC (Gràcia, Provença)",
      ],
      perfilConviviente:
        "Mezcla amplia: jóvenes profesionales con sueldo medio-alto, expats en multinacionales, y algún Erasmus en pisos más grandes y compartidos de 4-5 personas. Valoran la centralidad y la infraestructura. Menos tolerancia al ruido.",
      pros: [
        "Conectividad de transporte inigualable",
        "Todo a mano: supermercados, gimnasios, todo tipo de servicios",
        "Pisos amplios con techos altos y buena luz en plantas altas",
        "Máxima centralidad",
      ],
      cons: [
        "Precio más alto del batch",
        "Zonas turísticas con ruido",
        "Alta rotación — difícil construir comunidad de barrio",
        "Pisos bajos oscuros y ruidosos",
      ],
      moonTip:
        "En Eixample, el ruido varía mucho por calle. Antes de firmar, pasa una noche de viernes frente al piso para calibrar el nivel real. Los interiores y pisos 4º+ son los más tranquilos.",
      seoTitle: "Habitación compartida en Eixample, Barcelona 2026 — precios y barrio",
      seoDescription:
        "Busca habitación compartida en Eixample (Barcelona). Precio medio 600–900 €/mes. Máxima centralidad y transporte. Encuentra compañeros compatibles con moon.",
    },
    sants: {
      ciudad: "Barcelona",
      barrio: "Sants",
      precioMedio: { min: 430, max: 620 },
      ambiente:
        "Sants es el barrio auténtico que la especulación no ha terminado de tocar todavía. Fuerte identidad local, mercado propio, mucha vida de barrio en torno a la Plaça de Sants. Bien conectado con el aeropuerto y con la mayoría de universidades.",
      transporte: [
        "Metro L1, L3, L5 (Sants Estació — conexión con la mayoría de la red)",
        "Renfe rodalies (Sants — aeropuerto, Sitges)",
        "Bus 44, 109, L95",
      ],
      perfilConviviente:
        "Mezcla de trabajadores locales, estudiantes de grado (UB, UPC cercanas) y familias jóvenes. Menos concentración de Erasmus internacionales. Contratos más estables. Buena relación calidad-precio hace que haya perfiles muy variados.",
      pros: [
        "Precio más accesible de Barcelona cercano al centro",
        "Nodo de transporte clave (Sants Estació — aeropuerto, trenes de larga distancia)",
        "Barrio con carácter propio sin ser turístico",
        "Montjuïc a 15 min andando",
      ],
      cons: [
        "Menos «cool» que Gràcia o Poblenou en términos de vida social joven",
        "Zona de Sants Estació con mucho tráfico y ruido",
        "Menos opciones de ocio nocturno propio",
      ],
      moonTip:
        "Sants es el barrio con mejor ratio precio/transporte de toda la ciudad. Si trabajas en polígono o necesitas el aeropuerto con frecuencia, no hay mejor base.",
      seoTitle: "Habitación compartida en Sants, Barcelona 2026 — precios y barrio",
      seoDescription:
        "Busca habitación compartida en Sants (Barcelona). Precio medio 430–620 €/mes. Bien conectado, barrio auténtico. Compañeros compatibles con moon.",
    },
    "sant-antoni": {
      ciudad: "Barcelona",
      barrio: "Sant Antoni",
      precioMedio: { min: 560, max: 800 },
      ambiente:
        "Sant Antoni es el equilibrio entre centralidad y carácter de barrio. La remodelación del mercado lo convirtió en epicentro gastronómico joven, con terrazas y librerías de segunda mano en cada esquina. Alta concentración de profesionales creativos con poder adquisitivo medio.",
      transporte: [
        "Metro L2 (Sant Antoni)",
        "Metro L3 (Urgell, Rocafort)",
        "Bus 24, 55, 64",
      ],
      perfilConviviente:
        "Profesionales creativos 25–35 años. Diseñadores, periodistas, gente del mundo cultural. Valoran el ambiente de barrio y la gastronomía. Menor rotación que en zonas más turísticas. Bastante sensibilidad hacia la convivencia bien organizada.",
      pros: [
        "Punto justo entre animación y calidad de vida",
        "Mercado de Sant Antoni renovado — referente gastronómico",
        "Buena oferta cultural: librerías, teatros, ciclos de música",
        "Centralísimo sin el caos de Gòtic o Las Ramblas",
      ],
      cons: [
        "Precio al alza en los últimos años",
        "Viernes y sábado por la noche hay mucho movimiento",
        "Poca oferta de pisos grandes (muchos estudios y 2 habitaciones)",
      ],
      moonTip:
        "En Sant Antoni la compatibilidad de hábitos de tarde importa — mucha gente trabaja desde casa hasta las 18h y luego tiene vida social intensa. Acláralo antes de entrar.",
      seoTitle: "Habitación compartida en Sant Antoni, Barcelona 2026 — precios y barrio",
      seoDescription:
        "Busca habitación compartida en Sant Antoni (Barcelona). Precio medio 560–800 €/mes. Barrio creativo y gastronómico. Encuentra compañeros compatibles con moon.",
    },
  },
  madrid: {
    malasana: {
      ciudad: "Madrid",
      barrio: "Malasaña",
      precioMedio: { min: 500, max: 750 },
      ambiente:
        "Malasaña es el corazón alternativo de Madrid, con la movida en el ADN y capas de gentrificación encima. Lleno de bares de vinilos, tiendas vintage y terrazas hasta las 4AM los jueves. Muy popular entre Erasmus, jóvenes creativos y nómadas digitales que quieren Madrid al máximo.",
      transporte: [
        "Metro L2 (Noviciado, San Bernardo)",
        "Metro L1, L5, L10 (Gran Vía, Callao)",
        "Bus 3, 40, 149",
      ],
      perfilConviviente:
        "20–30 años, alta presencia de Erasmus y extranjeros. Creativos, músicos, freelances, gente del mundo del entretenimiento. Alta rotación de contratos de 6 meses. Si buscas tranquilidad, busca calles interiores.",
      pros: [
        "La vida social más intensa de Madrid a pie de calle",
        "Centralísimo — a pie de todo",
        "Alta oferta cultural: salas de conciertos, cines, museos cerca",
        "Ambiente internacional y diverso",
      ],
      cons: [
        "Ruido de fines de semana hasta el amanecer en algunas calles",
        "Alta rotación — difícil estabilidad",
        "Precio al alza constante por la gentrificación",
        "Aparcamiento imposible",
      ],
      moonTip:
        "En Malasaña el matching de horarios nocturnos es crítico. Los pisos con patio interior o en calles paralelas (no en la Corredera o San Andrés) tienen mejor aislamiento. Prioriza Moon Score de compañeros con historial.",
      seoTitle: "Habitación compartida en Malasaña, Madrid 2026 — precios y barrio",
      seoDescription:
        "Busca habitación compartida en Malasaña (Madrid). Precio medio 500–750 €/mes. El barrio más vivo de Madrid. Compañeros compatibles con moon.",
    },
    chamberi: {
      ciudad: "Madrid",
      barrio: "Chamberí",
      precioMedio: { min: 550, max: 800 },
      ambiente:
        "Chamberí es el barrio donde viven los madrileños que quieren buen nivel de vida sin irse a las afueras. Paseos anchos, mercados de barrio, muy buena calidad de construcción. Alta concentración de profesionales consolidados y familias jóvenes. Menos Erasmus, más indefinidos.",
      transporte: [
        "Metro L1, L7, L10 (Alonso Cano, Islas Filipinas)",
        "Metro L2, L4 (Alonso Martínez, Bilbao)",
        "Bus 3, 37, 149",
      ],
      perfilConviviente:
        "27–40 años, profesionales con trabajo estable. Muchos en consultoras, tech o finanzas. Valoran el orden, la puntualidad en gastos y la tranquilidad. Alta probabilidad de contratos de 1 año o más. Buena base para construir Moon Score.",
      pros: [
        "Calidad de construcción alta — muchos pisos rehabilitados",
        "Ambiente tranquilo sin perder centralidad",
        "Mercado de Vallehermoso y excelente oferta gastronómica",
        "Muy bien conectado a Nuevos Ministerios y Castellana",
      ],
      cons: [
        "Precio en la franja alta para Madrid",
        "Menos vida nocturna propia — hay que ir a Malasaña o Chueca",
        "Más difícil encontrar piso (menor rotación)",
      ],
      moonTip:
        "Chamberí tiene los convivientes con Moon Score más alto de Madrid de media — menor rotación significa más tiempo para acumular endosos y convivencias limpias. Ideal si vienes para quedarte.",
      seoTitle: "Habitación compartida en Chamberí, Madrid 2026 — precios y barrio",
      seoDescription:
        "Busca habitación compartida en Chamberí (Madrid). Precio medio 550–800 €/mes. Barrio tranquilo y bien conectado. Compañeros compatibles con moon.",
    },
    centro: {
      ciudad: "Madrid",
      barrio: "Centro",
      precioMedio: { min: 480, max: 750 },
      ambiente:
        "El Centro de Madrid es exactamente lo que el nombre dice: el corazón histórico, con la Puerta del Sol, la Plaza Mayor y los museos del Prado y Reina Sofía. Alta mezcla de turistas y residentes, mucho ruido pero máxima conectividad y acceso cultural. Los pisos en calles interiores son una apuesta segura.",
      transporte: [
        "Metro L1, L2, L3 (Sol — nodo central de toda la red)",
        "Metro L5 (La Latina, Ópera)",
        "Todas las líneas de bus pasan por el centro",
      ],
      perfilConviviente:
        "Perfil muy diverso: estudiantes de grado, Erasmus, recién llegados a Madrid de otras provincias, turistas de larga estancia. Alta rotación. Precio accesible para estar en el centro.",
      pros: [
        "Máxima centralidad geográfica y de transporte",
        "Todo a pie: museos, mercados, ocio, palacios",
        "Precio sorprendentemente accesible para lo que es",
        "Ningún rincón de Madrid queda lejos",
      ],
      cons: [
        "Ruido de turismo y ocio nocturno intenso",
        "Alta rotación de compañeros",
        "Algunos edificios con mantenimiento deficiente",
        "Dificultad para aparcar o recibir paquetes",
      ],
      moonTip:
        "En Centro, el inventario del piso al entrar es imprescindible. La alta rotación hace que el estado del piso varíe mucho. Usa la plantilla de inventario de moon y hazla el día 1 con fotos.",
      seoTitle: "Habitación compartida en Centro, Madrid 2026 — precios y barrio",
      seoDescription:
        "Busca habitación compartida en el Centro de Madrid. Precio medio 480–750 €/mes. Máxima centralidad. Compañeros compatibles con moon.",
    },
    retiro: {
      ciudad: "Madrid",
      barrio: "Retiro",
      precioMedio: { min: 560, max: 850 },
      ambiente:
        "Retiro combina el parque más emblemático de Madrid con uno de los barrios más tranquilos para vivir en la almendra central. Calles amplias y arboladas, mucho silencio nocturno, vecindario maduro y familiar. Ideal para profesionales que buscan calidad de vida sin alejarse del centro.",
      transporte: [
        "Metro L1, L9 (Retiro, Ibiza)",
        "Metro L2, L3, L5 (Atocha — Renfe)",
        "Bus 26, 32, 61",
      ],
      perfilConviviente:
        "25–40 años, profesionales en empresas consolidadas o en remoto. Perfil tranquilo, suelen quedarse 1-2 años. Alta presencia de funcionarios y empleados del sector público. Excelente para acumular Moon Score en convivencias largas.",
      pros: [
        "El Parque del Retiro a 5 minutos andando",
        "Máximo silencio nocturno para zona central",
        "Excelente calidad del aire y zonas verdes",
        "Cerca de Atocha y AVE",
      ],
      cons: [
        "Precio elevado para el perfil de barrio",
        "Vida nocturna escasa — hay que moverse al centro",
        "Menos vida de barrio «joven»",
      ],
      moonTip:
        "Si trabajas en remoto, Retiro es el top de Madrid: silencio diurno, parque cerca para despejar, y convivientes estables. El barrio tiene la tasa de conflicto de convivencia más baja de la ciudad.",
      seoTitle: "Habitación compartida en Retiro, Madrid 2026 — precios y barrio",
      seoDescription:
        "Busca habitación compartida en Retiro (Madrid). Precio medio 560–850 €/mes. Junto al parque, máxima tranquilidad. Compañeros compatibles con moon.",
    },
    salamanca: {
      ciudad: "Madrid",
      barrio: "Salamanca",
      precioMedio: { min: 650, max: 1000 },
      ambiente:
        "Salamanca es el barrio premium de Madrid — el equivalente madrileño al Eixample caro. Boutiques de lujo, restaurantes de todo tipo y una calidad de construcción alta en general. El precio es el más alto del batch, pero los pisos son de nivel. Muy popular entre expats en multinacionales y diplomáticos.",
      transporte: [
        "Metro L4 (Serrano, Velázquez, Goya)",
        "Metro L2, L5, L9 (Núñez de Balboa, Diego de León)",
        "Bus 1, 74, M3",
      ],
      perfilConviviente:
        "25–40 años con ingresos medios-altos o relocation package de empresa. Expats en multinacionales, abogados, financieros. Muy poco Erasmus. Alta estabilidad y contratos de 1 año mínimo.",
      pros: [
        "Calidad de construcción y acabados muy alta",
        "Barrio tranquilo y muy cuidado",
        "Excelente oferta gastronómica y comercial premium",
        "Bien conectado a la Castellana y las sedes empresariales",
      ],
      cons: [
        "El precio más caro de Madrid para compartir",
        "Menos vida de barrio joven y social",
        "Difícil encontrar disponibilidad — baja rotación",
      ],
      moonTip:
        "En Salamanca la señal de Moon Score importa más para entrar en los mejores pisos — los propietarios/anfitriones son selectivos. Ten el perfil verificado y el historial de convivencias en orden antes de aplicar.",
      seoTitle: "Habitación compartida en Salamanca, Madrid 2026 — precios y barrio",
      seoDescription:
        "Busca habitación compartida en Salamanca (Madrid). Precio medio 650–1000 €/mes. El barrio premium de Madrid. Compañeros compatibles con moon.",
    },
  },
};

export function getBarrioContent(
  ciudadSlug: string,
  barrioSlug: string,
): BarrioContent | null {
  return data[ciudadSlug]?.[barrioSlug] ?? null;
}

export function getBarrioSlugsForCity(ciudadSlug: string): string[] {
  return Object.keys(data[ciudadSlug] ?? {});
}

export function getAllBarrioPaths(): { ciudad: string; barrio: string }[] {
  return Object.entries(data).flatMap(([ciudad, barrios]) =>
    Object.keys(barrios).map((barrio) => ({ ciudad, barrio })),
  );
}
