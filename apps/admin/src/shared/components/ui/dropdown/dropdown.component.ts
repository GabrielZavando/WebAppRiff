import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

/**
 * Dropdown container (ported from TailAdmin's `ui/dropdown`, adapted to Riff
 * tokens: flat surface per the Riff design rules). Renders its content when
 * open and closes on outside clicks (unless the click hits a
 * `.dropdown-toggle`).
 */
@Component({
  selector: 'app-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div
        #dropdownRef
        class="absolute z-40 mt-2 border border-border bg-white min-w-52"
        [ngClass]="
          className.includes('right-') ||
          className.includes('left-') ||
          className.includes('start-') ||
          className.includes('end-')
            ? ''
            : 'right-0'
        "
        [class]="className"
      >
        <ng-content></ng-content>
      </div>
    }
  `,
  imports: [NgClass],
})
export class DropdownComponent implements AfterViewInit, OnDestroy {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Input() className = '';

  @ViewChild('dropdownRef') dropdownRef?: ElementRef<HTMLDivElement>;

  private readonly handleClickOutside = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (
      this.isOpen &&
      this.dropdownRef &&
      !this.dropdownRef.nativeElement.contains(target) &&
      target.closest('.dropdown-toggle') === null
    ) {
      this.close.emit();
    }
  };

  ngAfterViewInit(): void {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }
}
