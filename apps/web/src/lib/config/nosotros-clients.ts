import type { ClientLogo } from '@/lib/types/nosotros-page';

import acfMineraLogo from '@/assets/img/slider/trimmed/ACFMinera.png';
import aerosanLogo from '@/assets/img/slider/trimmed/aerosan.png';
import agrosuperLogo from '@/assets/img/slider/trimmed/Agrosuper.png';
import aguasAntofagastaLogo from '@/assets/img/slider/trimmed/AguasAntofagasta.png';
import andinaLogo from '@/assets/img/slider/trimmed/Andina.png';
import carozziLogo from '@/assets/img/slider/trimmed/Carozzi.png';
import ccuLogo from '@/assets/img/slider/trimmed/CCU.png';
import cementosBioBioLogo from '@/assets/img/slider/trimmed/Cementos.png';
import chilexpressLogo from '@/assets/img/slider/trimmed/chilexpress.png';
import chilquintaLogo from '@/assets/img/slider/trimmed/chilquinta.png';
import clinicaAlemanaLogo from '@/assets/img/slider/trimmed/ClinicaAlemana.png';
import cmpcLogo from '@/assets/img/slider/trimmed/CMPC.png';
import conchaYToroLogo from '@/assets/img/slider/trimmed/ConchaToro.png';
import construmartLogo from '@/assets/img/slider/trimmed/Construmart.png';
import corpescaLogo from '@/assets/img/slider/trimmed/Corpesca.png';
import doleLogo from '@/assets/img/slider/trimmed/Dole.png';
import dpWorldLogo from '@/assets/img/slider/trimmed/dp-worl.png';
import enamiLogo from '@/assets/img/slider/trimmed/Enami.png';
import enelLogo from '@/assets/img/slider/trimmed/Enel.png';
import epvLogo from '@/assets/img/slider/trimmed/Logo_EPV.png';
import gsLogo from '@/assets/img/slider/trimmed/GS.png';
import hormigonesPetreosLogo from '@/assets/img/slider/trimmed/Petreos.png';
import idealLogo from '@/assets/img/slider/trimmed/Ideal.png';
import kdmLogo from '@/assets/img/slider/trimmed/kdm.png';
import lobosLogo from '@/assets/img/slider/trimmed/Lobos.png';
import melonLogo from '@/assets/img/slider/trimmed/Melon.png';
import miguelTorresLogo from '@/assets/img/slider/trimmed/MiguelTorres.png';
import mollerPerezLogo from '@/assets/img/slider/trimmed/MollerPerez.png';
import pozosProfundosLogo from '@/assets/img/slider/trimmed/PozosProfundos.png';
import puertoLirquenLogo from '@/assets/img/slider/trimmed/PuertoLirquen.png';
import sanPedroLogo from '@/assets/img/slider/trimmed/SanPedro.png';
import sikaLogo from '@/assets/img/slider/trimmed/Sika.png';
import skyLogo from '@/assets/img/slider/trimmed/Sky.png';
import sodimacLogo from '@/assets/img/slider/trimmed/Sodimac.png';
import sopravalLogo from '@/assets/img/slider/trimmed/Sopraval.png';
import soproleLogo from '@/assets/img/slider/trimmed/Soprole.png';
import sqmLogo from '@/assets/img/slider/trimmed/sqm.png';
import tajamarLogo from '@/assets/img/slider/trimmed/Tajamar.png';
import unileverLogo from '@/assets/img/slider/trimmed/Unilever.png';
import vitalLogo from '@/assets/img/slider/trimmed/VitalJugos.png';
import wattsLogo from '@/assets/img/slider/trimmed/Watts.png';

/**
 * SSG configuration for the client-logo carousel of the public about page
 * (`/nosotros`, closing section). The 41 logos were delivered by the client in
 * `apps/web/src/assets/img/slider/`; this config consumes the trimmed variants
 * in `slider/trimmed/` (internal margins removed with `sharp.trim`) so every
 * logo fills the uniform carousel height at its real aspect ratio.
 * `astro:assets` re-encodes them to WebP at build time (image-assets
 * convention).
 *
 * The array order IS the carousel order: alphabetical by company name. The
 * `alt` is an explicit filename → company-name map (never derived from the
 * filename) because several filenames are inconsistent (`dp-worl.png`,
 * `sqm.png`, `Logo_EPV.png`, …). The display names of the ambiguous files were
 * verified against the delivered logos themselves.
 *
 * See `openspec/changes/nosotros-clients-carousel/design.md` (D5, D6, D8).
 */
export const CLIENT_LOGOS: readonly ClientLogo[] = [
  { image: acfMineraLogo, alt: 'ACF Minera' },
  { image: aerosanLogo, alt: 'Aerosan' },
  { image: agrosuperLogo, alt: 'Agrosuper' },
  { image: aguasAntofagastaLogo, alt: 'Aguas Antofagasta' },
  { image: andinaLogo, alt: 'Andina' },
  { image: carozziLogo, alt: 'Carozzi' },
  { image: ccuLogo, alt: 'CCU' },
  { image: cementosBioBioLogo, alt: 'Cementos Bío Bío' },
  { image: chilexpressLogo, alt: 'Chilexpress' },
  { image: chilquintaLogo, alt: 'Chilquinta' },
  { image: clinicaAlemanaLogo, alt: 'Clínica Alemana' },
  { image: cmpcLogo, alt: 'CMPC' },
  { image: conchaYToroLogo, alt: 'Concha y Toro' },
  { image: construmartLogo, alt: 'Construmart' },
  { image: corpescaLogo, alt: 'Corpesca' },
  { image: doleLogo, alt: 'Dole' },
  { image: dpWorldLogo, alt: 'DP World' },
  { image: enamiLogo, alt: 'ENAMI' },
  { image: enelLogo, alt: 'Enel' },
  { image: epvLogo, alt: 'EPV' },
  { image: gsLogo, alt: 'GS Gestión & Servicios' },
  { image: hormigonesPetreosLogo, alt: 'Hormigones Pétreos' },
  { image: idealLogo, alt: 'Ideal' },
  { image: kdmLogo, alt: 'KDM' },
  { image: lobosLogo, alt: 'Lobos' },
  { image: melonLogo, alt: 'Melón' },
  { image: miguelTorresLogo, alt: 'Miguel Torres' },
  { image: mollerPerezLogo, alt: 'Möller Pérez' },
  { image: pozosProfundosLogo, alt: 'Pozos Profundos' },
  { image: puertoLirquenLogo, alt: 'Puerto Lirquén' },
  { image: sanPedroLogo, alt: 'San Pedro' },
  { image: sikaLogo, alt: 'Sika' },
  { image: skyLogo, alt: 'Sky' },
  { image: sodimacLogo, alt: 'Sodimac' },
  { image: sopravalLogo, alt: 'Sopraval' },
  { image: soproleLogo, alt: 'Soprole' },
  { image: sqmLogo, alt: 'SQM' },
  { image: tajamarLogo, alt: 'Tajamar' },
  { image: unileverLogo, alt: 'Unilever' },
  { image: vitalLogo, alt: 'Vital' },
  { image: wattsLogo, alt: 'Watts' },
];

/** Duration of one full carousel cycle in seconds (client-specified: slow). */
export const CLIENTS_CAROUSEL_DURATION_SECONDS = 120;
