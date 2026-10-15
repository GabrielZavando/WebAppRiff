import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Inline banner (ported from TailAdmin's `ui/alert`, task 1.2 / design D4),
 * adapted to the Riff design system: `@theme` tokens, square corners, no
 * elevations, light-only. Used for inline success/error feedback in catalog
 * pages — never toasts (spec `admin-catalog-crud`, Notificación de éxito
 * inline).
 */
@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <div
      data-alert
      [attr.role]="variant === 'error' ? 'alert' : 'status'"
      [ngClass]="
        'flex items-start gap-3 border px-4 py-3 text-sm ' + toneClasses
      "
    >
      <span aria-hidden="true">{{ tone === 'error' ? '✕' : '✓' }}</span>
      <span class="flex-1">{{ message }}</span>
    </div>
  `,
})
export class AlertComponent {
  @Input() variant: 'success' | 'error' = 'success';
  @Input() message = '';

  get tone(): 'success' | 'error' {
    return this.variant;
  }

  get toneClasses(): string {
    return this.variant === 'error'
      ? 'border-error bg-error-light text-error-dark'
      : 'border-success bg-success-light text-success-dark';
  }
}
