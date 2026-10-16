import React, { useId } from 'react';
import PropTypes from 'prop-types';
import {
  formatCurrency,
  formatNumber,
  safeDisplay,
} from '../../utils/formatters.js';

function getFirstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function getNumericValue(value, fallback = 0) {
  const numericValue =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getAccountValue(account, providedValue, fields, fallback) {
  if (providedValue !== undefined && providedValue !== null) {
    return providedValue;
  }

  return getFirstDefined(...fields.map((field) => account?.[field]), fallback);
}

function getAnnualInterestDisplay(value) {
  if (value === undefined || value === null || value === '') {
    return 'Not available';
  }

  const numericValue = getNumericValue(value, NaN);

  if (!Number.isFinite(numericValue)) {
    return safeDisplay(value, 'Not available');
  }

  return `${formatNumber(numericValue, 2)}%`;
}

function getRelationshipExclusion(account, providedValue) {
  if (providedValue !== undefined && providedValue !== null) {
    return Boolean(providedValue);
  }

  return Boolean(
    account?.excludeFromRelationshipBalance ||
      account?.excludedFromRelationshipBalance ||
      account?.relationshipBalanceExcluded ||
      account?.isExcludedFromRelationshipBalance,
  );
}

function getRelationshipExclusionReason(account, providedReason) {
  return (
    providedReason ||
    account?.relationshipBalanceExclusionReason ||
    account?.exclusionReason ||
    ''
  );
}

/**
 * Renders current, available, pending, interest, and relationship-balance
 * inclusion details for a synthetic bank account.
 *
 * @param {{
 *   account?: Object,
 *   balance?: number|string,
 *   currentBalance?: number|string,
 *   ledgerBalance?: number|string,
 *   availableBalance?: number|string,
 *   pendingBalance?: number|string,
 *   pendingAmount?: number|string,
 *   annualInterest?: number|string,
 *   annualInterestRate?: number|string,
 *   interestRate?: number|string,
 *   excludeFromRelationshipBalance?: boolean,
 *   relationshipBalanceExcluded?: boolean,
 *   relationshipBalanceExclusionReason?: string,
 *   currency?: string,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function BalanceBreakdown({
  account,
  balance,
  currentBalance,
  ledgerBalance,
  availableBalance,
  pendingBalance,
  pendingAmount,
  annualInterest,
  annualInterestRate,
  interestRate,
  excludeFromRelationshipBalance,
  relationshipBalanceExcluded,
  relationshipBalanceExclusionReason,
  currency,
  className,
}) {
  const titleId = useId();
  const accountData = account || {};
  const displayedCurrency =
    currency || accountData.currency || 'USD';

  const currentValue = getNumericValue(
    getAccountValue(
      accountData,
      getFirstDefined(currentBalance, ledgerBalance, balance),
      ['currentBalance', 'ledgerBalance', 'balance'],
      0,
    ),
  );
  const availableValue = getNumericValue(
    getAccountValue(
      accountData,
      availableBalance,
      ['availableBalance', 'available'],
      currentValue,
    ),
  );
  const pendingValue = getNumericValue(
    getAccountValue(
      accountData,
      getFirstDefined(pendingBalance, pendingAmount),
      ['pendingBalance', 'pendingAmount', 'pending'],
      0,
    ),
  );
  const displayedAnnualInterest = getAnnualInterestDisplay(
    getAccountValue(
      accountData,
      getFirstDefined(annualInterestRate, annualInterest, interestRate),
      ['annualInterestRate', 'annualInterest', 'interestRate'],
      undefined,
    ),
  );
  const isExcluded = getRelationshipExclusion(
    accountData,
    getFirstDefined(
      excludeFromRelationshipBalance,
      relationshipBalanceExcluded,
    ),
  );
  const exclusionReason = getRelationshipExclusionReason(
    accountData,
    relationshipBalanceExclusionReason,
  );

  const metrics = [
    {
      label: 'Available balance',
      value: formatCurrency(availableValue, displayedCurrency),
      description: 'Funds currently available for eligible activity.',
      valueClassName: 'text-nova-teal',
    },
    {
      label: 'Current / ledger balance',
      value: formatCurrency(currentValue, displayedCurrency),
      description: 'The current posted balance for this account.',
      valueClassName: 'text-nova-midnight',
    },
    {
      label: 'Pending activity',
      value: formatCurrency(pendingValue, displayedCurrency),
      description: 'Transactions that have not posted yet.',
      valueClassName: 'text-nova-ink',
    },
    {
      label: 'Annual interest',
      value: displayedAnnualInterest,
      description: 'Annual interest rate shown for this account.',
      valueClassName: 'text-nova-midnight',
    },
  ];

  return (
    <section
      aria-labelledby={titleId}
      className={['surface-card p-5 sm:p-6', className]
        .filter(Boolean)
        .join(' ')}
      data-testid="balance-breakdown"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-nova-blue">
          Balance breakdown
        </p>
        <h2
          id={titleId}
          className="mt-1 text-2xl font-bold text-nova-midnight"
        >
          Account balances
        </h2>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg bg-nova-cream/70 p-4"
          >
            <dt className="text-sm font-semibold text-nova-slate">
              {metric.label}
            </dt>
            <dd className={['mt-2 text-2xl font-bold', metric.valueClassName].join(' ')}>
              {metric.value}
            </dd>
            <p className="mt-2 text-xs leading-5 text-nova-slate">
              {metric.description}
            </p>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-col gap-3 rounded-lg border border-nova-slate/20 bg-nova-sky/50 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-nova-midnight">
            Relationship balance
          </p>
          <p className="mt-1 text-sm text-nova-slate">
            {isExcluded
              ? 'This account is excluded from the relationship balance.'
              : 'This account is included in the relationship balance.'}
          </p>
          {isExcluded && exclusionReason && (
            <p className="mt-2 text-xs text-nova-slate">
              {exclusionReason}
            </p>
          )}
        </div>

        <span
          className={[
            'inline-flex min-h-7 shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold',
            isExcluded
              ? 'bg-nova-coral/20 text-nova-midnight'
              : 'bg-nova-mint text-nova-teal',
          ].join(' ')}
          data-testid="relationship-balance-status"
        >
          {isExcluded ? 'Excluded' : 'Included'}
        </span>
      </div>
    </section>
  );
}

BalanceBreakdown.propTypes = {
  account: PropTypes.object,
  balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currentBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  ledgerBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  availableBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  pendingBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  pendingAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  annualInterest: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  annualInterestRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  interestRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  excludeFromRelationshipBalance: PropTypes.bool,
  relationshipBalanceExcluded: PropTypes.bool,
  relationshipBalanceExclusionReason: PropTypes.string,
  currency: PropTypes.string,
  className: PropTypes.string,
};

BalanceBreakdown.defaultProps = {
  account: {},
  balance: undefined,
  currentBalance: undefined,
  ledgerBalance: undefined,
  availableBalance: undefined,
  pendingBalance: undefined,
  pendingAmount: undefined,
  annualInterest: undefined,
  annualInterestRate: undefined,
  interestRate: undefined,
  excludeFromRelationshipBalance: undefined,
  relationshipBalanceExcluded: undefined,
  relationshipBalanceExclusionReason: '',
  currency: '',
  className: '',
};

export { BalanceBreakdown };
export default BalanceBreakdown;