import { describe, it, expect } from 'vitest';
import {
  CONTACT_AREAS,
  CONTACT_FORM_CONFIG,
  CONTACT_PAGE_CONTENT,
} from '@/lib/config/contact-page';

describe('CONTACT_AREAS', () => {
  it('has exactly five areas with non-empty id and label', () => {
    expect(CONTACT_AREAS).toHaveLength(5);
    for (const area of CONTACT_AREAS) {
      expect(area.id.length).toBeGreaterThan(0);
      expect(area.label.length).toBeGreaterThan(0);
    }
  });

  it('exposes the five expected domain areas in order', () => {
    const ids = CONTACT_AREAS.map((area) => area.id);
    expect(ids).toEqual([
      'medicion-fluidos',
      'tratamiento-agua',
      'productos-quimicos',
      'control-accesorios',
      'servicio-tecnico',
    ]);
  });
});

describe('CONTACT_FORM_CONFIG', () => {
  it('defaults action to the future backend contacts endpoint', () => {
    expect(CONTACT_FORM_CONFIG.action).toBe('/api/v1/contacts');
  });

  it('defaults submit label to ENVIAR MENSAJE', () => {
    expect(CONTACT_FORM_CONFIG.submitLabel).toBe('ENVIAR MENSAJE');
  });

  it('carries placeholders for the text inputs and the message', () => {
    expect(CONTACT_FORM_CONFIG.placeholders.nombre).toBeTruthy();
    expect(CONTACT_FORM_CONFIG.placeholders.empresa).toBeTruthy();
    expect(CONTACT_FORM_CONFIG.placeholders.email).toBeTruthy();
    expect(CONTACT_FORM_CONFIG.placeholders.telefono).toBeTruthy();
    expect(CONTACT_FORM_CONFIG.placeholders.mensaje).toBeTruthy();
  });
});

describe('CONTACT_PAGE_CONTENT.bar', () => {
  it('uses the canonical Riff phone and email constants', () => {
    expect(CONTACT_PAGE_CONTENT.bar.phone).toBe('+56 2 29079067');
    expect(CONTACT_PAGE_CONTENT.bar.email).toBe('contacto@riff.cl');
    expect(CONTACT_PAGE_CONTENT.bar.phoneHref).toBe('tel:+56229079067');
    expect(CONTACT_PAGE_CONTENT.bar.emailHref).toBe('mailto:contacto@riff.cl');
  });
});

describe('CONTACT_PAGE_CONTENT form wiring', () => {
  it('binds the form areas and config together', () => {
    expect(CONTACT_PAGE_CONTENT.form.areas).toBe(CONTACT_AREAS);
    expect(CONTACT_PAGE_CONTENT.form.config).toBe(CONTACT_FORM_CONFIG);
  });
});
