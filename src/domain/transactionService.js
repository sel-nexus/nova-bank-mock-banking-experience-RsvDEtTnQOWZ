import {
  DEFAULT_FIXTURE_ACCOUNT_ID,
  DEFAULT_FIXTURE_USER_ID,
  FIXTURES,
} from '../fixtures/fixtures.js';
import {
  getReferenceDateString,
  toIsoDate,
} from './referenceClock.js';

const DEFAULT_SORT_BY = 'date';
const DEFAULT_SORT_ORDER = 'desc';
const ALLOWED_SORT_FIELDS = new Set([
  'date',
  'postedAt',
  'createdAt',
  'amount',
  'description',
  'merchantName',
  'status',
  'type',
  'direction',
]);

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

function normalizeDate(value) {
  return toIsoDate(value);
}

function normalizeArrayFilter(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeIdentifier(item).toLowerCase())
      .filter(Boolean);
  }

  const normalizedValue = normalizeIdentifier(value).toLowerCase();
  return normalizedValue ? [normalizedValue] : [];
}

function getPersona(personaOrId) {
  const personaId = normalizePersonaId(personaOrId);

  if (!personaId) {
    return null;
  }

  return FIXTURES.personas.find((persona) => persona.id === personaId) || null;
}

function getOwnedAccounts(personaId) {
  return FIXTURES.accounts.filter((account) => account.userId === personaId);
}

function getOwnedAccountIds(personaId) {
  return new Set(getOwnedAccounts(personaId).map((account) => account.id));
}

function getTransactionDate(transaction, sortField = 'date') {
  const value =
    transaction[sortField] ||
    transaction.postedAt ||
    transaction.createdAt ||
    transaction.date;

  if (sortField === 'date') {
    return transaction.date || '';
  }

  return value || '';
}

function getComparableValue(transaction, field) {
  if (field === 'amount') {
    return Number.isFinite(transaction.amount) ? transaction.amount : 0;
  }

  if (field === 'date') {
    return transaction.date || '';
  }

  return String(getTransactionDate(transaction, field) || '').toLowerCase();
}

function sortTransactions(transactions, options = {}) {
  const requestedSortField = normalizeIdentifier(
    options.sortBy || options.sortField || DEFAULT_SORT_BY,
  );
  const sortField = ALLOWED_SORT_FIELDS.has(requestedSortField)
    ? requestedSortField
    : DEFAULT_SORT_BY;
  const sortOrder =
    String(options.sortOrder || options.order || DEFAULT_SORT_ORDER).toLowerCase() ===
    'asc'
      ? 'asc'
      : 'desc';

  return transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((first, second) => {
      const firstValue = getComparableValue(first.transaction, sortField);
      const secondValue = getComparableValue(second.transaction, sortField);

      let comparison = 0;

      if (typeof firstValue === 'number' && typeof secondValue === 'number') {
        comparison = firstValue - secondValue;
      } else {
        comparison = String(firstValue).localeCompare(String(secondValue));
      }

      if (comparison === 0 && sortField !== 'date') {
        comparison = String(first.transaction.date || '').localeCompare(
          String(second.transaction.date || ''),
        );
      }

      if (comparison === 0) {
        comparison = first.index - second.index;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    })
    .map(({ transaction }) => transaction);
}

function matchesSearch(transaction, search) {
  const normalizedSearch = normalizeIdentifier(search).toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    transaction.description,
    transaction.merchantName,
    transaction.merchantCategory,
    transaction.category,
    transaction.reference,
    transaction.type,
    transaction.status,
    transaction.direction,
  ].some((value) =>
    String(value || '').toLowerCase().includes(normalizedSearch),
  );
}

