import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { AppProvider } from './state/AppProvider.jsx';
import { ChatProvider } from './state/ChatProvider.jsx';
import { initialState } from './state/appReducer.js';
import { AppShell } from './components/shell/AppShell.jsx';
import { ChatDrawer } from './components/chat/ChatDrawer.jsx';
import { Drawer } from './components/shared/Drawer.jsx';
import { Modal } from './components/shared/Modal.jsx';
import { AccountDetailPage } from './pages/AccountDetailPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SupportPage } from './pages/SupportPage.jsx';
import { FIXTURES } from './fixtures/fixtures.js';

const MIGUEL_ID = 'user-miguel-santos';
const MIGUEL_ACCOUNT_ID = 'account-miguel-checking';
const MIGUEL_ACCOUNT = FIXTURES.accounts.find(
  (account) => account.id === MIGUEL_ACCOUNT_ID,
);
const MIGUEL_TRANSACTIONS = FIXTURES.transactions.filter(
  (transaction) => transaction.accountId === MIGUEL_ACCOUNT_ID,
);

function createAuthenticatedState() {
  const persona = FIXTURES.personas.find(
    (item) => item.id === MIGUEL_ID,
  );

  return {
    ...initialState,
    session: {
      ...initialState.session,
      isAuthenticated: true,
      status: 'active',
      token: 'nova-demo-token',
      userId: MIGUEL_ID,
    },
    persona,
  };
}

function getHeadingLevels(container) {
  return Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(
    (heading) => Number(heading.tagName.slice(1)),
  );
}

function expectHeadingStructure(container) {
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));

  expect(headings.length).toBeGreaterThan(0);
  expect(headings.filter((heading) => heading.tagName === 'H1')).toHaveLength(1);

  const levels = getHeadingLevels(container);

  levels.slice(1).forEach((level, index) => {
    expect(level).toBeLessThanOrEqual(levels[index] + 1);
  });
}

function renderShell(children) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AppProvider initialState={createAuthenticatedState()}>
        <ChatProvider>
          <AppShell>{children}</AppShell>
        </ChatProvider>
      </AppProvider>
    </MemoryRouter>,
  );
}

function renderAccountDetail() {
  return render(
    <MemoryRouter initialEntries={[`/accounts/${MIGUEL_ACCOUNT_ID}`]}>
      <AppProvider initialState={createAuthenticatedState()}>
        <Routes>
          <Route
            path="/accounts/:accountId"
            element={
              <AccountDetailPage
                account={MIGUEL_ACCOUNT}
                transactions={MIGUEL_TRANSACTIONS}
              />
            }
          />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('accessibility gate', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the public login experience with a labelled form, landmarks, and valid heading structure', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Banking made clear, simple, and yours.',
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Access your demo',
    );
    expect(screen.getByLabelText('User ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expectHeadingStructure(container);
  });

  it('renders the authenticated shell with header navigation, main content, and accessible support controls', () => {
    renderShell(
      <section aria-labelledby="shell-page-title">
        <h1 id="shell-page-title">Dashboard</h1>
        <p>Authenticated synthetic banking content.</p>
      </section>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('note', { name: 'Privacy and synthetic data notice' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open support chat' }),
    ).toBeInTheDocument();
  });

  it('renders account details with one primary heading, labelled regions, and masked identifiers', async () => {
    const { container } = renderAccountDetail();

    expect(
      await screen.findByRole('heading', { name: 'Everyday Checking' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Everyday Checking',
    );
    expect(
      screen.getByRole('region', { name: 'Account information' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Transaction activity' }),
    ).toBeInTheDocument();
    expect(screen.getByText('•••• 5678')).toBeInTheDocument();
    expect(screen.queryByText('100012345678')).not.toBeInTheDocument();
    expectHeadingStructure(container);
  });

  it('renders support content with accessible search, expandable controls, landmarks, and heading structure', () => {
    const { container } = render(<SupportPage />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'How can we help?' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Search FAQs')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Is this a real bank\?/i }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.getByRole('button', { name: /Downtown Austin/i }),
    ).toHaveAttribute('aria-expanded', 'false');
    expectHeadingStructure(container);
  });

  it('renders authenticated chat as a labelled dialog with keyboard-accessible controls', () => {
    render(
      <MemoryRouter>
        <AppProvider initialState={createAuthenticatedState()}>
          <ChatProvider>
            <ChatDrawer open authenticated />
          </ChatProvider>
        </AppProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('dialog', { name: 'Nova Support chat' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Message Nova Support' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Close support chat' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Minimize support chat' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Escalate' }),
    ).toBeEnabled();
  });

  it('moves focus into a modal and restores focus after closing it', async () => {
    const user = userEvent.setup();

    function ModalHarness() {
      const [open, setOpen] = React.useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open accessible modal
          </button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Accessible modal"
          >
            <p>Modal content.</p>
            <button type="button" onClick={() => setOpen(false)}>
              Done
            </button>
          </Modal>
        </>
      );
    }

    render(<ModalHarness />);

    const trigger = screen.getByRole('button', {
      name: 'Open accessible modal',
    });

    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', {
      name: 'Accessible modal',
    });

    await waitFor(() => {
      expect(dialog).toHaveFocus();
    });

    await user.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it('moves focus into a drawer, traps tab navigation, and restores focus on close', async () => {
    const user = userEvent.setup();

    function DrawerHarness() {
      const [open, setOpen] = React.useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open accessible drawer
          </button>
          <Drawer
            open={open}
            onClose={() => setOpen(false)}
            title="Accessible drawer"
          >
            <button type="button">Drawer action</button>
          </Drawer>
        </>
      );
    }

    render(<DrawerHarness />);

    const trigger = screen.getByRole('button', {
      name: 'Open accessible drawer',
    });

    await user.click(trigger);

    const drawer = await screen.findByRole('dialog', {
      name: 'Accessible drawer',
    });
    const closeButton = screen.getByRole('button', { name: 'Close drawer' });

    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Drawer action' })).toHaveFocus();

    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    expect(drawer).not.toBeInTheDocument();
  });
});