import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

/**
 * Bootstrap del panel admin: standalone root `AppComponent` + router with the
 * `/login` route (lazy). The previous inline placeholder is gone — the first
 * real page of the admin panel is the login screen (change
 * `admin-login-panel`, ticket LOGIN-1).
 */
bootstrapApplication(AppComponent, {
  providers: [provideRouter(appRoutes)],
}).catch((err: unknown) => {
  console.error(err);
});