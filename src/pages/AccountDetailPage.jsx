import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useParams } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import {
  DEFAULT_FIXTURE_USER_ID,
} from '../fixtures/fixtures.js';
import { accountService } from '../domain/accountService.js';
import { transactionService } from '../domain/transactionService.js';
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
import {
  differenceInDays,
  getReferenceDateString,
} from '../domain/referenceClock.js';

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

function getTransactionIsoDate(transaction) {
  const value = transaction?.date || getTransactionDate(transaction);
  return typeof value === 'string' ? value.slice(0, 10) : '';
}

function isWithinDateRange(transaction, dateRange, customStart, customEnd) {
  const isoDate = getTransactionIsoDate(transaction);

  if (!isoDate) {
    return false;
  }

  if (dateRange === 'custom') {
    if (customStart && isoDate < customStart) {
      return false;
    }

    if (customEnd && isoDate > customEnd) {
      return false;
    }

    return true;
  }

  const days = Number(dateRange);
  const age = differenceInDays(isoDate, getReferenceDateString());

  return age !== null && age >= 0 && age <= days;
}

function getBalanceMetrics(account) {
  const currency = account.currency;

  if (account.type === 'credit') {
    return [
      {
        label: 'Amount due',
        value: formatCurrency(account.amountDue ?? account.balance, currency),
      },
      {
        label: 'Credit limit',
        value: formatCurrency(account.creditLimit, currency),
      },
      {
        label: 'Available credit',
        value: formatCurrency(
          account.availableCredit ?? account.availableBalance,
          currency,
        ),
      },
      {
        label: 'Currency',
        value: currency || 'PHP',
      },
    ];
  }

  if (account.type === 'loan') {
    return [
      {
        label: 'Outstanding principal',
        value: formatCurrency(
          account.outstandingPrincipal ?? account.balance,
          currency,
        ),
      },
      {
        label: 'Account status',
        value: 'Active',
      },
      {
        label: 'Currency',
        value: currency || 'PHP',
      },
      {
        label: 'Account type',
        value: 'Loan',
      },
    ];
  }

  return [
    {
      label: 'Available balance',
      value: formatCurrency(
        account.availableBalance ?? account.balance,
        currency,
      ),
    },
    {
      label: 'Current / ledger balance',
      value: formatCurrency(account.balance, currency),
    },
    {
      label: 'Pending transactions',
      value: formatCurrency(account.pendingAmount ?? 0, currency),
    },
    {
      label: 'Annual interest rate',
      value:
        typeof account.interestRate === 'number'
          ? `${account.interestRate.toFixed(2)}% p.a.`
          : 'Not applicable',
    },
  ];
}

