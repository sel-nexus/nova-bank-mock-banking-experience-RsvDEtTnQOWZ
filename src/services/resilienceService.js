const DEFAULT_LATENCY_MINIMUM_MILLISECONDS = 100;
const DEFAULT_LATENCY_MAXIMUM_MILLISECONDS = 300;
const DEFAULT_RETRY_LIMIT = 3;
const DEFAULT_RETRY_DELAY_MILLISECONDS = 100;
const DEFAULT_FAILURE_RATE = 0.5;
const MAX_RETRY_LIMIT = 10;
const MAX_LATENCY_MILLISECONDS = 30_000;

export const RESILIENCE_ERROR_MODES = Object.freeze({
  disabled: 'disabled',
  transient: 'transient',
  persistent: 'persistent',
});

export const RESILIENCE_STATUS = Object.freeze({
  idle: 'idle',
  pending: 'pending',
  succeeded: 'succeeded',
  failed: 'failed',
  exhausted: 'exhausted',
});

const state = {
  errorMode: RESILIENCE_ERROR_MODES.disabled,
  latencyEnabled: true,
  latencyMinimumMilliseconds: DEFAULT_LATENCY_MINIMUM_MILLISECONDS,
  latencyMaximumMilliseconds: DEFAULT_LATENCY_MAXIMUM_MILLISECONDS,
  retryLimit: DEFAULT_RETRY_LIMIT,
  retryDelayMilliseconds: DEFAULT_RETRY_DELAY_MILLISECONDS,
  failureRate: DEFAULT_FAILURE_RATE,
  seed: 0,
};

const retryStates = new Map();

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

function normalizeInteger(value, fallback, minimum, maximum) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const normalizedValue = Math.round(value);
  return Math.min(maximum, Math.max(minimum, normalizedValue));
}

