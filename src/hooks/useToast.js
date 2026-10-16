import { useCallback, useEffect, useMemo } from 'react';
import { APP_ACTION_TYPES } from '../state/appReducer.js';
import { useAppContext } from '../state/AppProvider.jsx';

const DEFAULT_DURATION = 4000;
const DEFAULT_TYPE = 'info';
const DEFAULT_ROLE = 'status';
const DEFAULT_ARIA_LIVE = 'polite';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDuration(value, fallback = DEFAULT_DURATION) {
  if (value === null || value === false || value === 0) {
    return 0;
  }

  if (Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }

  return fallback;
}

function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeToast(messageOrToast, options = {}) {
  const source = isObject(messageOrToast)
    ? messageOrToast
    : {
        ...(isObject(options) ? options : {}),
        message: messageOrToast,
      };

  const message = normalizeText(source.message || source.content || source.text);
  const type = normalizeText(source.type || source.variant).toLowerCase() || DEFAULT_TYPE;
  const duration = normalizeDuration(source.duration);
  const isAssertive = type === 'error' || type === 'warning';

  return {
    ...source,
    id: normalizeText(source.id) || createToastId(),
    message,
    type,
    duration,
    role: normalizeText(source.role) || (isAssertive ? 'alert' : DEFAULT_ROLE),
    ariaLive:
      normalizeText(source.ariaLive) ||
      (isAssertive ? 'assertive' : DEFAULT_ARIA_LIVE),
  };
}

/**
 * Provides accessible toast state, dispatch helpers, and subscription updates.
 *
 * @returns {{
 *   toast: Object|null,
 *   visible: boolean,
 *   hasToast: boolean,
 *   showToast: Function,
 *   dispatchToast: Function,
 *   updateToast: Function,
 *   hideToast: Function,
 *   dismissToast: Function,
 *   clearToast: Function,
 *   success: Function,
 *   error: Function,
 *   warning: Function,
 *   info: Function
 * }}
 */
export function useToast() {
  const { state, dispatch } = useAppContext();
  const toast = isObject(state.toast) ? state.toast : null;

  const dispatchToast = useCallback(
    (messageOrToast, options = {}) => {
      const normalizedToast = normalizeToast(messageOrToast, options);

      if (!normalizedToast.message) {
        return null;
      }

      dispatch({
        type: APP_ACTION_TYPES.TOAST_SHOWN,
        payload: {
          toast: normalizedToast,
        },
      });

      return normalizedToast;
    },
    [dispatch],
  );

  const showToast = useCallback(
    (messageOrToast, options = {}) =>
      dispatchToast(messageOrToast, options),
    [dispatchToast],
  );

  const updateToast = useCallback(
    (values = {}) => {
      if (!toast || !isObject(values)) {
        return toast;
      }

      const nextToast = normalizeToast(
        {
          ...toast,
          ...values,
        },
        {},
      );

      dispatch({
        type: APP_ACTION_TYPES.TOAST_SET,
        payload: {
          toast: nextToast,
        },
      });

      return nextToast;
    },
    [dispatch, toast],
  );

  const hideToast = useCallback(() => {
    dispatch({
      type: APP_ACTION_TYPES.TOAST_HIDDEN,
    });
  }, [dispatch]);

  const clearToast = useCallback(() => {
    dispatch({
      type: APP_ACTION_TYPES.TOAST_CLEARED,
    });
  }, [dispatch]);

  const success = useCallback(
    (message, options = {}) =>
      dispatchToast(message, {
        ...options,
        type: 'success',
      }),
    [dispatchToast],
  );

  const error = useCallback(
    (message, options = {}) =>
      dispatchToast(message, {
        ...options,
        type: 'error',
      }),
    [dispatchToast],
  );

  const warning = useCallback(
    (message, options = {}) =>
      dispatchToast(message, {
        ...options,
        type: 'warning',
      }),
    [dispatchToast],
  );

  const info = useCallback(
    (message, options = {}) =>
      dispatchToast(message, {
        ...options,
        type: 'info',
      }),
    [dispatchToast],
  );

  useEffect(() => {
    if (!toast || !Number.isFinite(toast.duration) || toast.duration <= 0) {
      return undefined;
    }

    const timeoutId = globalThis.setTimeout(() => {
      hideToast();
    }, toast.duration);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [hideToast, toast]);

  return useMemo(
    () => ({
      toast,
      visible: toast !== null,
      hasToast: toast !== null,
      showToast,
      dispatchToast,
      updateToast,
      hideToast,
      dismissToast: hideToast,
      clearToast,
      success,
      error,
      warning,
      info,
    }),
    [
      clearToast,
      dispatchToast,
      error,
      hideToast,
      info,
      showToast,
      success,
      toast,
      updateToast,
      warning,
    ],
  );
}

export default useToast;