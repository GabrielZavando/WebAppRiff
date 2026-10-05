import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

/**
 * Shared Vitest setup for Angular component tests (JIT).
 *
 * Initializes the Angular testing environment (TestBed) once per worker.
 * External `templateUrl`/`styleUrls` resources are resolved explicitly per
 * test via `resolveComponentResources()` (see the login component test),
 * because Vitest runs in Node where Angular's fetch-based default resource
 * loader cannot resolve relative decorator URLs.
 *
 * Registered in `apps/admin/vitest.config.ts` via `test.setupFiles`.
 */
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());