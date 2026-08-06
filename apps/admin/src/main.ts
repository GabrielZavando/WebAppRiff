import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

/**
 * Minimal shell component to validate the Tailwind v4 design-token loop on
 * the Angular admin app. The token `bg-primary` SHALL resolve to the
 * `--color-primary` (`#41B3C4`) declared in `src/styles/globals.css`.
 *
 * Full features of the admin panel will be developed in subsequent changes;
 * this component is intentionally a placeholder to make the build smokeable.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  template: `<div class="bg-primary text-white p-4">admin ready</div>`,
})
export class AppComponent {}

export function appConfig(): ReturnType<typeof bootstrapApplication> {
  return bootstrapApplication(AppComponent);
}

bootstrapApplication(AppComponent).catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
