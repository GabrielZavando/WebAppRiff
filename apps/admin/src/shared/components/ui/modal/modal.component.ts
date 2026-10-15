import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

/**
 * Confirmation modal (ported from TailAdmin's `ui/modal`, task 1.3 / design
 * D4), adapted to the Riff design system: `@theme` tokens, square corners, no
 * elevations, light-only. Used for destructive-action confirmations (delete).
 *
 * - Esc and the Cancel button both emit `cancelled`.
 * - The confirm button emits `confirmed` exactly once per click.
 * - Focus starts on the Cancel button (safe default for destructive actions)
 *   and Tab wraps between the two action buttons (focus trap).
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-secondary-dark/60 p-4"
      (click)="onBackdropClick($event)"
    >
      <div
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title"
        class="w-full max-w-md border border-border bg-white p-6"
      >
        <h3 class="font-heading text-lg font-semibold text-secondary">{{ title }}</h3>
        <p class="mt-2 text-sm text-text-2">{{ message }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            data-modal-cancel
            #cancelButton
            class="bg-white px-4 py-2.5 text-xs font-heading font-semibold uppercase tracking-wide text-text border border-border transition hover:bg-bg"
            (click)="cancelled.emit()"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-modal-confirm
            #confirmButton
            [ngClass]="
              'px-4 py-2.5 text-xs font-heading font-semibold uppercase tracking-wide text-white transition ' +
              confirmClassName
            "
            (click)="confirmed.emit()"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent implements AfterViewInit {
  @Input() title = '';
  @Input() message = '';
  @Input() confirmLabel = 'Eliminar';
  /** Token classes for the destructive confirm action (default: error red). */
  @Input() confirmClassName = 'bg-error hover:bg-error-dark';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('confirmButton') private confirmButton?: ElementRef<HTMLButtonElement>;

  ngAfterViewInit(): void {
    this.cancelButton?.nativeElement.focus();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cancelled.emit();
      return;
    }
    if (event.key === 'Tab') {
      this.wrapFocus(event);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelled.emit();
    }
  }

  /** Two-button focus trap: Tab cycles cancel ↔ confirm. */
  private wrapFocus(event: KeyboardEvent): void {
    const cancel = this.cancelButton?.nativeElement;
    const confirm = this.confirmButton?.nativeElement;
    if (!cancel || !confirm) {
      return;
    }
    event.preventDefault();
    const active = document.activeElement;
    const next = active === confirm ? cancel : confirm;
    next.focus();
  }
}
