import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../config/constants.js';
import authService from './authService.js';
import storageService from './storageService.js';

describe('StorageService', () => {
  beforeEach(() => {
    storageService.resetStorage();
    localStorage.removeItem('unrelated-application-key');
    sessionStorage.removeItem('unrelated-application-key');
  });

  it('persists allowlisted values in a versioned envelope and removes password fields', () => {
    const result = storageService.setStorageItem(STORAGE_KEYS.user, {
      id: 'user-miguel-santos',
      password: 'demo-only',
      profile: {
        passcode: '1234',
        label: 'Demo user',
      },
    });

    expect(result).toBe(true);
    expect(
      storageService.getStorageItem(STORAGE_KEYS.user, null),
    ).toEqual({
      id: 'user-miguel-santos',
      profile: {
        label: 'Demo user',
      },
    });

    const rawValue = localStorage.getItem(STORAGE_KEYS.user);

    expect(rawValue).toContain('"version":1');
    expect(rawValue).not.toContain('demo-only');
    expect(rawValue).not.toContain('passcode');
  });

  it('rejects storage keys outside the persistence allowlist', () => {
    const result = storageService.setStorageItem('unapproved-key', {
      value: 'should not persist',
    });

    expect(result).toBe(false);
    expect(storageService.isAllowedStorageKey('unapproved-key')).toBe(false);
    expect(localStorage.getItem('unapproved-key')).toBe(null);
    expect(
      storageService.getStorageItem('unapproved-key', 'safe fallback'),
    ).toBe('safe fallback');
  });

  it('keeps session values in session storage and application values in local storage', () => {
    const session = {
      token: 'nova-demo-token:user-miguel-santos',
      userId: 'user-miguel-santos',
    };

    expect(storageService.setSession(session)).toBe(true);
    expect(sessionStorage.getItem(STORAGE_KEYS.session)).not.toBe(null);
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBe(null);
    expect(storageService.getSession()).toEqual(session);
  });

  it('migrates legacy unversioned values into the current storage envelope', () => {
    localStorage.setItem(
      STORAGE_KEYS.accounts,
      JSON.stringify([
        {
          id: 'account-demo',
          accountNumber: '123456789',
          password: 'must-not-persist',
        },
      ]),
    );
    sessionStorage.setItem(
      STORAGE_KEYS.session,
      JSON.stringify({
        token: 'nova-demo-token',
        userId: 'user-miguel-santos',
      }),
    );

    const result = storageService.migrateStorage();

    expect(result.migrated).toEqual(
      expect.arrayContaining([STORAGE_KEYS.accounts, STORAGE_KEYS.session]),
    );
    expect(result.failed).toEqual([]);
    expect(
      storageService.getStorageItem(STORAGE_KEYS.accounts, []),
    ).toEqual([
      {
        id: 'account-demo',
        accountNumber: '123456789',
      },
    ]);
    expect(storageService.getSession()).toEqual({
      token: 'nova-demo-token',
      userId: 'user-miguel-santos',
    });
    expect(localStorage.getItem(STORAGE_KEYS.accounts)).toContain('"version":1');
    expect(sessionStorage.getItem(STORAGE_KEYS.session)).toContain('"version":1');
  });

  it('removes malformed legacy values during migration', () => {
    localStorage.setItem(STORAGE_KEYS.transactions, '{not-valid-json');

    const result = storageService.migrateStorage();

    expect(result.removed).toContain(STORAGE_KEYS.transactions);
    expect(localStorage.getItem(STORAGE_KEYS.transactions)).toBe(null);
    expect(
      storageService.getStorageItem(STORAGE_KEYS.transactions, []),
    ).toEqual([]);
  });

  it('resets application-owned storage without removing unrelated values', () => {
    storageService.setStorageItem(STORAGE_KEYS.user, {
      id: 'user-miguel-santos',
    });
    storageService.setStorageItem(STORAGE_KEYS.session, {
      token: 'nova-demo-token',
      userId: 'user-miguel-santos',
    });
    localStorage.setItem('unrelated-application-key', 'preserve me');

    const result = storageService.resetStorage();

    expect(result).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.user)).toBe(null);
    expect(sessionStorage.getItem(STORAGE_KEYS.session)).toBe(null);
    expect(localStorage.getItem('unrelated-application-key')).toBe(
      'preserve me',
    );
  });

  it('stores and clears a remembered demo User ID without persisting a password', () => {
    const remembered = authService.rememberUserId('user-miguel-santos');

    expect(remembered).toBe(true);
    expect(authService.getRememberedUserId()).toBe('user-miguel-santos');

    const storedUser = storageService.getStorageItem(STORAGE_KEYS.user, null);

    expect(storedUser).toEqual({
      rememberedUserId: 'user-miguel-santos',
    });
    expect(storedUser).not.toHaveProperty('password');

    expect(authService.clearRememberedUserId()).toBe(true);
    expect(authService.getRememberedUserId()).toBe('');
    expect(storageService.getStorageItem(STORAGE_KEYS.user, null)).toBe(null);
  });

  it('returns safe defaults when stored data is invalid or unavailable', () => {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify({ invalid: true }));

    expect(
      storageService.getStorageItem(STORAGE_KEYS.user, { fallback: true }),
    ).toEqual({
      invalid: true,
    });

    expect(
      storageService.getStorageItem('not-allowlisted', { fallback: true }),
    ).toEqual({
      fallback: true,
    });
    expect(storageService.getStorageDefault(STORAGE_KEYS.accounts)).toEqual([]);
  });
});