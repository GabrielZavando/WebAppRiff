import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SidebarService } from '../../services/sidebar.service';

/**
 * Off-canvas backdrop (ported from TailAdmin's `backdrop`, adapted to Riff
 * tokens with signals instead of async streams). Shown only while the mobile
 * sidebar drawer is open on < xl viewports.
 */
@Component({
  selector: 'app-backdrop',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sidebar.isMobileOpen()) {
      <div
        class="fixed inset-0 z-40 bg-secondary/50 lg:hidden"
        (click)="closeSidebar()"
        aria-hidden="true"
      ></div>
    }
  `,
})
export class BackdropComponent {
  readonly sidebar = inject(SidebarService);

  closeSidebar(): void {
    this.sidebar.setMobileOpen(false);
  }
}
