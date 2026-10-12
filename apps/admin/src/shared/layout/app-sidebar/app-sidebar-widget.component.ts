import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Sidebar footer brand card (ported from TailAdmin's `app-sidebar-widget`,
 * adapted to Riff branding). Only rendered while the sidebar is expanded.
 */
@Component({
  selector: 'app-sidebar-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-t border-border pt-4 pb-2">
      <p class="text-xs font-medium uppercase tracking-wide text-text-2">
        Riff Catálogo Digital
      </p>
      <p class="mt-1 text-xs text-muted">Panel de administración</p>
    </div>
  `,
})
export class AppSidebarWidgetComponent {}
