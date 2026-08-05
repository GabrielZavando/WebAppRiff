import { describe, it, expect } from 'vitest';
import { PANEL_HOME_CONTENT } from '@/lib/config/panel-home';

describe('PANEL_HOME_CONTENT', () => {
  it('stats has length 4 (task 1.3)', () => {
    expect(PANEL_HOME_CONTENT.stats).toHaveLength(4);
  });

  it('stats[0].value === "40+" and stats[3].value === "9+" (task 1.4)', () => {
    const first = PANEL_HOME_CONTENT.stats[0];
    const last = PANEL_HOME_CONTENT.stats[3];
    expect(first?.value).toBe('40+');
    expect(last?.value).toBe('9+');
  });

  it('cta points to /contacto with label "SOLICITAR ASESORÍA TÉCNICA" and variant primary (task 1.5)', () => {
    expect(PANEL_HOME_CONTENT.cta.href).toBe('/contacto');
    expect(PANEL_HOME_CONTENT.cta.label).toBe('SOLICITAR ASESORÍA TÉCNICA');
    expect(PANEL_HOME_CONTENT.cta.variant).toBe('primary');
  });

  it('each stat label matches the uppercase regex /^[A-ZÁÉÍÓÚÑ0-9\\s+]+$/ (task 1.6)', () => {
    const regex = /^[A-ZÁÉÍÓÚÑ0-9\s+]+$/;
    for (const stat of PANEL_HOME_CONTENT.stats) {
      expect(stat.label).toMatch(regex);
    }
  });

  it('eyebrow === "DESDE 1979", headline contains "Más de 40 Años", description is non-empty (task 1.7)', () => {
    expect(PANEL_HOME_CONTENT.eyebrow).toBe('DESDE 1979');
    expect(PANEL_HOME_CONTENT.headline).toContain('Más de 40 Años');
    expect(typeof PANEL_HOME_CONTENT.description).toBe('string');
    expect(PANEL_HOME_CONTENT.description.length).toBeGreaterThan(0);
  });
});
