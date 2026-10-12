import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * 404 page (ported from TailAdmin's `pages/other-page/not-found`, adapted to
 * Riff tokens: no template assets or decorative shapes; flat typography and a
 * link back to the panel home `/profile` — spec `admin-app-shell`).
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {
  readonly currentYear = new Date().getFullYear();
}
