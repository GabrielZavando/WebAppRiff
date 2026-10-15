import { describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertComponent } from './alert.component';

/**
 * Inline banner (task 1.2 / design D4): success and error variants built from
 * Riff `@theme` tokens, flat design (no `rounded*`, no `shadow*`, no `dark:`).
 */
describe('AlertComponent', () => {
  let fixture: ComponentFixture<AlertComponent>;

  function render(variant: 'success' | 'error', message: string): HTMLElement {
    fixture = TestBed.createComponent(AlertComponent);
    fixture.componentRef.setInput('variant', variant);
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the message with the success tokens', () => {
    const el = render('success', 'Producto creado con éxito.');
    const banner = el.querySelector('[data-alert]') as HTMLElement;

    expect(banner.textContent).toContain('Producto creado con éxito.');
    expect(banner.className).toContain('bg-success-light');
    expect(banner.className).toContain('text-success-dark');
    expect(banner.className).toContain('border-success');
    expect(banner.getAttribute('role')).toBe('status');
  });

  it('renders the message with the error tokens', () => {
    const el = render('error', 'No se pudo eliminar.');
    const banner = el.querySelector('[data-alert]') as HTMLElement;

    expect(banner.textContent).toContain('No se pudo eliminar.');
    expect(banner.className).toContain('bg-error-light');
    expect(banner.className).toContain('text-error-dark');
    expect(banner.className).toContain('border-error');
    expect(banner.getAttribute('role')).toBe('alert');
  });

  it('keeps the flat design: no rounded corners, no shadows, no dark variants', () => {
    const el = render('error', 'Fallo.');
    const banner = el.querySelector('[data-alert]') as HTMLElement;

    expect(banner.className).not.toMatch(/rounded/);
    expect(banner.className).not.toMatch(/shadow/);
    expect(banner.className).not.toMatch(/dark:/);
  });
});
