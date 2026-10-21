import type {
  ServicesHeroProps,
  ServicesPageProps,
  ServiciosPortafolioSectionProps,
  ServiciosTerrenoSectionProps,
} from '@/lib/types/services-page';
import edificiosImg from '@/assets/img/edificios.jpg';
import medidoresImg from '@/assets/img/medidores-de-agua.webp';
import obrasImg from '@/assets/img/planta-tratamiento.webp';
import osmosisImg from '@/assets/img/osmosis-inversa.jpg';

/**
 * Hardcoded content for the public services page (`/servicios`).
 *
 * Lives in `lib/config/` so `apps/web/src/pages/servicios.astro` can compose
 * the two sections without the components needing to know the copy or the
 * image imports (same pattern as `REPRESENTACIONES_PAGE_CONTENT`). As the site
 * is SSG, any change requires a rebuild anyway.
 *
 * Copy source: `docs/design/components/soluciones/modelo.html` and
 * `modelo.png` (client mockup). The Stitch/Material colors and typography are
 * remapped to Riff design tokens by the components (design.md D4); the copy is
 * used verbatim (design.md D1/D9).
 *
 * Images follow the `image-assets` convention (frontend-standards § "Imágenes
 * del sitio"): every optimizable site image lives in `assets/img/` and is
 * consumed via `astro:assets`. The four section-2 images are the existing
 * service photos; the portfolio section uses icons only.
 */

/**
 * Hero section content for the services page. Kept unchanged from the previous
 * design: the redesign preserves the Hero (requirement 3).
 *
 * "Servicios Industriales" is the highlighted substring, wrapped in `<span
 * class="text-primary">` by `ServicesHero.astro` via `splitHeadline()`.
 */
export const SERVICIOS_PAGE_HERO: Readonly<ServicesHeroProps> = {
  headline:
    'Portafolio industrial de soluciones & Servicios Industriales',
  highlightedWord: 'Servicios Industriales',
  subtitle:
    'Soluciones técnicas integrales para la instalación, mantenimiento y optimización de sistemas de medición y tratamiento de fluidos. Respaldo por décadas de ingeniería y ejecución en terreno.',
};

/**
 * Section 1: "Nuestras Soluciones — Portafolio Técnico".
 *
 * Four technical rows in the reference order. `id` is the scroll anchor; `icon`
 * is a Lucide name consumed by `astro-icon`. The specs panel admits two to four
 * label/value pairs; each card uses three or four in the reference design.
 */
