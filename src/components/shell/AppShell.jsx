import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Drawer } from '../shared/Drawer.jsx';
import { SessionWarning } from './SessionWarning.jsx';
import { Header } from './Header.jsx';
import { ToastProvider } from '../shared/ToastProvider.jsx';
import { useChatContext } from '../../state/ChatProvider.jsx';

function ChatDrawer() {
  const {
    messages,
    isOpen,
    isLoading,
    error,
    closeChat,
    sendMessage,
    sendTopicMessage,
  } = useChatContext();
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedMessage = message.trim();

    if (!normalizedMessage || isLoading) {
      return;
    }

    try {
      const result = sendMessage(normalizedMessage);

      if (result?.success !== false) {
        setMessage('');
      }
    } catch {
      // The chat provider exposes the request error state.
    }
  };

  const handleTopicClick = (topic) => {
    if (isLoading) {
      return;
    }

    try {
      sendTopicMessage(topic);
    } catch {
      // The chat provider exposes the request error state.
    }
  };

  return (
    <Drawer
      open={isOpen}
      onClose={closeChat}
      title="Nova Support"
      closeLabel="Close support chat"
      placement="right"
      initialFocusRef={inputRef}
      contentClassName="max-w-[min(100%,28rem)]"
    >
      <div className="flex min-h-full flex-col">
        <div
          aria-live="polite"
          className="min-h-0 flex-1 space-y-3"
          data-testid="chat-messages"
        >
          {messages.length > 0 ? (
            messages.map((item, index) => (
              <div
                key={item.id || `chat-message-${index}`}
                className={[
                  'max-w-[90%] rounded-xl px-4 py-3 text-sm',
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
            <div className="rounded-xl bg-nova-sky/60 p-4 text-sm text-nova-ink">
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

        <div className="mt-6 space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-nova-coral/40 bg-nova-coral/10 px-3 py-2 text-sm text-nova-midnight"
            >
              {error.message || 'The chat request could not be completed.'}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {['Accounts', 'Transfers', 'Transactions', 'Security'].map(
              (topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicClick(topic)}
                  disabled={isLoading}
                  className="rounded-full border border-nova-navy/30 px-3 py-1.5 text-xs font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {topic}
                </button>
              ),
            )}
          </div>

          <form
            aria-label="Send support chat message"
            onSubmit={handleSubmit}
            className="flex items-end gap-2"
          >
            <label htmlFor="support-chat-message" className="sr-only">
              Message Nova Support
            </label>
            <textarea
              ref={inputRef}
              id="support-chat-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a message"
              rows={2}
              disabled={isLoading}
              className="min-h-11 min-w-0 flex-1 resize-none rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20 disabled:cursor-not-allowed disabled:bg-nova-cream"
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="min-h-11 rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Sending' : 'Send'}
            </button>
          </form>

          <p className="text-xs text-nova-slate">
            This is a synthetic support conversation. No real bank or support
            team receives these messages.
          </p>
        </div>
      </div>
    </Drawer>
  );
}

ChatDrawer.propTypes = {};

function AppShell({
  children,
  className = '',
  mainClassName = '',
  headerProps = {},
}) {
  const { openChat } = useChatContext();

  return (
    <ToastProvider>
      <div
        className={['app-shell', className].filter(Boolean).join(' ')}
        data-testid="app-shell"
      >
        <div className="app-layout">
          <Header
            {...headerProps}
            onOpenChat={openChat}
          />

          <main
            id="main-content"
            className={[
              'app-main w-full',
              mainClassName,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {children}
          </main>

          <footer className="mt-auto border-t-4 border-[#DCB91C] bg-white">
            <div className="mx-auto flex w-full max-w-[1280px] px-4 py-4 sm:px-6 lg:px-8">
              <p className="font-extrabold tracking-[0.14em] text-nova-navy">
                NOVA BANK
              </p>
            </div>
          </footer>
        </div>

        <SessionWarning />
        <ChatDrawer />
      </div>
    </ToastProvider>
  );
}

AppShell.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  mainClassName: PropTypes.string,
  headerProps: PropTypes.object,
};

export { AppShell, ChatDrawer };
export default AppShell;
