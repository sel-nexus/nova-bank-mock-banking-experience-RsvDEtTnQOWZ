const ACTION_TYPES = Object.freeze({
  SESSION_STARTED: 'SESSION_STARTED',
  SESSION_SET: 'SESSION_SET',
  SESSION_UPDATED: 'SESSION_UPDATED',
  SESSION_ENDED: 'SESSION_ENDED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_CLEARED: 'SESSION_CLEARED',

  PERSONA_SET: 'PERSONA_SET',
  PERSONA_UPDATED: 'PERSONA_UPDATED',
  PERSONA_CLEARED: 'PERSONA_CLEARED',

  FACILITATOR_SET: 'FACILITATOR_SET',
  FACILITATOR_UPDATED: 'FACILITATOR_UPDATED',
  FACILITATOR_OPENED: 'FACILITATOR_OPENED',
  FACILITATOR_CLOSED: 'FACILITATOR_CLOSED',
  FACILITATOR_ERROR_MODE_SET: 'FACILITATOR_ERROR_MODE_SET',
  FACILITATOR_RESET: 'FACILITATOR_RESET',

  CHAT_OPENED: 'CHAT_OPENED',
  CHAT_CLOSED: 'CHAT_CLOSED',
  CHAT_STARTED: 'CHAT_STARTED',
  CHAT_MESSAGE_ADDED: 'CHAT_MESSAGE_ADDED',
  CHAT_MESSAGES_SET: 'CHAT_MESSAGES_SET',
  CHAT_STATUS_SET: 'CHAT_STATUS_SET',
  CHAT_CONVERSATION_SET: 'CHAT_CONVERSATION_SET',
  CHAT_RESET: 'CHAT_RESET',

  SUPPORT_REQUEST_STARTED: 'SUPPORT_REQUEST_STARTED',
  SUPPORT_REQUEST_SUBMITTED: 'SUPPORT_REQUEST_SUBMITTED',
  SUPPORT_REQUEST_FAILED: 'SUPPORT_REQUEST_FAILED',
  SUPPORT_REQUESTS_SET: 'SUPPORT_REQUESTS_SET',
  SUPPORT_REQUEST_SET: 'SUPPORT_REQUEST_SET',
  SUPPORT_RESET: 'SUPPORT_RESET',

  TOAST_SHOWN: 'TOAST_SHOWN',
  TOAST_SET: 'TOAST_SET',
  TOAST_HIDDEN: 'TOAST_HIDDEN',
  TOAST_CLEARED: 'TOAST_CLEARED',

  DEMO_TRANSITION_STARTED: 'DEMO_TRANSITION_STARTED',
  DEMO_TRANSITION_COMPLETED: 'DEMO_TRANSITION_COMPLETED',
  DEMO_TRANSITION_FAILED: 'DEMO_TRANSITION_FAILED',
  DEMO_TRANSITION_RESET: 'DEMO_TRANSITION_RESET',

  STATE_HYDRATED: 'STATE_HYDRATED',
  RESET_DEMO: 'RESET_DEMO',
  RESET_STATE: 'RESET_STATE',
});

const DEFAULT_SESSION = Object.freeze({
  isAuthenticated: false,
  status: 'signed-out',
  token: null,
  refreshToken: null,
  userId: null,
  createdAt: null,
  expiresAt: null,
  refreshExpiresAt: null,
});

const DEFAULT_FACILITATOR = Object.freeze({
  isOpen: false,
  status: 'idle',
  errorMode: 'disabled',
  isLoading: false,
  error: null,
  lastAction: null,
});

const DEFAULT_CHAT = Object.freeze({
  isOpen: false,
  status: 'idle',
  conversationId: null,
  messages: [],
  error: null,
});

const DEFAULT_SUPPORT = Object.freeze({
  status: 'idle',
  requests: [],
  activeRequest: null,
  error: null,
});

const DEFAULT_DEMO = Object.freeze({
  status: 'idle',
  transition: null,
  error: null,
  lastResetAt: null,
});

