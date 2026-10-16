import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { STORAGE_KEYS } from '../config/constants.js';
import { appReducer, initialState, APP_ACTION_TYPES } from './appReducer.js';
import { appSelectors } from './appSelectors.js';
import authService from '../services/authService.js';
import resilienceService from '../services/resilienceService.js';
import sessionManager from '../services/sessionManager.js';
import storageService from '../services/storageService.js';
import chatService from '../services/chatService.js';
import notificationService from '../services/notificationService.js';
import supportService from '../services/supportService.js';

const AppContext = createContext(null);

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

function getPersistedState() {
  const storedValue = storageService.getStorageItem(STORAGE_KEYS.onboarding, {});
  return isObject(storedValue) && isObject(storedValue.appState)
    ? storedValue.appState
    : null;
}

function getSessionState(session) {
  if (!isObject(session)) {
    return {
      isAuthenticated: false,
      status: 'signed-out',
    };
  }

  return {
    isAuthenticated: true,
    status: 'active',
    token: session.token || null,
    refreshToken: session.refreshToken || null,
    userId: session.userId || null,
    createdAt: session.createdAt || null,
    expiresAt: session.expiresAt || null,
    refreshExpiresAt: session.refreshExpiresAt || null,
  };
}

function getInitialState() {
  const persistedState = getPersistedState();
  const session = authService.getCurrentSession();
  const persona = authService.getActivePersona();

  return {
    ...initialState,
    ...(isObject(persistedState) ? cloneValue(persistedState) : {}),
    session: {
      ...initialState.session,
      ...(isObject(persistedState?.session) ? persistedState.session : {}),
      ...getSessionState(session),
    },
    persona: persona || persistedState?.persona || null,
    chat: {
      ...initialState.chat,
      ...(isObject(persistedState?.chat) ? persistedState.chat : {}),
      messages: Array.isArray(persistedState?.chat?.messages)
        ? persistedState.chat.messages
        : [],
    },
    support: {
      ...initialState.support,
      ...(isObject(persistedState?.support) ? persistedState.support : {}),
      requests: Array.isArray(persistedState?.support?.requests)
        ? persistedState.support.requests
        : [],
    },
  };
}

function createSessionAction(snapshot) {
  if (!snapshot) {
    return {
      type: APP_ACTION_TYPES.SESSION_CLEARED,
    };
  }

  if (snapshot.status === 'expired') {
    return {
      type: APP_ACTION_TYPES.SESSION_EXPIRED,
      payload: {
        session: {
          ...snapshot,
          status: 'expired',
          isAuthenticated: false,
        },
      },
    };
  }

  return {
    type:
      snapshot.status === 'active'
        ? APP_ACTION_TYPES.SESSION_UPDATED
        : APP_ACTION_TYPES.SESSION_SET,
    payload: {
      session: {
        ...snapshot,
        isAuthenticated: authService.isAuthenticated(),
        status: snapshot.status,
      },
    },
  };
}

/**
 * Provides application state, persistence, session lifecycle handling, and
 * application actions to descendant components.
 *
 * @param {{children: React.ReactNode, initialState?: Object}} props
 * @returns {JSX.Element}
 */
