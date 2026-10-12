import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

type BadgeVariant = 'light' | 'solid';
type BadgeSize = 'sm' | 'md';
type BadgeColor = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';

/**
 * Badge (ported from TailAdmin's `ui/badge`, adapted to the Riff design
 * system: `@theme` tokens only, flat square corners, no dark variants).
 */
@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [ngClass]="baseStyles + ' ' + sizeClass + ' ' + colorStyles">
      <ng-content></ng-content>
    </span>
  `,
  imports: [NgClass],
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'light';
  @Input() size: BadgeSize = 'md';
  @Input() color: BadgeColor = 'primary';

  @HostBinding('class') get hostClasses(): string {
    return 'flex';
  }

  get baseStyles(): string {
    return 'inline-flex items-center px-2.5 py-0.5 justify-center gap-1 border font-medium';
  }

  get sizeClass(): string {
    return this.size === 'sm' ? 'text-xs' : 'text-sm';
  }

  get colorStyles(): string {
    const variants = {
      light: {
        primary: 'bg-primary-100 text-primary-deep border-primary-light',
        success: 'bg-success/10 text-success-dark border-success/30',
        error: 'bg-error/10 text-error-dark border-error/30',
        warning: 'bg-warning/10 text-warning-dark border-warning/30',
        info: 'bg-info/10 text-info-dark border-info/30',
        neutral: 'bg-bg text-text-2 border-border',
      },
      solid: {
        primary: 'bg-primary text-white border-primary',
        success: 'bg-success text-white border-success',
        error: 'bg-error text-white border-error',
        warning: 'bg-warning text-white border-warning',
        info: 'bg-info text-white border-info',
        neutral: 'bg-secondary text-white border-secondary',
      },
    } as const;
    return variants[this.variant][this.color];
  }
}
