import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import chatService from '../services/chatService.js';
import { APP_ACTION_TYPES } from './appReducer.js';
import { useAppContext } from './AppProvider.jsx';

const ChatContext = createContext(null);

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPersonaId(persona, session) {
  return persona?.id || persona?.userId || session?.userId || undefined;
}

function getChatError(error, fallback = 'The chat request could not be completed.') {
  if (isObject(error)) {
    return {
      code: error.code || 'CHAT_REQUEST_FAILED',
      message: error.message || fallback,
      ...(error.details ? { details: error.details } : {}),
    };
  }

  return {
    code: 'CHAT_REQUEST_FAILED',
    message: fallback,
  };
}

/**
 * Provides persona-scoped chat state and local chat actions.
 *
 * @param {{children: React.ReactNode}} props
 * @returns {JSX.Element}
 */
export function ChatProvider({ children }) {
  const { state, dispatch } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const chat = isObject(state.chat) ? state.chat : {};
  const session = isObject(state.session) ? state.session : {};
  const persona = isObject(state.persona) ? state.persona : null;
  const isAuthenticated =
    session.isAuthenticated === true ||
    Boolean(session.token || session.userId);
  const personaId = getPersonaId(persona, session);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    setIsLoading(false);
    setError(null);
    setIsMinimized(false);

    dispatch({
      type: APP_ACTION_TYPES.CHAT_RESET,
    });
  }, [dispatch, isAuthenticated]);

  const openChat = useCallback(() => {
    setError(null);
    setIsMinimized(false);
    dispatch({
      type: APP_ACTION_TYPES.CHAT_OPENED,
    });
  }, [dispatch]);

  const closeChat = useCallback(() => {
    dispatch({
      type: APP_ACTION_TYPES.CHAT_CLOSED,
    });
  }, [dispatch]);

  const toggleChat = useCallback(() => {
    if (chat.isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }, [chat.isOpen, closeChat, openChat]);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
    dispatch({
      type: APP_ACTION_TYPES.CHAT_OPENED,
    });
  }, [dispatch]);

  const maximizeChat = useCallback(() => {
    setIsMinimized(false);
    dispatch({
      type: APP_ACTION_TYPES.CHAT_OPENED,
    });
  }, [dispatch]);

  const clearChat = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setIsMinimized(false);
    dispatch({
      type: APP_ACTION_TYPES.CHAT_RESET,
    });
  }, [dispatch]);

  const applyConversation = useCallback(
    (conversation) => {
      if (!isObject(conversation)) {
        return;
      }

      dispatch({
        type: APP_ACTION_TYPES.CHAT_CONVERSATION_SET,
        payload: {
          conversation,
          conversationId: conversation.id || null,
          isOpen: true,
        },
      });

      dispatch({
        type: APP_ACTION_TYPES.CHAT_MESSAGES_SET,
        payload: {
          messages: Array.isArray(conversation.messages)
            ? conversation.messages
            : [],
        },
      });
    },
    [dispatch],
  );

  const dispatchMessage = useCallback(
    (operation) => {
      if (isLoading) {
        return {
          success: false,
          error: {
            code: 'CHAT_REQUEST_IN_PROGRESS',
            message: 'Please wait for the current chat request to finish.',
          },
        };
      }

      if (!personaId) {
        const requestError = {
          code: 'PERSONA_NOT_FOUND',
          message: 'A signed-in demo persona is required to use chat.',
        };
        setError(requestError);
        return {
          success: false,
          error: requestError,
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = operation(personaId, chat.conversationId);

        if (!result || result.success !== true) {
          const requestError = getChatError(result?.error);
          setError(requestError);
          return {
            success: false,
            error: requestError,
          };
        }

        const conversation = result.data?.conversation || result.data;

        if (isObject(conversation)) {
          applyConversation(conversation);
        } else {
          openChat();
        }

        return result;
      } catch (requestError) {
        const normalizedError = getChatError(requestError);
        setError(normalizedError);

        return {
          success: false,
          error: normalizedError,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [
      applyConversation,
      chat.conversationId,
      isLoading,
      openChat,
      personaId,
    ],
  );

  const sendMessage = useCallback(
    (message) => {
      return dispatchMessage((activePersonaId, conversationId) =>
        chatService.sendMessage(
          activePersonaId,
          message,
          conversationId || undefined,
        ),
      );
    },
    [dispatchMessage],
  );

  const sendChatMessage = useCallback(
    (message) => sendMessage(message),
    [sendMessage],
  );

  const sendTopicMessage = useCallback(
    (topic) => {
      return dispatchMessage((activePersonaId, conversationId) =>
        chatService.sendTopicMessage(
          activePersonaId,
          topic,
          conversationId || undefined,
        ),
      );
    },
    [dispatchMessage],
  );

  const startConversation = useCallback(() => {
    if (!personaId) {
      const requestError = {
        code: 'PERSONA_NOT_FOUND',
        message: 'A signed-in demo persona is required to start chat.',
      };
      setError(requestError);
      return {
        success: false,
        error: requestError,
      };
    }

    try {
      const result = chatService.createConversation(personaId);

      if (!result || result.success !== true) {
        const requestError = getChatError(result?.error);
        setError(requestError);
        return {
          success: false,
          error: requestError,
        };
      }

      applyConversation(result.data);
      setError(null);
      return result;
    } catch (requestError) {
      const normalizedError = getChatError(requestError);
      setError(normalizedError);

      return {
        success: false,
        error: normalizedError,
      };
    }
  }, [applyConversation, personaId]);

  const endConversation = useCallback(() => {
    if (!personaId) {
      return {
        success: false,
        error: {
          code: 'PERSONA_NOT_FOUND',
          message: 'A signed-in demo persona is required to end chat.',
        },
      };
    }

    try {
      const result = chatService.endConversation(
        personaId,
        chat.conversationId || undefined,
      );

      if (!result || result.success !== true) {
        const requestError = getChatError(result?.error);
        setError(requestError);
        return {
          success: false,
          error: requestError,
        };
      }

      if (isObject(result.data)) {
        applyConversation(result.data);
      }

      return result;
    } catch (requestError) {
      const normalizedError = getChatError(requestError);
      setError(normalizedError);

      return {
        success: false,
        error: normalizedError,
      };
    }
  }, [applyConversation, chat.conversationId, personaId]);

  const value = useMemo(
    () => ({
      state: chat,
      chat,
      persona,
      personaId,
      conversationId: chat.conversationId || null,
      messages: Array.isArray(chat.messages) ? chat.messages : [],
      status: chat.status || 'idle',
      isOpen: chat.isOpen === true,
      isMinimized,
      isLoading,
      error,
      openChat,
      closeChat,
      toggleChat,
      minimizeChat,
      maximizeChat,
      clearChat,
      resetChat: clearChat,
      startConversation,
      sendMessage,
      sendChatMessage,
      sendTopicMessage,
      endConversation,
    }),
    [
      chat,
      clearChat,
      closeChat,
      endConversation,
      error,
      isLoading,
      isMinimized,
      maximizeChat,
      minimizeChat,
      openChat,
      persona,
      personaId,
      sendChatMessage,
      sendMessage,
      sendTopicMessage,
      startConversation,
      toggleChat,
    ],
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Returns chat state and actions.
 *
 * @returns {Object}
 */
export function useChatContext() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider.');
  }

  return context;
}

/**
 * Alias for useChatContext.
 *
 * @returns {Object}
 */
export function useChat() {
  return useChatContext();
}

/**
 * Returns chat actions when the provider is mounted.
 *
 * @returns {Object|null}
 */
export function useOptionalChat() {
  return useContext(ChatContext);
}

export default ChatProvider;