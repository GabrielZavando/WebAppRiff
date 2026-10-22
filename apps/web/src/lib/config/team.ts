import type { TeamMember } from '@/lib/types/team';
import rubyBarrientosImg from '@/assets/img/nosotros/ruby-barrientos.jpg';
import felipeRomanImg from '@/assets/img/nosotros/felipe-roman.jpg';
import patricioBarrientosImg from '@/assets/img/nosotros/patricio-barrientos.jpg';
import franciscoMehechImg from '@/assets/img/nosotros/francisco-mehech.jpg';
import ericPerezImg from '@/assets/img/nosotros/eric-perez.jpg';
import loredanaQuirogaImg from '@/assets/img/nosotros/loredana-quiroga.jpg';
import francysPadraImg from '@/assets/img/nosotros/francys-padra.jpg';
import melanyBravoImg from '@/assets/img/nosotros/melany-bravo.jpg';

/**
 * Canonical Riff team roster, shared by the home page and `/nosotros`.
 *
 * The array order is the render order on `/nosotros` and the relative order
 * of the featured selection on the home page. `isFeatured` marks the three
 * members highlighted on the home page (Ruby, Felipe and Patricio).
 */
export const TEAM_MEMBERS: readonly TeamMember[] = [
  {
    id: 'ruby-barrientos',
    name: 'Ruby Barrientos',
    role: 'Directora · Gerenta Comercial',
    description:
      'A cargo de la estrategia comercial y el desarrollo de RIFF, orientando el crecimiento, las relaciones estratégicas y la generación de nuevas oportunidades de negocio.',
    image: rubyBarrientosImg,
    imageAlt:
      'Retrato de Ruby Barrientos, directora y gerenta comercial de Riff, en una oficina corporativa.',
    isFeatured: true,
  },
  {
    id: 'felipe-roman',
    name: 'Felipe Román',
    role: 'Gerente de Operaciones',
    description:
      'A cargo de la gestión operativa, coordinando procesos, recursos y proyectos para asegurar una ejecución eficiente y el cumplimiento de los compromisos con nuestros clientes.',
    image: felipeRomanImg,
    imageAlt:
      'Retrato de Felipe Román, gerente de operaciones de Riff, en un entorno industrial.',
    isFeatured: true,
  },
  {
    id: 'patricio-barrientos',
    name: 'Patricio Barrientos',
    role: 'Ingeniero Químico · Asesor Técnico',
    description:
      'Referente técnico en tratamiento de agua y procesos industriales, aportando experiencia y conocimiento especializado en el análisis y desarrollo de soluciones para aplicaciones de distinta complejidad.',
    image: patricioBarrientosImg,
    imageAlt:
      'Retrato de Patricio Barrientos, ingeniero químico y asesor técnico de Riff.',
    isFeatured: true,
  },
  {
    id: 'francisco-mehech',
    name: 'Francisco Mehech',
    role: 'Coordinador de Servicios y Logística',
    description:
      'Coordina la gestión de servicios en terreno y los procesos logísticos asociados, articulando requerimientos, recursos y entregas para dar respuesta a las necesidades de cada proyecto.',
    image: franciscoMehechImg,
    imageAlt:
      'Retrato de Francisco Mehech, coordinador de servicios y logística de Riff.',
    isFeatured: false,
  },
  {
    id: 'eric-perez',
    name: 'Eric Pérez',
    role: 'Responsable de Ingeniería y Puesta en Marcha',
    description:
      'Referente del área de ingeniería en terreno, instalación, instrumentación y puesta en marcha de equipos y sistemas, apoyando además el diagnóstico y resolución de requerimientos técnicos de mayor complejidad.',
    image: ericPerezImg,
    imageAlt:
      'Retrato de Eric Pérez, responsable de ingeniería y puesta en marcha de Riff.',
    isFeatured: false,
  },
  {
    id: 'loredana-quiroga',
    name: 'Loredana Quiroga',
    role: 'Líder de Ventas Técnicas y Licitaciones',
    description:
      'A cargo de la gestión de ventas técnicas y oportunidades provenientes de licitaciones y portales, coordinando propuestas y requerimientos para diferentes aplicaciones y sectores industriales.',
    image: loredanaQuirogaImg,
    imageAlt:
      'Retrato de Loredana Quiroga, líder de ventas técnicas y licitaciones de Riff.',
    isFeatured: false,
  },
  {
    id: 'francys-padra',
    name: 'Francys Padra',
    role: 'Responsable de Desarrollo Comercial',
    description:
      'Orienta la gestión y desarrollo de oportunidades comerciales, fortaleciendo la relación con clientes y conectando sus requerimientos con el portafolio de productos y servicios de RIFF.',
    image: francysPadraImg,
    imageAlt:
      'Retrato de Francys Padra, responsable de desarrollo comercial de Riff.',
    isFeatured: false,
  },
  {
    id: 'melany-bravo',
    name: 'Melany Bravo',
    role: 'Coordinadora de Gestión Interna',
    description:
      'Coordina procesos administrativos y de soporte interno, facilitando la gestión documental y la articulación entre las distintas áreas de la organización.',
    image: melanyBravoImg,
    imageAlt:
      'Retrato de Melany Bravo, coordinadora de gestión interna de Riff.',
    isFeatured: false,
  },
];

/** The members highlighted on the home page, in canonical roster order. */
export const FEATURED_TEAM_MEMBERS: readonly TeamMember[] = TEAM_MEMBERS.filter(
  (member) => member.isFeatured,
);
