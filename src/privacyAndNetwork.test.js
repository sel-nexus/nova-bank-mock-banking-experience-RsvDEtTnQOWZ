import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXTURES } from './fixtures/fixtures.js';
import analyticsService from './services/analyticsService.js';
import authService from './services/authService.js';
import storageService from './services/storageService.js';
import {
  containsSensitiveData,
  isSafeToLog,
  redactSensitiveData,
} from './utils/safeLog.js';

const CURRENT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIRECTORY = CURRENT_DIRECTORY;
const PRODUCTION_EXTENSIONS = new Set(['.js', '.jsx']);
const TEST_FILE_PATTERN = /\.(?:test|spec)\.[^.]+$/i;
const FULL_ACCOUNT_NUMBER_PATTERN = /\b\d{9,}\b/g;
const NETWORK_API_PATTERN =
  /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|navigator\.(?:sendBeacon|serviceWorker)\b|(?:axios|got|superagent)\s*\./;
const DIRECT_CONSOLE_PATTERN = /\bconsole\.(?:log|warn|error|info|debug|trace)\s*\(/;

function getSourceFiles(directory = SOURCE_DIRECTORY) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return getSourceFiles(filePath);
    }

    if (
      !PRODUCTION_EXTENSIONS.has(extname(entry.name)) ||
      TEST_FILE_PATTERN.test(entry.name)
    ) {
      return [];
    }

    return [filePath];
  });
}

function getProductionSource() {
  return getSourceFiles().map((filePath) => ({
    filePath,
    relativePath: relative(SOURCE_DIRECTORY, filePath),
    source: readFileSync(filePath, 'utf8'),
  }));
}

function getPersistedStorageValues() {
  return Object.values(localStorage).concat(Object.values(sessionStorage));
}

describe('privacy and network gate', () => {
  beforeEach(() => {
    storageService.resetStorage();
    analyticsService.clearEvents();
  });

  afterEach(() => {
    storageService.resetStorage();
    analyticsService.clearEvents();
    vi.restoreAllMocks();
  });

  it('keeps fixture account identifiers masked for display and does not expose full account numbers in masked values', () => {
    FIXTURES.accounts.forEach((account) => {
      expect(account.maskedAccountNumber).toMatch(/^[•*xX]+\s+\d{4}$/);
      expect(account.maskedAccountNumber).not.toContain(
        String(account.accountNumber),
      );
    });

    const serializedFixtures = JSON.stringify(
      FIXTURES.accounts.map((account) => ({
        id: account.id,
        maskedAccountNumber: account.maskedAccountNumber,
      })),
    );

    FIXTURES.accounts.forEach((account) => {
      expect(serializedFixtures).not.toContain(String(account.accountNumber));
    });
  });

  it('does not persist passwords, passcodes, or credential fields in browser storage', () => {
    expect(
      storageService.setStorageItem('nova-bank-user', {
        id: 'user-miguel-santos',
        password: 'demo-only',
        passcode: '1234',
        credentials: {
          password: 'another-demo-password',
        },
      }),
    ).toBe(true);

    const persistedValues = getPersistedStorageValues().join(' ');

    expect(persistedValues).not.toContain('demo-only');
    expect(persistedValues).not.toContain('another-demo-password');
    expect(storageService.getStorageItem('nova-bank-user', null)).toEqual({
      id: 'user-miguel-santos',
      credentials: {},
    });
  });

  it('does not persist a password when authenticating with valid demo credentials', () => {
    const result = authService.login({
      userId: 'user-miguel-santos',
      password: 'demo-only',
      rememberMe: true,
    });

    expect(result.success).toBe(true);

    const persistedValues = getPersistedStorageValues().join(' ');

    expect(persistedValues).not.toContain('demo-only');
    expect(storageService.getStorageItem('nova-bank-user', null)).not.toHaveProperty(
      'password',
    );
    expect(storageService.getSession()).not.toHaveProperty('password');
  });

  it('redacts prohibited fields and sensitive values before analytics storage or logging', () => {
    const event = analyticsService.recordEvent('privacy_gate', {
      password: 'demo-only',
      accountNumber: '100012345678',
      email: 'miguel.santos@example.test',
      safeValue: 'synthetic demo value',
    });

    expect(event).toEqual(
      expect.objectContaining({
        name: 'privacy_gate',
        properties: {
          safeValue: 'synthetic demo value',
        },
      }),
    );
    expect(JSON.stringify(analyticsService.getEvents())).not.toContain(
      '100012345678',
    );

    const sensitiveValue = {
      password: 'demo-only',
      accountNumber: '100012345678',
      nested: {
        token: 'demo-token',
        safe: 'synthetic',
      },
    };

    expect(containsSensitiveData(sensitiveValue)).toBe(true);
    expect(isSafeToLog(sensitiveValue)).toBe(false);
    expect(redactSensitiveData(sensitiveValue)).toEqual({
      password: '[REDACTED]',
      accountNumber: '[REDACTED]',
      nested: {
        token: '[REDACTED]',
        safe: 'synthetic',
      },
    });
  });

  it('does not use network APIs in production source files', () => {
    const prohibitedUsages = getProductionSource()
      .filter(({ source }) => NETWORK_API_PATTERN.test(source))
      .map(({ relativePath }) => relativePath);

    expect(prohibitedUsages).toEqual([]);
  });

  it('uses the privacy-safe logger instead of direct console logging in production code', () => {
    const directConsoleUsages = getProductionSource()
      .filter(({ relativePath, source }) => {
        if (relativePath === 'utils/safeLog.js') {
          return false;
        }

        return DIRECT_CONSOLE_PATTERN.test(source);
      })
      .map(({ relativePath }) => relativePath);

    expect(directConsoleUsages).toEqual([]);
  });

  it('does not expose full account identifiers through production display markup', () => {
    const unmaskedAccountNumberUsages = getProductionSource()
      .filter(({ relativePath, source }) => {
        const normalizedPath = relativePath.replaceAll('\\', '/');

        if (
          normalizedPath === 'fixtures/fixtures.js' ||
          normalizedPath === 'utils/formatters.js'
        ) {
          return false;
        }

        const accountNumberMatches = source.match(FULL_ACCOUNT_NUMBER_PATTERN);

        return accountNumberMatches?.some(
          (value) =>
            FIXTURES.accounts.some(
              (account) => String(account.accountNumber) === value,
            ),
        );
      })
      .map(({ relativePath }) => relativePath);

    expect(unmaskedAccountNumberUsages).toEqual([]);
  });

  it('keeps sensitive fixture credentials confined to the fixture contract', () => {
    const productionSource = getProductionSource();

    productionSource
      .filter(
        ({ relativePath }) =>
          relativePath.replaceAll('\\', '/') !== 'fixtures/fixtures.js',
      )
      .forEach(({ source }) => {
        expect(source).not.toContain("'demo-only'");
        expect(source).not.toContain('"demo-only"');
      });

    expect(FIXTURES.credentials).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          password: expect.any(String),
        }),
      ]),
    );
  });
});