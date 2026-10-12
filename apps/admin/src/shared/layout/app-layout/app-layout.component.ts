import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { BackdropComponent } from '../backdrop/backdrop.component';
import { AppHeaderComponent } from '../app-header/app-header.component';

/**
 * Application shell (ported from TailAdmin's `app-layout`, adapted to Riff
 * design tokens and signals — design D1).
 *
 * Sidebar + header wrap a nested `router-outlet`; the content column shifts
 * with the sidebar state on xl+ viewports.
 */
@Component({
  selector: 'app-layout',
  imports: [NgClass, RouterOutlet, AppHeaderComponent, AppSidebarComponent, BackdropComponent],
  templateUrl: './app-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  readonly sidebar = inject(SidebarService);

  get containerClasses(): Record<string, boolean> {
    const expanded = this.sidebar.isExpanded() || this.sidebar.isHovered();
    return {
      'xl:ms-[290px]': expanded,
      'xl:ms-[90px]': !expanded,
      'ms-0': this.sidebar.isMobileOpen(),
    };
  }
}
