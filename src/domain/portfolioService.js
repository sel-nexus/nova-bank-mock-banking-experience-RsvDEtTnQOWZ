import { CURRENCY, DEMO_CONSTANTS } from '../config/constants.js';
import {
  DEFAULT_FIXTURE_USER_ID,
  FIXTURES,
} from '../fixtures/fixtures.js';
import { formatCurrency, maskAccountNumber } from '../utils/formatters.js';

const RECOMMENDATION_ORDER = ['checking', 'savings', 'credit', 'loan', 'investment'];

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

function normalizePersonaId(personaOrId) {
  if (typeof personaOrId === 'string') {
    return personaOrId.trim();
  }

  if (isObject(personaOrId)) {
    return typeof personaOrId.id === 'string' ? personaOrId.id.trim() : '';
  }

  return '';
}

function getPersona(personaOrId) {
  const personaId = normalizePersonaId(personaOrId);

  if (!personaId) {
    return null;
  }

  return (
    FIXTURES.personas.find((persona) => persona.id === personaId) || null
  );
}

function getPersonaAccounts(personaId) {
  return FIXTURES.accounts.filter((account) => account.userId === personaId);
}

function getPersonaTransactions(personaId, accounts) {
  const accountIds = new Set(accounts.map((account) => account.id));

  return FIXTURES.transactions
    .filter((transaction) => accountIds.has(transaction.accountId))
    .sort((first, second) => {
      const firstDate = new Date(
        first.postedAt || first.createdAt || first.date,
      ).getTime();
      const secondDate = new Date(
        second.postedAt || second.createdAt || second.date,
      ).getTime();

      return secondDate - firstDate;
    });
}

function getOwnedProductTypes(accounts) {
  return new Set(accounts.map((account) => account.type));
}

function getRecommendationReason(product, ownedTypes) {
  if (!ownedTypes.has(product.type)) {
    switch (product.type) {
      case 'checking':
        return 'A checking account can help manage everyday spending and bills.';
      case 'savings':
        return 'A savings account can help you build an emergency fund and reach your goals.';
      case 'credit':
        return 'A rewards card can add flexibility and benefits to qualifying purchases.';
      case 'loan':
        return 'Explore lending options when you are planning a larger purchase.';
      case 'investment':
        return 'An investment account can help you plan for longer-term goals.';
      default:
        return 'This product may complement your current portfolio.';
    }
  }

  return 'This product may provide another option for your current banking needs.';
}

function selectRecommendedProducts(accounts, options = {}) {
  const ownedTypes = getOwnedProductTypes(accounts);
  const limit =
    Number.isInteger(options.limit) && options.limit >= 0
      ? options.limit
      : 3;

  return FIXTURES.products
    .filter((product) => product.available !== false)
    .filter((product) => options.includeOwned === true || !ownedTypes.has(product.type))
    .sort((first, second) => {
      const firstIndex = RECOMMENDATION_ORDER.indexOf(first.type);
      const secondIndex = RECOMMENDATION_ORDER.indexOf(second.type);

      return (
        (firstIndex === -1 ? RECOMMENDATION_ORDER.length : firstIndex) -
        (secondIndex === -1 ? RECOMMENDATION_ORDER.length : secondIndex)
      );
    })
    .slice(0, limit)
    .map((product) => ({
      ...cloneValue(product),
      reason: getRecommendationReason(product, ownedTypes),
    }));
}

function createPortfolio(persona, accounts, transactions, options = {}) {
  const totalBalance = accounts.reduce(
    (total, account) => total + (Number.isFinite(account.balance) ? account.balance : 0),
    0,
  );
  const totalAvailableBalance = accounts.reduce(
    (total, account) =>
      total +
      (Number.isFinite(account.availableBalance)
        ? account.availableBalance
        : Number.isFinite(account.balance)
          ? account.balance
          : 0),
    0,
  );
  const pendingTransactions = transactions.filter(
    (transaction) => transaction.status === 'pending',
  );
  const availableOffers = FIXTURES.offers.filter(
    (offer) => offer.status === 'available',
  );

  return {
    persona: cloneValue(persona),
    accounts: cloneValue(accounts),
    transactions: cloneValue(transactions),
    products: cloneValue(FIXTURES.products),
    offers: cloneValue(availableOffers),
    recommendations: selectRecommendedProducts(accounts, options),
    summary: {
      accountCount: accounts.length,
      totalBalance,
      totalAvailableBalance,
      pendingTransactionCount: pendingTransactions.length,
      availableOfferCount: availableOffers.length,
      currency: CURRENCY.code,
    },
  };
}

/**
 * Returns the portfolio belonging to a persona.
 *
 * @param {string|Object} personaOrId
 * @param {{limit?: number, includeOwned?: boolean}} [options]
 * @returns {Object|null}
 */
