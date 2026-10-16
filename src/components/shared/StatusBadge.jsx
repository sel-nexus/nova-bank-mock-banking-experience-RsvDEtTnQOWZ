import React from 'react';
import PropTypes from 'prop-types';

const STATUS_LABELS = Object.freeze({
  posted: 'Posted',
  completed: 'Posted',
  pending: 'Pending',
  declined: 'Declined',
  failed: 'Declined',
  cancelled: 'Declined',
  active: 'Active',
  simulated: 'Simulated',
});

const STATUS_STYLES = Object.freeze({
  posted: 'bg-nova-mint text-nova-teal',
  completed: 'bg-nova-mint text-nova-teal',
  pending: 'bg-[#FEF4C8] text-[#1A1A1A]',
  declined: 'bg-nova-sky text-nova-navy',
  failed: 'bg-nova-sky text-nova-navy',
  cancelled: 'bg-nova-sky text-nova-navy',
  active: 'bg-nova-mint text-nova-teal',
  simulated: 'bg-[#FEF4C8] text-[#1A1A1A]',
});

function normalizeStatus(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function getStatusLabel(status, label, children) {
  if (typeof label === 'string' && label.trim()) {
    return label.trim();
  }

  if (children !== undefined && children !== null) {
    return children;
  }

  return STATUS_LABELS[status] || status.replace(/-/g, ' ') || 'Unknown';
}

/**
 * Renders an accessible status badge for common account and transaction states.
 *
 * @param {{
 *   status?: string,
 *   label?: string,
 *   variant?: string,
 *   simulated?: boolean,
 *   children?: React.ReactNode,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function StatusBadge({
  status = '',
  label = '',
  variant = '',
  simulated = false,
  children,
  className = '',
}) {
  const normalizedStatus = normalizeStatus(
    simulated ? 'simulated' : status || variant,
  );
  const statusLabel = getStatusLabel(normalizedStatus, label, children);
  const statusStyle =
    STATUS_STYLES[normalizedStatus] || 'bg-nova-slate/15 text-nova-ink';

  return (
    <span
      role="status"
      aria-label={String(statusLabel)}
      data-status={normalizedStatus || 'unknown'}
      className={[
        'inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-semibold leading-none',
        statusStyle,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {statusLabel}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string,
  variant: PropTypes.string,
  simulated: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
};

export { StatusBadge };
export default StatusBadge;