export const SERVICIOS_PORTFOLIO_SECTION: Readonly<ServiciosPortafolioSectionProps> =
  {
    eyebrow: 'LÍNEA DE EQUIPAMIENTO & TECNOLOGÍA',
    headline: 'Nuestras Soluciones — Portafolio Técnico',
    intro:
      'Suministro especializado, instrumentación y tecnologías certificadas para redes de agua, plantas industriales y minería.',
    solutions: [
      {
        id: 'solucion-medicion-fluidos',
        icon: 'lucide:gauge',
        category: 'Instrumentación de Precisión',
        title: 'Medición de Fluidos',
        description:
          'Equipos y soluciones para medir caudal con precisión, optimizando el control y la eficiencia de sus procesos. Proveemos tecnologías electromagnéticas, ultrasónicas (tiempo de tránsito / Doppler) y mecánicas para líquidos limpios, lodos y aguas residuales con conectividad telemétrica en tiempo real.',
        specsTitle: 'Especificaciones Técnicas Clave',
        specs: [
          { label: 'Precisión Estándar:', value: '±0.2% a ±0.5%' },
          { label: 'Tecnología:', value: 'Ultrasónica / Electromag.' },
          {
            label: 'Salidas & Telemetría:',
            value: '4-20mA, Modbus, LoRaWAN',
          },
        ],
        tagsLabel: 'Sectores e Industrias:',
        tags: [
          'Minería & Procesos',
          'Sanitarias & Riego',
          'Industria de Alimentos',
          'Comunidades Habitacionales',
          'Normativa DGA Res. 1238',
        ],
        ctaLabel: 'Solicitar Asesoría Técnica',
        ctaHref: '/contacto',
      },
      {
        id: 'solucion-tratamiento-agua',
        icon: 'lucide:droplets',
        category: 'Purificación & Desalinización',
        title: 'Tratamiento de Agua',
        description:
          'Sistemas integrales de tratamiento de agua para garantizar la calidad del recurso en aplicaciones industriales y sanitarias. Filtros de lecho profundo, ultrafiltración, ósmosis inversa para agua salobre o de mar, desmineralización por intercambio iónico y monitoreo continuo de conductividad, turbidez y pH.',
        specsTitle: 'Sistemas Disponibles en Catálogo',
        specs: [
          {
            label: 'Desalinización / Osmosis Inversa:',
            value: 'Plantas modulares 5 a 150 m³/día',
          },
          {
            label: 'Filtración Multimedia:',
            value: 'Antracita, arena sílice y zeolitas',
          },
          {
            label: 'Ablandamiento & Desmineralización:',
            value: 'Resinas catiónicas y lecho mixto',
          },
          {
            label: 'Desinfección & Pulido:',
            value: 'Sistemas UV industriales y Generadores Cloro',
          },
        ],
        tagsLabel: 'Cumplimiento de Estándares:',
        tags: [
          'NCh 409 Agua Potable',
          'D.S. 90 / 609 RILes',
          'Agua de Alimentación a Calderas',
          'Torres de Enfriamiento',
        ],
        ctaLabel: 'Solicitar Asesoría Técnica',
        ctaHref: '/contacto',
      },
      {
        id: 'solucion-productos-quimicos',
        icon: 'lucide:flask-conical',
        category: 'Química Industrial & Dosificación',
        title: 'Productos Químicos',
        description:
          'Dosificación y manejo de productos químicos con precisión, maximizando seguridad y resultados operativos. Proveemos formulaciones químicas certificadas para acondicionamiento térmico y membranas, junto a skids de inyección automatizada, bombas dosificadoras de diafragma electromagnéticas y estanques de almacenamiento homologados.',
        specsTitle: 'Líneas de Químicos y Equipos',
        specs: [
          {
            label: 'Antiincrustantes & Dispersantes:',
            value: 'Específicos para sílice, sulfatos y carbonatos',
          },
          {
            label: 'Biocidas & Alguicidas:',
            value: 'Oxidantes y no oxidantes de amplio espectro',
          },
          {
            label: 'Bombas Dosificadoras:',
            value: 'Caudal ajustable 0.1 a 100 L/h, hasta 16 bar',
          },
          {
            label: 'Estanques Homologados:',
            value: 'PEAD virgen con pretil de contención antiderrame',
          },
        ],
        tagsLabel: 'Seguridad y Cumplimiento:',
        tags: [
          'HDS según NCh 2245',
          'D.S. 43 Almacenamiento Sustancias Peligrosas',
          'Certificación NSF 60',
        ],
        ctaLabel: 'Solicitar Asesoría Técnica',
        ctaHref: '/contacto',
      },
      {
        id: 'solucion-control-accesorios',
        icon: 'lucide:settings-2',
        category: 'Válvulas & Automatización',
        title: 'Control y Accesorios',
        description:
          'Válvulas, accesorios y sistemas de control para una operación hidráulica confiable y de alto rendimiento. Disponemos de válvulas de retención, mariposa, compuertas elásticas, reguladoras de presión hidráulicas autónomas, actuadores neumáticos y telemetría de transmisión directa para cumplimiento DGA.',
        specsTitle: 'Familia de Componentes Hidráulicos',
        specs: [
          {
            label: 'Válvulas de Control:',
            value: 'Reductoras, sostenedoras y alivio rápido',
          },
          {
            label: 'Actuación & Maniobra:',
            value: 'Actuadores eléctricos multivueltas y neumáticos',
          },
          {
            label: 'Filtros & Desarenadores:',
            value: 'Tipo Y, Canasta y filtros de malla autolimpiantes',
          },
          {
            label: 'Dataloggers & Telemetría:',
            value: 'Homologados DGA con panel solar y batería interna',
          },
        ],
        tagsLabel: 'Aplicaciones Operacionales:',
        tags: [
          'Matrices de Agua Potable',
          'Pozos Profundos',
          'Plantas Térmicas de Vapor',
          'Sistemas Contra Incendio (UL/FM)',
        ],
        ctaLabel: 'Solicitar Asesoría Técnica',
        ctaHref: '/contacto',
      },
    ],
  };

/**
 * Section 2: "Servicios Especializados en Terreno".
 *
 * The four `slug` values MUST stay 1:1 with the home `SERVICES_DATA` slugs so
 * the home CTAs can deep-link to `/servicios#{slug}`. Each card uses exactly one
 * `body` variant, in the reference order: features, bullets, tags, bullets.
 */
