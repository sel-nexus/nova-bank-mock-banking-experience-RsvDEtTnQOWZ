import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChatDrawer from './ChatDrawer.jsx';
import { FIXTURES } from '../../fixtures/fixtures.js';
import { AppProvider } from '../../state/AppProvider.jsx';
import { ChatProvider } from '../../state/ChatProvider.jsx';
import { initialState } from '../../state/appReducer.js';
import chatService from '../../services/chatService.js';
import storageService from '../../services/storageService.js';

const PERSONA = FIXTURES.personas.find(
  (persona) => persona.id === 'user-miguel-santos',
);

function createInitialState() {
  return {
    ...initialState,
    session: {
      ...initialState.session,
      isAuthenticated: true,
      status: 'active',
      token: 'nova-demo-token',
      userId: PERSONA.id,
    },
    persona: PERSONA,
    chat: {
      ...initialState.chat,
      messages: [],
      isOpen: true,
    },
  };
}

function renderChat(props = {}) {
  return render(
    <MemoryRouter>
      <AppProvider initialState={createInitialState()}>
        <ChatProvider>
          <ChatDrawer
            open
            authenticated
            {...props}
          />
        </ChatProvider>
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('ChatDrawer', () => {
  beforeEach(() => {
    storageService.resetStorage();
    chatService.clearConversations();
  });

  afterEach(() => {
    cleanup();
    storageService.resetStorage();
    chatService.clearConversations();
    vi.restoreAllMocks();
  });

  it('renders topic chips and the privacy reminder for an authenticated persona', () => {
    renderChat();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accounts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transfers' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Transactions' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Payments' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Security' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Never share real passwords, account numbers, verification codes, or other sensitive information in this demo.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Synthetic conversation only. No real support team receives these messages.',
      ),
    ).toBeInTheDocument();
  });

  it('sends a topic chip and shows a persona-specific scripted response', async () => {
    const user = userEvent.setup();

    renderChat();

    await user.click(screen.getByRole('button', { name: 'Accounts' }));

    expect(
      (
        await screen.findAllByText(
          'I can help with your Nova Bank Demo accounts. You can review balances, account details, and masked account numbers from the Accounts area.',
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Welcome, Miguel\./)).toBeInTheDocument();
  });

  it('sends free text and displays the matching local assistant response', async () => {
    const user = userEvent.setup();

    renderChat();

    const messageInput = screen.getByRole('textbox', {
      name: 'Message Nova Support',
    });

    await user.type(messageInput, 'How can I transfer money?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      await screen.findByText(
        'To transfer money, open Transfers, choose the source and destination accounts, enter an amount, review the details, and confirm. Transfers in this demo are simulated locally.',
      ),
    ).toBeInTheDocument();
    expect(messageInput).toHaveValue('');
  });

  it('records a simulated escalation without contacting a real support team', async () => {
    const user = userEvent.setup();

    renderChat();

    await user.click(screen.getByRole('button', { name: 'Escalate' }));

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent(
      'This conversation was escalated locally to simulated support. No real bank or support team was contacted.',
    );
  });

  it('minimizes and restores the drawer while preserving the conversation', async () => {
    const user = userEvent.setup();

    renderChat();

    await user.type(
      screen.getByRole('textbox', { name: 'Message Nova Support' }),
      'Tell me about security.',
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      await screen.findByText(
        'For your security, use only synthetic information in this demo. Nova Bank Demo does not connect to real financial accounts.',
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Minimize support chat' }),
    );

    expect(
      screen.queryByRole('textbox', { name: 'Message Nova Support' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Restore support chat' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Restore support chat' }),
    );

    expect(
      screen.getByRole('textbox', { name: 'Message Nova Support' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'For your security, use only synthetic information in this demo. Nova Bank Demo does not connect to real financial accounts.',
      ),
    ).toBeInTheDocument();
  });

  it('calls close and preserves the conversation when the drawer is hidden and reopened', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const view = renderChat({ onClose });

    await user.click(screen.getByRole('button', { name: 'Transfers' }));

    expect(
      await screen.findByText(
        'To transfer money, open Transfers, choose the source and destination accounts, enter an amount, review the details, and confirm. Transfers in this demo are simulated locally.',
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Close support chat' }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    view.rerender(
      <MemoryRouter>
        <AppProvider initialState={createInitialState()}>
          <ChatProvider>
            <ChatDrawer open={false} authenticated onClose={onClose} />
          </ChatProvider>
        </AppProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    view.rerender(
      <MemoryRouter>
        <AppProvider initialState={createInitialState()}>
          <ChatProvider>
            <ChatDrawer open authenticated onClose={onClose} />
          </ChatProvider>
        </AppProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});