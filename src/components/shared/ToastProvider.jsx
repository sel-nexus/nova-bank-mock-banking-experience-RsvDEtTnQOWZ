import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useToast } from '../../hooks/useToast.js';

const TYPE_STYLES = Object.freeze({
  success: {
    container: 'border-nova-teal/30 bg-nova-mint text-nova-ink',
    indicator: 'bg-nova-teal',
    icon: '✓',
  },
  error: {
    container: 'border-nova-coral/40 bg-nova-coral/10 text-nova-midnight',
    indicator: 'bg-nova-coral',
    icon: '!',
  },
  warning: {
    container: 'border-nova-gold/50 bg-nova-gold/20 text-nova-ink',
    indicator: 'bg-nova-gold',
    icon: '!',
  },
  info: {
    container: 'border-nova-blue/30 bg-nova-sky text-nova-ink',
    indicator: 'bg-nova-blue',
    icon: 'i',
  },
});

function normalizeType(value) {
  if (typeof value !== 'string') {
    return 'info';
  }

  const normalizedValue = value.trim().toLowerCase();

  return TYPE_STYLES[normalizedValue] ? normalizedValue : 'info';
}

function ToastProvider({ children }) {
  const {
    toast,
    visible,
    hideToast,
  } = useToast();

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        hideToast();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hideToast, visible]);

  const type = normalizeType(toast?.severity || toast?.type || toast?.variant);
  const styles = TYPE_STYLES[type];
  const message = toast?.message || toast?.content || toast?.text || '';
  const title = typeof toast?.title === 'string' ? toast.title.trim() : '';
  const action =
    toast?.action && typeof toast.action === 'object' ? toast.action : null;
  const actionLabel =
    typeof action?.label === 'string' ? action.label.trim() : '';

  const handleAction = () => {
    if (typeof action?.onClick === 'function') {
      try {
        action.onClick();
      } catch {
        // Toast actions must not interrupt dismissal or application rendering.
      }
    }

    if (action?.dismissOnClick !== false) {
      hideToast();
    }
  };

  return (
    <>
      {children}

      <div
        aria-live={toast?.ariaLive || (type === 'error' || type === 'warning' ? 'assertive' : 'polite')}
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end"
      >
        {visible && (
          <div
            role={toast?.role || (type === 'error' || type === 'warning' ? 'alert' : 'status')}
            className={[
              'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-card border p-4 shadow-elevated',
              'motion-safe:animate-[toast-in_180ms_ease-out]',
              styles.container,
            ].join(' ')}
            data-severity={type}
          >
            <span
              aria-hidden="true"
              className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                styles.indicator,
              ].join(' ')}
            >
              {styles.icon}
            </span>

            <div className="min-w-0 flex-1">
              {title && (
                <p className="font-semibold text-nova-midnight">{title}</p>
              )}

              <p className={title ? 'mt-1 text-sm' : 'text-sm font-medium'}>
                {message}
              </p>

              {actionLabel && typeof action?.onClick === 'function' && (
                <button
                  type="button"
                  onClick={handleAction}
                  className="mt-3 min-h-9 rounded-lg px-2 py-1 text-sm font-semibold underline underline-offset-2 transition hover:no-underline focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
                >
                  {actionLabel}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={hideToast}
              aria-label="Dismiss notification"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg leading-none transition hover:bg-black/10 focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { ToastProvider };
export default ToastProvider;