function filterTransactions(transactions, options = {}) {
  const directions = normalizeArrayFilter(options.direction || options.directions);
  const statuses = normalizeArrayFilter(options.status || options.statuses);
  const types = normalizeArrayFilter(options.type || options.types);
  const categories = normalizeArrayFilter(options.category || options.categories);
  const startDate = normalizeDate(
    options.startDate || options.fromDate || options.dateFrom,
  );
  const endDate = normalizeDate(options.endDate || options.toDate || options.dateTo);
  const referenceDate = normalizeDate(
    options.referenceDate || options.asOf || getReferenceDateString(),
  );
  const minimumAmount =
    typeof options.minAmount === 'number' && Number.isFinite(options.minAmount)
      ? options.minAmount
      : null;
  const maximumAmount =
    typeof options.maxAmount === 'number' && Number.isFinite(options.maxAmount)
      ? options.maxAmount
      : null;
  const includeFuture = options.includeFuture === true;

  return transactions.filter((transaction) => {
    const transactionDirection = String(transaction.direction || '').toLowerCase();
    const transactionStatus = String(transaction.status || '').toLowerCase();
    const transactionType = String(transaction.type || '').toLowerCase();
    const transactionCategory = String(transaction.category || '').toLowerCase();
    const transactionDate = normalizeDate(transaction.date);

    if (directions.length > 0 && !directions.includes(transactionDirection)) {
      return false;
    }

    if (statuses.length > 0 && !statuses.includes(transactionStatus)) {
      return false;
    }

    if (types.length > 0 && !types.includes(transactionType)) {
      return false;
    }

    if (
      categories.length > 0 &&
      !categories.some(
        (category) =>
          category === transactionCategory ||
          category === String(transaction.merchantCategory || '').toLowerCase(),
      )
    ) {
      return false;
    }

    if (startDate && (!transactionDate || transactionDate < startDate)) {
      return false;
    }

    if (endDate && (!transactionDate || transactionDate > endDate)) {
      return false;
    }

    if (
      !includeFuture &&
      referenceDate &&
      transactionDate &&
      transactionDate > referenceDate
    ) {
      return false;
    }

    if (
      minimumAmount !== null &&
      (typeof transaction.amount !== 'number' ||
        transaction.amount < minimumAmount)
    ) {
      return false;
    }

    if (
      maximumAmount !== null &&
      (typeof transaction.amount !== 'number' ||
        transaction.amount > maximumAmount)
    ) {
      return false;
    }

    return matchesSearch(transaction, options.search || options.query);
  });
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

function createSuccess(data, message) {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

function resolvePersonaTransactions(personaOrId, options = {}) {
  const persona = getPersona(personaOrId);

  if (!persona) {
    return {
      success: false,
      error: createFailure(
        'PERSONA_NOT_FOUND',
        'No persona was found for the requested transaction scope.',
      ),
    };
  }

  const ownedAccountIds = getOwnedAccountIds(persona.id);
  const requestedAccountId = normalizeAccountId(
    options.accountId || options.account,
  );

  if (requestedAccountId && !ownedAccountIds.has(requestedAccountId)) {
    return {
      success: false,
      error: createFailure(
        'ACCOUNT_UNAVAILABLE',
        'The requested account is not available to this persona.',
      ),
    };
  }

  const transactions = FIXTURES.transactions.filter((transaction) => {
    if (!ownedAccountIds.has(transaction.accountId)) {
      return false;
    }

    return !requestedAccountId || transaction.accountId === requestedAccountId;
  });

  return {
    success: true,
    persona,
    transactions,
  };
}

/**
 * Retrieves transactions owned by a persona, applying optional filters and sorting.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @param {{
 *   accountId?: string|Object,
 *   direction?: string|string[],
 *   status?: string|string[],
 *   type?: string|string[],
 *   category?: string|string[],
 *   search?: string,
 *   query?: string,
 *   startDate?: string|Date|number,
 *   endDate?: string|Date|number,
 *   fromDate?: string|Date|number,
 *   toDate?: string|Date|number,
 *   referenceDate?: string|Date|number,
 *   includeFuture?: boolean,
 *   minAmount?: number,
 *   maxAmount?: number,
 *   sortBy?: string,
 *   sortOrder?: 'asc'|'desc',
 *   page?: number,
 *   pageSize?: number,
 *   limit?: number
 * }} [options]
 * @returns {Object[]}
 */
export function getTransactions(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  options = {},
) {
  const result = resolvePersonaTransactions(personaOrId, options);

  if (!result.success) {
    return [];
  }

  const filteredTransactions = sortTransactions(
    filterTransactions(result.transactions, options),
    options,
  );

  const page =
    Number.isInteger(options.page) && options.page > 0 ? options.page : 1;
  const pageSize =
    Number.isInteger(options.pageSize) && options.pageSize > 0
      ? options.pageSize
      : null;
  const limit =
    Number.isInteger(options.limit) && options.limit >= 0
      ? options.limit
      : null;

  let pagedTransactions = filteredTransactions;

  if (pageSize !== null) {
    pagedTransactions = filteredTransactions.slice(
      (page - 1) * pageSize,
      page * pageSize,
    );
  } else if (limit !== null) {
    pagedTransactions = filteredTransactions.slice(0, limit);
  }

  return cloneValue(pagedTransactions);
}

/**
 * Returns a controlled response for persona-scoped transaction retrieval.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @param {Object} [options]
 * @returns {{success: boolean, data?: Object, error?: Object}}
 */
export function getTransactionsResult(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  options = {},
) {
  const result = resolvePersonaTransactions(personaOrId, options);

  if (!result.success) {
    return result.error;
  }

  const allTransactions = sortTransactions(
    filterTransactions(result.transactions, options),
    options,
  );
  const page =
    Number.isInteger(options.page) && options.page > 0 ? options.page : 1;
  const pageSize =
    Number.isInteger(options.pageSize) && options.pageSize > 0
      ? options.pageSize
      : allTransactions.length || 1;
  const totalItems = allTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const items = allTransactions.slice((page - 1) * pageSize, page * pageSize);

  return createSuccess({
    items: cloneValue(items),
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalItems > 0,
    referenceDate:
      normalizeDate(options.referenceDate || options.asOf) ||
      getReferenceDateString(),
  });
}

/**
 * Alias for persona-scoped transaction retrieval.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function listTransactions(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  options = {},
) {
  return getTransactions(personaOrId, options);
}

/**
 * Retrieves transactions for one account after validating persona ownership.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} accountOrId
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function getTransactionsForAccount(personaOrId, accountOrId, options = {}) {
  return getTransactions(personaOrId, {
    ...options,
    accountId: accountOrId,
  });
}

/**
 * Retrieves one transaction within a persona's account scope.
 *
 * @param {string|Object} personaOrId
 * @param {string} transactionId
 * @returns {Object|null}
 */
export function getTransactionById(personaOrId, transactionId) {
  const normalizedTransactionId = normalizeIdentifier(transactionId);

  if (!normalizedTransactionId) {
    return null;
  }

  const transactions = getTransactions(personaOrId, {
    includeFuture: true,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  return (
    transactions.find((transaction) => transaction.id === normalizedTransactionId) ||
    null
  );
}

/**
 * Returns a controlled response for one transaction lookup.
 *
 * @param {string|Object} personaOrId
 * @param {string} transactionId
 * @returns {{success: boolean, data?: Object, error?: Object}}
 */
export function getTransactionResult(personaOrId, transactionId) {
  const transaction = getTransactionById(personaOrId, transactionId);

  if (!transaction) {
    return createFailure(
      'TRANSACTION_NOT_FOUND',
      'No transaction was found in the requested persona scope.',
    );
  }

  return createSuccess(transaction);
}

/**
 * Returns the transaction count for a persona after applying filters.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @param {Object} [options]
 * @returns {number}
 */
export function getTransactionCount(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  options = {},
) {
  return getTransactions(personaOrId, {
    ...options,
    page: undefined,
    pageSize: undefined,
    limit: undefined,
  }).length;
}

export const transactionService = Object.freeze({
  getTransactionById,
  getTransactionCount,
  getTransactionResult,
  getTransactions,
  getTransactionsForAccount,
  getTransactionsResult,
  listTransactions,
});

export default transactionService;