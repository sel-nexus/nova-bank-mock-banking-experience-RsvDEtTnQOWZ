import { getReferenceDate } from '../domain/referenceClock.js';

export const SESSION_INACTIVITY_WARNING_MILLISECONDS = 2 * 60 * 1000;
export const SESSION_EXPIRY_MILLISECONDS = 30 * 1000;

export const INACTIVITY_WARNING_MILLISECONDS =
  SESSION_INACTIVITY_WARNING_MILLISECONDS;
export const EXPIRY_MILLISECONDS = SESSION_EXPIRY_MILLISECONDS;

const SESSION_STATUS = Object.freeze({
  active: 'active',
  warning: 'warning',
  expired: 'expired',
  cleared: 'cleared',
});

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function defaultNow() {
  return Date.now();
}

function toTimestamp(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getTime();
  }

  if (typeof value === 'string') {
    const timestamp = new Date(value).getTime();

    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  return fallback;
}

function toIsoTimestamp(value) {
  const timestamp = toTimestamp(value, null);

  return timestamp === null ? null : new Date(timestamp).toISOString();
}

function cloneSnapshot(snapshot) {
  return snapshot ? { ...snapshot } : null;
}

function getDefaultStartTime(now) {
  const referenceTimestamp = getReferenceDate().getTime();

  return Number.isFinite(referenceTimestamp) ? now : now;
}

/**
 * Creates a local mock session lifecycle manager.
 *
 * @param {{
 *   sessionId?: string,
 *   warningAfterMilliseconds?: number,
 *   expiryAfterMilliseconds?: number,
 *   now?: () => number,
 *   timers?: {
 *     setTimeout?: Function,
 *     clearTimeout?: Function
 *   },
 *   autoStart?: boolean
 * }} [options]
 * @returns {Object}
 */
