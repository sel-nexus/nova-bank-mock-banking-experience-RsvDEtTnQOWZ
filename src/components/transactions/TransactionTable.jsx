import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { EmptyState } from '../shared/EmptyState.jsx';
import { StatusBadge } from '../shared/StatusBadge.jsx';
import {
  formatDate,
  formatDateTime,
  formatTransactionAmount,
  safeDisplay,
} from '../../utils/formatters.js';

function getTransactionId(transaction, index) {
  return String(transaction?.id || transaction?.transactionId || `transaction-${index}`);
}

function getTransactionDate(transaction) {
  return (
    transaction?.date ||
    transaction?.postedAt ||
    transaction?.createdAt ||
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

function getTransactionCategory(transaction) {
  return safeDisplay(
    transaction?.category || transaction?.merchantCategory || transaction?.type,
    'Uncategorized',
  );
}

function getDirectionLabel(direction) {
  const normalizedDirection =
    typeof direction === 'string' ? direction.trim().toLowerCase() : '';

  if (normalizedDirection === 'credit') {
    return 'Credit';
  }

  if (normalizedDirection === 'debit') {
    return 'Debit';
  }

  return 'Direction unavailable';
}

function getDetailValue(value, fallback = 'Not available') {
  return safeDisplay(value, fallback);
}

/**
 * Renders a semantic, expandable transaction table for synthetic banking
 * activity.
 *
 * @param {{
 *   transactions?: Object[],
 *   items?: Object[],
 *   rows?: Object[],
 *   expandedTransactionIds?: Array<string|number>,
 *   defaultExpandedIds?: Array<string|number>,
 *   onExpand?: Function,
 *   onSelect?: Function,
 *   onTransactionClick?: Function,
 *   className?: string,
 *   emptyTitle?: string,
 *   emptyDescription?: string
 * }} props
 * @returns {JSX.Element}
 */
function TransactionTable({
  transactions,
  items,
  rows,
  expandedTransactionIds,
  defaultExpandedIds,
  onExpand,
  onSelect,
  onTransactionClick,
  className,
  emptyTitle,
  emptyDescription,
}) {
  const transactionItems = Array.isArray(transactions)
    ? transactions
    : Array.isArray(items)
      ? items
      : Array.isArray(rows)
        ? rows
        : [];

  const controlledExpandedIds = Array.isArray(expandedTransactionIds)
    ? expandedTransactionIds.map((value) => String(value))
    : null;

  const [localExpandedIds, setLocalExpandedIds] = useState(() =>
    Array.isArray(defaultExpandedIds)
      ? defaultExpandedIds.map((value) => String(value))
      : [],
  );

  const expandedIds = useMemo(
    () =>
      new Set(
        controlledExpandedIds === null
          ? localExpandedIds
          : controlledExpandedIds,
      ),
    [controlledExpandedIds, localExpandedIds],
  );

  const handleToggle = (transaction, transactionId) => {
    const isExpanded = expandedIds.has(transactionId);
    const nextExpandedIds = new Set(expandedIds);

    if (isExpanded) {
      nextExpandedIds.delete(transactionId);
    } else {
      nextExpandedIds.add(transactionId);
    }

    const nextIds = Array.from(nextExpandedIds);

    if (controlledExpandedIds === null) {
      setLocalExpandedIds(nextIds);
    }

    onExpand?.(transaction, !isExpanded, nextIds);
  };

  const handleTransactionSelect = (transaction) => {
    onSelect?.(transaction);
    onTransactionClick?.(transaction);
  };

  if (transactionItems.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        compact
        className={className}
      />
    );
  }

  return (
    <section
      aria-label="Transaction activity"
      className={['surface-card overflow-hidden', className]
        .filter(Boolean)
        .join(' ')}
      data-testid="transaction-table"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[ fiftyrem] border-collapse text-left">
          <caption className="sr-only">
            Transaction activity with expandable details
          </caption>

          <thead className="border-b border-nova-slate/20 bg-nova-sky/40">
            <tr className="text-xs font-bold uppercase tracking-wide text-nova-slate">
              <th scope="col" className="px-5 py-4 sm:px-6">
                Date
              </th>
              <th scope="col" className="px-5 py-4 sm:px-6">
                Description
              </th>
              <th scope="col" className="px-5 py-4 sm:px-6">
                Category
              </th>
              <th scope="col" className="px-5 py-4 sm:px-6">
                Status
              </th>
              <th scope="col" className="px-5 py-4 sm:px-6">
                Direction
              </th>
              <th scope="col" className="px-5 py-4 text-right sm:px-6">
                Amount
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-nova-slate/15">
            {transactionItems.map((transaction, index) => {
              const transactionId = getTransactionId(transaction, index);
              const description = getTransactionDescription(transaction);
              const directionLabel = getDirectionLabel(transaction?.direction);
              const isExpanded = expandedIds.has(transactionId);
              const detailRowId = `${transactionId}-details`;

              return (
                <React.Fragment key={transactionId}>
                  <tr
                    data-testid="transaction-row"
                    className={[
                      'transition hover:bg-nova-sky/30',
                      isExpanded ? 'bg-nova-sky/20' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleTransactionSelect(transaction)}
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-nova-slate sm:px-6">
                      {getTransactionDate(transaction)
                        ? formatDate(getTransactionDate(transaction))
                        : 'Date unavailable'}
                    </td>

                    <th
                      scope="row"
                      className="min-w-56 px-5 py-4 font-semibold text-nova-midnight sm:px-6"
                    >
                      <button
                        type="button"
                        aria-controls={detailRowId}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${description}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggle(transaction, transactionId);
                        }}
                        className="flex items-center gap-2 rounded-lg text-left transition hover:text-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                      >
                        <span
                          aria-hidden="true"
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nova-sky text-nova-blue"
                        >
                          {isExpanded ? '−' : '+'}
                        </span>
                        <span>
                          <span className="block">{description}</span>
                          {transaction?.merchantName &&
                            transaction.merchantName !==
                              transaction.description && (
                              <span className="mt-1 block text-xs font-normal text-nova-slate">
                                {transaction.merchantName}
                              </span>
                            )}
                        </span>
                      </button>
                    </th>

                    <td className="px-5 py-4 text-sm text-nova-slate sm:px-6">
                      {getTransactionCategory(transaction)}
                    </td>

                    <td className="px-5 py-4 sm:px-6">
                      <StatusBadge status={transaction?.status} />
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-nova-ink sm:px-6">
                      <span
                        aria-label={`Direction: ${directionLabel}`}
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                          transaction?.direction === 'credit'
                            ? 'bg-nova-mint text-nova-teal'
                            : transaction?.direction === 'debit'
                              ? 'bg-nova-cream text-nova-midnight'
                              : 'bg-nova-slate/15 text-nova-ink',
                        ].join(' ')}
                      >
                        {directionLabel}
                      </span>
                    </td>

                    <td
                      className={[
                        'whitespace-nowrap px-5 py-4 text-right font-bold sm:px-6',
                        transaction?.direction === 'credit'
                          ? 'text-nova-teal'
                          : 'text-nova-midnight',
                      ].join(' ')}
                    >
                      {formatTransactionAmount(
                        transaction?.amount,
                        transaction?.direction,
                        transaction?.currency,
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr
                      id={detailRowId}
                      data-testid="transaction-detail-row"
                      className="bg-nova-cream/60"
                    >
                      <td colSpan="6" className="px-5 py-5 sm:px-6">
                        <div className="rounded-lg border border-nova-slate/20 bg-white p-4">
                          <h3 className="text-sm font-bold uppercase tracking-wide text-nova-blue">
                            Transaction details
                          </h3>

                          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <dt className="font-semibold text-nova-slate">
                                Reference
                              </dt>
                              <dd className="mt-1 text-nova-ink">
                                {getDetailValue(
                                  transaction?.reference ||
                                    transaction?.transactionReference,
                                )}
                              </dd>
                            </div>

                            <div>
                              <dt className="font-semibold text-nova-slate">
                                Posted date
                              </dt>
                              <dd className="mt-1 text-nova-ink">
                                {transaction?.postedAt
                                  ? formatDateTime(transaction.postedAt)
                                  : 'Not available'}
                              </dd>
                            </div>

                            <div>
                              <dt className="font-semibold text-nova-slate">
                                Transaction type
                              </dt>
                              <dd className="mt-1 capitalize text-nova-ink">
                                {getDetailValue(transaction?.type)}
                              </dd>
                            </div>

                            <div>
                              <dt className="font-semibold text-nova-slate">
                                Account
                              </dt>
                              <dd className="mt-1 text-nova-ink">
                                {getDetailValue(
                                  transaction?.accountName ||
                                    transaction?.accountId,
                                )}
                              </dd>
                            </div>
                          </dl>

                          {transaction?.notes && (
                            <p className="mt-4 border-t border-nova-slate/15 pt-4 text-sm text-nova-slate">
                              <span className="font-semibold text-nova-ink">
                                Notes:
                              </span>{' '}
                              {transaction.notes}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

TransactionTable.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object),
  items: PropTypes.arrayOf(PropTypes.object),
  rows: PropTypes.arrayOf(PropTypes.object),
  expandedTransactionIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ),
  defaultExpandedIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ),
  onExpand: PropTypes.func,
  onSelect: PropTypes.func,
  onTransactionClick: PropTypes.func,
  className: PropTypes.string,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
};

TransactionTable.defaultProps = {
  transactions: undefined,
  items: undefined,
  rows: undefined,
  expandedTransactionIds: undefined,
  defaultExpandedIds: [],
  onExpand: undefined,
  onSelect: undefined,
  onTransactionClick: undefined,
  className: '',
  emptyTitle: 'No transactions available',
  emptyDescription:
    'There is no transaction activity to display right now.',
};

export { TransactionTable };
export default TransactionTable;