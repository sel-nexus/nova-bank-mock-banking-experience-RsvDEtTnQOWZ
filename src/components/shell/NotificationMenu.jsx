import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_FIXTURE_USER_ID } from '../../fixtures/fixtures.js';
import notificationService from '../../services/notificationService.js';
import { formatDateTime } from '../../utils/formatters.js';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePersonaId(personaOrId) {
  if (typeof personaOrId === 'string' || typeof personaOrId === 'number') {
    return String(personaOrId).trim();
  }

  if (isObject(personaOrId)) {
    return String(
      personaOrId.id || personaOrId.userId || personaOrId.personaId || '',
    ).trim();
  }

  return DEFAULT_FIXTURE_USER_ID;
}

function getNotificationId(notification) {
  return notification?.id || notification?.notificationId || '';
}

function getNotificationRoute(notification) {
  return notification?.action?.route || '';
}

function getUnreadCount(notifications) {
  return notifications.filter((notification) => notification.read !== true).length;
}

/**
 * Renders the synthetic notification menu for the active demo persona.
 *
 * @param {{
 *   personaId?: string|Object,
 *   userId?: string|Object,
 *   persona?: Object,
 *   notifications?: Object[],
 *   notificationCount?: number,
 *   unreadNotificationCount?: number,
 *   open?: boolean,
 *   isOpen?: boolean,
 *   onOpenChange?: Function,
 *   onNotificationClick?: Function,
 *   onSelect?: Function,
 *   onMarkAllRead?: Function,
 *   onClose?: Function,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function NotificationMenu({
  personaId = '',
  userId = '',
  persona,
  notifications: providedNotifications,
  notificationCount,
  unreadNotificationCount,
  open,
  isOpen,
  onOpenChange,
  onNotificationClick,
  onSelect,
  onMarkAllRead,
  onClose,
  className = '',
}) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const menuId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(
    Array.isArray(providedNotifications) ? providedNotifications : [],
  );

  const activePersonaId = normalizePersonaId(
    personaId || userId || persona || DEFAULT_FIXTURE_USER_ID,
  );
  const isControlled = open !== undefined || isOpen !== undefined;
  const visible = isControlled ? open === true || isOpen === true : isMenuOpen;
  const hasProvidedNotifications = Array.isArray(providedNotifications);

  useEffect(() => {
    if (hasProvidedNotifications) {
      setNotifications(providedNotifications);
      return;
    }

    try {
      setNotifications(notificationService.getNotifications(activePersonaId));
    } catch {
      setNotifications([]);
    }
  }, [activePersonaId, hasProvidedNotifications, providedNotifications]);

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      if (
        visible &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
        onOpenChange?.(false);
        onClose?.();
      }
    };

    const handleKeyDown = (event) => {
      if (visible && event.key === 'Escape') {
        event.preventDefault();
        setIsMenuOpen(false);
        onOpenChange?.(false);
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onOpenChange, visible]);

  const serviceUnreadCount = getUnreadCount(notifications);
  const activeUnreadCount =
    Number.isFinite(unreadNotificationCount)
      ? unreadNotificationCount
      : Number.isFinite(notificationCount)
        ? notificationCount
        : serviceUnreadCount;

  const setMenuVisibility = (nextVisible) => {
    setIsMenuOpen(nextVisible);
    onOpenChange?.(nextVisible);
  };

  const handleNotificationClick = (notification) => {
    const notificationId = getNotificationId(notification);

    if (notification.read !== true && notificationId && !hasProvidedNotifications) {
      try {
        notificationService.markNotificationRead(
          activePersonaId,
          notificationId,
        );
        setNotifications(notificationService.getNotifications(activePersonaId));
      } catch {
        // A local read-state update must not interrupt notification navigation.
      }
    } else if (notification.read !== true) {
      setNotifications((currentNotifications) =>
        currentNotifications.map((item) =>
          getNotificationId(item) === notificationId
            ? { ...item, read: true }
            : item,
        ),
      );
    }

    const handler = onNotificationClick || onSelect;

    if (typeof handler === 'function') {
      handler(notification);
    }

    const route = getNotificationRoute(notification);

    if (route) {
      setMenuVisibility(false);
      navigate(route);
    }
  };

  const handleMarkAllRead = () => {
    if (!hasProvidedNotifications) {
      try {
        notificationService.markAllNotificationsRead(activePersonaId);
        setNotifications(notificationService.getNotifications(activePersonaId));
      } catch {
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        );
      }
    } else {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      );
    }

    onMarkAllRead?.();
  };

  return (
    <div
      ref={containerRef}
      className={['relative', className].filter(Boolean).join(' ')}
      data-testid="notification-menu"
    >
      <button
        type="button"
        aria-label={
          activeUnreadCount > 0
            ? `${activeUnreadCount} unread notifications`
            : 'Notifications'
        }
        aria-controls={visible ? menuId : undefined}
        aria-expanded={visible}
        onClick={() => setMenuVisibility(!visible)}
        className="relative flex h-11 w-11 items-center justify-center rounded-lg text-xl text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
      >
        <span aria-hidden="true">♧</span>
        {activeUnreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-nova-coral px-1 text-[10px] font-bold text-nova-midnight"
          >
            {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
          </span>
        )}
      </button>

      {visible && (
        <section
          id={menuId}
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-nova-slate/20 bg-white shadow-elevated"
        >
          <header className="flex items-start justify-between gap-4 border-b border-nova-slate/20 px-4 py-4">
            <div>
              <h2 className="text-lg font-bold text-nova-midnight">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-nova-slate">
                {activeUnreadCount > 0
                  ? `${activeUnreadCount} unread notification${
                      activeUnreadCount === 1 ? '' : 's'
                    }`
                  : 'You are all caught up'}
              </p>
            </div>

            {activeUnreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-nova-blue transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
              >
                Mark all read
              </button>
            )}
          </header>

          {notifications.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto divide-y divide-nova-slate/15">
              {notifications.map((notification, index) => {
                const notificationId =
                  getNotificationId(notification) || `notification-${index}`;
                const isUnread = notification.read !== true;

                return (
                  <li key={notificationId}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={[
                        'flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-nova-sky/50 focus:bg-nova-sky/50 focus:outline-none',
                        isUnread ? 'bg-nova-sky/20' : 'bg-white',
                      ].join(' ')}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                          isUnread ? 'bg-nova-blue' : 'bg-transparent',
                        ].join(' ')}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <span
                            className={[
                              'text-sm text-nova-midnight',
                              isUnread ? 'font-bold' : 'font-semibold',
                            ].join(' ')}
                          >
                            {notification.title || 'Notification'}
                          </span>
                          {notification.type && (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-nova-slate">
                              {notification.type}
                            </span>
                          )}
                        </span>

                        <span className="mt-1 block text-sm text-nova-slate">
                          {notification.message || notification.description}
                        </span>

                        {notification.createdAt && (
                          <span className="mt-2 block text-xs text-nova-slate">
                            {formatDateTime(notification.createdAt)}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-nova-slate">
              You have no notifications.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

NotificationMenu.propTypes = {
  personaId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  persona: PropTypes.object,
  notifications: PropTypes.arrayOf(PropTypes.object),
  notificationCount: PropTypes.number,
  unreadNotificationCount: PropTypes.number,
  open: PropTypes.bool,
  isOpen: PropTypes.bool,
  onOpenChange: PropTypes.func,
  onNotificationClick: PropTypes.func,
  onSelect: PropTypes.func,
  onMarkAllRead: PropTypes.func,
  onClose: PropTypes.func,
  className: PropTypes.string,
};

export { NotificationMenu };
export default NotificationMenu;