const TRANSACTION_CATEGORIES = [
  'All categories',
  'Income',
  'Groceries',
  'Savings',
  'Dining',
  'Transport',
  'Uncategorized',
];

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
  accountId: providedAccountId = '',
  personaId: providedPersonaId = '',
  account: providedAccount,
  transactions: providedTransactions,
  className = '',
}) {
  const { accountId: routeAccountId } = useParams();
  const { persona, session, actions } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [expandedTransactionId, setExpandedTransactionId] = useState('');
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
      const matchesDirection =
        directionFilter === 'all' || transaction.direction === directionFilter;
      const matchesCategory =
        categoryFilter === 'All categories' ||
        String(transaction.category || '').toLowerCase() ===
          categoryFilter.toLowerCase();
      const matchesDate = isWithinDateRange(
        transaction,
        dateRange,
        customStart,
        customEnd,
      );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDirection &&
        matchesCategory &&
        matchesDate
      );
    });

    return selectAndSortTransactions(filtered, {
      sortBy: 'date',
      sortOrder: 'desc',
      includeFuture: true,
    });
  }, [
    categoryFilter,
    customEnd,
    customStart,
    dateRange,
    directionFilter,
    search,
    statusFilter,
    transactions,
  ]);

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
          filename: `statement-${String(
            account.maskedAccountNumber || account.accountNumber || 'demo',
          ).slice(-4)}-demo`,
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

  if (!hasProvidedAccount && accountData.isError) {
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
        <section role="alert" className="surface-card px-6 py-10">
          <h1 className="text-2xl font-bold text-nova-midnight">
            Accounts could not be loaded
          </h1>
          <p className="mt-3 text-sm text-nova-slate">
            {accountData.error?.message ||
              'Unable to retrieve latest account information.'}
          </p>
          <button
            type="button"
            onClick={() => accountData.retry()}
            className="mt-6 min-h-11 rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </section>
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
              <span>
                {safeDisplay(
                  account.maskedAccountNumber,
                  'Account number unavailable',
                )}
              </span>
              {account.currency ? <span>{` · ${account.currency}`}</span> : null}
            </p>
            {(account.interestRate || account.lastStatementDate) && (
              <p className="mt-2 text-sm text-nova-slate">
                {typeof account.interestRate === 'number'
                  ? `Interest rate: ${account.interestRate.toFixed(2)}% p.a.`
                  : ''}
                {typeof account.interestRate === 'number' &&
                account.lastStatementDate
                  ? ' | '
                  : ''}
                {account.lastStatementDate
                  ? `Last statement date: ${formatDate(account.lastStatementDate)}`
                  : ''}
              </p>
            )}
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
          aria-labelledby="account-information-title"
          className="mb-8"
        >
          <h2
            id="account-information-title"
            className="mb-4 text-2xl font-bold text-nova-midnight"
          >
            Account information
          </h2>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {getBalanceMetrics(account).map((metric) => (
              <div key={metric.label} className="surface-card p-5">
                <p className="text-sm font-semibold text-nova-slate">
                  {metric.label}
                </p>
                <p className="mt-2 text-xl font-bold text-nova-midnight sm:text-2xl">
                  {metric.value}
                </p>
              </div>
            ))}
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

          <div className="surface-card mb-4 flex flex-wrap items-end gap-4 p-4">
            <div className="min-w-[16rem] flex-1">
              <label
                htmlFor="account-transaction-search"
                className="mb-1.5 block text-sm font-semibold text-nova-midnight"
              >
                Search transactions
              </label>
              <input
                id="account-transaction-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search merchant name or reference"
                className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
              />
            </div>

            <div className="min-w-[12rem]">
              <label
                htmlFor="account-transaction-range"
                className="mb-1.5 block text-sm font-semibold text-nova-midnight"
              >
                Date range
              </label>
              <select
                id="account-transaction-range"
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-semibold text-nova-midnight">
                Type
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['all', 'All'],
                  ['credit', 'Money in'],
                  ['debit', 'Money out'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={directionFilter === value}
                    onClick={() => setDirectionFilter(value)}
                    className={[
                      'min-h-11 rounded-full px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-nova-blue/20',
                      directionFilter === value
                        ? 'bg-nova-navy text-white'
                        : 'border border-nova-slate/30 text-nova-midnight hover:bg-nova-sky',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-[12rem]">
              <label
                htmlFor="account-transaction-category"
                className="mb-1.5 block text-sm font-semibold text-nova-midnight"
              >
                Category
              </label>
              <select
                id="account-transaction-category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
              >
                {TRANSACTION_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setDateRange('30');
                setCustomStart('');
                setCustomEnd('');
                setDirectionFilter('all');
                setCategoryFilter('All categories');
              }}
              className="min-h-11 rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
            >
              Reset filters
            </button>

            {dateRange === 'custom' && (
              <div className="flex flex-wrap gap-3">
                <div>
                  <label
                    htmlFor="account-transaction-start"
                    className="mb-1.5 block text-sm font-semibold text-nova-midnight"
                  >
                    From
                  </label>
                  <input
                    id="account-transaction-start"
                    type="date"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="min-h-11 rounded-lg border border-nova-slate/30 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="account-transaction-end"
                    className="mb-1.5 block text-sm font-semibold text-nova-midnight"
                  >
                    To
                  </label>
                  <input
                    id="account-transaction-end"
                    type="date"
                    value={customEnd}
                    onChange={(event) => setCustomEnd(event.target.value)}
                    className="min-h-11 rounded-lg border border-nova-slate/30 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {!hasProvidedTransactions && transactionData.isLoading && (
            <LoadingSkeleton variant="table" rows={4} label="Loading account activity" />
          )}

          {(!transactionData.isLoading || hasProvidedTransactions) &&
            (filteredTransactions.length > 0 ? (
              <div className="surface-card overflow-hidden">
                <div className="hidden grid-cols-[8rem_minmax(0,1.4fr)_8rem_7rem_auto] gap-4 border-b border-nova-slate/20 bg-nova-sky/30 px-5 py-3 text-xs font-bold uppercase tracking-wide text-nova-slate sm:grid sm:px-6">
                  <span>Date</span>
                  <span>Description</span>
                  <span>Category</span>
                  <span>Status</span>
                  <span className="text-right">Amount</span>
                </div>

                <div className="divide-y divide-nova-slate/15">
                  {filteredTransactions.map((transaction) => {
                    const isExpanded = expandedTransactionId === transaction.id;
                    const postedLabel = transaction.postedAt
                      ? formatDateTime(transaction.postedAt)
                      : '10:45 AM PHT';

                    return (
                      <article key={transaction.id}>
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() =>
                            setExpandedTransactionId(
                              isExpanded ? '' : transaction.id,
                            )
                          }
                          className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-nova-sky/40 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-nova-blue/20 sm:grid-cols-[8rem_minmax(0,1.4fr)_8rem_7rem_auto] sm:items-center sm:gap-4 sm:px-6"
                        >
                          <p className="text-sm text-nova-slate">
                            {getTransactionIsoDate(transaction)
                              ? formatDate(getTransactionIsoDate(transaction))
                              : 'Date unavailable'}
                          </p>
                          <p className="truncate font-semibold text-nova-midnight">
                            {getTransactionDescription(transaction)}
                          </p>
                          <p className="text-sm text-nova-slate">
                            {safeDisplay(transaction.category, 'General')}
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
                            <span className="block">
                              {transaction.status === 'failed' &&
                              transaction.amount === 0
                                ? formatCurrency(0, transaction.currency || account.currency)
                                : formatTransactionAmount(
                                    transaction.amount,
                                    transaction.direction,
                                    transaction.currency || account.currency,
                                  )}
                            </span>
                            <span className="block text-xs font-semibold">
                              {transaction.direction === 'credit'
                                ? 'Money in'
                                : 'Money out'}
                            </span>
                          </p>
                        </button>
                        {isExpanded && (
                          <p className="bg-nova-cream/70 px-5 py-3 text-sm text-nova-ink sm:px-6">
                            Synthetic Demonstration Transaction. Reference:{' '}
                            {transaction.reference || 'Not available'}. Posted at{' '}
                            {postedLabel}.
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No matching transactions"
                description={
                  search || statusFilter || directionFilter !== 'all' || categoryFilter !== 'All categories'
                    ? 'No transactions found in this period. Reset filters or broaden your search.'
                    : 'No transactions found in this period. Reset filters or broaden your search.'
                }
                compact
              />
            ))}
        </section>

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

export { AccountDetailPage };
export default AccountDetailPage;
