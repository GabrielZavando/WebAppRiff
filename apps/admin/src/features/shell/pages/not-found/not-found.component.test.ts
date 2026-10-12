import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ɵresolveComponentResources } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NotFoundPageComponent } from './not-found.component';


/**
 * Contract (task 4.2 / spec `admin-app-shell`): the 404 page explains the
 * missing route and offers a visible link back to `/profile`.
 */
describe('NotFoundPageComponent (task 4.2)', () => {
  let fixture: ComponentFixture<NotFoundPageComponent>;

  beforeEach(async () => {
    const testDir = dirname(fileURLToPath(import.meta.url));
    await ɵresolveComponentResources(async (url: string) =>
      readFileSync(resolve(testDir, url), 'utf-8'),
    );

    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      // /profile stand-in for the navigation assertion (the target component
      // itself is irrelevant here — only the resulting URL is asserted).
      providers: [provideRouter([{ path: 'profile', component: NotFoundPageComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();
  });

  it('explains that the route does not exist', () => {
    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';

    expect(text).toContain('404');
    expect(text).toContain('Página no encontrada');
  });

  it('links back to /profile', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector('a');

    expect(link?.getAttribute('routerlink')).toBe('/profile');
    expect(link?.textContent).toContain('Volver al panel');
  });

  it('navigates to /profile when the link is activated', async () => {
    const router = TestBed.inject(Router);
    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    link?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();

    expect(router.url).toBe('/profile');
  });
});
