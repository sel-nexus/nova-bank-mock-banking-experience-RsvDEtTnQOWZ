import { beforeEach, describe, expect, it } from 'vitest';
import authService from './authService.js';
import { STORAGE_KEYS } from '../config/constants.js';
import storageService from './storageService.js';

const VALID_USER_ID = 'user-miguel-santos';
const VALID_PASSWORD = 'demo-only';

describe('AuthService', () => {
  beforeEach(() => {
    storageService.resetStorage();
  });

  it('authenticates valid demo credentials and returns a local session', () => {
    const result = authService.login({
      userId: VALID_USER_ID,
      password: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
    expect(result.data?.session?.userId).toBe(VALID_USER_ID);
    expect(result.data?.session?.token).toContain('nova-demo-token');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('rejects invalid credentials with an authentication error', () => {
    const result = authService.login({
      userId: VALID_USER_ID,
      password: 'incorrect-demo-password',
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_CREDENTIALS');
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('locks the account at the failed-attempt threshold', () => {
    const failedResults = Array.from({ length: 5 }, () =>
      authService.login({
        userId: VALID_USER_ID,
        password: 'incorrect-demo-password',
      }),
    );

    expect(failedResults.slice(0, 4).every((result) => !result.success)).toBe(
      true,
    );
    expect(failedResults[4].success).toBe(false);
    expect(failedResults[4].error?.code).toBe('ACCOUNT_LOCKED');

    const lockoutStatus = authService.getLockoutStatus(VALID_USER_ID);

    expect(lockoutStatus.locked).toBe(true);
    expect(lockoutStatus.failedAttempts).toBe(5);

    const retryResult = authService.login({
      userId: VALID_USER_ID,
      password: VALID_PASSWORD,
    });

    expect(retryResult.success).toBe(false);
    expect(retryResult.error?.code).toBe('ACCOUNT_LOCKED');
  });

  it('returns recovery guidance for the demo authentication flow', () => {
    const result = authService.getRecoveryPrompt();

    expect(result.success).toBe(true);
    expect(result.data?.prompt).toEqual(expect.any(String));
    expect(result.data?.supportEmail).toBe('support@novabank.demo');

    const unknownUserResult =
      authService.requestPasswordRecovery('unknown-demo-user');

    expect(unknownUserResult.success).toBe(false);
    expect(unknownUserResult.error?.code).toBe('RECOVERY_UNAVAILABLE');
  });

  it('persists the User ID when remember me is enabled', () => {
    const result = authService.login({
      userId: VALID_USER_ID,
      password: VALID_PASSWORD,
      rememberMe: true,
    });

    expect(result.success).toBe(true);
    expect(authService.getRememberedUserId()).toBe(VALID_USER_ID);
    expect(
      storageService.getStorageItem(STORAGE_KEYS.user, null),
    ).toMatchObject({
      id: VALID_USER_ID,
      rememberedUserId: VALID_USER_ID,
    });
  });

  it('does not persist passwords in browser storage', () => {
    const result = authService.login({
      userId: VALID_USER_ID,
      password: VALID_PASSWORD,
      rememberMe: true,
    });

    expect(result.success).toBe(true);

    const storedUser = storageService.getStorageItem(STORAGE_KEYS.user, null);
    const storedSession = storageService.getStorageItem(
      STORAGE_KEYS.session,
      null,
    );

    expect(storedUser).not.toHaveProperty('password');
    expect(storedSession).not.toHaveProperty('password');

    const persistedValues = Object.values(localStorage).join(' ');

    expect(persistedValues).not.toContain(VALID_PASSWORD);
  });
});