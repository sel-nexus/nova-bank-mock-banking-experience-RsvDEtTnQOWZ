import { CURRENCY, DEMO_CONSTANTS } from '../config/constants.js';
import {
  getReferenceDateString,
  toIsoDate,
} from './referenceClock.js';
import { FIXTURES } from '../fixtures/fixtures.js';

export const FIXTURE_SCHEMA_VERSION = 1;
export const FIXTURE_SCHEMA_VERSION_STRING = '1.0.0';

const REQUIRED_COLLECTIONS = [
  'personas',
  'accounts',
  'transactions',
  'products',
  'offers',
  'supportRequests',
  'supportArticles',
  'branches',
  'faqs',
  'notifications',
  'chatConversations',
  'credentials',
];

const ACCOUNT_TYPES = new Set([
  'checking',
  'savings',
  'credit',
  'loan',
  'investment',
]);

const ACCOUNT_STATUSES = new Set([
  'active',
  'inactive',
  'closed',
  'pending',
]);

const TRANSACTION_DIRECTIONS = new Set(['credit', 'debit']);
const TRANSACTION_STATUSES = new Set([
  'pending',
  'completed',
  'failed',
  'cancelled',
]);
const TRANSACTION_TYPES = new Set([
  'card',
  'transfer',
  'payment',
  'deposit',
  'withdrawal',
  'fee',
  'interest',
  'refund',
  'other',
]);

const OFFER_STATUSES = new Set([
  'available',
  'claimed',
  'expired',
  'unavailable',
]);

const SUPPORT_REQUEST_TYPES = new Set([
  'question',
  'incident',
  'request',
  'feedback',
]);

const SUPPORT_REQUEST_STATUSES = new Set([
  'open',
  'in-progress',
  'resolved',
  'closed',
]);

const CHAT_ROLES = new Set(['user', 'assistant', 'system']);
const CHAT_STATUSES = new Set(['active', 'ended', 'waiting']);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEST_EMAIL_PATTERN = /^[^\s@]+@(?:example\.test|test|localhost)$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DIGITS_PATTERN = /^\d+$/;
const MASKED_ACCOUNT_PATTERN = /[•*xX]+(?:\s*[•*xX]+)*\s+\d{4}$/;

function addError(errors, path, message) {
  errors.push({
    path,
    message,
  });
}

