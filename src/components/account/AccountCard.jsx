import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../config/constants.js';
import { StatusBadge } from '../shared/StatusBadge.jsx';
import {
  formatPhpCurrency,
  maskAccountNumber,
  safeDisplay,
} from '../../utils/formatters.js';

function getAccountTypeLabel(type) {
  if (typeof type !== 'string' || !type.trim()) {
    return 'Account';
  }

  return type
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getAccountNumber(account) {
  return (
    account?.maskedAccountNumber ||
    account?.maskedAccount ||
    (account?.accountNumber
      ? maskAccountNumber(account.accountNumber)
      : 'Account number unavailable')
  );
}

function getAccountRoute(accountId) {
  return `${ROUTES.accounts}/${encodeURIComponent(String(accountId || ''))}`;
}

/**
 * Renders a masked summary card for a synthetic bank account.
 *
 * @param {{
 *   account: Object,
 *   className?: string,
 *   onSelect?: Function
 * }} props
 * @returns {JSX.Element}
 */
function AccountCard({ account, className, onSelect }) {
  const accountType = getAccountTypeLabel(account.type);
  const accountName = safeDisplay(account.name, 'Unnamed account');
  const accountNumber = getAccountNumber(account);
  const balance = Number.isFinite(account.balance) ? account.balance : 0;
  const accountId = account.id || '';

  return (
    <article
      className={[
        'surface-card flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-nova-blue/40 sm:p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="account-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-nova-slate">
            {accountType}
          </p>
          <h2 className="mt-1 truncate text-xl font-bold text-nova-midnight">
            {accountName}
          </h2>
        </div>

        <StatusBadge status={account.status} />
      </div>

      <p className="mt-4 text-sm text-nova-slate">{accountNumber}</p>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
          Balance
        </p>
        <p className="mt-1 text-3xl font-bold text-nova-midnight">
          {formatPhpCurrency(balance)}
        </p>
      </div>

      <NavLink
        to={getAccountRoute(accountId)}
        onClick={() => onSelect?.(account)}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
      >
        View details
      </NavLink>
    </article>
  );
}

AccountCard.propTypes = {
  account: PropTypes.object.isRequired,
  className: PropTypes.string,
  onSelect: PropTypes.func,
};

AccountCard.defaultProps = {
  className: '',
  onSelect: undefined,
};

export { AccountCard };
export default AccountCard;