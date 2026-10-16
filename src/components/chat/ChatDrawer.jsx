import React, { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { chatService } from '../../services/chatService.js';
import { useChatContext } from '../../state/ChatProvider.jsx';

const TOPICS = Object.freeze([
  'Accounts',
  'Transfers',
  'Transactions',
  'Payments',
  'Security',
]);

function getMessageKey(message, index) {
  return message?.id || `chat-drawer-message-${index}`;
}

function getPersonaId(context) {
  return (
    context.personaId ||
    context.persona?.id ||
    context.persona?.userId ||
    context.state?.persona?.id ||
    context.state?.session?.userId ||
    ''
  );
}

/**
 * Renders the authenticated scripted support chat drawer.
 *
 * @param {{
 *   open?: boolean,
 *   isOpen?: boolean,
 *   authenticated?: boolean,
 *   onClose?: Function,
 *   onMinimize?: Function,
 *   onRestore?: Function,
 *   onEscalate?: Function,
 *   className?: string
 * }} props
 * @returns {JSX.Element|null}
 */
function ChatDrawer({
  open,
  isOpen,
  authenticated,
  onClose,
  onMinimize,
  onRestore,
  onEscalate,
  className,
}) {
  const chat = useChatContext();
  const inputId = useId();
  const inputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [escalationMessage, setEscalationMessage] = useState('');

  const contextSession = chat.state?.session || {};
  const personaId = getPersonaId(chat);
  const isAuthenticated =
    authenticated !== undefined
      ? authenticated
      : contextSession.isAuthenticated === true ||
        Boolean(personaId || contextSession.token || contextSession.userId);
  const requestedOpen =
    open !== undefined ? open : isOpen !== undefined ? isOpen : chat.isOpen;
  const visible = isAuthenticated && requestedOpen;

  if (!visible) {
    return null;
  }

  const messages = Array.isArray(chat.messages) ? chat.messages : [];
  const isLoading = chat.isLoading === true;
  const hasMessage = Boolean(message.trim());
  const conversationId = chat.conversationId || undefined;

  const handleClose = () => {
    setIsMinimized(false);
    onClose?.();

    if (typeof onClose !== 'function') {
      chat.closeChat?.();
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    onMinimize?.();
  };

  const handleRestore = () => {
    setIsMinimized(false);
    onRestore?.();
    inputRef.current?.focus();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedMessage = message.trim();

    if (!normalizedMessage || isLoading) {
      return;
    }

    try {
      const result = chat.sendMessage(normalizedMessage);

      if (result?.success !== false) {
        setMessage('');
      }
    } catch {
      // The chat context exposes the request error state.
    }
  };

  const handleTopicClick = (topic) => {
    if (isLoading) {
      return;
    }

    try {
      chat.sendTopicMessage(topic);
    } catch {
      // The chat context exposes the request error state.
    }
  };

  const handleEscalate = () => {
    setEscalationMessage('');

    try {
      const result = chatService.requestEscalation(
        personaId,
        conversationId,
        'Customer requested simulated support escalation.',
      );

      if (result?.success === false) {
        setEscalationMessage(
          result.error?.message ||
            'The simulated escalation could not be completed.',
        );
        return;
      }

      setEscalationMessage(
        'This conversation was escalated locally to simulated support. No real bank or support team was contacted.',
      );
      onEscalate?.(result);
    } catch {
      setEscalationMessage(
        'The simulated escalation could not be completed right now.',
      );
    }
  };

  return (
    <aside
      aria-label="Nova Support chat"
      className={[
        'fixed bottom-4 right-4 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-card border border-nova-slate/20 bg-white shadow-elevated',
        isMinimized ? 'h-auto' : 'h-[min(560px,calc(100vh-2rem))]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="chat-drawer"
      role="dialog"
    >
      <header className="flex items-center justify-between gap-3 bg-nova-midnight px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate font-bold">Nova Support</p>
          {!isMinimized && (
            <p className="text-xs text-nova-sky">Synthetic chat assistance</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isMinimized ? (
            <button
              type="button"
              onClick={handleRestore}
              aria-label="Restore support chat"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-nova-blue/40"
            >
              <span aria-hidden="true">□</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMinimize}
              aria-label="Minimize support chat"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-nova-blue/40"
            >
              <span aria-hidden="true">−</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close support chat"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl leading-none text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-nova-blue/40"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </header>

      {!isMinimized && (
        <div className="flex h-[calc(100%-4.5rem)] min-h-0 flex-col">
          <div
            aria-live="polite"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
            data-testid="chat-drawer-messages"
          >
            {messages.length > 0 ? (
              messages.map((item, index) => (
                <div
                  key={getMessageKey(item, index)}
                  className={[
                    'max-w-[90%] rounded-xl px-3 py-2.5 text-sm',
                    item.role === 'user'
                      ? 'ml-auto bg-nova-navy text-white'
                      : item.role === 'system'
                        ? 'mx-auto bg-nova-sky text-nova-slate'
                        : 'bg-nova-cream text-nova-ink',
                  ].join(' ')}
                >
                  {item.content}
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-nova-sky/60 p-3 text-sm text-nova-ink">
                <p className="font-semibold text-nova-midnight">
                  Welcome to Nova Support
                </p>
                <p className="mt-1">
                  Ask about accounts, transfers, transactions, payments, or
                  security. Responses are simulated locally.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-nova-slate/20 bg-white px-4 py-3">
            {chat.error && (
              <p
                role="alert"
                className="rounded-lg border border-nova-coral/40 bg-nova-coral/10 px-3 py-2 text-xs text-nova-midnight"
              >
                {chat.error.message || 'The chat request could not be completed.'}
              </p>
            )}

            {escalationMessage && (
              <p
                role="status"
                className="rounded-lg border border-nova-teal/30 bg-nova-mint px-3 py-2 text-xs text-nova-ink"
              >
                {escalationMessage}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicClick(topic)}
                  disabled={isLoading}
                  className="rounded-full border border-nova-navy/30 px-2.5 py-1 text-xs font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {topic}
                </button>
              ))}
            </div>

            <form
              aria-label="Send support chat message"
              className="flex items-end gap-2"
              onSubmit={handleSubmit}
            >
              <label htmlFor={inputId} className="sr-only">
                Message Nova Support
              </label>
              <textarea
                ref={inputRef}
                id={inputId}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={isLoading}
                placeholder="Type a message"
                rows={2}
                className="min-h-11 min-w-0 flex-1 resize-none rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20 disabled:cursor-not-allowed disabled:bg-nova-cream"
              />
              <button
                type="submit"
                disabled={isLoading || !hasMessage}
                className="min-h-11 rounded-lg bg-nova-navy px-3 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Sending' : 'Send'}
              </button>
            </form>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] leading-4 text-nova-slate">
                Synthetic conversation only. No real support team receives
                these messages.
              </p>
              <button
                type="button"
                onClick={handleEscalate}
                disabled={isLoading || !personaId}
                className="shrink-0 text-xs font-semibold text-nova-blue underline-offset-2 transition hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Escalate
              </button>
            </div>

            <p className="rounded-lg bg-nova-sky/60 px-3 py-2 text-[11px] leading-4 text-nova-slate">
              Never share real passwords, account numbers, verification codes,
              or other sensitive information in this demo.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

ChatDrawer.propTypes = {
  open: PropTypes.bool,
  isOpen: PropTypes.bool,
  authenticated: PropTypes.bool,
  onClose: PropTypes.func,
  onMinimize: PropTypes.func,
  onRestore: PropTypes.func,
  onEscalate: PropTypes.func,
  className: PropTypes.string,
};

ChatDrawer.defaultProps = {
  open: undefined,
  isOpen: undefined,
  authenticated: undefined,
  onClose: undefined,
  onMinimize: undefined,
  onRestore: undefined,
  onEscalate: undefined,
  className: '',
};

export { ChatDrawer };
export default ChatDrawer;