export const initialState = Object.freeze({
  session: DEFAULT_SESSION,
  persona: null,
  facilitator: DEFAULT_FACILITATOR,
  chat: DEFAULT_CHAT,
  support: DEFAULT_SUPPORT,
  toast: null,
  demo: DEFAULT_DEMO,
});

export const APP_ACTION_TYPES = ACTION_TYPES;

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPayload(action) {
  return isObject(action?.payload) ? action.payload : {};
}

function getValue(action, key, fallback = undefined) {
  const payload = getPayload(action);

  if (Object.prototype.hasOwnProperty.call(payload, key)) {
    return payload[key];
  }

  if (Object.prototype.hasOwnProperty.call(action || {}, key)) {
    return action[key];
  }

  return fallback;
}

function createInitialState() {
  return {
    session: { ...DEFAULT_SESSION },
    persona: null,
    facilitator: { ...DEFAULT_FACILITATOR },
    chat: { ...DEFAULT_CHAT, messages: [] },
    support: { ...DEFAULT_SUPPORT, requests: [] },
    toast: null,
    demo: { ...DEFAULT_DEMO },
  };
}

function getSessionData(action) {
  const payload = getPayload(action);
  const session =
    isObject(payload.session) ? payload.session : isObject(action?.session) ? action.session : payload;

  return {
    ...DEFAULT_SESSION,
    ...session,
    isAuthenticated:
      session.isAuthenticated === undefined
        ? Boolean(session.token || session.userId)
        : session.isAuthenticated,
    status:
      session.status ||
      (session.isAuthenticated || session.token ? 'active' : 'signed-out'),
  };
}

function getMessage(action) {
  const payload = getPayload(action);

  if (isObject(payload.message)) {
    return payload.message;
  }

  if (isObject(action?.message)) {
    return action.message;
  }

  if (typeof payload.message === 'string') {
    return {
      id: payload.id || `chat-message-${Date.now()}`,
      role: payload.role || 'user',
      content: payload.message,
      createdAt: payload.createdAt || null,
    };
  }

  if (typeof action?.message === 'string') {
    return {
      id: action.id || `chat-message-${Date.now()}`,
      role: action.role || 'user',
      content: action.message,
      createdAt: action.createdAt || null,
    };
  }

  return null;
}

function getToast(action) {
  const payload = getPayload(action);

  if (isObject(payload.toast)) {
    return payload.toast;
  }

  if (isObject(action?.toast)) {
    return action.toast;
  }

  if (typeof payload.message === 'string' || typeof action?.message === 'string') {
    return {
      id: payload.id || action.id || `toast-${Date.now()}`,
      message: payload.message || action.message,
      type: payload.type || action.typeName || 'info',
      duration: payload.duration ?? action.duration ?? 4000,
    };
  }

  return null;
}

function resetState() {
  return createInitialState();
}

