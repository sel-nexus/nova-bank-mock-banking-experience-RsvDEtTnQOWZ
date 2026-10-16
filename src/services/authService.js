import {
  DEMO_CONSTANTS,
  STORAGE_KEYS,
  TOKEN_VALUES,
} from '../config/constants.js';
import {
  DEFAULT_FIXTURE_USER_ID,
  FIXTURES,
} from '../fixtures/fixtures.js';
import {
  getReferenceDate,
  getReferenceDateString,
} from '../domain/referenceClock.js';
import {
  getSession,
  getStorageItem,
  removeSession,
  removeStorageItem,
  setSession,
  setStorageItem,
} from './storageService.js';

export const AUTH_MAX_FAILED_ATTEMPTS = 5;
export const AUTH_LOCKOUT_MINUTES = 15;
export const AUTH_LOCKOUT_MILLISECONDS = AUTH_LOCKOUT_MINUTES * 60 * 1000;

const AUTH_STATE_KEY = STORAGE_KEYS.onboarding;
const USER_KEY = STORAGE_KEYS.user;

const DEFAULT_RECOVERY_PROMPT =
  'Use the demo credentials supplied with this experience, or contact demo support for assistance.';
const INVALID_CREDENTIALS_MESSAGE = 'The User ID or password is incorrect.';
const LOCKED_ACCOUNT_MESSAGE =
  'Too many unsuccessful attempts. Please try again after the temporary lockout period.';

function normalizeValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createIdToken(userId) {
  return `${TOKEN_VALUES.demoToken}:${userId}`;
}

function getPersonaById(userId) {
  return FIXTURES.personas.find((persona) => persona.id === userId) || null;
}

function getCredentialByUserId(userId) {
  return (
    FIXTURES.credentials.find((credential) => credential.userId === userId) ||
    null
  );
}

function findCredential(userId) {
  const normalizedUserId = normalizeValue(userId).toLowerCase();

  if (!normalizedUserId) {
    return null;
  }

  return (
    FIXTURES.credentials.find((credential) => {
      const identifiers = [
        credential.userId,
        credential.email,
        credential.username,
      ];

      return identifiers.some(
        (identifier) =>
          normalizeValue(identifier).toLowerCase() === normalizedUserId,
      );
    }) || null
  );
}

function getAuthState() {
  const state = getStorageItem(AUTH_STATE_KEY, {});
  return isObject(state) ? state : {};
}

function saveAuthState(state) {
  return setStorageItem(AUTH_STATE_KEY, isObject(state) ? state : {});
}

function getAttemptState(userId) {
  const state = getAuthState();
  const attempts = isObject(state.authAttempts) ? state.authAttempts : {};
  const attempt = attempts[userId];

  return isObject(attempt)
    ? {
        failedAttempts: Number.isInteger(attempt.failedAttempts)
          ? attempt.failedAttempts
          : 0,
        lockedUntil:
          typeof attempt.lockedUntil === 'number' ? attempt.lockedUntil : null,
      }
    : {
        failedAttempts: 0,
        lockedUntil: null,
      };
}

function setAttemptState(userId, attemptState) {
  const state = getAuthState();
  const attempts = isObject(state.authAttempts) ? state.authAttempts : {};

  if (attemptState.failedAttempts === 0 && !attemptState.lockedUntil) {
    delete attempts[userId];
  } else {
    attempts[userId] = attemptState;
  }

  return saveAuthState({
    ...state,
    authAttempts: attempts,
  });
}

function getNowTimestamp() {
  return getReferenceDate().getTime();
}

function isAttemptLocked(attemptState) {
  return (
    typeof attemptState.lockedUntil === 'number' &&
    attemptState.lockedUntil > getNowTimestamp()
  );
}

function clearAttemptState(userId) {
  return setAttemptState(userId, {
    failedAttempts: 0,
    lockedUntil: null,
  });
}

function getRememberedUserValue() {
  const storedUser = getStorageItem(USER_KEY, null);

  if (typeof storedUser === 'string') {
    return normalizeValue(storedUser);
  }

  if (!isObject(storedUser)) {
    return '';
  }

  return normalizeValue(
    storedUser.rememberedUserId ||
      storedUser.rememberedUsername ||
      storedUser.username,
  );
}

function setRememberedUserValue(userId) {
  const normalizedUserId = normalizeValue(userId);

  if (!normalizedUserId) {
    return false;
  }

  const storedUser = getStorageItem(USER_KEY, null);
  const userData = isObject(storedUser) ? storedUser : {};

  return setStorageItem(USER_KEY, {
    ...userData,
    rememberedUserId: normalizedUserId,
  });
}

function createSession(userId) {
  const createdAt = new Date(getNowTimestamp()).toISOString();
  const expiresAt = new Date(
    getNowTimestamp() + TOKEN_VALUES.expirySeconds * 1000,
  ).toISOString();
  const refreshExpiresAt = new Date(
    getNowTimestamp() + TOKEN_VALUES.refreshExpirySeconds * 1000,
  ).toISOString();

  return {
    token: createIdToken(userId),
    refreshToken: `${TOKEN_VALUES.demoToken}-refresh:${userId}`,
    tokenType: TOKEN_VALUES.tokenType,
    userId,
    createdAt,
    expiresAt,
    refreshExpiresAt,
  };
}

