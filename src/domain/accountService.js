import {
  DEFAULT_FIXTURE_USER_ID,
  FIXTURES,
} from '../fixtures/fixtures.js';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneValue(value) {
  if (value === undefined || value === null || typeof value !== 'object') {
    return value;
  }

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // Fall through to the JSON-compatible clone.
    }
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function normalizeIdentifier(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
}

function normalizePersonaId(personaOrId) {
  if (typeof personaOrId === 'string' || typeof personaOrId === 'number') {
    return normalizeIdentifier(personaOrId);
  }

  if (isObject(personaOrId)) {
    return normalizeIdentifier(personaOrId.id);
  }

  return '';
}

function normalizeAccountId(accountOrId) {
  if (typeof accountOrId === 'string' || typeof accountOrId === 'number') {
    return normalizeIdentifier(accountOrId);
  }

  if (isObject(accountOrId)) {
    return normalizeIdentifier(accountOrId.id);
  }

  return '';
}

function getPersona(personaOrId) {
  const personaId = normalizePersonaId(personaOrId);

  if (!personaId) {
    return null;
  }

  return FIXTURES.personas.find((persona) => persona.id === personaId) || null;
}

function getAccount(accountOrId) {
  const accountId = normalizeAccountId(accountOrId);

  if (!accountId) {
    return null;
  }

  return FIXTURES.accounts.find((account) => account.id === accountId) || null;
}

function getOwnedFixtureAccounts(personaOrId) {
  const personaId = normalizePersonaId(personaOrId);

  if (!personaId || !getPersona(personaId)) {
    return [];
  }

  return FIXTURES.accounts.filter((account) => account.userId === personaId);
}

/**
 * Returns all accounts owned by a persona.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @returns {Object[]}
 */
export function getAccountsForPersona(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  return cloneValue(getOwnedFixtureAccounts(personaOrId));
}

/**
 * Alias for listing accounts owned by a persona.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @returns {Object[]}
 */
export function listAccounts(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  return getAccountsForPersona(personaOrId);
}

/**
 * Returns whether an account belongs to a persona.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} accountOrId
 * @returns {boolean}
 */
export function isAccountOwnedByPersona(personaOrId, accountOrId) {
  const personaId = normalizePersonaId(personaOrId);
  const accountId = normalizeAccountId(accountOrId);

  if (!personaId || !accountId || !getPersona(personaId)) {
    return false;
  }

  const account = getAccount(accountId);
  return account !== null && account.userId === personaId;
}

/**
 * Validates account ownership without exposing an account that is unavailable
 * to the requested persona.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} accountOrId
 * @returns {{valid: boolean, account?: Object|null, reason?: string}}
 */
export function validateAccountOwnership(personaOrId, accountOrId) {
  const personaId = normalizePersonaId(personaOrId);
  const accountId = normalizeAccountId(accountOrId);

  if (!personaId || !getPersona(personaId)) {
    return {
      valid: false,
      account: null,
      reason: 'PERSONA_NOT_FOUND',
    };
  }

  if (!accountId) {
    return {
      valid: false,
      account: null,
      reason: 'ACCOUNT_NOT_FOUND',
    };
  }

  const account = getAccount(accountId);

  if (!account) {
    return {
      valid: false,
      account: null,
      reason: 'ACCOUNT_NOT_FOUND',
    };
  }

  if (account.userId !== personaId) {
    return {
      valid: false,
      account: null,
      reason: 'ACCOUNT_UNAVAILABLE',
    };
  }

  return {
    valid: true,
    account: cloneValue(account),
  };
}

/**
 * Returns an account only when it is owned by the requested persona.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} accountOrId
 * @returns {Object|null}
 */
export function getAccountForPersona(personaOrId, accountOrId) {
  const result = validateAccountOwnership(personaOrId, accountOrId);
  return result.valid ? result.account : null;
}

/**
 * Returns the details for an account owned by a persona.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} accountOrId
 * @returns {Object|null}
 */
export function getAccountDetails(personaOrId, accountOrId) {
  return getAccountForPersona(personaOrId, accountOrId);
}

/**
 * Looks up an account by ID within a persona's account scope.
 *
 * The persona is required so an account belonging to another persona is
 * treated as unavailable.
 *
 * @param {string|Object} accountOrId
 * @param {string|Object} personaOrId
 * @returns {Object|null}
 */
export function getAccountById(accountOrId, personaOrId) {
  return getAccountForPersona(personaOrId, accountOrId);
}

/**
 * Returns whether an account exists and is available to a persona.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} accountOrId
 * @returns {boolean}
 */
export function isAccountAvailable(personaOrId, accountOrId) {
  return isAccountOwnedByPersona(personaOrId, accountOrId);
}

/**
 * Returns the account count for a persona.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @returns {number}
 */
export function getAccountCount(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  return getOwnedFixtureAccounts(personaOrId).length;
}

export const accountService = {
  getAccountById,
  getAccountCount,
  getAccountDetails,
  getAccountForPersona,
  getAccountsForPersona,
  isAccountAvailable,
  isAccountOwnedByPersona,
  listAccounts,
  validateAccountOwnership,
};

export default accountService;