import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import { DEFAULT_FIXTURE_USER_ID } from '../fixtures/fixtures.js';
import { accountService } from '../domain/accountService.js';
import { useDomainData } from '../hooks/useDomainData.js';
import { useAppContext } from '../state/AppProvider.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { LoadingSkeleton } from '../components/shared/LoadingSkeleton.jsx';
import { StatusBadge } from '../components/shared/StatusBadge.jsx';
import {
  formatCurrency,
  safeDisplay,
} from '../utils/formatters.js';

function getPersonaId(persona, session, providedPersonaId) {
  return (
    providedPersonaId ||
    persona?.id ||
    persona?.userId ||
    session?.userId ||
    DEFAULT_FIXTURE_USER_ID
  );
}

function getAccountRoute(accountId) {
  return `${ROUTES.accounts}/${accountId}`;
}

function getAccountNumber(account) {
  return (
    account?.maskedAccountNumber ||
    account?.maskedAccount ||
    'Account number unavailable'
  );
}

function getAccountBalance(account) {
  return Number.isFinite(account?.balance) ? account.balance : 0;
}

function getAvailableBalance(account) {
  return Number.isFinite(account?.availableBalance)
    ? account.availableBalance
    : getAccountBalance(account);
}

function getAccountTypeLabel(type) {
  if (typeof type !== 'string' || !type.trim()) {
    return 'Account';
  }

  return type
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * Renders a persona-scoped overview of the active demo user's accounts.
 *
 * @param {{
 *   personaId?: string,
 *   accounts?: Object[],
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function AccountsPage({ personaId: providedPersonaId = '', accounts: providedAccounts, className = '' }) {
  const { persona, session } = useAppContext();

  const activePersonaId = getPersonaId(
    persona,
    session,
    providedPersonaId,
  );
  const hasProvidedAccounts = Array.isArray(providedAccounts);

  const loadAccounts = useCallback(
    () => accountService.getAccountsForPersona(activePersonaId),
    [activePersonaId],
  );

  const accountData = useDomainData(loadAccounts, {
    enabled: !hasProvidedAccounts,
    initialData: hasProvidedAccounts ? providedAccounts : undefined,
    dependencies: [activePersonaId, hasProvidedAccounts],
  });

  const accounts = hasProvidedAccounts
    ? providedAccounts
    : Array.isArray(accountData.data)
      ? accountData.data
      : [];

  const summary = useMemo(
    () => ({
      accountCount: accounts.length,
      totalBalance: accounts.reduce(
        (total, account) => total + getAccountBalance(account),
        0,
      ),
      totalAvailableBalance: accounts.reduce(
        (total, account) => total + getAvailableBalance(account),
        0,
      ),
    }),
    [accounts],
  );

  if (!hasProvidedAccounts && accountData.isLoading && !accountData.hasData) {
    return (
      <div
        className={['page-container', className].filter(Boolean).join(' ')}
        data-testid="accounts-page"
      >
        <header className="page-header mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
              Your accounts
            </p>
            <h1 className="mt-2 text-3xl font-bold text-nova-midnight sm:text-4xl">
              Accounts
            </h1>
            <p className="mt-2 max-w-2xl text-base text-nova-slate">
              Review your synthetic account balances and details.
            </p>
          </div>
        </header>

        <LoadingSkeleton variant="accounts" label="Loading your accounts" />
      </div>
    );
  }

  if (!hasProvidedAccounts && accountData.isError && !accountData.hasData) {
    return (
      <div
        className={['page-container', className].filter(Boolean).join(' ')}
        data-testid="accounts-page"
      >
        <header className="page-header mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
              Your accounts
            </p>
            <h1 className="mt-2 text-3xl font-bold text-nova-midnight sm:text-4xl">
              Accounts
            </h1>
            <p className="mt-2 max-w-2xl text-base text-nova-slate">
              Review your synthetic account balances and details.
            </p>
          </div>
        </header>

        <section
          role="alert"
          className="surface-card px-6 py-10 text-center sm:px-8"
        >
          <div
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-nova-coral/20 text-2xl font-bold text-nova-midnight"
          >
            !
          </div>
          <h2 className="mt-5 text-xl font-bold text-nova-midnight sm:text-2xl">
            Accounts could not be loaded
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-nova-slate sm:text-base">
            {accountData.error?.message ||
              'We could not retrieve your account information right now.'}
          </p>
          <button
            type="button"
            onClick={accountData.retry}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-nova-navy px-5 py-3 font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div
      className={['page-container', className].filter(Boolean).join(' ')}
      data-testid="accounts-page"
    >
      <header className="page-header mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            Your accounts
          </p>
          <h1 className="mt-2 text-3xl font-bold text-nova-midnight sm:text-4xl">
            Accounts
          </h1>
          <p className="mt-2 max-w-2xl text-base text-nova-slate">
            Review balances, availability, and masked account identifiers.
          </p>
        </div>

        <NavLink
          to={ROUTES.dashboard}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
        >
          Back to dashboard
        </NavLink>
      </header>

      <section
        aria-labelledby="accounts-summary-title"
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <h2 id="accounts-summary-title" className="sr-only">
          Account summary
        </h2>

        <div className="surface-card p-5 sm:p-6">
          <p className="text-sm font-semibold text-nova-slate">
            Total accounts
          </p>
          <p className="mt-2 text-3xl font-bold text-nova-midnight">
            {summary.accountCount}
          </p>
        </div>

        <div className="surface-card p-5 sm:p-6">
          <p className="text-sm font-semibold text-nova-slate">
            Total balance
          </p>
          <p className="mt-2 text-2xl font-bold text-nova-midnight sm:text-3xl">
            {formatCurrency(summary.totalBalance)}
          </p>
        </div>

        <div className="surface-card p-5 sm:p-6">
          <p className="text-sm font-semibold text-nova-slate">
            Available balance
          </p>
          <p className="mt-2 text-2xl font-bold text-nova-midnight sm:text-3xl">
            {formatCurrency(summary.totalAvailableBalance)}
          </p>
        </div>
      </section>

      {accounts.length === 0 ? (
        <EmptyState
          title="No accounts available"
          description="This demo persona does not have any accounts to display."
          compact
        />
      ) : (
        <section aria-labelledby="account-list-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2
                id="account-list-title"
                className="text-2xl font-bold text-nova-midnight"
              >
                Your accounts
              </h2>
              <p className="mt-1 text-sm text-nova-slate">
                Select an account to view its details and activity.
              </p>
            </div>

            {!hasProvidedAccounts && accountData.isLoading && (
              <span className="text-sm text-nova-slate" role="status">
                Updating…
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accounts.map((account) => (
              <NavLink
                key={account.id}
                to={getAccountRoute(account.id)}
                className="surface-card block p-5 transition hover:-translate-y-0.5 hover:border-nova-blue/40 focus:outline-none focus:ring-4 focus:ring-nova-blue/20 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-nova-slate">
                      {getAccountTypeLabel(account.type)}
                    </p>
                    <h3 className="mt-1 truncate text-xl font-bold text-nova-midnight">
                      {safeDisplay(account.name, 'Unnamed account')}
                    </h3>
                  </div>

                  <StatusBadge status={account.status} />
                </div>

                <p className="mt-4 text-sm text-nova-slate">
                  {getAccountNumber(account)}
                </p>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
                    Balance
                  </p>
                  <p className="mt-1 text-3xl font-bold text-nova-midnight">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-nova-slate/15 pt-4">
                  <p className="text-sm text-nova-slate">
                    Available:{' '}
                    <span className="font-semibold text-nova-ink">
                      {formatCurrency(
                        getAvailableBalance(account),
                        account.currency,
                      )}
                    </span>
                  </p>
                  <span
                    aria-hidden="true"
                    className="text-xl text-nova-blue"
                  >
                    →
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

AccountsPage.propTypes = {
  personaId: PropTypes.string,
  accounts: PropTypes.arrayOf(PropTypes.object),
  className: PropTypes.string,
};

export { AccountsPage };
export default AccountsPage;
