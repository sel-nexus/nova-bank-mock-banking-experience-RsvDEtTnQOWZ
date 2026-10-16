import { getReferenceDateString, toIsoDate } from './referenceClock.js';

const DEFAULT_SORT_BY = 'date';
const DEFAULT_SORT_ORDER = 'desc';

const ALLOWED_SORT_FIELDS = new Set([
  'date',
  'postedAt',
  'createdAt',
  'amount',
  'description',
  'merchantName',
  'merchantCategory',
  'category',
  'status',
  'type',
  'direction',
]);

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function normalizeDate(value) {
  return toIsoDate(value);
}

function normalizeFilterValues(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item).toLowerCase())
      .filter(Boolean);
  }

  const normalizedValue = normalizeText(value).toLowerCase();
  return normalizedValue ? [normalizedValue] : [];
}

function getTransactionDate(transaction, field = DEFAULT_SORT_BY) {
  if (field === 'date') {
    return transaction.date || '';
  }

  return (
    transaction[field] ||
    transaction.postedAt ||
    transaction.createdAt ||
    transaction.date ||
    ''
  );
}

function getComparableValue(transaction, field) {
  if (field === 'amount') {
    return typeof transaction.amount === 'number' &&
      Number.isFinite(transaction.amount)
      ? transaction.amount
      : 0;
  }

  return String(getTransactionDate(transaction, field)).toLowerCase();
}

function getSearchableValues(transaction) {
  return [
    transaction.description,
    transaction.merchantName,
    transaction.merchantCategory,
    transaction.category,
    transaction.reference,
    transaction.type,
    transaction.status,
    transaction.direction,
  ];
}

function matchesSearch(transaction, search) {
  const normalizedSearch = normalizeText(search).toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return getSearchableValues(transaction).some((value) =>
    String(value || '').toLowerCase().includes(normalizedSearch),
  );
}

function matchesDateRange(transaction, options) {
  const transactionDate = normalizeDate(transaction.date);
  const startDate = normalizeDate(
    options.startDate || options.fromDate || options.dateFrom,
  );
  const endDate = normalizeDate(
    options.endDate || options.toDate || options.dateTo,
  );

  if (startDate && (!transactionDate || transactionDate < startDate)) {
    return false;
  }

  if (endDate && (!transactionDate || transactionDate > endDate)) {
    return false;
  }

  if (options.includeFuture !== true) {
    const referenceDate = normalizeDate(
      options.referenceDate || options.asOf || getReferenceDateString(),
    );

    if (
      referenceDate &&
      transactionDate &&
      transactionDate > referenceDate
    ) {
      return false;
    }
  }

  return true;
}

function matchesTransaction(transaction, options) {
  const directions = normalizeFilterValues(
    options.direction || options.directions,
  );
  const statuses = normalizeFilterValues(options.status || options.statuses);
  const types = normalizeFilterValues(options.type || options.types);
  const categories = normalizeFilterValues(
    options.category || options.categories,
  );

  const direction = String(transaction.direction || '').toLowerCase();
  const status = String(transaction.status || '').toLowerCase();
  const type = String(transaction.type || '').toLowerCase();
  const category = String(transaction.category || '').toLowerCase();
  const merchantCategory = String(
    transaction.merchantCategory || '',
  ).toLowerCase();

  if (directions.length > 0 && !directions.includes(direction)) {
    return false;
  }

  if (statuses.length > 0 && !statuses.includes(status)) {
    return false;
  }

  if (types.length > 0 && !types.includes(type)) {
    return false;
  }

  if (
    categories.length > 0 &&
    !categories.some(
      (value) => value === category || value === merchantCategory,
    )
  ) {
    return false;
  }

  const minimumAmount =
    typeof options.minAmount === 'number' && Number.isFinite(options.minAmount)
      ? options.minAmount
      : null;
  const maximumAmount =
    typeof options.maxAmount === 'number' && Number.isFinite(options.maxAmount)
      ? options.maxAmount
      : null;

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

  return matchesDateRange(transaction, options) &&
    matchesSearch(transaction, options.search || options.query);
}

