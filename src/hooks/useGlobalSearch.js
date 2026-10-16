import { useCallback, useMemo, useState } from 'react';
import { ROUTES } from '../config/constants.js';
import { FIXTURES } from '../fixtures/fixtures.js';
import { formatCurrency, maskAccountNumber } from '../utils/formatters.js';

const SEARCH_DOMAINS = Object.freeze(['accounts', 'products', 'offers']);

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
  if (typeof options === 'string') {
    return { query: options };
  }

  return isObject(options) ? options : {};
}

function normalizeDomains(value) {
  if (Array.isArray(value)) {
    return value
      .map((domain) => normalizeText(domain).toLowerCase())
      .filter((domain) => SEARCH_DOMAINS.includes(domain));
  }

  const domain = normalizeText(value).toLowerCase();
  return domain && SEARCH_DOMAINS.includes(domain) ? [domain] : SEARCH_DOMAINS;
}

function normalizePersonaId(personaOrId) {
  if (isObject(personaOrId)) {
    return normalizeText(
      personaOrId.id || personaOrId.userId || personaOrId.personaId,
    );
  }

  return normalizeText(personaOrId);
}

function getSearchText(values) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(normalizeText)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchesQuery(values, query) {
  const normalizedQuery = normalizeText(query).toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return getSearchText(values).includes(normalizedQuery);
}

function getAccountSummary(account) {
  const maskedAccountNumber =
    normalizeText(account.maskedAccountNumber) ||
    maskAccountNumber(account.accountNumber);

  return {
    id: account.id,
    name: account.name,
    type: account.type,
    status: account.status,
    currency: account.currency,
    maskedAccountNumber,
    balance: account.balance,
    displayBalance: formatCurrency(account.balance, account.currency),
  };
}

function createAccountResult(account) {
  const summary = getAccountSummary(account);

  return {
    id: account.id,
    domain: 'accounts',
    type: 'account',
    category: 'accounts',
    title: account.name,
    description: `${account.type} account ending in ${summary.maskedAccountNumber.slice(-4)}`,
    summary: `${account.name} • ${summary.maskedAccountNumber}`,
    route: `/accounts/${account.id}`,
    item: summary,
  };
}

function createProductResult(product) {
  return {
    id: product.id,
    domain: 'products',
    type: 'product',
    category: product.category || 'products',
    title: product.name,
    description: product.description,
    summary: product.description,
    route: ROUTES.accounts,
    item: {
      id: product.id,
      name: product.name,
      description: product.description,
      type: product.type,
      category: product.category,
      available: product.available !== false,
    },
  };
}

function createOfferResult(offer) {
  const value =
    offer.amount !== undefined
      ? formatCurrency(offer.amount)
      : offer.percentage !== undefined
        ? `${offer.percentage}%`
        : '';

  return {
    id: offer.id,
    domain: 'offers',
    type: 'offer',
    category: offer.category || 'offers',
    title: offer.title,
    description: offer.description,
    summary: value ? `${offer.title} • ${value}` : offer.description,
    route: ROUTES.dashboard,
    item: {
      id: offer.id,
      title: offer.title,
      description: offer.description,
      category: offer.category,
      status: offer.status,
      ...(offer.amount !== undefined ? { amount: offer.amount } : {}),
      ...(offer.percentage !== undefined
        ? { percentage: offer.percentage }
        : {}),
    },
  };
}