export const SERVICIOS_FIELD_SECTION: Readonly<ServiciosTerrenoSectionProps> = {
  eyebrow: 'EJECUCIÓN, MONTAJE & POSTVENTA',
  headline: 'Servicios Especializados en Terreno',
  intro:
    'Cuadrillas de ingenieros y técnicos calificados para instalación, puesta en marcha y mantenimiento con herramientas de última generación.',
  services: [
    {
      slug: 'medicion-en-edificios',
      index: 1,
      sector: 'RESIDENCIAL & COMERCIAL',
      title: 'Medición en Edificios',
      description:
        'Instalación y recambio de medidores de agua caliente y fría en comunidades residenciales y centros comerciales. Aseguramos la máxima precisión en el consumo mediante la implementación de tecnología volumétrica y ultrasónica, eliminando subfacturaciones por pérdidas ocultas y garantizando un reparto de gastos comunes transparente y auditable.',
      image: edificiosImg,
      imageAlt: 'Edificios residenciales con instalación de medidores de agua',
      imageCaptionLabel: 'COMPATIBILIDAD TELEMÉTRICA',
      imageCaption:
        'Lectura remota por radiofrecuencia (Walk-By / Drive-By / Red Fija).',
      body: {
        kind: 'features',
        features: [
          {
            title: 'Recambio Masivo Programado',
            description:
              'Reemplazo de bancos de medidores antiguos sin interrupción prolongada del suministro de agua potable.',
          },
          {
            title: 'Plataforma de Facturación',
            description:
              'Integración con software de administración de condominios mediante exportación automática de métricas.',
          },
        ],
      },
      ctaLabel: 'Contactar a un Especialista',
      ctaHref: '/contacto',
    },
    {
      slug: 'medicion-industrial',
      index: 2,
      sector: 'MINERÍA & MANUFACTURA',
      title: 'Medición Industrial',
      description:
        'Instalación, calibración en terreno y puesta en marcha de sistemas de medición de caudal para procesos industriales complejos. Proveemos soluciones robustas diseñadas para operar bajo condiciones severas de presión, temperatura y sólidos en suspensión, garantizando la exactitud de los datos críticos necesarios para balance de masa, control de procesos y fiscalización ambiental.',
      image: medidoresImg,
      imageAlt: 'Medidores de agua instalados en infraestructura industrial',
      imageCaptionLabel: 'CONDICIONES CRÍTICAS',
      imageCaption:
        'Operación continua en fluidos abrasivos, pulpas mineras y altas presiones.',
      body: {
        kind: 'bullets',
        bullets: [
          {
            strong: 'Precisión Certificada:',
            text: 'Calibraciones in situ con caudalímetros ultrasónicos clamp-on de referencia.',
          },
          {
            strong: 'Integración de Comunicaciones:',
            text: 'Enlace a sistemas SCADA, DCS y PLC mediante Profibus-DP, Modbus TCP y HART.',
          },
          {
            strong: 'Transmisión DGA:',
            text: 'Configuración y validación del sistema de transmisión de caudales de extracción efectiva.',
          },
        ],
      },
      ctaLabel: 'Contactar a un Especialista',
      ctaHref: '/contacto',
    },
    {
      slug: 'obras-y-proyectos',
      index: 3,
      sector: 'INGENIERÍA & CONSTRUCCIÓN',
      title: 'Obras y Proyectos',
      description:
        'Desarrollo integral de infraestructura para sistemas de medición, piping y estaciones de bombeo. Nuestro equipo multidisciplinario gestiona el ciclo completo del proyecto, desde el diseño hidráulico y estructural hasta la fabricación de manifolds en taller, obras civiles en hormigón armado, montaje electromecánico y pruebas hidrostáticas certificadas.',
      image: obrasImg,
      imageAlt: 'Planta de tratamiento de agua en operación',
      imageCaptionLabel: 'INGENIERÍA EPC / LLAVE EN MANO',
      imageCaption:
        'Desde la ingeniería básica hasta la entrega operacional comisionada.',
      body: {
        kind: 'tags',
        tags: [
          'Ingeniería Conceptual y de Detalle',
          'Spools & Tuberías HDPE / Acero Carbono',
          'Cámaras de Medición de Hormigón',
          'Montaje de Tableros Eléctricos y VDF',
          'Comisionamiento & Start-up',
        ],
      },
      ctaLabel: 'Contactar a un Especialista',
      ctaHref: '/contacto',
    },
    {
      slug: 'tratamiento-de-agua',
      index: 4,
      sector: 'QUÍMICA & PROCESOS',
      title: 'Tratamiento de Agua y Desalinización',
      description:
        'Diseño, montaje y optimización operacional de plantas de tratamiento de agua potable, desalinización de agua de mar y reúso de efluentes industriales. Implementamos trenes de membranas de alta eficiencia energética con sistemas de recuperación de energía (ERS), planes de limpieza química (CIP) programada y dosificación inteligente de insumos para extender la vida útil de los activos.',
      image: osmosisImg,
      imageAlt:
        'Sistema de osmosis inversa para tratamiento y desalinización de agua',
      imageCaptionLabel: 'CALIDAD CONTINUA',
      imageCaption:
        'Monitoreo analítico online de SDI, conductividad y cloro libre.',
      body: {
        kind: 'bullets',
        bullets: [
          {
            strong: 'Plantas de Osmosis Inversa (RO):',
            text: 'Soluciones contenerizadas plug & play para faenas remotas y campamentos mineros.',
          },
          {
            strong: 'Limpiezas CIP & Autopsia de Membranas:',
            text: 'Diagnóstico de ensuciamiento orgánico/inorgánico y recuperación de flujo permeado.',
          },
          {
            strong: 'Eficiencia Energética Hidráulica:',
            text: 'Reducción de kWh/m³ mediante bombas de alta presión e intercambiadores isobáricos.',
          },
        ],
      },
      ctaLabel: 'Contactar a un Especialista',
      ctaHref: '/contacto',
    },
  ],
};

/** Full props bag for the services page. */
export const SERVICIOS_PAGE_CONTENT: Readonly<ServicesPageProps> = {
  hero: SERVICIOS_PAGE_HERO,
  portfolioSection: SERVICIOS_PORTFOLIO_SECTION,
  fieldServicesSection: SERVICIOS_FIELD_SECTION,
};
