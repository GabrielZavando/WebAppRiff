import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root shell of the admin panel (standalone). Only hosts the router outlet;
 * the `/login` route renders the login page lazily. Replaces the previous
 * inline placeholder that bootstrapped directly.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {}