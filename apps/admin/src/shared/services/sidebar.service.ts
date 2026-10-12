import { Injectable, signal } from '@angular/core';

/**
 * Sidebar UI state (ported from TailAdmin's `sidebar.service.ts`, adapted to
 * Angular 22 signals per design D1/D7).
 *
 * - `isExpanded`: desktop expanded state (persisted across routes by living
 *   in a root service).
 * - `isMobileOpen`: off-canvas drawer on < xl viewports.
 * - `isHovered`: temporary expansion while the mouse is over a collapsed
 *   sidebar.
 */
@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly isExpandedSignal = signal<boolean>(true);
  private readonly isMobileOpenSignal = signal<boolean>(false);
  private readonly isHoveredSignal = signal<boolean>(false);

  readonly isExpanded = this.isExpandedSignal.asReadonly();
  readonly isMobileOpen = this.isMobileOpenSignal.asReadonly();
  readonly isHovered = this.isHoveredSignal.asReadonly();

  setExpanded(value: boolean): void {
    this.isExpandedSignal.set(value);
  }

  toggleExpanded(): void {
    this.isExpandedSignal.update((value) => !value);
  }

  setMobileOpen(value: boolean): void {
    this.isMobileOpenSignal.set(value);
  }

  toggleMobileOpen(): void {
    this.isMobileOpenSignal.update((value) => !value);
  }

  setHovered(value: boolean): void {
    this.isHoveredSignal.set(value);
  }
}