function getSearchResults(query, options) {
  const normalizedOptions = normalizeOptions(options);
  const domains = normalizeDomains(
    normalizedOptions.domains || normalizedOptions.domain,
  );
  const personaId = normalizePersonaId(
    normalizedOptions.personaId ||
      normalizedOptions.userId ||
      normalizedOptions.persona,
  );
  const includeInactive = normalizedOptions.includeInactive === true;
  const includeClaimed = normalizedOptions.includeClaimed === true;
  const results = [];

  if (domains.includes('accounts')) {
    FIXTURES.accounts
      .filter((account) => !personaId || account.userId === personaId)
      .filter(
        (account) =>
          includeInactive ||
          account.status === 'active' ||
          account.status === 'pending',
      )
      .filter((account) =>
        matchesQuery(
          [
            account.name,
            account.type,
            account.status,
            account.currency,
            account.maskedAccountNumber,
          ],
          query,
        ),
      )
      .forEach((account) => results.push(createAccountResult(account)));
  }

  if (domains.includes('products')) {
    FIXTURES.products
      .filter(
        (product) =>
          normalizedOptions.includeUnavailable === true ||
          product.available !== false,
      )
      .filter((product) =>
        matchesQuery(
          [
            product.name,
            product.description,
            product.type,
            product.category,
            product.benefits,
          ],
          query,
        ),
      )
      .forEach((product) => results.push(createProductResult(product)));
  }

  if (domains.includes('offers')) {
    FIXTURES.offers
      .filter(
        (offer) =>
          includeClaimed ||
          offer.status === 'available' ||
          offer.status === undefined,
      )
      .filter((offer) =>
        matchesQuery(
          [
            offer.title,
            offer.description,
            offer.terms,
            offer.category,
            offer.promoCode,
          ],
          query,
        ),
      )
      .forEach((offer) => results.push(createOfferResult(offer)));
  }

  const limit =
    Number.isInteger(normalizedOptions.limit) && normalizedOptions.limit >= 0
      ? normalizedOptions.limit
      : null;

  return limit === null ? results : results.slice(0, limit);
}

/**
 * Searches local account, product, and offer fixtures without exposing raw
 * account numbers.
 *
 * @param {string|Object} [searchOrOptions]
 * @param {Object} [maybeOptions]
 * @returns {{
 *   query: string,
 *   setQuery: Function,
 *   search: Function,
 *   clear: Function,
 *   reset: Function,
 *   results: Object[],
 *   searchResults: Object[],
 *   accounts: Object[],
 *   products: Object[],
 *   offers: Object[],
 *   groupedResults: Object,
 *   resultCount: number,
 *   hasResults: boolean,
 *   isSearching: boolean,
 *   error: Error|null
 * }}
 */
export function useGlobalSearch(searchOrOptions = '', maybeOptions = {}) {
  const initialOptions = normalizeOptions(searchOrOptions);
  const additionalOptions = normalizeOptions(maybeOptions);
  const options = {
    ...initialOptions,
    ...additionalOptions,
  };
  const hasConfiguredQuery = Object.prototype.hasOwnProperty.call(
    options,
    'query',
  );
  const [queryState, setQueryState] = useState(
    normalizeText(
      hasConfiguredQuery ? options.query : typeof searchOrOptions === 'string'
        ? searchOrOptions
        : '',
    ),
  );

  const query = hasConfiguredQuery
    ? normalizeText(options.query)
    : queryState;

  const results = useMemo(
    () => getSearchResults(query, options),
    [query, options.domains, options.domain, options.personaId, options.userId, options.persona, options.includeInactive, options.includeClaimed, options.includeUnavailable, options.limit],
  );

  const setQuery = useCallback((value) => {
    setQueryState(normalizeText(value));
  }, []);

  const search = useCallback(
    (value) => {
      const nextQuery = normalizeText(value);
      setQueryState(nextQuery);
      return getSearchResults(nextQuery, options);
    },
    [options],
  );

  const clear = useCallback(() => {
    setQueryState('');
  }, []);

  const groupedResults = useMemo(
    () => ({
      accounts: results.filter((result) => result.domain === 'accounts'),
      products: results.filter((result) => result.domain === 'products'),
      offers: results.filter((result) => result.domain === 'offers'),
    }),
    [results],
  );

  return useMemo(
    () => ({
      query,
      setQuery,
      search,
      clear,
      reset: clear,
      results,
      searchResults: results,
      accounts: groupedResults.accounts,
      products: groupedResults.products,
      offers: groupedResults.offers,
      groupedResults,
      resultCount: results.length,
      hasResults: results.length > 0,
      isSearching: query.length > 0,
      error: null,
    }),
    [clear, groupedResults, query, results, search, setQuery],
  );
}

export default useGlobalSearch;