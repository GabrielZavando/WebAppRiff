import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPPRESSIONS_PATH = path.join(__dirname, '..', '..', 'npm-audit-suppressions.json');

// Mock the child_process module
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

// Import functions to test
const { loadSuppressions, isSuppressionActive, analyzeVulnerabilities } = await import('../audit.mjs');

describe('audit.mjs', () => {
  let originalSuppressions;

  beforeEach(async () => {
    // Backup original suppressions
    try {
      originalSuppressions = await fs.readFile(SUPPRESSIONS_PATH, 'utf-8');
    } catch {
      originalSuppressions = null;
    }
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Restore original suppressions
    if (originalSuppressions !== null) {
      await fs.writeFile(SUPPRESSIONS_PATH, originalSuppressions);
    }
  });

  describe('SC-201: Script returns 0 when no high/critical vulns', () => {
    it('should return empty blocking array when no high/critical vulnerabilities', async () => {
      const auditData = { vulnerabilities: {} };
      const suppressions = [];
      
      const result = analyzeVulnerabilities(auditData, suppressions);
      
      expect(result.blocking).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.suppressed).toHaveLength(0);
    });
  });

  describe('SC-202: Suppressions allow excluding known vulns', () => {
    it('should suppress vulns that are in the suppressions file', async () => {
      const auditData = {
        vulnerabilities: {
          'test-package': {
            severity: 'high',
            via: [{ url: 'GHSA-xxxx-xxxx-xxxx' }],
          },
        },
      };
      const suppressions = [
        { id: 'GHSA-xxxx-xxxx-xxxx', reason: 'Test suppression', revokedAt: null },
      ];
      
      const result = analyzeVulnerabilities(auditData, suppressions);
      
      expect(result.blocking).toHaveLength(0);
      expect(result.suppressed).toHaveLength(1);
      expect(result.suppressed[0].name).toBe('test-package');
    });
  });

  describe('SC-203: Suppressions expire with revokedAt', () => {
    it('should NOT suppress vulns with expired revokedAt', async () => {
      const auditData = {
        vulnerabilities: {
          'test-package': {
            severity: 'high',
            via: [{ url: 'GHSA-xxxx-xxxx-xxxx' }],
          },
        },
      };
      const suppressions = [
        { id: 'GHSA-xxxx-xxxx-xxxx', reason: 'Expired', revokedAt: '2020-01-01T00:00:00Z' },
      ];
      
      const result = analyzeVulnerabilities(auditData, suppressions);
      
      expect(result.blocking).toHaveLength(1);
      expect(result.suppressed).toHaveLength(0);
    });

    it('should suppress vulns with future revokedAt', async () => {
      const auditData = {
        vulnerabilities: {
          'test-package': {
            severity: 'high',
            via: [{ url: 'GHSA-xxxx-xxxx-xxxx' }],
          },
        },
      };
      const suppressions = [
        { id: 'GHSA-xxxx-xxxx-xxxx', reason: 'Active', revokedAt: '2030-01-01T00:00:00Z' },
      ];
      
      const result = analyzeVulnerabilities(auditData, suppressions);
      
      expect(result.blocking).toHaveLength(0);
      expect(result.suppressed).toHaveLength(1);
    });
  });

  describe('SC-204: devDependencies have soft path (Warning only)', () => {
    it('should block high vulns in production dependencies', async () => {
      const auditData = {
        vulnerabilities: {
          'some-package': {
            severity: 'high',
            via: [{ url: 'GHSA-high-1234' }],
          },
        },
      };
      const suppressions = [];
      const devDependencies = new Set(['other-package']);
      
      const result = analyzeVulnerabilities(auditData, suppressions, devDependencies);
      
      expect(result.blocking).toHaveLength(1);
      expect(result.blocking[0].name).toBe('some-package');
    });

    it('should warn (not block) high vulns in devDependencies', async () => {
      const auditData = {
        vulnerabilities: {
          'vitest': {
            severity: 'high',
            via: [{ url: 'GHSA-high-5678' }],
          },
        },
      };
      const suppressions = [];
      const devDependencies = new Set(['vitest']);
      
      const result = analyzeVulnerabilities(auditData, suppressions, devDependencies);
      
      expect(result.blocking).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].name).toBe('vitest');
      expect(result.warnings[0].reason).toContain('devDependency');
    });
  });

  describe('SC-205: critical always blocks', () => {
    it('should block critical vulns even in devDependencies', async () => {
      const auditData = {
        vulnerabilities: {
          'critical-package': {
            severity: 'critical',
            via: [{ url: 'GHSA-crit-1234' }],
          },
        },
      };
      const suppressions = [];
      const devDependencies = new Set(['critical-package']);
      
      const result = analyzeVulnerabilities(auditData, suppressions, devDependencies);
      
      expect(result.blocking).toHaveLength(1);
      expect(result.blocking[0].name).toBe('critical-package');
      expect(result.blocking[0].reason).toBe('critical always blocks');
    });

    it('should block critical vulns in production dependencies', async () => {
      const auditData = {
        vulnerabilities: {
          'critical-package': {
            severity: 'critical',
            via: [{ url: 'GHSA-crit-5678' }],
          },
        },
      };
      const suppressions = [];
      const devDependencies = new Set(['other-package']);
      
      const result = analyzeVulnerabilities(auditData, suppressions, devDependencies);
      
      expect(result.blocking).toHaveLength(1);
      expect(result.blocking[0].name).toBe('critical-package');
    });
  });

  describe('loadSuppressions', () => {
    it('should load suppressions from file', async () => {
      await fs.writeFile(SUPPRESSIONS_PATH, JSON.stringify({
        suppressions: [
          { id: 'test-1', reason: 'Test', revokedAt: null },
        ],
      }));
      
      const suppressions = await loadSuppressions();
      
      expect(suppressions).toHaveLength(1);
      expect(suppressions[0].id).toBe('test-1');
    });

    it('should return empty array if file does not exist', async () => {
      await fs.unlink(SUPPRESSIONS_PATH).catch(() => {});
      
      const suppressions = await loadSuppressions();
      
      expect(suppressions).toHaveLength(0);
    });
  });

  describe('isSuppressionActive', () => {
    it('should return true for null revokedAt', () => {
      expect(isSuppressionActive({ revokedAt: null })).toBe(true);
    });

    it('should return true for future revokedAt', () => {
      expect(isSuppressionActive({ revokedAt: '2030-01-01T00:00:00Z' })).toBe(true);
    });

    it('should return false for past revokedAt', () => {
      expect(isSuppressionActive({ revokedAt: '2020-01-01T00:00:00Z' })).toBe(false);
    });
  });
});