export function appReducer(state = initialState, action = {}) {
  if (!action || typeof action.type !== 'string') {
    return state;
  }

  switch (action.type) {
    case ACTION_TYPES.SESSION_STARTED:
    case ACTION_TYPES.SESSION_SET:
    case ACTION_TYPES.SESSION_UPDATED: {
      const session = getSessionData(action);

      return {
        ...state,
        session,
        persona:
          getValue(action, 'persona', undefined) !== undefined
            ? getValue(action, 'persona')
            : state.persona,
      };
    }

    case ACTION_TYPES.SESSION_ENDED:
    case ACTION_TYPES.SESSION_EXPIRED:
    case ACTION_TYPES.SESSION_CLEARED:
      return {
        ...state,
        session: {
          ...DEFAULT_SESSION,
          status: action.type === ACTION_TYPES.SESSION_EXPIRED ? 'expired' : 'signed-out',
        },
        persona: null,
        chat: {
          ...state.chat,
          isOpen: false,
          status: 'idle',
          conversationId: null,
          messages: [],
          error: null,
        },
      };

    case ACTION_TYPES.PERSONA_SET:
      return {
        ...state,
        persona:
          getValue(action, 'persona', undefined) !== undefined
            ? getValue(action, 'persona')
            : getPayload(action),
      };

    case ACTION_TYPES.PERSONA_UPDATED:
      return {
        ...state,
        persona: {
          ...(isObject(state.persona) ? state.persona : {}),
          ...getPayload(action),
        },
      };

    case ACTION_TYPES.PERSONA_CLEARED:
      return {
        ...state,
        persona: null,
      };

    case ACTION_TYPES.FACILITATOR_SET:
      return {
        ...state,
        facilitator: {
          ...DEFAULT_FACILITATOR,
          ...state.facilitator,
          ...(isObject(getValue(action, 'facilitator'))
            ? getValue(action, 'facilitator')
            : getPayload(action)),
        },
      };

    case ACTION_TYPES.FACILITATOR_UPDATED:
      return {
        ...state,
        facilitator: {
          ...state.facilitator,
          ...getPayload(action),
        },
      };

    case ACTION_TYPES.FACILITATOR_OPENED:
      return {
        ...state,
        facilitator: {
          ...state.facilitator,
          isOpen: true,
          status: 'active',
          error: null,
        },
      };

    case ACTION_TYPES.FACILITATOR_CLOSED:
      return {
        ...state,
        facilitator: {
          ...state.facilitator,
          isOpen: false,
          status: 'idle',
        },
      };

    case ACTION_TYPES.FACILITATOR_ERROR_MODE_SET:
      return {
        ...state,
        facilitator: {
          ...state.facilitator,
          errorMode:
            getValue(action, 'errorMode', getValue(action, 'mode', 'disabled')),
        },
      };

    case ACTION_TYPES.FACILITATOR_RESET:
      return {
        ...state,
        facilitator: { ...DEFAULT_FACILITATOR },
      };

    case ACTION_TYPES.CHAT_OPENED:
      return {
        ...state,
        chat: {
          ...state.chat,
          isOpen: true,
          error: null,
        },
      };

    case ACTION_TYPES.CHAT_CLOSED:
      return {
        ...state,
        chat: {
          ...state.chat,
          isOpen: false,
        },
      };

    case ACTION_TYPES.CHAT_STARTED:
    case ACTION_TYPES.CHAT_CONVERSATION_SET: {
      const conversation = getValue(action, 'conversation', null);

      return {
        ...state,
        chat: {
          ...state.chat,
          status: 'active',
          conversationId:
            getValue(action, 'conversationId', conversation?.id) ??
            state.chat.conversationId,
          ...(conversation ? conversation : {}),
          isOpen: getValue(action, 'isOpen', true),
          error: null,
        },
      };
    }

    case ACTION_TYPES.CHAT_MESSAGE_ADDED: {
      const message = getMessage(action);

      if (!message) {
        return state;
      }

      return {
        ...state,
        chat: {
          ...state.chat,
          status: 'active',
          messages: [...state.chat.messages, message],
          error: null,
        },
      };
    }

    case ACTION_TYPES.CHAT_MESSAGES_SET:
      return {
        ...state,
        chat: {
          ...state.chat,
          messages: Array.isArray(getValue(action, 'messages'))
            ? [...getValue(action, 'messages')]
            : [],
          error: null,
        },
      };

    case ACTION_TYPES.CHAT_STATUS_SET:
      return {
        ...state,
        chat: {
          ...state.chat,
          status: getValue(action, 'status', state.chat.status),
          error: getValue(action, 'error', null),
        },
      };

    case ACTION_TYPES.CHAT_RESET:
      return {
        ...state,
        chat: { ...DEFAULT_CHAT, messages: [] },
      };

    case ACTION_TYPES.SUPPORT_REQUEST_STARTED:
      return {
        ...state,
        support: {
          ...state.support,
          status: 'submitting',
          error: null,
        },
      };

    case ACTION_TYPES.SUPPORT_REQUEST_SUBMITTED: {
      const request = getValue(action, 'request', getPayload(action));

      return {
        ...state,
        support: {
          ...state.support,
          status: 'submitted',
          activeRequest: request,
          requests: request
            ? [...state.support.requests, request]
            : state.support.requests,
          error: null,
        },
      };
    }

    case ACTION_TYPES.SUPPORT_REQUEST_FAILED:
      return {
        ...state,
        support: {
          ...state.support,
          status: 'error',
          error: getValue(action, 'error', getPayload(action)),
        },
      };

    case ACTION_TYPES.SUPPORT_REQUESTS_SET:
      return {
        ...state,
        support: {
          ...state.support,
          status: 'ready',
          requests: Array.isArray(getValue(action, 'requests'))
            ? [...getValue(action, 'requests')]
            : [],
          error: null,
        },
      };

    case ACTION_TYPES.SUPPORT_REQUEST_SET:
      return {
        ...state,
        support: {
          ...state.support,
          activeRequest: getValue(action, 'request', null),
          error: null,
        },
      };

    case ACTION_TYPES.SUPPORT_RESET:
      return {
        ...state,
        support: { ...DEFAULT_SUPPORT, requests: [] },
      };

    case ACTION_TYPES.TOAST_SHOWN:
    case ACTION_TYPES.TOAST_SET: {
      const toast = getToast(action);

      return toast
        ? {
            ...state,
            toast,
          }
        : state;
    }

    case ACTION_TYPES.TOAST_HIDDEN:
    case ACTION_TYPES.TOAST_CLEARED:
      return {
        ...state,
        toast: null,
      };

    case ACTION_TYPES.DEMO_TRANSITION_STARTED:
      return {
        ...state,
        demo: {
          ...state.demo,
          status: 'pending',
          transition: getValue(action, 'transition', getValue(action, 'name', null)),
          error: null,
        },
      };

    case ACTION_TYPES.DEMO_TRANSITION_COMPLETED:
      return {
        ...state,
        demo: {
          ...state.demo,
          status: 'completed',
          transition: getValue(action, 'transition', state.demo.transition),
          error: null,
        },
      };

    case ACTION_TYPES.DEMO_TRANSITION_FAILED:
      return {
        ...state,
        demo: {
          ...state.demo,
          status: 'failed',
          error: getValue(action, 'error', getPayload(action)),
        },
      };

    case ACTION_TYPES.DEMO_TRANSITION_RESET:
      return {
        ...state,
        demo: { ...DEFAULT_DEMO },
      };

    case ACTION_TYPES.STATE_HYDRATED: {
      const hydratedState = getValue(action, 'state', getPayload(action));

      if (!isObject(hydratedState)) {
        return state;
      }

      return {
        ...state,
        ...hydratedState,
        session: {
          ...state.session,
          ...(isObject(hydratedState.session) ? hydratedState.session : {}),
        },
        facilitator: {
          ...state.facilitator,
          ...(isObject(hydratedState.facilitator)
            ? hydratedState.facilitator
            : {}),
        },
        chat: {
          ...state.chat,
          ...(isObject(hydratedState.chat) ? hydratedState.chat : {}),
          messages: Array.isArray(hydratedState.chat?.messages)
            ? hydratedState.chat.messages
            : state.chat.messages,
        },
        support: {
          ...state.support,
          ...(isObject(hydratedState.support) ? hydratedState.support : {}),
          requests: Array.isArray(hydratedState.support?.requests)
            ? hydratedState.support.requests
            : state.support.requests,
        },
      };
    }

    case ACTION_TYPES.RESET_DEMO:
    case ACTION_TYPES.RESET_STATE:
      return {
        ...resetState(),
        demo: {
          ...DEFAULT_DEMO,
          status: 'reset',
          lastResetAt: getValue(action, 'timestamp', null),
        },
      };

    default:
      return state;
  }
}

export default appReducer;