function createSuccess(data, message) {
  return {
    success: true,
    ...(data !== undefined ? { data } : {}),
    ...(message ? { message } : {}),
  };
}

function createFailure(code, message, details) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

/**
 * Validates credentials against the local demo fixture.
 *
 * @param {string} userId
 * @param {string} password
 * @returns {{valid: boolean, userId?: string, persona?: Object|null, error?: Object}}
 */
export function validateCredentials(userId, password) {
  const credential = findCredential(userId);

  if (
    !credential ||
    typeof password !== 'string' ||
    password !== credential.password
  ) {
    return {
      valid: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: INVALID_CREDENTIALS_MESSAGE,
      },
    };
  }

  return {
    valid: true,
    userId: credential.userId,
    persona: getPersonaById(credential.userId),
  };
}

/**
 * Authenticates a demo user and creates a local session.
 *
 * @param {string|Object} userIdOrCredentials
 * @param {string} [password]
 * @param {boolean|Object} [options]
 * @returns {{success: boolean, data?: Object, error?: Object, message?: string}}
 */
export function login(userIdOrCredentials, password, options = {}) {
  const credentials = isObject(userIdOrCredentials)
    ? userIdOrCredentials
    : {
        userId: userIdOrCredentials,
        password,
        ...(typeof options === 'boolean' ? { rememberMe: options } : options),
      };

  const userId = normalizeValue(
    credentials.userId || credentials.username || credentials.email,
  );
  const suppliedPassword = credentials.password;
  const rememberMe =
    credentials.rememberMe === true || credentials.remembered === true;

  if (!userId || typeof suppliedPassword !== 'string') {
    return createFailure(
      'INVALID_REQUEST',
      'A User ID and password are required.',
    );
  }

  const credential = findCredential(userId);
  const lockoutKey = credential?.userId || userId.toLowerCase();
  const attemptState = getAttemptState(lockoutKey);

  if (isAttemptLocked(attemptState)) {
    return createFailure('ACCOUNT_LOCKED', LOCKED_ACCOUNT_MESSAGE, {
      lockedUntil: new Date(attemptState.lockedUntil).toISOString(),
      remainingSeconds: Math.ceil(
        (attemptState.lockedUntil - getNowTimestamp()) / 1000,
      ),
    });
  }

  if (attemptState.lockedUntil) {
    clearAttemptState(lockoutKey);
  }

  const validation = validateCredentials(userId, suppliedPassword);

  if (!validation.valid) {
    const failedAttempts = attemptState.failedAttempts + 1;
    const shouldLock = failedAttempts >= AUTH_MAX_FAILED_ATTEMPTS;
    const lockedUntil = shouldLock
      ? getNowTimestamp() + AUTH_LOCKOUT_MILLISECONDS
      : null;

    setAttemptState(lockoutKey, {
      failedAttempts,
      lockedUntil,
    });

    if (shouldLock) {
      return createFailure('ACCOUNT_LOCKED', LOCKED_ACCOUNT_MESSAGE, {
        failedAttempts,
        lockedUntil: new Date(lockedUntil).toISOString(),
      });
    }

    return createFailure('INVALID_CREDENTIALS', INVALID_CREDENTIALS_MESSAGE, {
      failedAttempts,
      remainingAttempts: AUTH_MAX_FAILED_ATTEMPTS - failedAttempts,
    });
  }

  clearAttemptState(validation.userId);

  const session = createSession(validation.userId);
  const sessionSaved = setSession(session);

  if (!sessionSaved) {
    return createFailure(
      'SESSION_PERSISTENCE_FAILED',
      'Unable to create a local demo session.',
    );
  }

  setStorageItem(USER_KEY, {
    id: validation.userId,
    ...(rememberMe ? { rememberedUserId: userId } : {}),
  });

  if (!rememberMe) {
    const storedUser = getStorageItem(USER_KEY, null);

    if (isObject(storedUser) && storedUser.rememberedUserId) {
      setStorageItem(USER_KEY, {
        id: validation.userId,
        rememberedUserId: storedUser.rememberedUserId,
      });
    }
  }

  return createSuccess(
    {
      session,
      user: validation.persona,
    },
    'You are now signed in to the Nova Bank Demo.',
  );
}

/**
 * Alias for login.
 *
 * @param {string|Object} userIdOrCredentials
 * @param {string} [password]
 * @param {boolean|Object} [options]
 * @returns {{success: boolean, data?: Object, error?: Object, message?: string}}
 */
export function authenticate(userIdOrCredentials, password, options) {
  return login(userIdOrCredentials, password, options);
}

/**
 * Logs out the current local demo session.
 *
 * @returns {{success: boolean, message: string}}
 */
