import { Injectable, Inject } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from './infrastructure/firebase/firebase.tokens';

// Firebase ping must never block the health endpoint: if Firestore is slow,
// the race resolves to "down" after this timeout so /health stays responsive.
const FIREBASE_PING_TIMEOUT_MS = Number(process.env.HEALTH_PING_TIMEOUT_MS ?? 2000);

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  uptime: number;
  firebase: 'up' | 'down';
}

@Injectable()
export class AppService {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async getHealth(): Promise<HealthResponse> {
    return {
      status: 'ok',
      version: process.env.npm_package_version ?? '0.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      firebase: await this.pingFirebase(),
    };
  }

  private async pingFirebase(): Promise<'up' | 'down'> {
    const ping = this.firestore
      .listCollections()
      .then(() => 'up' as const)
      .catch(() => 'down' as const);
    const timeout = new Promise<'down'>((resolve) => {
      const timer = setTimeout(() => resolve('down'), FIREBASE_PING_TIMEOUT_MS);
      // A stuck Firestore ping must never keep the event loop (and the process) alive.
      timer.unref?.();
    });
    return Promise.race([ping, timeout]);
  }
}