export function AppProvider({ children, initialState: providedInitialState }) {
  const [state, dispatch] = useReducer(
    appReducer,
    providedInitialState || getInitialState(),
  );
  const hydratedRef = useRef(false);

  useEffect(() => {
    const persistedState = getPersistedState();

    if (persistedState) {
      dispatch({
        type: APP_ACTION_TYPES.STATE_HYDRATED,
        payload: {
          state: persistedState,
        },
      });
    }

    const session = authService.getCurrentSession();
    const persona = authService.getActivePersona();

    if (session) {
      dispatch({
        type: APP_ACTION_TYPES.SESSION_SET,
        payload: {
          session: getSessionState(session),
          persona,
        },
      });
    }

    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      return undefined;
    }

    const existingValue = storageService.getStorageItem(
      STORAGE_KEYS.onboarding,
      {},
    );

    storageService.setStorageItem(STORAGE_KEYS.onboarding, {
      ...(isObject(existingValue) ? existingValue : {}),
      appState: {
        persona: state.persona,
        facilitator: state.facilitator,
        chat: state.chat,
        support: state.support,
        toast: state.toast,
        demo: state.demo,
      },
    });

    return undefined;
  }, [
    state.persona,
    state.facilitator,
    state.chat,
    state.support,
    state.toast,
    state.demo,
  ]);

  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((snapshot) => {
      dispatch(createSessionAction(snapshot));

      if (snapshot?.status === 'expired') {
        authService.logout();
      }
    });

    const session = authService.getCurrentSession();

    if (session) {
      sessionManager.start({
        sessionId: session.userId,
        lastActivityAt: session.createdAt,
      });
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleActivity = () => {
      const snapshot = sessionManager.recordActivity('browser-activity');

      if (snapshot) {
        dispatch(createSessionAction(snapshot));
      }
    };

    const activityEvents = [
      'click',
      'keydown',
      'pointerdown',
      'scroll',
      'touchstart',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, []);

  const login = useCallback((userIdOrCredentials, password, options) => {
    const result = authService.login(userIdOrCredentials, password, options);

    if (result.success) {
      const session = result.data?.session;
      const persona = result.data?.user || authService.getActivePersona();

      dispatch({
        type: APP_ACTION_TYPES.SESSION_STARTED,
        payload: {
          session: getSessionState(session),
          persona,
        },
      });

      sessionManager.start({
        sessionId: session?.userId,
        lastActivityAt: session?.createdAt,
      });
    }

    return result;
  }, []);

  const logout = useCallback(() => {
    const result = authService.logout();

    if (result.success) {
      sessionManager.clear();
      dispatch({
        type: APP_ACTION_TYPES.SESSION_ENDED,
      });
    }

    return result;
  }, []);

  const continueSession = useCallback(() => {
    const snapshot = sessionManager.continueSession();

    if (snapshot) {
      dispatch(createSessionAction(snapshot));
    }

    return snapshot;
  }, []);

  const recordActivity = useCallback((signal = 'activity') => {
    const snapshot = sessionManager.recordActivity(signal);

    if (snapshot) {
      dispatch(createSessionAction(snapshot));
    }

    return snapshot;
  }, []);

  const resetDemo = useCallback(() => {
    const storageReset = storageService.resetStorage();

    chatService.clearConversations();
    notificationService.clearNotificationState();
    supportService.clearContactEnquiries();
    resilienceService.resetResilience();
    sessionManager.clear();
    authService.logout();

    dispatch({
      type: APP_ACTION_TYPES.RESET_DEMO,
      payload: {
        timestamp: new Date().toISOString(),
      },
    });

    return storageReset;
  }, []);

  const clearPersistedState = useCallback(() => {
    const storedValue = storageService.getStorageItem(
      STORAGE_KEYS.onboarding,
      {},
    );

    return storageService.setStorageItem(STORAGE_KEYS.onboarding, {
      ...(isObject(storedValue) ? storedValue : {}),
      appState: null,
    });
  }, []);

  const actions = useMemo(
    () => ({
      login,
      logout,
      continueSession,
      recordActivity,
      resetDemo,
      clearPersistedState,
      startSession: (session) => {
        const snapshot = sessionManager.start(session);
        dispatch({
          type: APP_ACTION_TYPES.SESSION_STARTED,
          payload: {
            session: {
              ...snapshot,
              isAuthenticated: authService.isAuthenticated(),
            },
            persona: authService.getActivePersona(),
          },
        });
        return snapshot;
      },
      expireSession: () => {
        const snapshot = sessionManager.forceExpire();
        dispatch(createSessionAction(snapshot));
        return snapshot;
      },
      openChat: () =>
        dispatch({
          type: APP_ACTION_TYPES.CHAT_OPENED,
        }),
      closeChat: () =>
        dispatch({
          type: APP_ACTION_TYPES.CHAT_CLOSED,
        }),
      sendChatMessage: (personaOrId, message, conversationId) =>
        chatService.sendMessage(personaOrId, message, conversationId),
      markNotificationRead: (personaOrId, notificationId) =>
        notificationService.markNotificationRead(personaOrId, notificationId),
      submitSupportRequest: (request) => {
        const result = supportService.submitContactEnquiry(request);

        dispatch({
          type: result.success
            ? APP_ACTION_TYPES.SUPPORT_REQUEST_SUBMITTED
            : APP_ACTION_TYPES.SUPPORT_REQUEST_FAILED,
          payload: result.success
            ? { request: result.data }
            : { error: result.error },
        });

        return result;
      },
    }),
    [clearPersistedState, continueSession, login, logout, recordActivity, resetDemo],
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      actions,
      ...appSelectors,
      session: state.session,
      persona: state.persona,
      facilitator: state.facilitator,
      chat: state.chat,
      support: state.support,
      toast: state.toast,
      demo: state.demo,
    }),
    [actions, state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialState: PropTypes.object,
};

/**
 * Returns the complete application context.
 *
 * @returns {Object}
 */
export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider.');
  }

  return context;
}

/**
 * Returns application state and dispatch.
 *
 * @returns {{state: Object, dispatch: Function}}
 */
export function useAppState() {
  const { state, dispatch } = useAppContext();
  return { state, dispatch };
}

/**
 * Returns the application dispatch function.
 *
 * @returns {Function}
 */
export function useAppDispatch() {
  return useAppContext().dispatch;
}

/**
 * Returns application action helpers.
 *
 * @returns {Object}
 */
export function useAppActions() {
  return useAppContext().actions;
}

export default AppProvider;