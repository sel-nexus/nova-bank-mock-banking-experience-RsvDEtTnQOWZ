import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { StatusBadge } from '../shared/StatusBadge.jsx';
import {
  formatDate,
  maskAccountNumber,
  safeDisplay,
} from '../../utils/formatters.js';

function getAccountNumber(account, providedAccountNumber) {
  return (
    providedAccountNumber ||
    account?.maskedAccountNumber ||
    account?.maskedAccount ||
    (account?.accountNumber
      ? maskAccountNumber(account.accountNumber)
      : 'Account number unavailable')
  );
}

function getLastStatementDate(account, providedDate) {
  return (
    providedDate ||
    account?.lastStatementDate ||
    account?.statementDate ||
    account?.lastStatementAt ||
    ''
  );
}

function formatMetadataDate(value) {
  if (!value) {
    return 'Not available';
  }

  const formattedDate = formatDate(value);
  return formattedDate === '—' ? 'Not available' : formattedDate;
}

/**
 * Renders identifying and summary metadata for a synthetic bank account.
 *
 * @param {{
 *   account?: Object,
 *   title?: string,
 *   accountNumber?: string,
 *   maskedAccountNumber?: string,
 *   status?: string,
 *   currency?: string,
 *   lastStatementDate?: string|Date|number,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function AccountMetadata({
  account = {},
  title = '',
  accountNumber = '',
  maskedAccountNumber = '',
  status = '',
  currency = '',
  lastStatementDate = '',
  className = '',
}) {
  const titleId = useId();
  const accountData = account || {};
  const accountTitle = safeDisplay(
    title || accountData.title || accountData.name,
    'Unnamed account',
  );
  const displayedAccountNumber = getAccountNumber(
    accountData,
    maskedAccountNumber || accountNumber,
  );
  const displayedStatus = status || accountData.status || '';
  const displayedCurrency = currency || accountData.currency || '';
  const displayedStatementDate = getLastStatementDate(
    accountData,
    lastStatementDate,
  );

  return (
    <section
      aria-labelledby={titleId}
      className={['surface-card p-5 sm:p-6', className]
        .filter(Boolean)
        .join(' ')}
      data-testid="account-metadata"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-nova-slate">
            Account
          </p>
          <h2
            id={titleId}
            className="mt-1 truncate text-2xl font-bold text-nova-midnight"
          >
            {accountTitle}
          </h2>
          <p className="mt-2 text-sm text-nova-slate">
            {displayedAccountNumber}
          </p>
        </div>

        <StatusBadge status={displayedStatus} />
      </div>

      <dl className="mt-6 grid gap-4 border-t border-nova-slate/20 pt-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
            Currency
          </dt>
          <dd className="mt-1 font-semibold text-nova-midnight">
            {safeDisplay(displayedCurrency, 'Not available')}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
            Last statement date
          </dt>
          <dd className="mt-1 font-semibold text-nova-midnight">
            {formatMetadataDate(displayedStatementDate)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
            Account status
          </dt>
          <dd className="mt-1 font-semibold capitalize text-nova-midnight">
            {safeDisplay(displayedStatus, 'Not available')}
          </dd>
        </div>
      </dl>
    </section>
  );
}

AccountMetadata.propTypes = {
  account: PropTypes.object,
  title: PropTypes.string,
  accountNumber: PropTypes.string,
  maskedAccountNumber: PropTypes.string,
  status: PropTypes.string,
  currency: PropTypes.string,
  lastStatementDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
    PropTypes.number,
  ]),
  className: PropTypes.string,
};

export { AccountMetadata };
export default AccountMetadata;