/**
 * Filters transactions using direction, category, search, amount, status,
 * type, and inclusive date range criteria.
 *
 * @param {Object[]} transactions
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function filterTransactions(transactions, options = {}) {
  if (!Array.isArray(transactions)) {
    return [];
  }

  const normalizedOptions = isObject(options) ? options : {};

  return transactions.filter((transaction) => {
    if (!isObject(transaction)) {
      return false;
    }

    return matchesTransaction(transaction, normalizedOptions);
  });
}

/**
 * Selects transactions matching the supplied business rules.
 *
 * @param {Object[]} transactions
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function selectTransactions(transactions, options = {}) {
  return filterTransactions(transactions, options);
}

/**
 * Selects transactions within an inclusive calendar date range.
 *
 * @param {Object[]} transactions
 * @param {string|Date|number} [startDate]
 * @param {string|Date|number} [endDate]
 * @returns {Object[]}
 */
export function selectTransactionsByDateRange(
  transactions,
  startDate,
  endDate,
) {
  return filterTransactions(transactions, {
    startDate,
    endDate,
    includeFuture: true,
  });
}

/**
 * Selects transactions matching a search query.
 *
 * @param {Object[]} transactions
 * @param {string} search
 * @returns {Object[]}
 */
export function selectTransactionsBySearch(transactions, search) {
  return filterTransactions(transactions, {
    search,
    includeFuture: true,
  });
}

/**
 * Selects transactions matching one or more directions.
 *
 * @param {Object[]} transactions
 * @param {string|string[]} direction
 * @returns {Object[]}
 */
export function selectTransactionsByDirection(transactions, direction) {
  return filterTransactions(transactions, {
    direction,
    includeFuture: true,
  });
}

/**
 * Selects transactions matching one or more categories.
 *
 * @param {Object[]} transactions
 * @param {string|string[]} category
 * @returns {Object[]}
 */
export function selectTransactionsByCategory(transactions, category) {
  return filterTransactions(transactions, {
    category,
    includeFuture: true,
  });
}

/**
 * Sorts transactions without mutating the source array.
 *
 * @param {Object[]} transactions
 * @param {Object|string} [options]
 * @param {'asc'|'desc'} [sortOrder]
 * @returns {Object[]}
 */
export function sortTransactions(
  transactions,
  options = {},
  sortOrder = DEFAULT_SORT_ORDER,
) {
  if (!Array.isArray(transactions)) {
    return [];
  }

  const normalizedOptions =
    typeof options === 'string'
      ? { sortBy: options, sortOrder }
      : isObject(options)
        ? options
        : {};

  const requestedSortField = normalizeText(
    normalizedOptions.sortBy || normalizedOptions.sortField || DEFAULT_SORT_BY,
  );
  const sortField = ALLOWED_SORT_FIELDS.has(requestedSortField)
    ? requestedSortField
    : DEFAULT_SORT_BY;
  const normalizedSortOrder =
    normalizeText(
      normalizedOptions.sortOrder ||
        normalizedOptions.order ||
        DEFAULT_SORT_ORDER,
    ).toLowerCase() === 'asc'
      ? 'asc'
      : 'desc';

  return transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((first, second) => {
      const firstValue = getComparableValue(first.transaction, sortField);
      const secondValue = getComparableValue(second.transaction, sortField);

      let comparison;

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

      return comparison === 0
        ? first.index - second.index
        : normalizedSortOrder === 'asc'
          ? comparison
          : -comparison;
    })
    .map(({ transaction }) => transaction);
}

/**
 * Filters and sorts transactions according to the supplied options.
 *
 * @param {Object[]} transactions
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function selectAndSortTransactions(transactions, options = {}) {
  return sortTransactions(filterTransactions(transactions, options), options);
}

export const transactionSelectors = Object.freeze({
  filterTransactions,
  selectAndSortTransactions,
  selectTransactions,
  selectTransactionsByCategory,
  selectTransactionsByDateRange,
  selectTransactionsByDirection,
  selectTransactionsBySearch,
  sortTransactions,
});

export default transactionSelectors;