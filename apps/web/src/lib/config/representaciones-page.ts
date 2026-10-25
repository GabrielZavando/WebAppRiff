import apatorLogo from '@/assets/img/representaciones/apator-logo.png';
import glFlowLogo from '@/assets/img/representaciones/GL-Flow.webp';
import ilmapLogo from '@/assets/img/representaciones/Ilmap-logo.webp';
import nittoSeikoLogo from '@/assets/img/representaciones/nittoseiko-logo.jpg';
import piusiLogo from '@/assets/img/representaciones/piusi-logo.png';
import riffMetersLogo from '@/assets/img/representaciones/Riff-meters.png';
import sensusLogo from '@/assets/img/representaciones/sensus-logo.webp';
import type { RepresentacionesPageContent } from '@/lib/types/representaciones-page';

/**
 * Hardcoded content for the public `/representaciones` page.
 *
 * Lives in `lib/config/` so `apps/web/src/pages/representaciones.astro` can
 * compose the section components without them knowing the copy (same pattern as
 * `SERVICIOS_PAGE_CONTENT` / `CONTACT_PAGE_CONTENT`). As the site is SSG, any
 * change requires a rebuild anyway.
 *
 * Copy source: `docs/design/components/representaciones/reference.html` and
 * `reference.png` (client mockup). The Stitch/Material colors and typography
 * were remapped to Riff design tokens (design.md § D5). Company logos are the
 * real assets delivered in `src/assets/img/representaciones/` (design.md § D1).
 */
