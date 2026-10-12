import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Button (ported from TailAdmin's `ui/button`, adapted to the Riff design
 * system: `@theme` tokens, square corners, no elevations; the safe-html icon
 * inputs were dropped in favor of content projection).
 */
@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      [ngClass]="
        'inline-flex items-center justify-center gap-2 transition font-heading font-semibold uppercase tracking-wide text-xs ' +
        className +
        ' ' +
        sizeClasses +
        ' ' +
        variantClasses +
        ' ' +
        disabledClasses
      "
      [disabled]="disabled"
      (click)="onClick($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  imports: [NgClass],
})
export class ButtonComponent {
  @Input() size: 'sm' | 'md' = 'md';
  @Input() variant: 'primary' | 'outline' = 'primary';
  @Input() disabled = false;
  @Input() className = '';

  @Output() btnClick = new EventEmitter<Event>();

  get sizeClasses(): string {
    return this.size === 'sm' ? 'px-4 py-2.5' : 'px-5 py-3';
  }

  get variantClasses(): string {
    return this.variant === 'primary'
      ? 'bg-primary text-white hover:bg-primary-dark disabled:bg-primary-light disabled:text-white'
      : 'bg-white text-text border border-border hover:bg-bg';
  }

  get disabledClasses(): string {
    return this.disabled ? 'cursor-not-allowed opacity-50' : '';
  }

  onClick(event: Event): void {
    if (!this.disabled) {
      this.btnClick.emit(event);
    }
  }
}
