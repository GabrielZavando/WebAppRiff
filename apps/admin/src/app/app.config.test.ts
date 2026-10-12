import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test-app' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ app: { name: 'test-app' } })),
}));

import { FIREBASE_APP, FIREBASE_AUTH } from '../features/auth/firebase.tokens';
import { appConfig } from './app.config';

/**
 * Bootstrap contract (task 1.3 / spec `admin-auth`): the app config provides
 * HttpClient (for the backend) and an initialized Firebase Auth instance
 * wrapped by tokens, so the AuthService can be built on top of it.
 */
describe('appConfig bootstrap', () => {
  it('exposes an initialized Firebase Auth instance', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(TestBed.inject(FIREBASE_APP)).toBeDefined();
    expect(TestBed.inject(FIREBASE_AUTH)).toBeDefined();
  });

  it('provides HttpClient for backend calls', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    expect(TestBed.inject(HttpClient)).toBeInstanceOf(HttpClient);
  });
});
