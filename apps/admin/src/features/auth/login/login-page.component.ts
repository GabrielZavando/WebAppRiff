import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AuthService } from '../auth.service';

/**
 * Smart container for the admin login panel (spec `admin-login`, wired to
 * Firebase Authentication in change `admin-panel-foundation`, task 5.1).
 *
 * Owns the ReactiveForms state and validation for the Correo and Contraseña
 * fields. The submit handler invokes `AuthService.login` (Firebase Auth +
 * profile load + redirect): on success the service navigates to the
 * `returnUrl`/`/profile`; on failure a visible error message is rendered and
 * the button is disabled while the authentication is in flight. Flat design
 * system (no `rounded*`, only `@theme` utilities, no raw hex).
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  get email(): FormControl<string> {
    return this.loginForm.controls.email;
  }

  get password(): FormControl<string> {
    return this.loginForm.controls.password;
  }

  /** True when the email control is touched and invalid (SC-002). */
  get showEmailError(): boolean {
    return this.email.touched && this.email.invalid;
  }

  /** True when the password control is touched and invalid (SC-003). */
  get showPasswordError(): boolean {
    return this.password.touched && this.password.invalid;
  }

  /** Email error message for the touched+invalid state (SC-002). */
  get emailErrorMessage(): string {
    if (this.email.hasError('required')) {
      return 'El correo es obligatorio.';
    }
    return 'Ingresa un correo electrónico válido.';
  }

  /** Password error message for the touched+invalid state (SC-003). */
  get passwordErrorMessage(): string {
    if (this.password.hasError('required')) {
      return 'La contraseña es obligatoria.';
    }
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  /** Submits the credentials to Firebase Auth via `AuthService` (task 5.1). */
  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.loginForm.invalid || this.submitting()) {
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    try {
      await this.authService.login(this.email.value, this.password.value);
    } catch (error: unknown) {
      this.errorMessage.set(this.toUserMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  /** Maps auth failures to the visible message (delta `admin-login`). */
  private toUserMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('auth/invalid-credential') ||
      message.includes('auth/wrong-password') ||
      message.includes('auth/user-not-found')
    ) {
      return 'Correo o contraseña incorrectos.';
    }
    return 'No se pudo iniciar sesión. Intenta de nuevo.';
  }
}
