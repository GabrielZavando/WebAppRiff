import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

/**
 * Smart container for the admin login panel (UI-only, change
 * `admin-login-panel`, ticket LOGIN-1).
 *
 * Owns the ReactiveForms state and validation for the Correo and Contraseña
 * fields. The submit handler is a documented no-op stub: Firebase Auth wiring
 * is out of scope for this change (SC-005) — it only prevents the native form
 * submission. Follows the flat design system (no `rounded*`, only `@theme`
 * utilities, no raw hex).
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
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

  /**
   * UI-only submit handler (SC-005): prevents the native submission. The real
   * authentication (Firebase Auth) is connected in a future change.
   */
  onSubmit(event: Event): void {
    event.preventDefault();
  }
}