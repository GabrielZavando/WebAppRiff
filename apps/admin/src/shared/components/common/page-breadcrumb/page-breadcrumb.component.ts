import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Page breadcrumb/title (ported from TailAdmin's `common/page-breadcrumb`,
 * adapted to Riff tokens).
 */
@Component({
  selector: 'app-page-breadcrumb',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start justify-center gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
      <ul class="flex items-center gap-2">
        <li>
          <a routerLink="/profile" class="text-sm font-medium text-text-2 hover:text-text">
            Panel
          </a>
        </li>
        <li class="flex items-center gap-2 text-sm font-medium text-text">
          <span aria-hidden="true">/</span>
          {{ pageTitle }}
        </li>
      </ul>
    </div>
  `,
})
export class PageBreadcrumbComponent {
  @Input() pageTitle = '';
}
