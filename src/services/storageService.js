import { STORAGE_KEYS } from '../config/constants.js';

export const STORAGE_SCHEMA_VERSION = 1;
export const STORAGE_VERSION = STORAGE_SCHEMA_VERSION;

const STORAGE_KEY_VALUES = Object.freeze(Object.values(STORAGE_KEYS));
const ALLOWED_STORAGE_KEYS = new Set(STORAGE_KEY_VALUES);
const PASSWORD_KEY_PATTERN = /(?:^|[_-])(password|passwd|passcode)(?:$|[_-])/i;

const DEFAULT_VALUES = Object.freeze({
  [STORAGE_KEYS.session]: null,
  [STORAGE_KEYS.user]: null,
  [STORAGE_KEYS.accounts]: [],
  [STORAGE_KEYS.transactions]: [],
  [STORAGE_KEYS.beneficiaries]: [],
  [STORAGE_KEYS.onboarding]: {},
  [STORAGE_KEYS.theme]: 'light',
});

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // Fall through to the JSON-compatible clone.
    }
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}

function getDefaultValue(key, fallback) {
  if (fallback !== undefined) {
    return cloneValue(fallback);
  }

  return cloneValue(DEFAULT_VALUES[key]);
}

function getStorageArea(area) {
  if (area === 'session' || area === 'sessionStorage') {
    return globalThis.sessionStorage;
  }

  if (area === 'local' || area === 'localStorage') {
    return globalThis.localStorage;
  }

  return undefined;
}

function getStorageForKey(key) {
  return key === STORAGE_KEYS.session
    ? getStorageArea('session')
    : getStorageArea('local');
}

function isAllowedKey(key) {
  return typeof key === 'string' && ALLOWED_STORAGE_KEYS.has(key);
}

function removePasswords(value) {
  if (Array.isArray(value)) {
    return value.map((item) => removePasswords(item));
  }

  if (!isObject(value)) {
    return value;
  }

  const sanitizedValue = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (PASSWORD_KEY_PATTERN.test(key)) {
      continue;
    }

    sanitizedValue[key] = removePasswords(nestedValue);
  }

  return sanitizedValue;
}

function createEnvelope(value) {
  return {
    version: STORAGE_SCHEMA_VERSION,
    data: removePasswords(value),
  };
}

function parseStoredValue(rawValue, fallback) {
  if (typeof rawValue !== 'string') {
    return getDefaultValue('', fallback);
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (
      isObject(parsedValue) &&
      Number.isInteger(parsedValue.version) &&
      Object.prototype.hasOwnProperty.call(parsedValue, 'data')
    ) {
      if (parsedValue.version > STORAGE_SCHEMA_VERSION) {
        return getDefaultValue('', fallback);
      }

      return removePasswords(parsedValue.data);
    }

    return removePasswords(parsedValue);
  } catch {
    return getDefaultValue('', fallback);
  }
}

/**
 * Returns whether a storage key is explicitly allowed by the persistence contract.
 *
 * @param {unknown} key
 * @returns {boolean}
 */
export function isAllowedStorageKey(key) {
  return isAllowedKey(key);
}

/**
 * Returns the safe default value for an allowed storage key.
 *
 * @param {string} key
 * @param {unknown} [fallback]
 * @returns {unknown}
 */
export function getStorageDefault(key, fallback) {
  return getDefaultValue(key, fallback);
}

/**
 * Reads and parses an allowlisted value from browser storage.
 *
 * @param {string} key
 * @param {unknown} [fallback]
 * @returns {unknown}
 */
export function getStorageItem(key, fallback) {
  const safeFallback = getDefaultValue(key, fallback);

  if (!isAllowedKey(key)) {
    return safeFallback;
  }

  const storage = getStorageForKey(key);

  if (!storage) {
    return safeFallback;
  }

  try {
    const rawValue = storage.getItem(key);

    if (rawValue === null) {
      return safeFallback;
    }

    const parsedValue = parseStoredValue(rawValue, safeFallback);
    return parsedValue === undefined ? safeFallback : cloneValue(parsedValue);
  } catch {
    return safeFallback;
  }
}

/**
 * Persists an allowlisted value using a versioned envelope.
 *
 * Password and passcode fields are removed before serialization.
 *
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean}
 */
export function setStorageItem(key, value) {
  if (!isAllowedKey(key) || value === undefined) {
    return false;
  }

  const storage = getStorageForKey(key);

  if (!storage) {
    return false;
  }

  try {
    const envelope = createEnvelope(value);
    storage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes an allowlisted value from browser storage.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function removeStorageItem(key) {
  if (!isAllowedKey(key)) {
    return false;
  }

  const storage = getStorageForKey(key);

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Determines whether an allowlisted value exists in browser storage.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function hasStorageItem(key) {
  if (!isAllowedKey(key)) {
    return false;
  }

  const storage = getStorageForKey(key);

  if (!storage) {
    return false;
  }

  try {
    return storage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/**
 * Migrates legacy unversioned values to the current storage envelope.
 *
 * @returns {{migrated: string[], removed: string[], failed: string[]}}
 */
export function migrateStorage() {
  const result = {
    migrated: [],
    removed: [],
    failed: [],
  };

  for (const key of STORAGE_KEY_VALUES) {
    const storage = getStorageForKey(key);

    if (!storage) {
      continue;
    }

    try {
      const rawValue = storage.getItem(key);

      if (rawValue === null) {
        continue;
      }

      const parsedValue = JSON.parse(rawValue);

      if (
        isObject(parsedValue) &&
        Number.isInteger(parsedValue.version) &&
        Object.prototype.hasOwnProperty.call(parsedValue, 'data')
      ) {
        if (parsedValue.version > STORAGE_SCHEMA_VERSION) {
          storage.removeItem(key);
          result.removed.push(key);
        }

        continue;
      }

      const migrated = setStorageItem(key, parsedValue);

      if (migrated) {
        result.migrated.push(key);
      } else {
        result.failed.push(key);
      }
    } catch {
      try {
        storage.removeItem(key);
        result.removed.push(key);
      } catch {
        result.failed.push(key);
      }
    }
  }

  return result;
}

/**
 * Removes every value owned by this application from both storage areas.
 *
 * @returns {boolean}
 */
export function resetStorage() {
  let successful = true;

  for (const key of STORAGE_KEY_VALUES) {
    if (hasStorageItem(key) && !removeStorageItem(key)) {
      successful = false;
    }
  }

  return successful;
}

/**
 * Alias for resetting application-owned browser storage.
 *
 * @returns {boolean}
 */
export function clearStorage() {
  return resetStorage();
}

/**
 * Reads the persisted session.
 *
 * @returns {Object|null}
 */
export function getSession() {
  return getStorageItem(STORAGE_KEYS.session, null);
}

/**
 * Persists a session without retaining password fields.
 *
 * @param {Object} session
 * @returns {boolean}
 */
export function setSession(session) {
  return setStorageItem(STORAGE_KEYS.session, session);
}

/**
 * Removes the persisted session.
 *
 * @returns {boolean}
 */
export function removeSession() {
  return removeStorageItem(STORAGE_KEYS.session);
}

export const storageService = Object.freeze({
  clearStorage,
  getSession,
  getStorageDefault,
  getStorageItem,
  hasStorageItem,
  isAllowedStorageKey,
  migrateStorage,
  removeSession,
  removeStorageItem,
  resetStorage,
  setSession,
  setStorageItem,
  STORAGE_SCHEMA_VERSION,
});

export default storageService;