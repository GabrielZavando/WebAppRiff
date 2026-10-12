import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * Bootstrap del panel admin: standalone root `AppComponent` + `appConfig`
 * (router, HttpClient, Firebase Auth). The `/login` page is the first real
 * screen (change `admin-login-panel`); the full shell lands with change
 * `admin-panel-foundation`.
 */
bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  console.error(err);
});