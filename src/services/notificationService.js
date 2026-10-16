import { DEFAULT_FIXTURE_USER_ID, FIXTURES } from '../fixtures/fixtures.js';
import { getReferenceDateString } from '../domain/referenceClock.js';

const notificationReadState = new Map();

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

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function normalizePersonaId(personaOrId) {
  if (isObject(personaOrId)) {
    return normalizeText(
      personaOrId.id || personaOrId.userId || personaOrId.personaId,
    );
  }

  return normalizeText(personaOrId);
}

function normalizeNotificationId(notificationOrId) {
  if (isObject(notificationOrId)) {
    return normalizeText(
      notificationOrId.id || notificationOrId.notificationId,
    );
  }

  return normalizeText(notificationOrId);
}

function normalizeOptions(options) {
  return isObject(options) ? options : {};
}

function getPersona(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  const personaId = normalizePersonaId(personaOrId);

  if (!personaId) {
    return null;
  }

  return FIXTURES.personas.find((persona) => persona.id === personaId) || null;
}

function getNotification(notificationOrId) {
  const notificationId = normalizeNotificationId(notificationOrId);

  if (!notificationId) {
    return null;
  }

  return (
    FIXTURES.notifications.find(
      (notification) => notification.id === notificationId,
    ) || null
  );
}

function createNotificationStateKey(personaId, notificationId) {
  return `${personaId}:${notificationId}`;
}

function getNotificationReadState(personaId, notification) {
  const stateKey = createNotificationStateKey(personaId, notification.id);

  return notificationReadState.has(stateKey)
    ? notificationReadState.get(stateKey)
    : notification.read === true;
}

function createNotificationView(personaId, notification) {
  return {
    ...cloneValue(notification),
    read: getNotificationReadState(personaId, notification),
  };
}

function resolveArguments(personaOrOptions, maybeOptions) {
  if (isObject(personaOrOptions) && maybeOptions === undefined) {
    const looksLikeOptions = [
      'read',
      'unreadOnly',
      'type',
      'search',
      'query',
      'limit',
      'sortOrder',
    ].some((key) =>
      Object.prototype.hasOwnProperty.call(personaOrOptions, key),
    );

    if (looksLikeOptions) {
      return {
        personaId: DEFAULT_FIXTURE_USER_ID,
        options: normalizeOptions(personaOrOptions),
      };
    }
  }

  return {
    personaId:
      normalizePersonaId(personaOrOptions) || DEFAULT_FIXTURE_USER_ID,
    options: normalizeOptions(maybeOptions),
  };
}

function createSuccess(data, message) {
  return {
    success: true,
    ...(data !== undefined ? { data: cloneValue(data) } : {}),
    ...(message ? { message } : {}),
  };
}

function createFailure(code, message, details) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details: cloneValue(details) } : {}),
    },
  };
}

function matchesNotification(notification, options) {
  const requestedType = normalizeText(options.type).toLowerCase();
  const search = normalizeText(options.search || options.query).toLowerCase();
  const readOnly = typeof options.read === 'boolean' ? options.read : null;
  const unreadOnly = options.unreadOnly === true;

  if (requestedType && normalizeText(notification.type).toLowerCase() !== requestedType) {
    return false;
  }

  if (readOnly !== null && notification.read !== readOnly) {
    return false;
  }

  if (unreadOnly && notification.read) {
    return false;
  }

  if (
    search &&
    ![
      notification.title,
      notification.message,
      notification.type,
      notification.action?.label,
    ].some((value) => normalizeText(value).toLowerCase().includes(search))
  ) {
    return false;
  }

  return true;
}

