import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Dropdown item (ported from TailAdmin's `ui/dropdown/dropdown-item`,
 * adapted to Riff tokens with flat hover state). Renders a button that emits
 * `itemClick`; optionally navigates via `to`.
 */
@Component({
  selector: 'app-dropdown-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="block w-full text-left px-4 py-2 text-sm text-text hover:bg-bg hover:text-text"
      [class]="className"
      (click)="handleClick($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
})
export class DropdownItemComponent {
  @Input() to?: string;
  @Input() className = '';
  @Output() itemClick = new EventEmitter<void>();
  @Output() click = new EventEmitter<void>();

  handleClick(event: Event): void {
    event.preventDefault();
    this.click.emit();
    this.itemClick.emit();
  }
}
