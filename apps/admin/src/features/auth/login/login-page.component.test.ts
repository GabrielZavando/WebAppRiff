import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ɵresolveComponentResources } from '@angular/core';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LoginPageComponent } from './login-page.component';

/**
 * Unit tests for the admin login panel (UI-only change `admin-login-panel`,
 * ticket LOGIN-1). Scope: SC-001..SC-005, SC-007, SC-008.
 *
 * The component is a smart standalone container (OnPush) that owns the
 * ReactiveForms state. No services are injected — the submit handler is a
 * documented no-op stub (Firebase Auth wiring is out of scope).
 */

// Resolve the external templateUrl from disk before TestBed accesses the
// component def: Vitest runs in Node where Angular's default fetch-based
// resource loader cannot resolve relative decorator URLs. `ɵresolveComponentResources`
// is the same entry point TestBed uses internally during `compileComponents`.
const testDir = dirname(fileURLToPath(import.meta.url));

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;

  beforeEach(async () => {
    await ɵresolveComponentResources(async (url: string) =>
      readFileSync(resolve(testDir, url), 'utf-8'),
    );

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('[SC-001] render', () => {
    it('renders the Iniciar sesión heading above the card (not inside it)', () => {
      const heading = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement;
      expect(heading).not.toBeNull();
      expect(heading.textContent?.trim()).toBe('Iniciar sesión');

      const card = fixture.nativeElement.querySelector(
        '[data-login-card]',
      ) as HTMLElement;
      expect(card.querySelector('h1'), 'title must NOT live inside the card').toBeNull();
      expect(
        heading.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING,
        'title must appear before (above) the card in the DOM',
      ).toBeTruthy();
    });

    it('renders the Riff logo with alt text', () => {
      const img = fixture.nativeElement.querySelector('img[alt="Riff"]') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.getAttribute('src')).toContain('assets/img/logo-web.webp');
    });

    it('renders the Correo and Contraseña fields with labels', () => {
      const emailInput = fixture.nativeElement.querySelector(
        'input[autocomplete="email"]',
      ) as HTMLInputElement;
      const passwordInput = fixture.nativeElement.querySelector(
        'input[autocomplete="current-password"]',
      ) as HTMLInputElement;
      expect(emailInput).not.toBeNull();
      expect(passwordInput).not.toBeNull();
      expect(passwordInput.getAttribute('type')).toBe('password');

      const labels = Array.from(
        fixture.nativeElement.querySelectorAll('label'),
      ).map((label: HTMLLabelElement) => label.textContent?.trim());
      expect(labels).toContain('Correo');
      expect(labels).toContain('Contraseña');
    });

    it('renders the INICIAR SESIÓN submit button', () => {
      const button = fixture.nativeElement.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;
      expect(button).not.toBeNull();
      expect(button.textContent?.trim()).toBe('INICIAR SESIÓN');
    });

    it('does not use rounded utilities on the card (flat design)', () => {
      const card = fixture.nativeElement.querySelector(
        '[data-login-card]',
      ) as HTMLElement;
      expect(card).not.toBeNull();
      expect(card.className).not.toMatch(/rounded/);
    });
  });

  describe('[SC-008] forgot-password link', () => {
    it('renders the clickable "¿Olvidaste tu contraseña?" link', () => {
      const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
      expect(link).not.toBeNull();
      expect(link.textContent?.trim()).toBe('¿Olvidaste tu contraseña?');
      expect(link.getAttribute('href')).toBe('#');
      expect(link.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('[SC-002] email validation', () => {
    it('marks the email control invalid for a non-email value', () => {
      const email = component.loginForm.controls['email'];
      email.setValue('admin');
      email.markAsTouched();
      expect(email.invalid).toBe(true);
      expect(component.showEmailError).toBe(true);
    });

    it('shows the error state and message when the email is touched and invalid', () => {
      component.loginForm.controls['email'].setValue('');
      component.loginForm.controls['email'].markAsTouched();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        'input[autocomplete="email"]',
      ) as HTMLInputElement;
      expect(input.className).toContain('border-error');

      const errorMessage = fixture.nativeElement.querySelector(
        '[data-email-error]',
      ) as HTMLElement;
      expect(errorMessage).not.toBeNull();
      expect(errorMessage.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  describe('[SC-003] password validation', () => {
    it('marks the password control invalid when empty or shorter than 6 chars', () => {
      const password = component.loginForm.controls['password'];
      password.setValue('');
      expect(password.invalid).toBe(true);
      password.setValue('12345');
      expect(password.invalid).toBe(true);
    });

    it('shows the error state and message when the password is touched and invalid', () => {
      component.loginForm.controls['password'].setValue('123');
      component.loginForm.controls['password'].markAsTouched();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector(
        'input[autocomplete="current-password"]',
      ) as HTMLInputElement;
      expect(input.className).toContain('border-error');

      const errorMessage = fixture.nativeElement.querySelector(
        '[data-password-error]',
      ) as HTMLElement;
      expect(errorMessage).not.toBeNull();
      expect(errorMessage.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  describe('[SC-004] submit button enabled only when the form is valid', () => {
    function submitButton(): HTMLButtonElement {
      return fixture.nativeElement.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;
    }

    it('is disabled while the form is invalid', () => {
      fixture.detectChanges();
      expect(submitButton().disabled).toBe(true);
    });

    it('is enabled when both fields are valid', () => {
      component.loginForm.controls['email'].setValue('admin@riff.cl');
      component.loginForm.controls['password'].setValue('secret123');
      fixture.detectChanges();
      expect(component.loginForm.valid).toBe(true);
      expect(submitButton().disabled).toBe(false);
    });

    it('returns to disabled when a field becomes invalid again', () => {
      component.loginForm.controls['email'].setValue('admin@riff.cl');
      component.loginForm.controls['password'].setValue('secret123');
      fixture.detectChanges();
      expect(submitButton().disabled).toBe(false);

      component.loginForm.controls['email'].setValue('not-an-email');
      fixture.detectChanges();
      expect(submitButton().disabled).toBe(true);
    });
  });

  describe('[SC-005] UI-only submit handler', () => {
    it('prevents the native form submission', () => {
      const onSubmit = vi.spyOn(component, 'onSubmit');
      const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
      const event = new Event('submit', { bubbles: true, cancelable: true });

      component.loginForm.controls['email'].setValue('admin@riff.cl');
      component.loginForm.controls['password'].setValue('secret123');
      form.dispatchEvent(event);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('[SC-007] accessibility', () => {
    it('associates each input with a label via for/id', () => {
      const inputs = Array.from(
        fixture.nativeElement.querySelectorAll('input'),
      ) as HTMLInputElement[];
      for (const input of inputs) {
        const id = input.getAttribute('id');
        expect(id).toBeTruthy();
        const label = fixture.nativeElement.querySelector(
          `label[for="${id}"]`,
        ) as HTMLLabelElement;
        expect(label, `label for #${id}`).not.toBeNull();
      }
    });

    it('wires aria-describedby to the error messages', () => {
      component.loginForm.controls['email'].setValue('');
      component.loginForm.controls['email'].markAsTouched();
      component.loginForm.controls['password'].setValue('');
      component.loginForm.controls['password'].markAsTouched();
      fixture.detectChanges();

      const emailInput = fixture.nativeElement.querySelector(
        'input[autocomplete="email"]',
      ) as HTMLInputElement;
      const emailErrorId = emailInput.getAttribute('aria-describedby');
      expect(
        fixture.nativeElement.querySelector(`#${emailErrorId}`),
        'email error element exists',
      ).not.toBeNull();

      const passwordInput = fixture.nativeElement.querySelector(
        'input[autocomplete="current-password"]',
      ) as HTMLInputElement;
      const passwordErrorId = passwordInput.getAttribute('aria-describedby');
      expect(
        fixture.nativeElement.querySelector(`#${passwordErrorId}`),
        'password error element exists',
      ).not.toBeNull();
    });
  });
});