function sortNotifications(notifications, options) {
  const sortOrder =
    normalizeText(options.sortOrder || options.order).toLowerCase() === 'asc'
      ? 'asc'
      : 'desc';

  return notifications
    .map((notification, index) => ({ notification, index }))
    .sort((first, second) => {
      const firstTimestamp = new Date(
        first.notification.createdAt || 0,
      ).getTime();
      const secondTimestamp = new Date(
        second.notification.createdAt || 0,
      ).getTime();

      const comparison =
        (Number.isFinite(firstTimestamp) ? firstTimestamp : 0) -
        (Number.isFinite(secondTimestamp) ? secondTimestamp : 0);

      if (comparison === 0) {
        return first.index - second.index;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    })
    .map(({ notification }) => notification);
}

function getPersonaNotifications(personaId, options = {}) {
  const normalizedOptions = normalizeOptions(options);

  const notifications = FIXTURES.notifications
    .filter((notification) => notification.userId === personaId)
    .map((notification) => createNotificationView(personaId, notification))
    .filter((notification) => matchesNotification(notification, normalizedOptions));

  const sortedNotifications = sortNotifications(notifications, normalizedOptions);
  const limit =
    Number.isInteger(normalizedOptions.limit) && normalizedOptions.limit >= 0
      ? normalizedOptions.limit
      : null;

  return limit === null
    ? sortedNotifications
    : sortedNotifications.slice(0, limit);
}

/**
 * Returns synthetic notifications for a persona.
 *
 * @param {string|Object} [personaOrOptions]
 * @param {Object} [maybeOptions]
 * @returns {Object[]}
 */
export function getNotifications(personaOrOptions, maybeOptions) {
  const { personaId, options } = resolveArguments(
    personaOrOptions,
    maybeOptions,
  );

  if (!getPersona(personaId)) {
    return [];
  }

  return cloneValue(getPersonaNotifications(personaId, options));
}

/**
 * Alias for retrieving synthetic notifications.
 *
 * @param {string|Object} [personaOrOptions]
 * @param {Object} [maybeOptions]
 * @returns {Object[]}
 */
export function listNotifications(personaOrOptions, maybeOptions) {
  return getNotifications(personaOrOptions, maybeOptions);
}

/**
 * Returns one notification available to a persona.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} notificationOrId
 * @returns {Object|null}
 */
export function getNotificationById(personaOrId, notificationOrId) {
  const personaId = normalizePersonaId(personaOrId);
  const notification = getNotification(notificationOrId);

  if (!personaId || !notification || notification.userId !== personaId) {
    return null;
  }

  return cloneValue(createNotificationView(personaId, notification));
}

/**
 * Alias for retrieving notification details.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} notificationOrId
 * @returns {Object|null}
 */
export function getNotificationDetails(personaOrId, notificationOrId) {
  return getNotificationById(personaOrId, notificationOrId);
}

/**
 * Returns the unread notification count for a persona.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @returns {number}
 */
export function getUnreadNotificationCount(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
) {
  return getNotifications(personaOrId, { unreadOnly: true }).length;
}

/**
 * Alias for retrieving the unread notification count.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @returns {number}
 */
export function getUnreadCount(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  return getUnreadNotificationCount(personaOrId);
}

/**
 * Returns a notification summary for a persona.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @returns {{total: number, unread: number, read: number}}
 */
export function getNotificationSummary(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
) {
  const notifications = getNotifications(personaOrId);

  return {
    total: notifications.length,
    unread: notifications.filter((notification) => !notification.read).length,
    read: notifications.filter((notification) => notification.read).length,
  };
}

/**
 * Marks one notification as read or unread for a persona.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} notificationOrId
 * @param {boolean} [read=true]
 * @returns {{success: boolean, data?: Object, error?: Object, message?: string}}
 */
export function setNotificationRead(
  personaOrId,
  notificationOrId,
  read = true,
) {
  const personaId = normalizePersonaId(personaOrId);
  const notification = getNotification(notificationOrId);

  if (!getPersona(personaId)) {
    return createFailure(
      'PERSONA_NOT_FOUND',
      'No persona was found for the requested notification scope.',
    );
  }

  if (!notification || notification.userId !== personaId) {
    return createFailure(
      'NOTIFICATION_NOT_FOUND',
      'No notification was found for the requested persona.',
    );
  }

  if (typeof read !== 'boolean') {
    return createFailure(
      'INVALID_READ_STATE',
      'Notification read state must be a boolean.',
    );
  }

  notificationReadState.set(
    createNotificationStateKey(personaId, notification.id),
    read,
  );

  return createSuccess(
    createNotificationView(personaId, notification),
    read
      ? 'Notification marked as read.'
      : 'Notification marked as unread.',
  );
}

/**
 * Marks one notification as read for a persona.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} notificationOrId
 * @returns {{success: boolean, data?: Object, error?: Object, message?: string}}
 */
export function markNotificationRead(personaOrId, notificationOrId) {
  return setNotificationRead(personaOrId, notificationOrId, true);
}

/**
 * Marks one notification as unread for a persona.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} notificationOrId
 * @returns {{success: boolean, data?: Object, error?: Object, message?: string}}
 */
export function markNotificationUnread(personaOrId, notificationOrId) {
  return setNotificationRead(personaOrId, notificationOrId, false);
}

/**
 * Marks all notifications as read for a persona.
 *
 * @param {string|Object} [personaOrId=DEFAULT_FIXTURE_USER_ID]
 * @returns {{success: boolean, data?: Object, error?: Object, message?: string}}
 */
export function markAllNotificationsRead(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
) {
  const personaId = normalizePersonaId(personaOrId);

  if (!getPersona(personaId)) {
    return createFailure(
      'PERSONA_NOT_FOUND',
      'No persona was found for the requested notification scope.',
    );
  }

  const notifications = FIXTURES.notifications.filter(
    (notification) => notification.userId === personaId,
  );

  notifications.forEach((notification) => {
    notificationReadState.set(
      createNotificationStateKey(personaId, notification.id),
      true,
    );
  });

  return createSuccess(
    {
      count: notifications.length,
      unreadCount: 0,
    },
    'All notifications have been marked as read.',
  );
}

/**
 * Clears local notification read-state overrides.
 *
 * @param {string|Object} [personaOrId]
 * @returns {number}
 */
export function clearNotificationState(personaOrId) {
  const personaId =
    personaOrId === undefined ? '' : normalizePersonaId(personaOrId);
  let removedCount = 0;

  for (const key of notificationReadState.keys()) {
    if (!personaId || key.startsWith(`${personaId}:`)) {
      notificationReadState.delete(key);
      removedCount += 1;
    }
  }

  return removedCount;
}

/**
 * Returns a controlled response for one notification lookup.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} notificationOrId
 * @returns {{success: boolean, data?: Object, error?: Object}}
 */
export function getNotificationResult(personaOrId, notificationOrId) {
  const notification = getNotificationById(personaOrId, notificationOrId);

  return notification
    ? createSuccess(notification)
    : createFailure(
        'NOTIFICATION_NOT_FOUND',
        'No notification was found for the requested persona.',
      );
}

export const notificationService = Object.freeze({
  clearNotificationState,
  getNotificationById,
  getNotificationDetails,
  getNotificationResult,
  getNotificationSummary,
  getNotifications,
  getUnreadCount,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  setNotificationRead,
});

export default notificationService;