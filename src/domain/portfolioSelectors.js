const DEPOSIT_ACCOUNT_TYPES = new Set(['checking', 'savings']);
const ELIGIBLE_ACCOUNT_STATUSES = new Set(['active']);

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function normalizeOptions(options) {
  return isObject(options) ? options : {};
}

function getAllowedAccountTypes(options) {
  const configuredTypes = options.accountTypes || options.types;

  if (Array.isArray(configuredTypes)) {
    return new Set(
      configuredTypes
        .map((type) => normalizeText(type).toLowerCase())
        .filter(Boolean),
    );
  }

  const normalizedType = normalizeText(configuredTypes).toLowerCase();

  return normalizedType ? new Set([normalizedType]) : DEPOSIT_ACCOUNT_TYPES;
}

function getAllowedAccountStatuses(options) {
  if (options.includeInactive === true) {
    return null;
  }

  const configuredStatuses = options.accountStatuses || options.statuses;

  if (Array.isArray(configuredStatuses)) {
    return new Set(
      configuredStatuses
        .map((status) => normalizeText(status).toLowerCase())
        .filter(Boolean),
    );
  }

  const normalizedStatus = normalizeText(configuredStatuses).toLowerCase();

  return normalizedStatus
    ? new Set([normalizedStatus])
    : ELIGIBLE_ACCOUNT_STATUSES;
}

function hasMatchingCurrency(account, options) {
  const requestedCurrency = normalizeText(options.currency).toUpperCase();

  return (
    !requestedCurrency ||
    normalizeText(account.currency).toUpperCase() === requestedCurrency
  );
}

/**
 * Determines whether an account is a deposit account.
 *
 * @param {Object} account
 * @returns {boolean}
 */
export function isDepositAccount(account) {
  return (
    isObject(account) &&
    DEPOSIT_ACCOUNT_TYPES.has(normalizeText(account.type).toLowerCase())
  );
}

/**
 * Determines whether an account can receive a deposit.
 *
 * @param {Object} account
 * @param {{
 *   accountTypes?: string|string[],
 *   accountStatuses?: string|string[],
 *   currency?: string,
 *   includeInactive?: boolean
 * }} [options]
 * @returns {boolean}
 */
export function isDepositEligibleAccount(account, options = {}) {
  if (!isObject(account)) {
    return false;
  }

  const normalizedOptions = normalizeOptions(options);
  const allowedTypes = getAllowedAccountTypes(normalizedOptions);
  const allowedStatuses = getAllowedAccountStatuses(normalizedOptions);
  const accountType = normalizeText(account.type).toLowerCase();
  const accountStatus = normalizeText(account.status).toLowerCase();

  return (
    allowedTypes.has(accountType) &&
    (allowedStatuses === null || allowedStatuses.has(accountStatus)) &&
    hasMatchingCurrency(account, normalizedOptions)
  );
}

/**
 * Alias for determining deposit account eligibility.
 *
 * @param {Object} account
 * @param {Object} [options]
 * @returns {boolean}
 */
export function isEligibleForDeposit(account, options = {}) {
  return isDepositEligibleAccount(account, options);
}

/**
 * Selects accounts that can receive a deposit without mutating the source array.
 *
 * @param {Object[]} accounts
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function selectDepositEligibleAccounts(accounts, options = {}) {
  if (!Array.isArray(accounts)) {
    return [];
  }

  return accounts.filter((account) =>
    isDepositEligibleAccount(account, options),
  );
}

/**
 * Alias for selecting deposit-eligible accounts.
 *
 * @param {Object[]} accounts
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function getDepositEligibleAccounts(accounts, options = {}) {
  return selectDepositEligibleAccounts(accounts, options);
}

/**
 * Returns the accounts included in a relationship balance calculation.
 *
 * @param {Object[]} accounts
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function selectRelationshipAccounts(accounts, options = {}) {
  return selectDepositEligibleAccounts(accounts, options);
}

/**
 * Calculates the combined balance of eligible deposit accounts.
 *
 * @param {Object[]} accounts
 * @param {{
 *   accountTypes?: string|string[],
 *   accountStatuses?: string|string[],
 *   currency?: string,
 *   includeInactive?: boolean,
 *   balanceField?: string
 * }} [options]
 * @returns {number}
 */
export function calculateRelationshipBalance(accounts, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const balanceField =
    normalizeText(normalizedOptions.balanceField) || 'balance';

  return selectRelationshipAccounts(accounts, normalizedOptions).reduce(
    (total, account) => {
      const balance = account[balanceField];

      return total + (typeof balance === 'number' && Number.isFinite(balance) ? balance : 0);
    },
    0,
  );
}

/**
 * Alias for calculating the combined relationship balance.
 *
 * @param {Object[]} accounts
 * @param {Object} [options]
 * @returns {number}
 */
export function getRelationshipBalance(accounts, options = {}) {
  return calculateRelationshipBalance(accounts, options);
}

/**
 * Returns a compact relationship balance summary.
 *
 * @param {Object[]} accounts
 * @param {Object} [options]
 * @returns {{balance: number, accountCount: number, currency: string|null}}
 */
export function getRelationshipBalanceSummary(accounts, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const relationshipAccounts = selectRelationshipAccounts(
    accounts,
    normalizedOptions,
  );
  const requestedCurrency = normalizeText(normalizedOptions.currency).toUpperCase();
  const currencies = Array.from(
    new Set(
      relationshipAccounts
        .map((account) => normalizeText(account.currency).toUpperCase())
        .filter(Boolean),
    ),
  );

  return {
    balance: calculateRelationshipBalance(relationshipAccounts, {
      ...normalizedOptions,
      accountTypes: Array.from(getAllowedAccountTypes(normalizedOptions)),
      accountStatuses:
        normalizedOptions.includeInactive === true
          ? undefined
          : Array.from(getAllowedAccountStatuses(normalizedOptions) || []),
    }),
    accountCount: relationshipAccounts.length,
    currency:
      requestedCurrency || (currencies.length === 1 ? currencies[0] : null),
  };
}

export const portfolioSelectors = Object.freeze({
  calculateRelationshipBalance,
  getDepositEligibleAccounts,
  getRelationshipBalance,
  getRelationshipBalanceSummary,
  isDepositAccount,
  isDepositEligibleAccount,
  isEligibleForDeposit,
  selectDepositEligibleAccounts,
  selectRelationshipAccounts,
});

export default portfolioSelectors;