const MAX_EVENTS = 500;
const MAX_EVENT_NAME_LENGTH = 80;
const MAX_PROPERTY_KEY_LENGTH = 60;
const MAX_STRING_LENGTH = 240;

export const ANALYTICS_MAX_EVENTS = MAX_EVENTS;

const SENSITIVE_KEY_PATTERN =
  /(?:password|passwd|passcode|pin|secret|token|authorization|cookie|session|credential|api[-_]?key|private[-_]?key|access[-_]?key|refresh[-_]?token|client[-_]?secret|ssn|social[-_]?security|tax[-_]?id|account[-_]?number|routing[-_]?number|card[-_]?number|cvv|cvc|security[-_]?code|date[-_]?of[-_]?birth|dob|email|phone|mobile|address|first[-_]?name|last[-_]?name|full[-_]?name|user[-_]?id)/i;

const SENSITIVE_VALUE_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:\+?\d[\d\s().-]{7,}\d)\b/,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b(?:\d[ -]*?){13,19}\b/,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+\b/i,
];

const events = [];
let eventSequence = 0;

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeEventName(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, MAX_EVENT_NAME_LENGTH);
}

function normalizePropertyKey(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .replace(/[^a-zA-Z0-9_.:-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, MAX_PROPERTY_KEY_LENGTH);
}

function containsSensitiveValue(value) {
  return (
    typeof value === 'string' &&
    SENSITIVE_VALUE_PATTERNS.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(value);
    })
  );
}

function sanitizeString(value) {
  if (typeof value !== 'string' || containsSensitiveValue(value)) {
    return undefined;
  }

  return value.trim().slice(0, MAX_STRING_LENGTH);
}

function sanitizeValue(value, depth = 0) {
  if (depth > 2 || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    const sanitizedArray = value
      .slice(0, 20)
      .map((item) => sanitizeValue(item, depth + 1))
      .filter((item) => item !== undefined);

    return sanitizedArray.length > 0 ? sanitizedArray : undefined;
  }

  if (!isObject(value)) {
    return undefined;
  }

  const sanitizedObject = {};

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = normalizePropertyKey(rawKey);

    if (!key || SENSITIVE_KEY_PATTERN.test(rawKey)) {
      continue;
    }

    const sanitizedValue = sanitizeValue(rawValue, depth + 1);

    if (sanitizedValue !== undefined) {
      sanitizedObject[key] = sanitizedValue;
    }
  }

  return Object.keys(sanitizedObject).length > 0 ? sanitizedObject : undefined;
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

  return JSON.parse(JSON.stringify(value));
}

function createEventId() {
  eventSequence += 1;
  return `analytics-${eventSequence}`;
}

function normalizeTimestamp(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const timestamp = new Date(value);

    if (!Number.isNaN(timestamp.getTime())) {
      return timestamp.toISOString();
    }
  }

  return new Date().toISOString();
}

/**
 * Records a sanitized analytics event in memory.
 *
 * @param {string} eventName
 * @param {Object} [properties]
 * @param {{category?: string, timestamp?: Date|string}} [options]
 * @returns {Object|null}
 */
export function recordEvent(eventName, properties = {}, options = {}) {
  const name = normalizeEventName(eventName);

  if (!name) {
    return null;
  }

  const sanitizedProperties = sanitizeValue(properties);
  const category = sanitizeString(options.category);
  const event = {
    id: createEventId(),
    name,
    ...(category ? { category } : {}),
    properties: sanitizedProperties || {},
    timestamp: normalizeTimestamp(options.timestamp),
  };

  events.push(event);

  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  return cloneValue(event);
}

/**
 * Alias for recording an analytics event.
 *
 * @param {string} eventName
 * @param {Object} [properties]
 * @param {{category?: string, timestamp?: Date|string}} [options]
 * @returns {Object|null}
 */
export function trackEvent(eventName, properties = {}, options = {}) {
  return recordEvent(eventName, properties, options);
}

/**
 * Records a sanitized page-view event.
 *
 * @param {string} page
 * @param {Object} [properties]
 * @returns {Object|null}
 */
export function recordPageView(page, properties = {}) {
  return recordEvent(
    'page_view',
    {
      ...properties,
      page,
    },
    { category: 'navigation' },
  );
}

/**
 * Returns recorded analytics events.
 *
 * @param {{name?: string, category?: string, limit?: number}} [options]
 * @returns {Object[]}
 */
export function getEvents(options = {}) {
  const normalizedName = normalizeEventName(options.name);
  const normalizedCategory = sanitizeString(options.category);
  const limit =
    Number.isInteger(options.limit) && options.limit >= 0
      ? options.limit
      : events.length;

  return events
    .filter((event) => {
      const matchesName = !normalizedName || event.name === normalizedName;
      const matchesCategory =
        !normalizedCategory || event.category === normalizedCategory;

      return matchesName && matchesCategory;
    })
    .slice(-limit)
    .map((event) => cloneValue(event));
}

/**
 * Returns event counts grouped by event name.
 *
 * @returns {Object<string, number>}
 */
export function getEventCounts() {
  return events.reduce((counts, event) => {
    counts[event.name] = (counts[event.name] || 0) + 1;
    return counts;
  }, {});
}

/**
 * Returns a summary of the in-memory analytics buffer.
 *
 * @returns {{totalEvents: number, eventCounts: Object<string, number>}}
 */
export function getAnalyticsSummary() {
  return {
    totalEvents: events.length,
    eventCounts: getEventCounts(),
  };
}

/**
 * Clears all recorded analytics events.
 *
 * @returns {number}
 */
export function clearEvents() {
  const removedCount = events.length;
  events.length = 0;
  eventSequence = 0;
  return removedCount;
}

/**
 * Returns the number of recorded analytics events.
 *
 * @returns {number}
 */
export function getEventCount() {
  return events.length;
}

export const analyticsService = Object.freeze({
  clearEvents,
  getAnalyticsSummary,
  getEventCount,
  getEventCounts,
  getEvents,
  recordEvent,
  recordPageView,
  trackEvent,
});

export default analyticsService;