export function logout() {
  const removed = removeSession();

  if (!removed) {
    return createFailure(
      'LOGOUT_FAILED',
      'Unable to clear the local demo session.',
    );
  }

  const storedUser = getStorageItem(USER_KEY, null);

  if (isObject(storedUser) && storedUser.rememberedUserId) {
    setStorageItem(USER_KEY, {
      rememberedUserId: storedUser.rememberedUserId,
    });
  } else {
    removeStorageItem(USER_KEY);
  }

  return createSuccess(undefined, 'You have been signed out.');
}

/**
 * Returns the current session when it is present and unexpired.
 *
 * @returns {Object|null}
 */
export function getCurrentSession() {
  const session = getSession();

  if (!isObject(session) || typeof session.expiresAt !== 'string') {
    return null;
  }

  const expiresAt = new Date(session.expiresAt).getTime();

  if (
    !Number.isFinite(expiresAt) ||
    expiresAt <= getNowTimestamp() ||
    typeof session.userId !== 'string'
  ) {
    removeSession();
    return null;
  }

  return session;
}

/**
 * Returns whether a valid local demo session exists.
 *
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getCurrentSession() !== null;
}

/**
 * Returns the active persona for the current session.
 *
 * @returns {Object|null}
 */
export function getActivePersona() {
  const session = getCurrentSession();
  return session ? getPersonaById(session.userId) : null;
}

/**
 * Alias for getActivePersona.
 *
 * @returns {Object|null}
 */
export function getCurrentUser() {
  return getActivePersona();
}

/**
 * Returns the remembered User ID, if one has been saved.
 *
 * @returns {string}
 */
export function getRememberedUserId() {
  return getRememberedUserValue();
}

/**
 * Remembers a User ID for the next local sign-in.
 *
 * @param {string} userId
 * @returns {boolean}
 */
export function rememberUserId(userId) {
  return setRememberedUserValue(userId);
}

/**
 * Clears the remembered User ID without logging the user out.
 *
 * @returns {boolean}
 */
export function clearRememberedUserId() {
  const storedUser = getStorageItem(USER_KEY, null);

  if (!isObject(storedUser)) {
    return true;
  }

  const { rememberedUserId, rememberedUsername, username, ...remainingUser } =
    storedUser;

  return Object.keys(remainingUser).length > 0
    ? setStorageItem(USER_KEY, remainingUser)
    : removeStorageItem(USER_KEY);
}

/**
 * Returns the local recovery guidance for the demo.
 *
 * @returns {{success: boolean, data: {prompt: string, supportEmail: string}}}
 */
export function getRecoveryPrompt() {
  return createSuccess({
    prompt: DEFAULT_RECOVERY_PROMPT,
    supportEmail: 'support@novabank.demo',
  });
}

/**
 * Provides a recovery prompt without changing credentials.
 *
 * @param {string} userId
 * @returns {{success: boolean, data?: Object, error?: Object}}
 */
export function requestPasswordRecovery(userId) {
  const credential = findCredential(userId);

  if (!credential) {
    return createFailure(
      'RECOVERY_UNAVAILABLE',
      'No demo account was found for that User ID.',
    );
  }

  return createSuccess({
    userId: credential.userId,
    prompt: DEFAULT_RECOVERY_PROMPT,
    supportEmail: 'support@novabank.demo',
  });
}

/**
 * Returns lockout details for a User ID.
 *
 * @param {string} userId
 * @returns {{locked: boolean, failedAttempts: number, lockedUntil: string|null}}
 */
export function getLockoutStatus(userId) {
  const credential = findCredential(userId);
  const key = credential?.userId || normalizeValue(userId).toLowerCase();
  const attemptState = getAttemptState(key);

  if (attemptState.lockedUntil && !isAttemptLocked(attemptState)) {
    clearAttemptState(key);
    return {
      locked: false,
      failedAttempts: 0,
      lockedUntil: null,
    };
  }

  return {
    locked: isAttemptLocked(attemptState),
    failedAttempts: attemptState.failedAttempts,
    lockedUntil: attemptState.lockedUntil
      ? new Date(attemptState.lockedUntil).toISOString()
      : null,
  };
}

/**
 * Returns the default fixture persona used by the demo.
 *
 * @returns {Object|null}
 */
export function getDefaultPersona() {
  return getPersonaById(DEFAULT_FIXTURE_USER_ID);
}

export const authService = Object.freeze({
  AUTH_LOCKOUT_MILLISECONDS,
  AUTH_LOCKOUT_MINUTES,
  AUTH_MAX_FAILED_ATTEMPTS,
  authenticate,
  clearRememberedUserId,
  getActivePersona,
  getCurrentSession,
  getCurrentUser,
  getDefaultPersona,
  getLockoutStatus,
  getRecoveryPrompt,
  getRememberedUserId,
  isAuthenticated,
  login,
  logout,
  rememberUserId,
  requestPasswordRecovery,
  validateCredentials,
});

export default authService;