import { ROUTES } from '../config/constants.js';

const PUBLIC_ROUTES = new Set([
  ROUTES.home,
  ROUTES.login,
  ROUTES.help,
]);

const FACILITATOR_ERROR_MODES = new Set([
  'disabled',
  'transient',
  'persistent',
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

function getState(state) {
  return isObject(state) ? state : {};
}

function getSession(state) {
  const normalizedState = getState(state);
  return isObject(normalizedState.session) ? normalizedState.session : {};
}

function getFacilitator(state) {
  const normalizedState = getState(state);
  return isObject(normalizedState.facilitator)
    ? normalizedState.facilitator
    : {};
}

function getRoutePath(route) {
  if (typeof route === 'string') {
    return route.trim().split('?')[0].split('#')[0] || ROUTES.home;
  }

  if (isObject(route)) {
    return getRoutePath(route.pathname || route.path || route.url);
  }

  return ROUTES.home;
}

function isAccountDetailsRoute(route) {
  const path = getRoutePath(route);

  return (
    path.startsWith('/accounts/') &&
    path.split('/').filter(Boolean).length === 2
  );
}

function isRouteMatch(route, configuredRoute) {
  const path = getRoutePath(route);

  if (configuredRoute === ROUTES.accountDetails) {
    return isAccountDetailsRoute(path);
  }

  return path === configuredRoute;
}

function getSearchSource(state, options = {}) {
  const normalizedState = getState(state);
  const normalizedOptions = isObject(options) ? options : {};
  const configuredResults =
    normalizedOptions.results ??
    normalizedState.globalSearch?.results ??
    normalizedState.search?.results ??
    normalizedState.globalSearch ??
    normalizedState.search;

  if (Array.isArray(configuredResults)) {
    return configuredResults;
  }

  if (isObject(configuredResults)) {
    if (Array.isArray(configuredResults.items)) {
      return configuredResults.items;
    }

    if (Array.isArray(configuredResults.results)) {
      return configuredResults.results;
    }
  }

  return [];
}

function getResultCategory(result) {
  if (!isObject(result)) {
    return 'other';
  }

  return (
    normalizeText(
      result.category ||
        result.type ||
        result.entityType ||
        result.kind ||
        result.section,
    ).toLowerCase() || 'other'
  );
}

function getResultId(result, index) {
  if (isObject(result)) {
    return normalizeText(result.id || result.resultId) || String(index);
  }

  return String(index);
}

function createSearchSummary(results, query = '') {
  const counts = results.reduce((summary, result) => {
    const category = getResultCategory(result);
    summary[category] = (summary[category] || 0) + 1;
    return summary;
  }, {});

  return {
    query: normalizeText(query),
    totalResults: results.length,
    resultCount: results.length,
    hasResults: results.length > 0,
    categories: counts,
    categoryCounts: { ...counts },
  };
}

/**
 * Returns the application session state.
 *
 * @param {Object} state
 * @returns {Object}
 */
export function selectSession(state) {
  return getSession(state);
}

/**
 * Returns whether the current application session is authenticated.
 *
 * @param {Object} state
 * @returns {boolean}
 */
export function selectIsAuthenticated(state) {
  const session = getSession(state);

  return (
    session.isAuthenticated === true ||
    Boolean(session.token || session.userId)
  );
}

/**
 * Alias for selecting authenticated status.
 *
 * @param {Object} state
 * @returns {boolean}
 */
export function selectAuthenticated(state) {
  return selectIsAuthenticated(state);
}

/**
 * Returns the active persona.
 *
 * @param {Object} state
 * @returns {Object|null}
 */
export function selectActivePersona(state) {
  const normalizedState = getState(state);
  return isObject(normalizedState.persona) ? normalizedState.persona : null;
}

/**
 * Alias for selecting the current user persona.
 *
 * @param {Object} state
 * @returns {Object|null}
 */
export function selectCurrentPersona(state) {
  return selectActivePersona(state);
}

/**
 * Returns the active persona identifier.
 *
 * @param {Object} state
 * @returns {string|null}
 */
export function selectActivePersonaId(state) {
  const persona = selectActivePersona(state);
  const session = getSession(state);

  return normalizeText(persona?.id || persona?.userId || session.userId) || null;
}

/**
 * Returns the facilitator state.
 *
 * @param {Object} state
 * @returns {Object}
 */
export function selectFacilitator(state) {
  return getFacilitator(state);
}

/**
 * Returns whether the facilitator is open.
 *
 * @param {Object} state
 * @returns {boolean}
 */
export function selectIsFacilitatorOpen(state) {
  return getFacilitator(state).isOpen === true;
}

/**
 * Returns the facilitator status.
 *
 * @param {Object} state
 * @returns {string}
 */
export function selectFacilitatorStatus(state) {
  return normalizeText(getFacilitator(state).status) || 'idle';
}

/**
 * Returns whether the facilitator is loading.
 *
 * @param {Object} state
 * @returns {boolean}
 */
export function selectIsFacilitatorLoading(state) {
  return getFacilitator(state).isLoading === true;
}

/**
 * Returns the facilitator error mode.
 *
 * @param {Object} state
 * @returns {string}
 */
export function selectFacilitatorErrorMode(state) {
  const errorMode = normalizeText(getFacilitator(state).errorMode);

  return FACILITATOR_ERROR_MODES.has(errorMode) ? errorMode : 'disabled';
}

/**
 * Returns whether facilitator error mode is enabled.
 *
 * @param {Object} state
 * @returns {boolean}
 */
export function selectIsFacilitatorErrorModeEnabled(state) {
  return selectFacilitatorErrorMode(state) !== 'disabled';
}

/**
 * Returns whether the facilitator currently has an error.
 *
 * @param {Object} state
 * @returns {boolean}
 */
export function selectHasFacilitatorError(state) {
  return getFacilitator(state).error !== null &&
    getFacilitator(state).error !== undefined;
}

/**
 * Determines whether a route requires authentication.
 *
 * @param {string|Object} route
 * @returns {boolean}
 */
export function selectIsProtectedRoute(route) {
  const path = getRoutePath(route);

  if (PUBLIC_ROUTES.has(path) || path === ROUTES.notFound) {
    return false;
  }

  return !isRouteMatch(path, ROUTES.home) && !isRouteMatch(path, ROUTES.login);
}

/**
 * Alias for determining route protection.
 *
 * @param {string|Object} route
 * @returns {boolean}
 */
export function isProtectedRoute(route) {
  return selectIsProtectedRoute(route);
}

/**
 * Returns whether the current session can access a route.
 *
 * @param {Object} state
 * @param {string|Object} route
 * @returns {boolean}
 */
export function selectCanAccessRoute(state, route) {
  return (
    !selectIsProtectedRoute(route) ||
    selectIsAuthenticated(state)
  );
}

/**
 * Returns route protection details for navigation decisions.
 *
 * @param {Object} state
 * @param {string|Object} route
 * @returns {{route: string, isProtected: boolean, isAuthenticated: boolean, canAccess: boolean, redirectTo: string|null}}
 */
export function selectRouteProtection(state, route) {
  const normalizedRoute = getRoutePath(route);
  const isProtected = selectIsProtectedRoute(normalizedRoute);
  const isAuthenticated = selectIsAuthenticated(state);
  const canAccess = !isProtected || isAuthenticated;

  return {
    route: normalizedRoute,
    isProtected,
    isAuthenticated,
    canAccess,
    redirectTo: canAccess ? null : ROUTES.login,
  };
}

/**
 * Returns the global search results from application state.
 *
 * @param {Object} state
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function selectGlobalSearchResults(state, options = {}) {
  return getSearchSource(state, options).slice();
}

/**
 * Returns a summary of global search results grouped by category.
 *
 * @param {Object} state
 * @param {{query?: string, results?: Object[]}} [options]
 * @returns {{query: string, totalResults: number, resultCount: number, hasResults: boolean, categories: Object<string, number>, categoryCounts: Object<string, number>}}
 */
export function selectGlobalSearchSummary(state, options = {}) {
  const normalizedState = getState(state);
  const normalizedOptions = isObject(options) ? options : {};
  const searchState = isObject(normalizedState.globalSearch)
    ? normalizedState.globalSearch
    : isObject(normalizedState.search)
      ? normalizedState.search
      : {};
  const results = selectGlobalSearchResults(state, normalizedOptions);
  const query =
    normalizedOptions.query ??
    searchState.query ??
    searchState.search ??
    '';

  return createSearchSummary(results, query);
}

/**
 * Returns whether global search has any results.
 *
 * @param {Object} state
 * @param {Object} [options]
 * @returns {boolean}
 */
export function selectHasGlobalSearchResults(state, options = {}) {
  return selectGlobalSearchSummary(state, options).hasResults;
}

/**
 * Returns a stable list of identifiers for global search results.
 *
 * @param {Object} state
 * @param {Object} [options]
 * @returns {string[]}
 */
export function selectGlobalSearchResultIds(state, options = {}) {
  return selectGlobalSearchResults(state, options).map(getResultId);
}

export const appSelectors = Object.freeze({
  isProtectedRoute,
  selectActivePersona,
  selectActivePersonaId,
  selectAuthenticated,
  selectCanAccessRoute,
  selectCurrentPersona,
  selectFacilitator,
  selectFacilitatorErrorMode,
  selectFacilitatorStatus,
  selectGlobalSearchResultIds,
  selectGlobalSearchResults,
  selectGlobalSearchSummary,
  selectHasFacilitatorError,
  selectHasGlobalSearchResults,
  selectIsAuthenticated,
  selectIsFacilitatorErrorModeEnabled,
  selectIsFacilitatorLoading,
  selectIsFacilitatorOpen,
  selectIsProtectedRoute,
  selectRouteProtection,
  selectSession,
});

export default appSelectors;