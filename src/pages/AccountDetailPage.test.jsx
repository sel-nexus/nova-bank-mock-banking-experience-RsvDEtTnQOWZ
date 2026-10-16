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
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AccountDetailPage } from './AccountDetailPage.jsx';
import { initialState } from '../state/appReducer.js';
import { AppProvider } from '../state/AppProvider.jsx';
import { FIXTURES } from '../fixtures/fixtures.js';
import { accountService } from '../domain/accountService.js';
import sessionManager from '../services/sessionManager.js';
import storageService from '../services/storageService.js';

const MIGUEL_ID = 'user-miguel-santos';
const ROSA_ACCOUNT_ID = 'account-rosa-checking';
const MIGUEL_ACCOUNT_ID = 'account-miguel-checking';
const MIGUEL_ACCOUNT = FIXTURES.accounts.find(
  (account) => account.id === MIGUEL_ACCOUNT_ID,
);
const MIGUEL_TRANSACTIONS = FIXTURES.transactions.filter(
  (transaction) => transaction.accountId === MIGUEL_ACCOUNT_ID,
);

function createAuthenticatedState(personaId = MIGUEL_ID) {
  const persona = FIXTURES.personas.find((item) => item.id === personaId);

  return {
    ...initialState,
    session: {
      ...initialState.session,
      isAuthenticated: true,
      status: 'active',
      token: 'nova-demo-token',
      userId: personaId,
    },
    persona,
  };
}

function renderAccountDetail(
  accountId = MIGUEL_ACCOUNT_ID,
  props = {},
  personaId = MIGUEL_ID,
) {
  return render(
    <AppProvider initialState={createAuthenticatedState(personaId)}>
      <MemoryRouter initialEntries={[`/accounts/${accountId}`]}>
        <Routes>
          <Route
            path="/accounts/:accountId"
            element={<AccountDetailPage {...props} />}
          />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

describe('AccountDetailPage', () => {
  beforeEach(() => {
    storageService.resetStorage();
    sessionManager.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    storageService.resetStorage();
    sessionManager.clear();
  });

  it('renders an owned account with balances, pending activity, and masked account details', async () => {
    renderAccountDetail();

    expect(
      await screen.findByRole('heading', { name: 'Everyday Checking' }),
    ).toBeInTheDocument();
    expect(screen.getByText('$12,500.00')).toBeInTheDocument();
    expect(screen.getByText('$12,180.45')).toBeInTheDocument();
    expect(screen.getByText('$15.99')).toBeInTheDocument();
    expect(screen.getByText('•••• 5678')).toBeInTheDocument();
    expect(screen.queryByText('100012345678')).not.toBeInTheDocument();
    expect(screen.getByText('Current balance')).toBeInTheDocument();
    expect(screen.getByText('Available balance')).toBeInTheDocument();
    expect(screen.getByText('Pending activity')).toBeInTheDocument();
  });

  it('keeps another persona account unavailable to the active persona', async () => {
    renderAccountDetail(ROSA_ACCOUNT_ID);

    expect(
      await screen.findByRole('heading', { name: 'Account unavailable' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This account belongs to another demo persona and is not available in the current session.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('•••• 8912')).not.toBeInTheDocument();
    expect(screen.queryByText('$8,450.72')).not.toBeInTheDocument();
  });

  it('renders transaction activity and supports searching the displayed transactions', async () => {
    const user = userEvent.setup();

    renderAccountDetail();

    expect(
      await screen.findByText('Payroll deposit'),
    ).toBeInTheDocument();
    expect(screen.getByText('Rent payment')).toBeInTheDocument();
    expect(screen.getByText('Monthly subscription')).toBeInTheDocument();

    const searchInput = screen.getByLabelText('Search activity');
    await user.type(searchInput, 'rent');

    expect(screen.getByText('Rent payment')).toBeInTheDocument();
    expect(screen.queryByText('Payroll deposit')).not.toBeInTheDocument();
    expect(screen.queryByText('Monthly subscription')).not.toBeInTheDocument();
  });

  it('opens the transaction enquiry action from the account activity section', async () => {
    const user = userEvent.setup();

    renderAccountDetail();

    await screen.findByText('Payroll deposit');

    await user.click(
      screen.getByRole('button', { name: 'Ask about a transaction' }),
    );

    expect(
      screen.getByRole('dialog', { name: 'Ask about a transaction' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Your question'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit enquiry' }),
    ).toBeDisabled();
  });

  it('shows an account loading error and retries the failed account request', async () => {
    const account = MIGUEL_ACCOUNT;
    const validateSpy = vi
      .spyOn(accountService, 'validateAccountOwnership')
      .mockImplementationOnce(() => {
        throw new Error('Temporary account service failure.');
      })
      .mockImplementation(() => ({
        valid: true,
        account,
      }));

    renderAccountDetail();

    expect(
      await screen.findByRole('heading', {
        name: 'Accounts could not be loaded',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Temporary account service failure.'),
    ).toBeInTheDocument();

    await userEvent.setup().click(
      screen.getByRole('button', { name: 'Try again' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Everyday Checking' }),
    ).toBeInTheDocument();
    expect(validateSpy).toHaveBeenCalledTimes(2);
  });

  it('downloads a masked statement locally without exposing the full account number', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:statement');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    renderAccountDetail(
      MIGUEL_ACCOUNT_ID,
      {
        account: MIGUEL_ACCOUNT,
        transactions: MIGUEL_TRANSACTIONS,
      },
    );

    expect(
      await screen.findByRole('heading', { name: 'Everyday Checking' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Download statement' }),
    );

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent('Statement ready: everyday-checking-statement.txt.');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:statement');
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('100012345678')).not.toBeInTheDocument();
  });

  it('renders provided account and transaction data while preserving masked identifiers', async () => {
    renderAccountDetail(
      MIGUEL_ACCOUNT_ID,
      {
        account: {
          ...MIGUEL_ACCOUNT,
          balance: 999.5,
          availableBalance: 950,
          maskedAccountNumber: '•••• 5678',
        },
        transactions: [
          {
            id: 'transaction-provided',
            accountId: MIGUEL_ACCOUNT_ID,
            direction: 'debit',
            status: 'completed',
            type: 'payment',
            amount: 42,
            currency: 'USD',
            description: 'Provided demo payment',
            category: 'Demo',
            date: '2026-10-16',
          },
        ],
      },
    );

    expect(
      await screen.findByRole('heading', { name: 'Everyday Checking' }),
    ).toBeInTheDocument();
    expect(screen.getByText('$999.50')).toBeInTheDocument();
    expect(screen.getByText('$950.00')).toBeInTheDocument();
    expect(screen.getByText('Provided demo payment')).toBeInTheDocument();
    expect(screen.getByText('•••• 5678')).toBeInTheDocument();
    expect(screen.queryByText('100012345678')).not.toBeInTheDocument();
  });
});