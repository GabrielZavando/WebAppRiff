import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Subject } from 'rxjs';
import { ɵresolveComponentResources } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, NavigationEnd } from '@angular/router';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AppSidebarComponent } from './app-sidebar.component';
import { SidebarService } from '../../services/sidebar.service';

// External templateUrl must be resolved from disk before TestBed compiles
// (same pattern as the login component test; see test-setup.ts).
const testDir = dirname(fileURLToPath(import.meta.url));

/**
 * Sidebar navigation contract (task 2.3 / spec delta `admin-app-shell`,
 * `admin-panel-content`): the sections Productos, Categorías and Perfil appear
 * in that order, every item carries an inline SVG icon, and catalog child
 * URLs (e.g. `/categories/c1`) mark their section active.
 */
describe('AppSidebarComponent navigation (task 2.3)', () => {
  let fixture: ComponentFixture<AppSidebarComponent>;
  let component: AppSidebarComponent;
  let urlSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    await ɵresolveComponentResources(async (url: string) =>
      readFileSync(resolve(testDir, url), 'utf-8'),
    );

    TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [SidebarService, provideRouter([])],
    });
    const router = TestBed.inject(Router);
    // events: the component just closes the mobile drawer on NavigationEnd.
    vi.spyOn(router, 'events', 'get').mockReturnValue(new Subject<NavigationEnd>().asObservable());
    urlSpy = vi.fn().mockReturnValue('/products');
    vi.spyOn(router, 'url', 'get').mockImplementation(urlSpy);

    fixture = TestBed.createComponent(AppSidebarComponent);
    component = fixture.componentInstance;
  });

  it('lists Productos, Categorías and Perfil in that order', () => {
    const names = component.navItems.map((item) => item.name);
    const paths = component.navItems.map((item) => item.path);

    expect(names).toEqual(['Productos', 'Categorías', 'Perfil']);
    expect(paths).toEqual(['/products', '/categories', '/profile']);
  });

  it('keeps inline SVG icons for every section', () => {
    for (const item of component.navItems) {
      expect(item.icon, `icon for ${item.name}`).toContain('<svg');
    }
  });

  it('marks a catalog child URL as the active section', () => {
    urlSpy.mockReturnValue('/categories/c1');

    expect(component.isActive('/categories')).toBe(true);
    expect(component.isActive('/products')).toBe(false);
    expect(component.isActive('/profile')).toBe(false);
  });
});