export function getPortfolio(personaOrId = DEFAULT_FIXTURE_USER_ID, options = {}) {
  const persona = getPersona(personaOrId);

  if (!persona) {
    return null;
  }

  const accounts = getPersonaAccounts(persona.id);
  const transactions = getPersonaTransactions(persona.id, accounts);

  return cloneValue(createPortfolio(persona, accounts, transactions, options));
}

/**
 * Returns the portfolio belonging to a persona ID.
 *
 * @param {string} personaId
 * @param {{limit?: number, includeOwned?: boolean}} [options]
 * @returns {Object|null}
 */
export function getPortfolioByPersonaId(personaId, options = {}) {
  return getPortfolio(personaId, options);
}

/**
 * Alias for looking up a persona-scoped portfolio.
 *
 * @param {string|Object} personaOrId
 * @param {{limit?: number, includeOwned?: boolean}} [options]
 * @returns {Object|null}
 */
export function getPortfolioForPersona(personaOrId, options = {}) {
  return getPortfolio(personaOrId, options);
}

/**
 * Returns accounts owned by a persona.
 *
 * @param {string|Object} personaOrId
 * @returns {Object[]}
 */
export function getAccountsForPersona(personaOrId) {
  const persona = getPersona(personaOrId);
  return persona ? cloneValue(getPersonaAccounts(persona.id)) : [];
}

/**
 * Returns transactions belonging to accounts owned by a persona.
 *
 * @param {string|Object} personaOrId
 * @returns {Object[]}
 */
export function getTransactionsForPersona(personaOrId) {
  const persona = getPersona(personaOrId);

  if (!persona) {
    return [];
  }

  const accounts = getPersonaAccounts(persona.id);
  return cloneValue(getPersonaTransactions(persona.id, accounts));
}

/**
 * Selects product recommendations for a persona.
 *
 * @param {string|Object} personaOrId
 * @param {{limit?: number, includeOwned?: boolean}} [options]
 * @returns {Object[]}
 */
export function getRecommendedProducts(personaOrId, options = {}) {
  const persona = getPersona(personaOrId);

  if (!persona) {
    return [];
  }

  return cloneValue(selectRecommendedProducts(getPersonaAccounts(persona.id), options));
}

/**
 * Alias for selecting recommendations.
 *
 * @param {string|Object} personaOrId
 * @param {{limit?: number, includeOwned?: boolean}} [options]
 * @returns {Object[]}
 */
export function selectRecommendations(personaOrId, options = {}) {
  return getRecommendedProducts(personaOrId, options);
}

/**
 * Builds a display-ready portfolio view model for a persona.
 *
 * @param {string|Object} personaOrId
 * @param {{limit?: number, includeOwned?: boolean}} [options]
 * @returns {Object|null}
 */
export function getPortfolioViewModel(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  options = {},
) {
  const portfolio = getPortfolio(personaOrId, options);

  if (!portfolio) {
    return null;
  }

  return {
    persona: portfolio.persona,
    greetingName:
      portfolio.persona.firstName ||
      portfolio.persona.name.split(' ')[0] ||
      portfolio.persona.name,
    summary: {
      ...portfolio.summary,
      totalBalanceDisplay: formatCurrency(
        portfolio.summary.totalBalance,
        portfolio.summary.currency,
      ),
      totalAvailableBalanceDisplay: formatCurrency(
        portfolio.summary.totalAvailableBalance,
        portfolio.summary.currency,
      ),
    },
    accounts: portfolio.accounts.map((account) => ({
      ...account,
      displayBalance: formatCurrency(account.balance, account.currency),
      displayAvailableBalance: formatCurrency(
        account.availableBalance ?? account.balance,
        account.currency,
      ),
      displayAccountNumber: account.maskedAccountNumber
        ? account.maskedAccountNumber
        : maskAccountNumber(account.accountNumber),
    })),
    recentTransactions: portfolio.transactions
      .slice(0, DEMO_CONSTANTS.recentTransactionCount)
      .map((transaction) => ({
        ...transaction,
        displayAmount: formatCurrency(transaction.amount, transaction.currency),
      })),
    offers: portfolio.offers,
    recommendations: portfolio.recommendations,
  };
}

/**
 * Returns a compact summary of a persona's portfolio.
 *
 * @param {string|Object} personaOrId
 * @returns {Object|null}
 */
export function getPortfolioSummary(personaOrId) {
  const portfolio = getPortfolio(personaOrId);

  return portfolio ? cloneValue(portfolio.summary) : null;
}

export const portfolioService = Object.freeze({
  getAccountsForPersona,
  getPortfolio,
  getPortfolioByPersonaId,
  getPortfolioForPersona,
  getPortfolioSummary,
  getPortfolioViewModel,
  getRecommendedProducts,
  getTransactionsForPersona,
  selectRecommendations,
});

export default portfolioService;