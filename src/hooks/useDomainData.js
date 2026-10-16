import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STATUS_IDLE = 'idle';
const STATUS_LOADING = 'loading';
const STATUS_SUCCESS = 'success';
const STATUS_ERROR = 'error';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeOptions(options) {
  return isObject(options) ? options : {};
}

function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }

  if (isObject(error)) {
    const normalizedError = new Error(
      typeof error.message === 'string'
        ? error.message
        : 'The domain data request failed.',
    );

    Object.assign(normalizedError, error);
    return normalizedError;
  }

  return new Error(
    error === undefined || error === null
      ? 'The domain data request failed.'
      : String(error),
  );
}

function createAbortController() {
  return typeof globalThis.AbortController === 'function'
    ? new globalThis.AbortController()
    : null;
}

/**
 * Loads domain data with lifecycle state, retry support, and stale-response
 * protection.
 *
 * @param {Function} loader
 * @param {{
 *   enabled?: boolean,
 *   autoLoad?: boolean,
 *   initialData?: unknown,
 *   dependencies?: unknown[],
 *   reloadKey?: unknown,
 *   onSuccess?: Function,
 *   onError?: Function
 * }} [options]
 * @returns {{
 *   data: unknown,
 *   error: Error|null,
 *   status: string,
 *   isIdle: boolean,
 *   isLoading: boolean,
 *   isSuccess: boolean,
 *   isError: boolean,
 *   hasData: boolean,
 *   lastUpdated: string|null,
 *   requestId: number,
 *   retry: Function,
 *   refetch: Function,
 *   reset: Function
 * }}
 */
export function useDomainData(loader, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const enabled =
    normalizedOptions.enabled !== false && normalizedOptions.autoLoad !== false;
  const initialData = normalizedOptions.initialData;
  const dependencies = Array.isArray(normalizedOptions.dependencies)
    ? normalizedOptions.dependencies
    : [];
  const reloadKey = normalizedOptions.reloadKey;

  const loaderRef = useRef(loader);
  const callbacksRef = useRef({
    onSuccess: normalizedOptions.onSuccess,
    onError: normalizedOptions.onError,
  });
  const initialDataRef = useRef(initialData);
  const mountedRef = useRef(false);
  const requestSequenceRef = useRef(0);
  const abortControllerRef = useRef(null);

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(
    enabled ? STATUS_IDLE : STATUS_IDLE,
  );
  const [lastUpdated, setLastUpdated] = useState(null);
  const [requestId, setRequestId] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  loaderRef.current = loader;
  callbacksRef.current = {
    onSuccess: normalizedOptions.onSuccess,
    onError: normalizedOptions.onError,
  };
  initialDataRef.current = initialData;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestSequenceRef.current += 1;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      requestSequenceRef.current += 1;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      if (mountedRef.current) {
        setStatus(STATUS_IDLE);
        setError(null);
      }

      return undefined;
    }

    const currentRequestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = currentRequestId;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = createAbortController();
    abortControllerRef.current = controller;

    setRequestId(currentRequestId);
    setStatus(STATUS_LOADING);
    setError(null);

    let settled = false;

    Promise.resolve()
      .then(() => loaderRef.current())
      .then((result) => {
        if (
          settled ||
          !mountedRef.current ||
          requestSequenceRef.current !== currentRequestId
        ) {
          return;
        }

        settled = true;
        setData(result);
        setError(null);
        setStatus(STATUS_SUCCESS);
        setLastUpdated(new Date().toISOString());

        if (typeof callbacksRef.current.onSuccess === 'function') {
          try {
            callbacksRef.current.onSuccess(result);
          } catch {
            // Consumer callbacks must not change the request outcome.
          }
        }
      })
      .catch((requestError) => {
        if (
          settled ||
          !mountedRef.current ||
          requestSequenceRef.current !== currentRequestId
        ) {
          return;
        }

        settled = true;
        const normalizedError = normalizeError(requestError);
        setError(normalizedError);
        setStatus(STATUS_ERROR);

        if (typeof callbacksRef.current.onError === 'function') {
          try {
            callbacksRef.current.onError(normalizedError);
          } catch {
            // Consumer callbacks must not change the request outcome.
          }
        }
      });

    return () => {
      settled = true;

      if (controller && !controller.signal.aborted) {
        controller.abort();
      }

      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    };
  }, [enabled, reloadKey, retryKey, ...dependencies]);

  const retry = useCallback(() => {
    setRetryKey((currentValue) => currentValue + 1);
  }, []);

  const refetch = useCallback(() => {
    setRetryKey((currentValue) => currentValue + 1);
  }, []);

  const reset = useCallback(() => {
    requestSequenceRef.current += 1;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setData(initialDataRef.current);
    setError(null);
    setStatus(STATUS_IDLE);
    setLastUpdated(null);
    setRequestId(0);
  }, []);

  return useMemo(
    () => ({
      data,
      error,
      status,
      isIdle: status === STATUS_IDLE,
      isLoading: status === STATUS_LOADING,
      isSuccess: status === STATUS_SUCCESS,
      isError: status === STATUS_ERROR,
      hasData: data !== undefined && data !== null,
      lastUpdated,
      requestId,
      retry,
      refetch,
      reset,
    }),
    [data, error, lastUpdated, refetch, requestId, reset, retry, status],
  );
}

export default useDomainData;