export const REPRESENTACIONES_PAGE_CONTENT: Readonly<RepresentacionesPageContent> =
  {
    title: 'Representaciones — Riff',
    description:
      'Representaciones exclusivas y distribuciones autorizadas de Riff: metrología hídrica e industrial de fabricantes de Europa, Japón y América.',

    hero: {
      eyebrow: 'ALIANZAS GLOBALES DE ALTA PRECISIÓN',
      headline: 'Alianzas Estratégicas y Representación Exclusiva',
      highlightedWord: 'Representación Exclusiva',
      intro:
        'Conectando a la minería, industria química y empresas sanitarias de Chile con la manufactura metrológica más avanzada de Europa, Japón y América. Transferencia tecnológica directa sin intermediarios.',
      metrics: [
        {
          value: '05',
          label: 'Representaciones Exclusivas',
          caption: 'Soporte directo de fábrica',
          valueTone: 'primary',
        },
        {
          value: '02',
          label: 'Distribuciones Oficiales',
          caption: 'Stock garantizado en bodega',
          valueTone: 'accent',
        },
        {
          value: '100%',
          label: 'Garantía Directa de Fábrica',
          caption: 'Certificación trazable',
          valueTone: 'surface',
        },
      ],
    },

    brandsSection: {
      eyebrow: 'CATÁLOGO OFICIAL DE FABRICANTES',
      headline: 'Marcas de Representación Exclusiva',
      brands: [
        {
          id: 'apator-powogaz',
          logo: apatorLogo,
          url: 'https://www.apator.com/en',
          chip: 'Polonia / UE',
          sublabel: 'Partner Exclusivo desde 2004',
          title: 'Apator Powogaz',
          category: 'Medición Volumétrica y Macromedición',
          description:
            'Referente europeo en metrología hídrica con certificación MID e ISO 4064. Soluciones de chorro único, múltiple y tecnología Woltman de alta precisión R160/R200 para redes de agua potable, riego y servicios sanitarios.',
        },
        {
          id: 'riff-flow-metering',
          logo: riffMetersLogo,
          url: 'https://riffmeters.com/',
          chip: 'Marca Propia / Chile',
          sublabel: 'Desarrollo y Banco Local',
          title: 'RIFF Flow Metering',
          category: 'Electromagnéticos, Ultrasónicos y Telemetría',
          description:
            'Ingeniería especializada para minería e industria pesada. Medidores electromagnéticos y ultrasónicos con dataloggers homologados para integración telemática directa según normativa DGA.',
        },
        {
          id: 'nitto-seiko',
          logo: nittoSeikoLogo,
          url: 'https://global.nittoseiko.com/',
          chip: 'Japón',
          sublabel: 'Distribución Técnica Oficial',
          title: 'Nitto Seiko',
          category: 'Desplazamiento Positivo y Flujo Viscoso',
          description:
            'Precisión metrológica japonesa para combustibles, lubricantes y fluidos de alta viscosidad mediante tecnología de engranajes ovales y pistón rotativo sin necesidad de tramos rectos.',
        },
        {
          id: 'gl-sanitaria',
          logo: glFlowLogo,
          chip: 'Italia / UE',
          sublabel: 'Representación Directa',
          title: 'GL Sanitaria',
          category: 'Grado Alimentario y Farmacéutico',
          description:
            'Instrumentación sanitaria certificada 3-A y EHEDG en acero inoxidable 316L, apta para ciclos CIP/SIP en procesos de alimentos, lácteos, bebidas y formulaciones químicas finas.',
        },
        {
          id: 'ilmap',
          logo: ilmapLogo,
          url: 'https://ilmap.com/es/',
          chip: 'Italia / Industrial',
          sublabel: 'Representante Oficial',
          title: 'ILMAP',
          category: 'Sistemas de Filtración y Toberas Drenantes',
          description:
            'Toberas filtrantes y difusores en polipropileno, PVDF y acero inoxidable para lechos de intercambio iónico, filtros de arena, desmineralización y plantas de tratamiento de agua.',
        },
      ],
    },

    distributorsSection: {
      eyebrow: 'CANAL DE DISTRIBUCIÓN CALIFICADO',
      headline: 'Somos Distribuidores Autorizados de:',
      intro:
        'Contamos con certificación directa para suministro, montaje y parametrización de equipos de líderes mundiales en fluidos y redes inteligentes.',
      distributors: [
        {
          id: 'piusi',
          name: 'PIUSI',
          logo: piusiLogo,
          url: 'https://www.piusi.com/es/',
          badge: 'Italia',
          icon: 'lucide:fuel',
          title: 'Contadores de Litros y Despacho de Combustibles',
          description:
            'Líder global en sistemas de trasvasije, medición y control de hidrocarburos, lubricantes, AdBlue y fluidos de taller minero. Suministro integral de medidores digitales K24, K600, bombas Panther y surtidores de alta precisión.',
          bullets: [
            'Medidores de pulsos y mecánicos para combustible',
            'Sistemas de gestión de flotas y despacho controlado',
            'Pistolas de llenado automático con corte de flujo',
          ],
          guarantee: 'Garantía Oficial PIUSI Italia',
        },
        {
          id: 'sensus',
          name: 'SENSUS',
          logo: sensusLogo,
          url: 'https://www.sensus-international.com/en',
          badge: 'Xylem Brand',
          icon: 'lucide:radio-tower',
          title: 'Medición Inteligente de Agua y Redes Sanitarias',
          description:
            'Tecnología de referencia en medición para empresas sanitarias y distribución de agua potable. Macromedidores mecánicos y estáticos de altísima resistencia, telemetría bidireccional y soluciones de gestión de pérdidas (ANR).',
          bullets: [
            'Macromedidores Woltman MeiStream e iPERL',
            'Módulos de comunicación radiofrecuencia SensusRF',
            'Integración de datos AMI/AMR para compañías de agua',
          ],
          guarantee: 'Garantía Xylem / Sensus',
        },
      ],
    },

    valuePropsSection: {
      eyebrow: 'GARANTÍA CORPORATIVA RIFF SPA',
      headline: '¿Por qué adquirir a través del representante oficial en Chile?',
      intro:
        'Evite pérdidas por rechazo de proyectos o equipos no homologados ante la autoridad. Asegure respaldo operacional para activos de larga vida útil.',
      valueProps: [
        {
          id: 'respaldo-tecnico',
          icon: 'lucide:wrench',
          indexLabel: '01 / Respaldo Técnico',
          title: 'Soporte de Ingeniería Local',
          description:
            'Ingenieros de fluidos certificados directamente por los fabricantes europeos y japoneses para dimensionamiento hidráulico y configuración.',
          accent: 'primary',
        },
        {
          id: 'marco-normativo',
          icon: 'lucide:clipboard-check',
          indexLabel: '02 / Marco Normativo',
          title: 'Homologación DGA Chile',
          description:
            'Equipos validados según las normativas vigentes de la Dirección General de Aguas para control de extracciones efectivas y reporte telemático.',
          accent: 'accent',
        },
        {
          id: 'logistica-repuestos',
          icon: 'lucide:package',
          indexLabel: '03 / Logística & Repuestos',
          title: 'Stock Inmediato en Santiago',
          description:
            'Bodega centralizada con componentes críticos, medidores de reemplazo rápido, mecanismos de recambio y accesorios de montaje.',
          accent: 'primary',
        },
        {
          id: 'certificacion',
          icon: 'lucide:shield-check',
          indexLabel: '04 / Certificación',
          title: 'Garantía Directa de Fabricante',
          description:
            'Trazabilidad de origen y certificados de calibración emitidos en fábrica bajo estándares OIML y calibración secundaria en Chile.',
          accent: 'secondary',
        },
      ],
    },
  };