export function createSessionManager(options = {}) {
  const warningAfterMilliseconds =
    Number.isFinite(options.warningAfterMilliseconds) &&
    options.warningAfterMilliseconds >= 0
      ? options.warningAfterMilliseconds
      : SESSION_INACTIVITY_WARNING_MILLISECONDS;

  const expiryAfterMilliseconds =
    Number.isFinite(options.expiryAfterMilliseconds) &&
    options.expiryAfterMilliseconds >= 0
      ? options.expiryAfterMilliseconds
      : SESSION_EXPIRY_MILLISECONDS;

  const now =
    typeof options.now === 'function' ? options.now : defaultNow;
  const setTimer =
    typeof options.timers?.setTimeout === 'function'
      ? options.timers.setTimeout
      : globalThis.setTimeout;
  const clearTimer =
    typeof options.timers?.clearTimeout === 'function'
      ? options.timers.clearTimeout
      : globalThis.clearTimeout;

  let snapshot = null;
  let warningTimer = null;
  let expiryTimer = null;
  const listeners = new Set();

  function clearTimers() {
    if (warningTimer !== null) {
      clearTimer(warningTimer);
      warningTimer = null;
    }

    if (expiryTimer !== null) {
      clearTimer(expiryTimer);
      expiryTimer = null;
    }
  }

  function notify() {
    const nextSnapshot = cloneSnapshot(snapshot);

    listeners.forEach((listener) => {
      try {
        listener(nextSnapshot);
      } catch {
        // A subscriber must not prevent other subscribers from receiving updates.
      }
    });

    return nextSnapshot;
  }

  function buildSnapshot(status, values = {}) {
    const timestamp = values.timestamp ?? now();
    const lastActivityAt =
      values.lastActivityAt ?? snapshot?.lastActivityAt ?? timestamp;
    const warningAt =
      values.warningAt ??
      (status === SESSION_STATUS.active
        ? lastActivityAt + warningAfterMilliseconds
        : snapshot?.warningAt ?? null);
    const expiresAt =
      values.expiresAt ??
      (status === SESSION_STATUS.warning
        ? timestamp + expiryAfterMilliseconds
        : snapshot?.expiresAt ?? null);
    const remainingMilliseconds =
      status === SESSION_STATUS.warning && expiresAt !== null
        ? Math.max(0, expiresAt - timestamp)
        : status === SESSION_STATUS.active && warningAt !== null
          ? Math.max(0, warningAt - timestamp)
          : 0;

    return {
      sessionId: values.sessionId ?? snapshot?.sessionId ?? options.sessionId ?? createId(),
      status,
      isActive: status === SESSION_STATUS.active,
      isWarning: status === SESSION_STATUS.warning,
      isExpired: status === SESSION_STATUS.expired,
      isCleared: status === SESSION_STATUS.cleared,
      lastActivityAt: toIsoTimestamp(lastActivityAt),
      warningAt: toIsoTimestamp(warningAt),
      expiresAt: toIsoTimestamp(expiresAt),
      remainingMilliseconds,
      remainingSeconds: Math.ceil(remainingMilliseconds / 1000),
      updatedAt: toIsoTimestamp(timestamp),
    };
  }

  function scheduleWarning() {
    if (snapshot?.status !== SESSION_STATUS.active) {
      return;
    }

    warningTimer = setTimer(() => {
      warningTimer = null;
      showWarning();
    }, warningAfterMilliseconds);

    if (warningTimer && typeof warningTimer.unref === 'function') {
      warningTimer.unref();
    }
  }

  function scheduleExpiry() {
    expiryTimer = setTimer(() => {
      expiryTimer = null;
      expire();
    }, expiryAfterMilliseconds);

    if (expiryTimer && typeof expiryTimer.unref === 'function') {
      expiryTimer.unref();
    }
  }

  function showWarning() {
    if (!snapshot || snapshot.status !== SESSION_STATUS.active) {
      return cloneSnapshot(snapshot);
    }

    const warningTimestamp = now();

    snapshot = buildSnapshot(SESSION_STATUS.warning, {
      timestamp: warningTimestamp,
      warningAt: snapshot.warningAt,
      expiresAt: warningTimestamp + expiryAfterMilliseconds,
    });

    const nextSnapshot = notify();
    scheduleExpiry();
    return nextSnapshot;
  }

  function expire() {
    if (!snapshot || snapshot.status === SESSION_STATUS.cleared) {
      return cloneSnapshot(snapshot);
    }

    clearTimers();

    snapshot = buildSnapshot(SESSION_STATUS.expired, {
      timestamp: now(),
      expiresAt: snapshot.expiresAt,
      warningAt: snapshot.warningAt,
    });

    return notify();
  }

  /**
   * Starts or restarts a mock session.
   *
   * @param {{sessionId?: string, lastActivityAt?: Date|string|number}} [session]
   * @returns {Object}
   */
  function start(session = {}) {
    clearTimers();

    const startTimestamp = toTimestamp(session.lastActivityAt, getDefaultStartTime(now()));

    snapshot = buildSnapshot(SESSION_STATUS.active, {
      sessionId: session.sessionId,
      timestamp: startTimestamp,
      lastActivityAt: startTimestamp,
      warningAt: startTimestamp + warningAfterMilliseconds,
      expiresAt: null,
    });

    const nextSnapshot = notify();
    scheduleWarning();
    return nextSnapshot;
  }

  /**
   * Returns a copy of the current session snapshot.
   *
   * @returns {Object|null}
   */
  function getSnapshot() {
    if (!snapshot) {
      return null;
    }

    if (snapshot.status === SESSION_STATUS.warning) {
      const remainingMilliseconds = Math.max(
        0,
        new Date(snapshot.expiresAt).getTime() - now(),
      );

      return {
        ...cloneSnapshot(snapshot),
        remainingMilliseconds,
        remainingSeconds: Math.ceil(remainingMilliseconds / 1000),
      };
    }

    if (snapshot.status === SESSION_STATUS.active) {
      const remainingMilliseconds = Math.max(
        0,
        new Date(snapshot.warningAt).getTime() - now(),
      );

      return {
        ...cloneSnapshot(snapshot),
        remainingMilliseconds,
        remainingSeconds: Math.ceil(remainingMilliseconds / 1000),
      };
    }

    return cloneSnapshot(snapshot);
  }

  /**
   * Subscribes to session snapshot changes.
   *
   * @param {(snapshot: Object|null) => void} listener
   * @param {{emitCurrent?: boolean}} [subscriptionOptions]
   * @returns {() => void}
   */
  function subscribe(listener, subscriptionOptions = {}) {
    if (typeof listener !== 'function') {
      return () => {};
    }

    listeners.add(listener);

    if (subscriptionOptions.emitCurrent !== false) {
      try {
        listener(getSnapshot());
      } catch {
        // Subscriber errors are isolated from lifecycle management.
      }
    }

    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * Records user activity and resets the inactivity countdown.
   *
   * @param {string} [signal]
   * @returns {Object|null}
   */
  function recordActivity(signal = 'activity') {
    if (!snapshot || snapshot.status === SESSION_STATUS.expired) {
      return getSnapshot();
    }

    if (snapshot.status === SESSION_STATUS.cleared) {
      return null;
    }

    clearTimers();

    const activityTimestamp = now();

    snapshot = buildSnapshot(SESSION_STATUS.active, {
      timestamp: activityTimestamp,
      lastActivityAt: activityTimestamp,
      warningAt: activityTimestamp + warningAfterMilliseconds,
      expiresAt: null,
    });
    snapshot.activitySignal = signal;

    const nextSnapshot = notify();
    scheduleWarning();
    return nextSnapshot;
  }

  /**
   * Continues a session from its inactivity warning state.
   *
   * @returns {Object|null}
   */
  function continueSession() {
    return recordActivity('continue');
  }

  /**
   * Immediately expires the current session.
   *
   * @returns {Object|null}
   */
  function forceExpire() {
    return expire();
  }

  /**
   * Clears the current session and all lifecycle timers.
   *
   * @returns {Object|null}
   */
  function clear() {
    clearTimers();

    if (!snapshot) {
      return null;
    }

    snapshot = buildSnapshot(SESSION_STATUS.cleared, {
      timestamp: now(),
      expiresAt: null,
    });

    return notify();
  }

  if (options.autoStart !== false) {
    start();
  }

  return Object.freeze({
    clear,
    continue: continueSession,
    continueSession,
    forceExpire,
    getSnapshot,
    recordActivity,
    signalActivity: recordActivity,
    start,
    subscribe,
  });
}

export const sessionManager = createSessionManager();

export default sessionManager;