function addWarning(warnings, path, message) {
  warnings.push({
    path,
    message,
  });
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteAmount(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidDate(value) {
  return (
    typeof value === 'string' &&
    ISO_DATE_PATTERN.test(value) &&
    toIsoDate(value) === value
  );
}

function validateCollection(bundle, collectionName, errors) {
  const collection = bundle[collectionName];

  if (!Array.isArray(collection)) {
    addError(errors, collectionName, 'Expected an array.');
    return [];
  }

  const identifiers = new Set();

  collection.forEach((item, index) => {
    const path = `${collectionName}[${index}]`;

    if (!isObject(item)) {
      addError(errors, path, 'Expected an object.');
      return;
    }

    if (!isNonEmptyString(item.id)) {
      addError(errors, `${path}.id`, 'Expected a non-empty identifier.');
      return;
    }

    if (identifiers.has(item.id)) {
      addError(errors, `${path}.id`, `Duplicate identifier "${item.id}".`);
    }

    identifiers.add(item.id);
  });

  return collection;
}

function validatePersonas(personas, errors, warnings) {
  personas.forEach((persona, index) => {
    const path = `personas[${index}]`;

    if (!isNonEmptyString(persona.name)) {
      addError(errors, `${path}.name`, 'Expected a non-empty name.');
    }

    if (!isNonEmptyString(persona.email) || !EMAIL_PATTERN.test(persona.email)) {
      addError(errors, `${path}.email`, 'Expected a valid email address.');
    } else if (!TEST_EMAIL_PATTERN.test(persona.email)) {
      addError(
        errors,
        `${path}.email`,
        'Fixture email addresses must use a reserved test domain.',
      );
    }

    if (persona.phone !== undefined && !isNonEmptyString(persona.phone)) {
      addError(errors, `${path}.phone`, 'Expected a non-empty phone number.');
    }

    if (persona.dateOfBirth !== undefined && !isValidDate(persona.dateOfBirth)) {
      addError(errors, `${path}.dateOfBirth`, 'Expected an ISO calendar date.');
    }

    if (persona.memberSince !== undefined && !isValidDate(persona.memberSince)) {
      addError(errors, `${path}.memberSince`, 'Expected an ISO calendar date.');
    }

    if (persona.isVerified !== undefined && typeof persona.isVerified !== 'boolean') {
      addError(errors, `${path}.isVerified`, 'Expected a boolean.');
    }

    if (persona.avatarUrl) {
      addWarning(
        warnings,
        `${path}.avatarUrl`,
        'Fixture avatars should not reference external user data.',
      );
    }
  });
}

function validateAccounts(accounts, personaIds, errors) {
  accounts.forEach((account, index) => {
    const path = `accounts[${index}]`;

    if (!personaIds.has(account.userId)) {
      addError(errors, `${path}.userId`, 'References an unknown persona.');
    }

    if (!isNonEmptyString(account.name)) {
      addError(errors, `${path}.name`, 'Expected a non-empty account name.');
    }

    if (!ACCOUNT_TYPES.has(account.type)) {
      addError(errors, `${path}.type`, 'Contains an unsupported account type.');
    }

    if (!ACCOUNT_STATUSES.has(account.status)) {
      addError(errors, `${path}.status`, 'Contains an unsupported account status.');
    }

    if (!isFiniteAmount(account.balance)) {
      addError(errors, `${path}.balance`, 'Expected a non-negative finite balance.');
    }

    if (
      account.availableBalance !== undefined &&
      !isFiniteAmount(account.availableBalance)
    ) {
      addError(
        errors,
        `${path}.availableBalance`,
        'Expected a non-negative finite available balance.',
      );
    }

    if (account.currency !== CURRENCY.code) {
      addError(
        errors,
        `${path}.currency`,
        `Expected currency "${CURRENCY.code}".`,
      );
    }

    if (account.accountNumber !== undefined) {
      if (!DIGITS_PATTERN.test(String(account.accountNumber))) {
        addError(
          errors,
          `${path}.accountNumber`,
          'Account numbers must contain digits only.',
        );
      }

      if (String(account.accountNumber).length < 4) {
        addError(
          errors,
          `${path}.accountNumber`,
          'Account numbers must contain at least four digits.',
        );
      }
    }

    if (account.maskedAccountNumber !== undefined) {
      const masked = String(account.maskedAccountNumber);
      const accountNumber = String(account.accountNumber || '');

      if (!MASKED_ACCOUNT_PATTERN.test(masked)) {
        addError(
          errors,
          `${path}.maskedAccountNumber`,
          'Expected a masked account number ending in four digits.',
        );
      }

      if (
        accountNumber.length >= 4 &&
        !masked.endsWith(accountNumber.slice(-4))
      ) {
        addError(
          errors,
          `${path}.maskedAccountNumber`,
          'Masked account number does not preserve the source account suffix.',
        );
      }

      if (accountNumber && masked.includes(accountNumber)) {
        addError(
          errors,
          `${path}.maskedAccountNumber`,
          'Masked account number exposes the full account number.',
        );
      }
    }

    if (
      account.routingNumber !== undefined &&
      !/^\d{9}$/.test(String(account.routingNumber))
    ) {
      addError(
        errors,
        `${path}.routingNumber`,
        'Routing numbers must contain exactly nine digits.',
      );
    }

    if (account.openedAt !== undefined && !isValidDate(account.openedAt)) {
      addError(errors, `${path}.openedAt`, 'Expected an ISO calendar date.');
    }
  });
}

function validateTransactions(transactions, accountIds, errors) {
  transactions.forEach((transaction, index) => {
    const path = `transactions[${index}]`;

    if (!accountIds.has(transaction.accountId)) {
      addError(errors, `${path}.accountId`, 'References an unknown account.');
    }

    if (!TRANSACTION_DIRECTIONS.has(transaction.direction)) {
      addError(errors, `${path}.direction`, 'Contains an unsupported direction.');
    }

    if (!TRANSACTION_STATUSES.has(transaction.status)) {
      addError(errors, `${path}.status`, 'Contains an unsupported status.');
    }

    if (!TRANSACTION_TYPES.has(transaction.type)) {
      addError(errors, `${path}.type`, 'Contains an unsupported transaction type.');
    }

    if (!isFiniteAmount(transaction.amount) || transaction.amount === 0) {
      addError(
        errors,
        `${path}.amount`,
        'Expected a positive finite transaction amount.',
      );
    }

    if (transaction.currency !== CURRENCY.code) {
      addError(
        errors,
        `${path}.currency`,
        `Expected currency "${CURRENCY.code}".`,
      );
    }

    if (!isNonEmptyString(transaction.description)) {
      addError(errors, `${path}.description`, 'Expected a transaction description.');
    }

    if (!isValidDate(transaction.date)) {
      addError(errors, `${path}.date`, 'Expected an ISO calendar date.');
    }

    for (const field of ['postedAt', 'createdAt']) {
      if (
        transaction[field] !== undefined &&
        (typeof transaction[field] !== 'string' ||
          Number.isNaN(new Date(transaction[field]).getTime()))
      ) {
        addError(errors, `${path}.${field}`, 'Expected a valid timestamp.');
      }
    }
  });
}

function validateOffers(offers, errors) {
  offers.forEach((offer, index) => {
    const path = `offers[${index}]`;

    for (const field of ['title', 'description', 'category']) {
      if (!isNonEmptyString(offer[field])) {
        addError(errors, `${path}.${field}`, 'Expected a non-empty value.');
      }
    }

    if (!OFFER_STATUSES.has(offer.status)) {
      addError(errors, `${path}.status`, 'Contains an unsupported offer status.');
    }

    if (!isValidDate(offer.validFrom) || !isValidDate(offer.validUntil)) {
      addError(
        errors,
        `${path}`,
        'Offer validity dates must be ISO calendar dates.',
      );
    } else if (offer.validFrom > offer.validUntil) {
      addError(errors, path, 'Offer validFrom must not be after validUntil.');
    }

    if (offer.amount !== undefined && !isFiniteAmount(offer.amount)) {
      addError(errors, `${path}.amount`, 'Expected a non-negative amount.');
    }

    if (
      offer.percentage !== undefined &&
      (typeof offer.percentage !== 'number' ||
        !Number.isFinite(offer.percentage) ||
        offer.percentage < 0 ||
        offer.percentage > 100)
    ) {
      addError(errors, `${path}.percentage`, 'Expected a percentage from 0 to 100.');
    }
  });
}

function validateSupportData(bundle, errors) {
  bundle.supportRequests.forEach((request, index) => {
    const path = `supportRequests[${index}]`;

    if (!SUPPORT_REQUEST_TYPES.has(request.type)) {
      addError(errors, `${path}.type`, 'Contains an unsupported request type.');
    }

    if (!SUPPORT_REQUEST_STATUSES.has(request.status)) {
      addError(errors, `${path}.status`, 'Contains an unsupported request status.');
    }

    for (const field of ['subject', 'description']) {
      if (!isNonEmptyString(request[field])) {
        addError(errors, `${path}.${field}`, 'Expected a non-empty value.');
      }
    }
  });

  bundle.chatConversations.forEach((conversation, index) => {
    const path = `chatConversations[${index}]`;

    if (!CHAT_STATUSES.has(conversation.status)) {
      addError(errors, `${path}.status`, 'Contains an unsupported chat status.');
    }

    if (!Array.isArray(conversation.messages)) {
      addError(errors, `${path}.messages`, 'Expected an array of messages.');
      return;
    }

    conversation.messages.forEach((message, messageIndex) => {
      const messagePath = `${path}.messages[${messageIndex}]`;

      if (!CHAT_ROLES.has(message.role)) {
        addError(errors, `${messagePath}.role`, 'Contains an unsupported message role.');
      }

      if (!isNonEmptyString(message.content)) {
        addError(errors, `${messagePath}.content`, 'Expected message content.');
      }
    });
  });
}

function validatePrivacy(bundle, errors) {
  bundle.personas.forEach((persona, index) => {
    if (persona.email && !TEST_EMAIL_PATTERN.test(persona.email)) {
      addError(
        errors,
        `personas[${index}].email`,
        'Personal email addresses are not permitted in fixtures.',
      );
    }
  });

  bundle.credentials.forEach((credential, index) => {
    const path = `credentials[${index}]`;

    if (credential.email && !TEST_EMAIL_PATTERN.test(credential.email)) {
      addError(errors, `${path}.email`, 'Credential emails must use a test domain.');
    }

    if (
      typeof credential.password === 'string' &&
      credential.password.length > 0 &&
      !credential.password.toLowerCase().includes('demo')
    ) {
      addWarning(
        errors,
        `${path}.password`,
        'Fixture passwords should clearly identify themselves as demo-only values.',
      );
    }
  });

  bundle.accounts.forEach((account, index) => {
    if (
      account.accountNumber &&
      account.maskedAccountNumber &&
      String(account.maskedAccountNumber).includes(String(account.accountNumber))
    ) {
      addError(
        errors,
        `accounts[${index}].maskedAccountNumber`,
        'Sensitive account data is exposed by the masked value.',
      );
    }
  });
}

/**
 * Validates the schema version declared by a fixture bundle.
 *
 * @param {Object} bundle
 * @returns {{valid: boolean, errors: Array<{path: string, message: string}>}}
 */
export function validateFixtureSchema(bundle) {
  const errors = [];

  if (!isObject(bundle)) {
    addError(errors, '', 'Fixture bundle must be an object.');
    return { valid: false, errors };
  }

  const version = bundle.schemaVersion;

  if (
    version !== undefined &&
    version !== FIXTURE_SCHEMA_VERSION &&
    version !== FIXTURE_SCHEMA_VERSION_STRING
  ) {
    addError(
      errors,
      'schemaVersion',
      `Expected fixture schema version ${FIXTURE_SCHEMA_VERSION}.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates masking and privacy requirements for a fixture bundle.
 *
 * @param {Object} bundle
 * @returns {{valid: boolean, errors: Array<{path: string, message: string}>}}
 */
export function validateFixturePrivacy(bundle) {
  const errors = [];

  if (!isObject(bundle)) {
    addError(errors, '', 'Fixture bundle must be an object.');
    return { valid: false, errors };
  }

  if (Array.isArray(bundle.accounts)) {
    bundle.accounts.forEach((account, index) => {
      if (
        account.maskedAccountNumber !== undefined &&
        !MASKED_ACCOUNT_PATTERN.test(String(account.maskedAccountNumber))
      ) {
        addError(
          errors,
          `accounts[${index}].maskedAccountNumber`,
          'Expected a masked account number.',
        );
      }
    });
  }

  if (Array.isArray(bundle.personas) && Array.isArray(bundle.credentials)) {
    validatePrivacy(
      {
        personas: bundle.personas,
        accounts: Array.isArray(bundle.accounts) ? bundle.accounts : [],
        credentials: bundle.credentials,
      },
      errors,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates the complete fixture contract.
 *
 * @param {Object} bundle
 * @param {{allowMissingCollections?: boolean}} [options]
 * @returns {{valid: boolean, schemaVersion: number, errors: Array<{path: string, message: string}>, warnings: Array<{path: string, message: string}>}}
 */
export function validateFixtureBundle(bundle, options = {}) {
  const errors = [];
  const warnings = [];
  const schemaResult = validateFixtureSchema(bundle);

  errors.push(...schemaResult.errors);

  if (!isObject(bundle)) {
    return {
      valid: false,
      schemaVersion: FIXTURE_SCHEMA_VERSION,
      errors,
      warnings,
    };
  }

  for (const collectionName of REQUIRED_COLLECTIONS) {
    if (
      bundle[collectionName] === undefined &&
      options.allowMissingCollections !== true
    ) {
      addError(errors, collectionName, 'Required fixture collection is missing.');
    }
  }

  const collections = Object.fromEntries(
    REQUIRED_COLLECTIONS.map((name) => [
      name,
      validateCollection(bundle, name, errors),
    ]),
  );

  const personas = collections.personas;
  const accounts = collections.accounts;
  const transactions = collections.transactions;

  validatePersonas(personas, errors, warnings);
  validateAccounts(
    accounts,
    new Set(personas.map((persona) => persona.id)),
    errors,
  );
  validateTransactions(
    transactions,
    new Set(accounts.map((account) => account.id)),
    errors,
  );
  validateOffers(collections.offers, errors);
  validateSupportData(collections, errors);
  validatePrivacy(collections, errors);

  if (bundle.referenceDate !== undefined) {
    if (!isValidDate(bundle.referenceDate)) {
      addError(errors, 'referenceDate', 'Expected an ISO calendar date.');
    } else if (bundle.referenceDate !== getReferenceDateString()) {
      addWarning(
        warnings,
        'referenceDate',
        `Fixture reference date differs from ${getReferenceDateString()}.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    schemaVersion: FIXTURE_SCHEMA_VERSION,
    errors,
    warnings,
  };
}

/**
 * Alias for validating a fixture bundle.
 *
 * @param {Object} bundle
 * @param {Object} [options]
 * @returns {{valid: boolean, schemaVersion: number, errors: Array, warnings: Array}}
 */
export function validateFixtures(bundle, options = {}) {
  return validateFixtureBundle(bundle, options);
}

/**
 * Returns whether a fixture bundle satisfies the fixture contract.
 *
 * @param {Object} bundle
 * @returns {boolean}
 */
export function isValidFixtureBundle(bundle) {
  return validateFixtureBundle(bundle).valid;
}

/**
 * Throws when a fixture bundle does not satisfy the fixture contract.
 *
 * @param {Object} bundle
 * @returns {Object}
 */
export function assertValidFixtureBundle(bundle) {
  const result = validateFixtureBundle(bundle);

  if (!result.valid) {
    const details = result.errors
      .map((error) => `${error.path || 'fixture'}: ${error.message}`)
      .join('; ');

    throw new Error(`Invalid fixture bundle: ${details}`);
  }

  return bundle;
}

/**
 * Runs the fixture contract validation used during application startup.
 *
 * @returns {{valid: boolean, schemaVersion: number, errors: Array, warnings: Array}}
 */
export function validateStartupFixtures() {
  return validateFixtureBundle(FIXTURES);
}

export const STARTUP_FIXTURE_VALIDATION = validateStartupFixtures();

export default Object.freeze({
  FIXTURE_SCHEMA_VERSION,
  FIXTURE_SCHEMA_VERSION_STRING,
  STARTUP_FIXTURE_VALIDATION,
  assertValidFixtureBundle,
  isValidFixtureBundle,
  validateFixtureBundle,
  validateFixturePrivacy,
  validateFixtureSchema,
  validateFixtures,
  validateStartupFixtures,
});