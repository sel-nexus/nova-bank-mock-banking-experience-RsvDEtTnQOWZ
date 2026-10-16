const REDACTION_PLACEHOLDER = '[REDACTED]';
const CIRCULAR_REFERENCE_PLACEHOLDER = '[Circular]';
const MAX_LOG_DEPTH = 8;

const SENSITIVE_KEY_PATTERN =
  /(?:password|passwd|passcode|pin|secret|token|authorization|cookie|session|credential|api[-_]?key|private[-_]?key|access[-_]?key|refresh[-_]?token|client[-_]?secret|ssn|social[-_]?security|tax[-_]?id|account[-_]?number|routing[-_]?number|card[-_]?number|cvv|cvc|security[-_]?code|date[-_]?of[-_]?birth|dob|email|phone|mobile|address|first[-_]?name|last[-_]?name|full[-_]?name)/i;

const SENSITIVE_VALUE_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi,
  /\b(?:basic|digest)\s+[A-Za-z0-9._~+/=-]+\b/gi,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:\+?\d[\d\s().-]{7,}\d)\b/g,
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b(?:\d[ -]*?){13,19}\b/g,
  /\b(?:api[-_ ]?key|access[-_ ]?token|refresh[-_ ]?token|client[-_ ]?secret)\s*[:=]\s*\S+/gi,
];

function redactString(value) {
  return SENSITIVE_VALUE_PATTERNS.reduce(
    (redactedValue, pattern) =>
      redactedValue.replace(pattern, REDACTION_PLACEHOLDER),
    value,
  );
}

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

/**
 * Determines whether a property name is likely to contain private or credential data.
 *
 * @param {unknown} key
 * @returns {boolean}
 */
export function isSensitiveKey(key) {
  return typeof key === 'string' && SENSITIVE_KEY_PATTERN.test(key);
}

/**
 * Redacts credentials and personally identifiable information from a value.
 *
 * @param {unknown} value
 * @param {WeakSet<object>} [seen]
 * @param {number} [depth=0]
 * @returns {unknown}
 */
export function redactSensitiveData(value, seen = new WeakSet(), depth = 0) {
  if (depth > MAX_LOG_DEPTH) {
    return '[MaxDepth]';
  }

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value;
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (typeof value === 'symbol') {
    return value.toString();
  }

  if (seen.has(value)) {
    return CIRCULAR_REFERENCE_PLACEHOLDER;
  }

  seen.add(value);

  if (value instanceof Date) {
    seen.delete(value);
    return Number.isNaN(value.getTime()) ? '[Invalid Date]' : value.toISOString();
  }

  if (value instanceof Error) {
    const errorValue = {
      name: redactString(value.name),
      message: redactString(value.message),
      ...(value.stack ? { stack: redactString(value.stack) } : {}),
    };

    seen.delete(value);
    return errorValue;
  }

  if (Array.isArray(value)) {
    const redactedArray = value.map((item) =>
      redactSensitiveData(item, seen, depth + 1),
    );
    seen.delete(value);
    return redactedArray;
  }

  const redactedObject = {};

  for (const [key, propertyValue] of Object.entries(value)) {
    redactedObject[key] = isSensitiveKey(key)
      ? REDACTION_PLACEHOLDER
      : redactSensitiveData(propertyValue, seen, depth + 1);
  }

  seen.delete(value);
  return redactedObject;
}

/**
 * Checks whether a value contains data that should not be logged without redaction.
 *
 * @param {unknown} value
 * @param {WeakSet<object>} [seen]
 * @returns {boolean}
 */
export function containsSensitiveData(value, seen = new WeakSet()) {
  if (typeof value === 'string') {
    return SENSITIVE_VALUE_PATTERNS.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(value);
    });
  }

  if (!isObject(value)) {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((item) => containsSensitiveData(item, seen));
  }

  return Object.entries(value).some(
    ([key, propertyValue]) =>
      isSensitiveKey(key) || containsSensitiveData(propertyValue, seen),
  );
}

/**
 * Determines whether a value is safe to write without exposing private data.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isSafeToLog(value) {
  return !containsSensitiveData(value);
}

/**
 * Writes a privacy-safe informational log message.
 *
 * @param {...unknown} values
 * @returns {boolean}
 */
export function safeLog(...values) {
  const logger = globalThis.console?.log;

  if (typeof logger !== 'function') {
    return false;
  }

  logger(...values.map((value) => redactSensitiveData(value)));
  return true;
}

/**
 * Writes a privacy-safe warning log message.
 *
 * @param {...unknown} values
 * @returns {boolean}
 */
export function safeWarn(...values) {
  const logger = globalThis.console?.warn;

  if (typeof logger !== 'function') {
    return false;
  }

  logger(...values.map((value) => redactSensitiveData(value)));
  return true;
}

/**
 * Writes a privacy-safe error log message.
 *
 * @param {...unknown} values
 * @returns {boolean}
 */
export function safeError(...values) {
  const logger = globalThis.console?.error;

  if (typeof logger !== 'function') {
    return false;
  }

  logger(...values.map((value) => redactSensitiveData(value)));
  return true;
}

/**
 * Creates a namespaced privacy-safe logger.
 *
 * @param {string} namespace
 * @returns {{log: Function, warn: Function, error: Function}}
 */
export function createSafeLogger(namespace) {
  const safeNamespace = redactString(String(namespace || '').trim());

  const withNamespace = (logger, values) => {
    if (!safeNamespace) {
      return logger(...values);
    }

    return logger(`[${safeNamespace}]`, ...values);
  };

  return {
    log: (...values) => withNamespace(safeLog, values),
    warn: (...values) => withNamespace(safeWarn, values),
    error: (...values) => withNamespace(safeError, values),
  };
}

export default Object.freeze({
  REDACTION_PLACEHOLDER,
  containsSensitiveData,
  createSafeLogger,
  isSafeToLog,
  isSensitiveKey,
  redactSensitiveData,
  safeError,
  safeLog,
  safeWarn,
});