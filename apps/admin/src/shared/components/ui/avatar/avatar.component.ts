import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type AvatarSize = 'xsmall' | 'small' | 'medium' | 'large';

/**
 * Avatar (ported from TailAdmin's `ui/avatar`, adapted to the Riff flat
 * design system: square surface with border and an initials placeholder —
 * user avatars are not part of the MVP data model).
 */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="relative inline-flex items-center justify-center border border-border bg-bg font-medium text-text-2"
      [ngClass]="sizeClasses[size]"
      [attr.aria-label]="alt"
      role="img"
    >
      {{ initials }}
    </span>
  `,
  imports: [NgClass],
})
export class AvatarComponent {
  @Input() initials = '?';
  @Input() alt = 'Avatar de usuario';
  @Input() size: AvatarSize = 'medium';

  readonly sizeClasses: Record<AvatarSize, string> = {
    xsmall: 'h-6 w-6 text-xs',
    small: 'h-8 w-8 text-xs',
    medium: 'h-10 w-10 text-sm',
    large: 'h-12 w-12 text-sm',
  };
}
