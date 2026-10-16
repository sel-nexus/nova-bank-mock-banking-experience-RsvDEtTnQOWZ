import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useParams } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import {
  DEFAULT_FIXTURE_USER_ID,
} from '../fixtures/fixtures.js';
import { accountService } from '../domain/accountService.js';
import { transactionService } from '../services/transactionService.js';
import { downloadStatement } from '../services/statementDownload.js';
import { useDomainData } from '../hooks/useDomainData.js';
import { useAppContext } from '../state/AppProvider.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { LoadingSkeleton } from '../components/shared/LoadingSkeleton.jsx';
import { StatusBadge } from '../components/shared/StatusBadge.jsx';
import { Modal } from '../components/shared/Modal.jsx';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTransactionAmount,
  safeDisplay,
} from '../utils/formatters.js';
import { selectAndSortTransactions } from '../domain/transactionSelectors.js';

function getPersonaId(persona, session, providedPersonaId) {
  return (
    providedPersonaId ||
    persona?.id ||
    persona?.userId ||
    session?.userId ||
    DEFAULT_FIXTURE_USER_ID
  );
}

function getAccountId(accountId) {
  if (typeof accountId !== 'string') {
    return '';
  }

  return accountId.trim();
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

function getOwnershipMessage(reason) {
  switch (reason) {
    case 'PERSONA_NOT_FOUND':
      return 'We could not identify the active demo persona for this account.';
    case 'ACCOUNT_UNAVAILABLE':
      return 'This account belongs to another demo persona and is not available in the current session.';
    case 'ACCOUNT_NOT_FOUND':
    default:
      return 'The requested account could not be found in this synthetic banking experience.';
  }
}

function getTransactionDate(transaction) {
  return (
    transaction?.postedAt ||
    transaction?.createdAt ||
    transaction?.date ||
    ''
  );
}

function getTransactionDescription(transaction) {
  return safeDisplay(
    transaction?.description ||
      transaction?.merchantName ||
      transaction?.title,
    'Transaction',
  );
}

/**
 * Renders account details, balances, metadata, statement actions, and
 * persona-scoped transaction activity.
 *
 * @param {{
 *   accountId?: string,
 *   personaId?: string,
 *   account?: Object,
 *   transactions?: Object[],
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function AccountDetailPage({
  accountId: providedAccountId,
  personaId: providedPersonaId,
  account: providedAccount,
  transactions: providedTransactions,
  className,
}) {
  const { accountId: routeAccountId } = useParams();
  const { persona, session, actions } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryError, setEnquiryError] = useState('');
  const [enquirySuccess, setEnquirySuccess] = useState('');
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [statementStatus, setStatementStatus] = useState('');

  const activePersonaId = getPersonaId(
    persona,
    session,
    providedPersonaId,
  );
  const activeAccountId = getAccountId(
    providedAccountId || routeAccountId,
  );
  const hasProvidedAccount = providedAccount !== undefined;
  const hasProvidedTransactions = Array.isArray(providedTransactions);

  const loadAccount = useCallback(
    () => accountService.validateAccountOwnership(
      activePersonaId,
      activeAccountId,
    ),
    [activeAccountId, activePersonaId],
  );

  const accountData = useDomainData(loadAccount, {
    enabled: !hasProvidedAccount,
    initialData: hasProvidedAccount
      ? {
          valid: Boolean(providedAccount),
          account: providedAccount || null,
          reason: providedAccount ? undefined : 'ACCOUNT_NOT_FOUND',
        }
      : undefined,
    dependencies: [activeAccountId, activePersonaId, hasProvidedAccount],
  });

  const accountResult = hasProvidedAccount
    ? {
        valid: Boolean(providedAccount),
        account: providedAccount || null,
        reason: providedAccount ? undefined : 'ACCOUNT_NOT_FOUND',
      }
    : accountData.data;

  const account = accountResult?.valid ? accountResult.account : null;

  const loadTransactions = useCallback(
    () =>
      transactionService.getTransactionsForAccount(
        activePersonaId,
        activeAccountId,
        {
          includeFuture: true,
          sortBy: 'date',
          sortOrder: 'desc',
        },
      ),
    [activeAccountId, activePersonaId],
  );

  const transactionData = useDomainData(loadTransactions, {
    enabled: Boolean(account) && !hasProvidedTransactions,
    initialData: hasProvidedTransactions ? providedTransactions : undefined,
    dependencies: [
      activeAccountId,
      activePersonaId,
      Boolean(account),
      hasProvidedTransactions,
    ],
  });

  const transactions = hasProvidedTransactions
    ? providedTransactions
    : Array.isArray(transactionData.data)
      ? transactionData.data
      : [];

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        [
          transaction.description,
          transaction.merchantName,
          transaction.category,
          transaction.type,
          transaction.status,
          transaction.reference,
        ].some((value) =>
          String(value || '').toLowerCase().includes(normalizedSearch),
        );
      const matchesStatus =
        !statusFilter || transaction.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return selectAndSortTransactions(filtered, {
      sortBy: 'date',
      sortOrder: 'desc',
      includeFuture: true,
    });
  }, [search, statusFilter, transactions]);

  const balanceSummary = useMemo(() => {
    const balance = getAccountBalance(account);
    const availableBalance = getAvailableBalance(account);

    return {
      balance,
      availableBalance,
      pendingAmount: transactions
        .filter((transaction) => transaction.status === 'pending')
        .reduce(
          (total, transaction) =>
            total + (Number.isFinite(transaction.amount) ? transaction.amount : 0),
          0,
        ),
      transactionCount: transactions.length,
    };
  }, [account, transactions]);

  const handleStatementDownload = () => {
    if (!account) {
      return;
    }

    setStatementStatus('');

    try {
      const result = downloadStatement(
        {
          title: `${account.name || 'Account'} statement`,
          account,
          referenceDate: account.lastUpdated || account.openedAt,
          transactions,
        },
        {
          filename: `${account.name || 'nova-bank-account'}-statement`,
        },
      );

      if (result.success) {
        setStatementStatus(
          `Statement ready: ${result.data?.filename || 'download started'}.`,
        );
      } else {
        setStatementStatus(
          result.error?.message || 'The statement could not be created.',
        );
      }
    } catch {
      setStatementStatus('The statement could not be created.');
    }
  };

  const handleOpenEnquiry = () => {
    setEnquiryError('');
    setEnquirySuccess('');
    setIsEnquiryOpen(true);
  };

  const handleCloseEnquiry = () => {
    if (!isSubmittingEnquiry) {
      setIsEnquiryOpen(false);
    }
  };

  const handleSubmitEnquiry = (event) => {
    event.preventDefault();
    setEnquiryError('');
    setEnquirySuccess('');

    const normalizedMessage = enquiryMessage.trim();

    if (!normalizedMessage) {
      setEnquiryError('Enter a question about this account or its activity.');
      return;
    }

    setIsSubmittingEnquiry(true);

    try {
      const submitSupportRequest = actions?.submitSupportRequest;

      if (typeof submitSupportRequest !== 'function') {
        setEnquiryError('Transaction enquiries are unavailable right now.');
        return;
      }

      const result = submitSupportRequest({
        name: persona?.name || 'Demo customer',
        email: persona?.email || 'customer@example.test',
        subject: `Account enquiry: ${account?.name || activeAccountId}`,
        message: normalizedMessage,
        category: 'Transactions',
        preferredChannel: 'Demo support',
      });

      if (result?.success === false) {
        setEnquiryError(
          result.error?.message ||
            'The transaction enquiry could not be submitted.',
        );
        return;
      }

      setEnquiryMessage('');
      setEnquirySuccess(
        'Your enquiry was submitted locally. No real bank or support team receives it.',
      );
    } catch {
      setEnquiryError('The transaction enquiry could not be submitted.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  if (
    !hasProvidedAccount &&
    accountData.isLoading &&
    !accountData.hasData
  ) {
    return (
      <div
        className={['page-container', className].filter(Boolean).join(' ')}
        data-testid="account-detail-page"
      >
        <LoadingSkeleton
          variant="account"
          label="Loading account details"
        />
      </div>
    );
  }

  if (!account) {
    const reason =
      accountResult?.reason ||
      (accountData.isError ? 'ACCOUNT_NOT_FOUND' : 'ACCOUNT_NOT_FOUND');

    return (
      <div
        className={['page-container', className].filter(Boolean).join(' ')}
        data-testid="account-detail-page"
      >
        <div className="mb-6">
          <NavLink
            to={ROUTES.accounts}
            className="text-sm font-semibold text-nova-blue underline-offset-2 hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            ← Back to accounts
          </NavLink>
        </div>

        <EmptyState
          title={
            reason === 'ACCOUNT_UNAVAILABLE'
              ? 'Account unavailable'
              : 'Account not found'
          }
          description={getOwnershipMessage(reason)}
          icon="!"
          action={{
            label: 'Back to accounts',
            onClick: () => {
              window.location.assign(ROUTES.accounts);
            },
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={['page-container', className].filter(Boolean).join(' ')}
        data-testid="account-detail-page"
      >
        <header className="page-header mb-8">
          <div className="min-w-0">
            <NavLink
              to={ROUTES.accounts}
              className="text-sm font-semibold text-nova-blue underline-offset-2 hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
            >
              ← Back to accounts
            </NavLink>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
              {getAccountTypeLabel(account.type)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-nova-midnight sm:text-4xl">
                {safeDisplay(account.name, 'Account details')}
              </h1>
              <StatusBadge status={account.status} />
            </div>
            <p className="mt-2 text-base text-nova-slate">
              {safeDisplay(
                account.maskedAccountNumber,
                'Account number unavailable',
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleStatementDownload}
            className="min-h-11 shrink-0 rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
          >
            Download statement
          </button>
        </header>

        {statementStatus && (
          <p
            role="status"
            className="mb-6 rounded-lg border border-nova-blue/20 bg-nova-sky/70 px-4 py-3 text-sm text-nova-ink"
          >
            {statementStatus}
          </p>
        )}

        <section
          aria-labelledby="balance-overview-title"
          className="mb-8 rounded-card bg-nova-midnight p-6 text-white shadow-elevated sm:p-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-lime">
                Current balance
              </p>
              <h2
                id="balance-overview-title"
                className="mt-3 text-4xl font-bold sm:text-5xl"
              >
                {formatCurrency(account.balance, account.currency)}
              </h2>
              <p className="mt-3 text-sm text-nova-sky">
                Available to spend:{' '}
                <span className="font-semibold text-white">
                  {formatCurrency(
                    balanceSummary.availableBalance,
                    account.currency,
                  )}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-64">
              <div className="rounded-lg bg-white/10 p-4">
                <p className="text-nova-sky">Pending activity</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {formatCurrency(
                    balanceSummary.pendingAmount,
                    account.currency,
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4">
                <p className="text-nova-sky">Transactions</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {balanceSummary.transactionCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="account-information-title"
          className="mb-8"
        >
          <h2
            id="account-information-title"
            className="mb-4 text-2xl font-bold text-nova-midnight"
          >
            Account information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-card p-5">
              <p className="text-sm font-semibold text-nova-slate">
                Account type
              </p>
              <p className="mt-2 font-bold text-nova-midnight">
                {getAccountTypeLabel(account.type)}
              </p>
            </div>

            <div className="surface-card p-5">
              <p className="text-sm font-semibold text-nova-slate">
                Account number
              </p>
              <p className="mt-2 font-bold text-nova-midnight">
                {safeDisplay(account.maskedAccountNumber)}
              </p>
            </div>

            <div className="surface-card p-5">
              <p className="text-sm font-semibold text-nova-slate">
                Routing number
              </p>
              <p className="mt-2 font-bold text-nova-midnight">
                {safeDisplay(account.routingNumber)}
              </p>
            </div>

            <div className="surface-card p-5">
              <p className="text-sm font-semibold text-nova-slate">
                Opened
              </p>
              <p className="mt-2 font-bold text-nova-midnight">
                {account.openedAt ? formatDate(account.openedAt) : 'Not available'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="surface-card p-5">
              <p className="text-sm font-semibold text-nova-slate">
                Available balance
              </p>
              <p className="mt-2 text-2xl font-bold text-nova-midnight">
                {formatCurrency(
                  balanceSummary.availableBalance,
                  account.currency,
                )}
              </p>
              <p className="mt-1 text-sm text-nova-slate">
                Funds available for eligible activity.
              </p>
            </div>

            <div className="surface-card p-5">
              <p className="text-sm font-semibold text-nova-slate">
                Last updated
              </p>
              <p className="mt-2 text-lg font-bold text-nova-midnight">
                {account.lastUpdated
                  ? formatDateTime(account.lastUpdated)
                  : 'Not available'}
              </p>
              <p className="mt-1 text-sm text-nova-slate">
                All account information is synthetic demo data.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="account-transactions-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="account-transactions-title"
                className="text-2xl font-bold text-nova-midnight"
              >
                Transaction activity
              </h2>
              <p className="mt-1 text-sm text-nova-slate">
                Review activity associated with this account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenEnquiry}
              className="min-h-11 rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
            >
              Ask about a transaction
            </button>
          </div>

          <div className="surface-card mb-4 grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div>
              <label
                htmlFor="account-transaction-search"
                className="mb-1.5 block text-sm font-semibold text-nova-midnight"
              >
                Search activity
              </label>
              <input
                id="account-transaction-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search description, category, or reference"
                className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
              />
            </div>

            <div>
              <label
                htmlFor="account-transaction-status"
                className="mb-1.5 block text-sm font-semibold text-nova-midnight"
              >
                Status
              </label>
              <select
                id="account-transaction-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
              >
                <option value="">All statuses</option>
                <option value="completed">Posted</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {!hasProvidedTransactions && transactionData.isLoading && (
            <LoadingSkeleton variant="table" rows={4} label="Loading account activity" />
          )}

          {(!transactionData.isLoading || hasProvidedTransactions) &&
            (filteredTransactions.length > 0 ? (
              <div className="surface-card overflow-hidden">
                <div className="hidden grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto_auto] gap-4 border-b border-nova-slate/20 bg-nova-sky/30 px-5 py-3 text-xs font-bold uppercase tracking-wide text-nova-slate sm:grid sm:px-6">
                  <span>Description</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span className="text-right">Amount</span>
                </div>

                <div className="divide-y divide-nova-slate/15">
                  {filteredTransactions.map((transaction) => (
                    <article
                      key={transaction.id}
                      className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4 sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-nova-midnight">
                          {getTransactionDescription(transaction)}
                        </p>
                        <p className="mt-1 text-sm text-nova-slate">
                          {safeDisplay(
                            transaction.category || transaction.type,
                            'General activity',
                          )}
                          {transaction.reference
                            ? ` · ${transaction.reference}`
                            : ''}
                        </p>
                      </div>

                      <p className="text-sm text-nova-slate">
                        {getTransactionDate(transaction)
                          ? formatDate(getTransactionDate(transaction))
                          : 'Date unavailable'}
                      </p>

                      <StatusBadge status={transaction.status} />

                      <p
                        className={[
                          'font-bold sm:text-right',
                          transaction.direction === 'credit'
                            ? 'text-nova-teal'
                            : 'text-nova-midnight',
                        ].join(' ')}
                      >
                        {formatTransactionAmount(
                          transaction.amount,
                          transaction.direction,
                          transaction.currency || account.currency,
                        )}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No matching transactions"
                description={
                  search || statusFilter
                    ? 'Try changing your search or status filter.'
                    : 'There is no activity to display for this account.'
                }
                compact
              />
            ))}
        </section>

        <p className="mt-8 rounded-lg bg-nova-sky/60 px-4 py-3 text-sm text-nova-slate">
          Account details, balances, and transaction activity shown here are
          synthetic demo data. Account identifiers are masked for privacy.
        </p>
      </div>

      <Modal
        open={isEnquiryOpen}
        onClose={handleCloseEnquiry}
        title="Ask about a transaction"
        closeLabel="Close transaction enquiry"
        contentClassName="max-w-xl"
      >
        <form onSubmit={handleSubmitEnquiry}>
          <p className="text-sm text-nova-slate">
            Send a question about activity on{' '}
            <span className="font-semibold text-nova-ink">
              {safeDisplay(account.name, 'this account')}
            </span>
            . This enquiry is stored only in the local demonstration.
          </p>

          {enquiryError && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-nova-coral/40 bg-nova-coral/10 px-3 py-2 text-sm text-nova-midnight"
            >
              {enquiryError}
            </p>
          )}

          {enquirySuccess && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-nova-teal/30 bg-nova-mint px-3 py-2 text-sm text-nova-ink"
            >
              {enquirySuccess}
            </p>
          )}

          <div className="mt-5">
            <label
              htmlFor="transaction-enquiry-message"
              className="mb-1.5 block text-sm font-semibold text-nova-midnight"
            >
              Your question
            </label>
            <textarea
              id="transaction-enquiry-message"
              value={enquiryMessage}
              onChange={(event) => setEnquiryMessage(event.target.value)}
              placeholder="For example: I would like more information about this transaction."
              rows={5}
              disabled={isSubmittingEnquiry}
              className="w-full resize-y rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20 disabled:cursor-not-allowed disabled:bg-nova-cream"
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCloseEnquiry}
              disabled={isSubmittingEnquiry}
              className="min-h-11 rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmittingEnquiry || !enquiryMessage.trim()}
              className="min-h-11 rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmittingEnquiry ? 'Submitting…' : 'Submit enquiry'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

AccountDetailPage.propTypes = {
  accountId: PropTypes.string,
  personaId: PropTypes.string,
  account: PropTypes.object,
  transactions: PropTypes.arrayOf(PropTypes.object),
  className: PropTypes.string,
};

AccountDetailPage.defaultProps = {
  accountId: '',
  personaId: '',
  account: undefined,
  transactions: undefined,
  className: '',
};

export { AccountDetailPage };
export default AccountDetailPage;