function normalizeUnitInterval(value, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeKey(value) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return 'default';
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getConfigurationSnapshot() {
  return {
    errorMode: state.errorMode,
    latencyEnabled: state.latencyEnabled,
    latencyMinimumMilliseconds: state.latencyMinimumMilliseconds,
    latencyMaximumMilliseconds: state.latencyMaximumMilliseconds,
    retryLimit: state.retryLimit,
    retryDelayMilliseconds: state.retryDelayMilliseconds,
    failureRate: state.failureRate,
    seed: state.seed,
  };
}

function normalizeErrorMode(value) {
  if (value === true) {
    return RESILIENCE_ERROR_MODES.transient;
  }

  if (value === false || value === null || value === undefined) {
    return RESILIENCE_ERROR_MODES.disabled;
  }

  if (
    value === RESILIENCE_ERROR_MODES.disabled ||
    value === RESILIENCE_ERROR_MODES.transient ||
    value === RESILIENCE_ERROR_MODES.persistent
  ) {
    return value;
  }

  return null;
}

function createResilienceError(key, attempt, mode = state.errorMode) {
  const error = new Error(
    mode === RESILIENCE_ERROR_MODES.persistent
      ? 'Mock resilience failure.'
      : 'Mock transient resilience failure.',
  );

  error.name = 'ResilienceError';
  error.code =
    mode === RESILIENCE_ERROR_MODES.persistent
      ? 'MOCK_PERSISTENT_FAILURE'
      : 'MOCK_TRANSIENT_FAILURE';
  error.retryable = mode === RESILIENCE_ERROR_MODES.transient;
  error.key = key;
  error.attempt = attempt;

  return error;
}

function getRetryState(key) {
  const normalizedKey = normalizeKey(key);
  const retryState = retryStates.get(normalizedKey);

  return retryState
    ? cloneValue(retryState)
    : {
        key: normalizedKey,
        attempts: 0,
        status: RESILIENCE_STATUS.idle,
        lastError: null,
        updatedAt: null,
      };
}

function saveRetryState(key, values) {
  const normalizedKey = normalizeKey(key);
  const currentState = retryStates.get(normalizedKey) || getRetryState(normalizedKey);
  const nextState = {
    ...currentState,
    ...values,
    key: normalizedKey,
    updatedAt: new Date().toISOString(),
  };

  retryStates.set(normalizedKey, nextState);
  return cloneValue(nextState);
}

/**
 * Configures the local mock resilience controls.
 *
 * @param {{
 *   errorMode?: 'disabled'|'transient'|'persistent'|boolean,
 *   latencyEnabled?: boolean,
 *   latencyMinimumMilliseconds?: number,
 *   latencyMaximumMilliseconds?: number,
 *   retryLimit?: number,
 *   retryDelayMilliseconds?: number,
 *   failureRate?: number,
 *   seed?: number
 * }} [options]
 * @returns {Object}
 */
export function configureResilience(options = {}) {
  if (!isObject(options)) {
    return getConfigurationSnapshot();
  }

  const normalizedErrorMode =
    options.errorMode === undefined
      ? state.errorMode
      : normalizeErrorMode(options.errorMode);

  if (normalizedErrorMode !== null) {
    state.errorMode = normalizedErrorMode;
  }

  if (typeof options.latencyEnabled === 'boolean') {
    state.latencyEnabled = options.latencyEnabled;
  }

  const minimum = normalizeInteger(
    options.latencyMinimumMilliseconds,
    state.latencyMinimumMilliseconds,
    0,
    MAX_LATENCY_MILLISECONDS,
  );
  const maximum = normalizeInteger(
    options.latencyMaximumMilliseconds,
    state.latencyMaximumMilliseconds,
    0,
    MAX_LATENCY_MILLISECONDS,
  );

  state.latencyMinimumMilliseconds = Math.min(minimum, maximum);
  state.latencyMaximumMilliseconds = Math.max(minimum, maximum);
  state.retryLimit = normalizeInteger(
    options.retryLimit,
    state.retryLimit,
    0,
    MAX_RETRY_LIMIT,
  );
  state.retryDelayMilliseconds = normalizeInteger(
    options.retryDelayMilliseconds,
    state.retryDelayMilliseconds,
    0,
    MAX_LATENCY_MILLISECONDS,
  );
  state.failureRate = normalizeUnitInterval(options.failureRate, state.failureRate);

  if (Number.isFinite(options.seed)) {
    state.seed = Math.trunc(options.seed);
  }

  return getConfigurationSnapshot();
}

/**
 * Returns the active local resilience configuration.
 *
 * @returns {Object}
 */
export function getResilienceConfig() {
  return getConfigurationSnapshot();
}

/**
 * Returns the complete resilience state, including retry counters.
 *
 * @returns {{config: Object, retries: Object[]}}
 */
export function getResilienceState() {
  return {
    config: getConfigurationSnapshot(),
    retries: Array.from(retryStates.values()).map((retryState) =>
      cloneValue(retryState),
    ),
  };
}

/**
 * Enables or disables Facilitator error mode.
 *
 * @param {boolean|'disabled'|'transient'|'persistent'} mode
 * @returns {string}
 */
export function setFacilitatorErrorMode(mode) {
  const normalizedMode = normalizeErrorMode(mode);

  if (normalizedMode === null) {
    return state.errorMode;
  }

  state.errorMode = normalizedMode;
  return state.errorMode;
}

/**
 * Alias for setting Facilitator error mode.
 *
 * @param {boolean|'disabled'|'transient'|'persistent'} mode
 * @returns {string}
 */
export function setErrorMode(mode) {
  return setFacilitatorErrorMode(mode);
}

/**
 * Returns whether Facilitator error mode is active.
 *
 * @returns {boolean}
 */
export function isFacilitatorErrorModeEnabled() {
  return state.errorMode !== RESILIENCE_ERROR_MODES.disabled;
}

/**
 * Returns a deterministic latency for an operation key.
 *
 * @param {string} [key]
 * @returns {number}
 */
export function getMockLatency(key = 'default') {
  if (!state.latencyEnabled) {
    return 0;
  }

  const range =
    state.latencyMaximumMilliseconds - state.latencyMinimumMilliseconds;
  const hash = hashString(`${state.seed}:${normalizeKey(key)}`);

  return state.latencyMinimumMilliseconds + (range === 0 ? 0 : hash % (range + 1));
}

/**
 * Alias for deterministic mock latency.
 *
 * @param {string} [key]
 * @returns {number}
 */
export function getDeterministicLatency(key = 'default') {
  return getMockLatency(key);
}

/**
 * Waits for deterministic mock latency.
 *
 * @param {string} [key]
 * @returns {Promise<number>}
 */
export function waitForMockLatency(key = 'default') {
  const latency = getMockLatency(key);

  return new Promise((resolve) => {
    globalThis.setTimeout(() => resolve(latency), latency);
  });
}

/**
 * Determines whether an operation should fail under the active error mode.
 *
 * @param {string} [key]
 * @param {number} [attempt=1]
 * @returns {boolean}
 */
export function shouldFail(key = 'default', attempt = 1) {
  if (state.errorMode === RESILIENCE_ERROR_MODES.disabled) {
    return false;
  }

  if (state.errorMode === RESILIENCE_ERROR_MODES.persistent) {
    return true;
  }

  const normalizedAttempt = Math.max(1, Math.trunc(attempt));
  const hash = hashString(
    `${state.seed}:${normalizeKey(key)}:${normalizedAttempt}`,
  );
  return hash / 0xffffffff < state.failureRate;
}

/**
 * Records a retry attempt for an operation.
 *
 * @param {string} [key]
 * @param {Error|Object|null} [error]
 * @returns {Object}
 */
export function recordRetry(key = 'default', error = null) {
  const currentState = getRetryState(key);

  return saveRetryState(key, {
    attempts: currentState.attempts + 1,
    status: RESILIENCE_STATUS.pending,
    lastError: error
      ? {
          code: error.code || 'MOCK_RESILIENCE_ERROR',
          message: error.message || String(error),
        }
      : null,
  });
}

/**
 * Returns the retry state for an operation.
 *
 * @param {string} [key]
 * @returns {Object}
 */
export function getRetryStatus(key = 'default') {
  return getRetryState(key);
}

/**
 * Clears retry state for one operation or all operations.
 *
 * @param {string} [key]
 * @returns {boolean}
 */
export function resetRetryState(key) {
  if (key === undefined) {
    retryStates.clear();
    return true;
  }

  return retryStates.delete(normalizeKey(key));
}

/**
 * Executes a synchronous operation with mock failure and retry behavior.
 *
 * @param {Function} operation
 * @param {{key?: string, retryLimit?: number}} [options]
 * @returns {Object}
 */
export function executeWithResilience(operation, options = {}) {
  if (typeof operation !== 'function') {
    return {
      success: false,
      error: {
        code: 'INVALID_OPERATION',
        message: 'A resilience operation function is required.',
      },
    };
  }

  const key = normalizeKey(options.key);
  const retryLimit = normalizeInteger(
    options.retryLimit,
    state.retryLimit,
    0,
    MAX_RETRY_LIMIT,
  );
  const maximumAttempts = retryLimit + 1;
  let lastError = null;

  resetRetryState(key);

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      if (shouldFail(key, attempt)) {
        throw createResilienceError(key, attempt);
      }

      const value = operation({
        attempt,
        key,
        latencyMilliseconds: getMockLatency(key),
      });

      saveRetryState(key, {
        attempts: attempt,
        status: RESILIENCE_STATUS.succeeded,
        lastError: null,
      });

      return {
        success: true,
        data: value,
        attempts: attempt,
        latencyMilliseconds: getMockLatency(key),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      recordRetry(key, lastError);

      if (attempt >= maximumAttempts) {
        saveRetryState(key, {
          attempts: attempt,
          status: RESILIENCE_STATUS.exhausted,
        });

        return {
          success: false,
          attempts: attempt,
          error: {
            code: lastError.code || 'RESILIENCE_EXHAUSTED',
            message: lastError.message,
            retryable: lastError.retryable === true,
          },
        };
      }
    }
  }

  return {
    success: false,
    attempts: maximumAttempts,
    error: {
      code: 'RESILIENCE_EXHAUSTED',
      message: lastError?.message || 'The resilience operation failed.',
    },
  };
}

/**
 * Resets all local resilience controls to their defaults.
 *
 * @returns {Object}
 */
export function resetResilience() {
  state.errorMode = RESILIENCE_ERROR_MODES.disabled;
  state.latencyEnabled = true;
  state.latencyMinimumMilliseconds = DEFAULT_LATENCY_MINIMUM_MILLISECONDS;
  state.latencyMaximumMilliseconds = DEFAULT_LATENCY_MAXIMUM_MILLISECONDS;
  state.retryLimit = DEFAULT_RETRY_LIMIT;
  state.retryDelayMilliseconds = DEFAULT_RETRY_DELAY_MILLISECONDS;
  state.failureRate = DEFAULT_FAILURE_RATE;
  state.seed = 0;
  retryStates.clear();

  return getConfigurationSnapshot();
}

export const resilienceService = Object.freeze({
  configureResilience,
  executeWithResilience,
  getDeterministicLatency,
  getMockLatency,
  getResilienceConfig,
  getResilienceState,
  getRetryStatus,
  isFacilitatorErrorModeEnabled,
  recordRetry,
  resetResilience,
  resetRetryState,
  setErrorMode,
  setFacilitatorErrorMode,
  shouldFail,
  waitForMockLatency,
});

export default resilienceService;