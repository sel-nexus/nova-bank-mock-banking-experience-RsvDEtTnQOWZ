import React from 'react';
import PropTypes from 'prop-types';

const VARIANT_LABELS = Object.freeze({
  account: 'Loading account information',
  accounts: 'Loading account information',
  card: 'Loading card information',
  table: 'Loading table data',
  page: 'Loading page content',
});

function normalizeVariant(value) {
  if (typeof value !== 'string') {
    return 'page';
  }

  const normalizedValue = value.trim().toLowerCase();

  return VARIANT_LABELS[normalizedValue] ? normalizedValue : 'page';
}

function normalizeCount(value, fallback, maximum = 12) {
  if (!Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return Math.min(value, maximum);
}

function joinClasses(...values) {
  return values.filter(Boolean).join(' ');
}

function SkeletonBar({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={joinClasses(
        'block animate-pulse rounded bg-nova-slate/20',
        className,
      )}
    />
  );
}

SkeletonBar.propTypes = {
  className: PropTypes.string,
};

function AccountSkeleton({ compact = false }) {
  return (
    <section
      aria-hidden="true"
      className={joinClasses(
        'surface-card animate-pulse p-5 sm:p-6',
        compact ? 'max-w-xl' : 'w-full',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBar className="h-4 w-32" />
          <SkeletonBar className="h-8 w-48 max-w-full" />
          <SkeletonBar className="h-4 w-24" />
        </div>
        <SkeletonBar className="h-8 w-20 shrink-0 rounded-full" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="h-5 w-32" />
        </div>
        <div className="space-y-2">
          <SkeletonBar className="h-3 w-28" />
          <SkeletonBar className="h-5 w-36" />
        </div>
      </div>
    </section>
  );
}

AccountSkeleton.propTypes = {
  compact: PropTypes.bool,
};

function CardSkeleton({ compact = false }) {
  return (
    <section
      aria-hidden="true"
      className={joinClasses(
        'surface-card animate-pulse p-5 sm:p-6',
        compact ? 'max-w-xl' : 'w-full',
      )}
    >
      <div className="flex items-start gap-4">
        <SkeletonBar className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBar className="h-5 w-3/5" />
          <SkeletonBar className="h-4 w-full max-w-md" />
          <SkeletonBar className="h-4 w-4/5 max-w-sm" />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <SkeletonBar className="h-7 w-28" />
        <SkeletonBar className="h-10 w-24 rounded-lg" />
      </div>
    </section>
  );
}

CardSkeleton.propTypes = {
  compact: PropTypes.bool,
};

function TableSkeleton({ rows = 5 }) {
  const rowCount = normalizeCount(rows, 5);

  return (
    <section
      aria-hidden="true"
      className="surface-card animate-pulse overflow-hidden"
    >
      <div className="border-b bg-nova-sky/30 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <SkeletonBar className="h-5 w-40" />
          <SkeletonBar className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="hidden grid-cols-4 gap-4 border-b px-5 py-3 sm:grid sm:px-6">
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="h-3 w-28" />
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="ml-auto h-3 w-16" />
      </div>

      <div className="divide-y">
        {Array.from({ length: rowCount }, (_, index) => (
          <div
            key={`loading-table-row-${index}`}
            className="grid gap-3 px-5 py-4 sm:grid-cols-4 sm:items-center sm:gap-4 sm:px-6"
          >
            <div className="space-y-2">
              <SkeletonBar className="h-4 w-32" />
              <SkeletonBar className="h-3 w-20" />
            </div>
            <SkeletonBar className="h-4 w-40 max-w-full" />
            <SkeletonBar className="h-6 w-20 rounded-full" />
            <SkeletonBar className="h-5 w-24 sm:ml-auto" />
          </div>
        ))}
      </div>
    </section>
  );
}

TableSkeleton.propTypes = {
  rows: PropTypes.number,
};

function PageSkeleton({ rows = 5, cardCount = 3 }) {
  const normalizedCardCount = normalizeCount(cardCount, 3, 6);

  return (
    <div aria-hidden="true" className="w-full animate-pulse">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <SkeletonBar className="h-9 w-56 max-w-full" />
          <SkeletonBar className="h-4 w-80 max-w-full" />
        </div>
        <SkeletonBar className="hidden h-10 w-28 rounded-lg sm:block" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: normalizedCardCount }, (_, index) => (
          <CardSkeleton key={`loading-page-card-${index}`} compact />
        ))}
      </div>

      <TableSkeleton rows={rows} />
    </div>
  );
}

PageSkeleton.propTypes = {
  rows: PropTypes.number,
  cardCount: PropTypes.number,
};

/**
 * Renders an accessible loading skeleton for common banking content.
 *
 * @param {{
 *   variant?: 'account'|'accounts'|'card'|'table'|'page',
 *   type?: string,
 *   rows?: number,
 *   count?: number,
 *   cardCount?: number,
 *   compact?: boolean,
 *   label?: string,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function LoadingSkeleton({
  variant = 'page',
  type = '',
  rows = 5,
  count,
  cardCount = 3,
  compact = false,
  label = '',
  className = '',
}) {
  const normalizedVariant = normalizeVariant(variant || type);
  const statusLabel =
    typeof label === 'string' && label.trim()
      ? label.trim()
      : VARIANT_LABELS[normalizedVariant];

  let content;

  switch (normalizedVariant) {
    case 'account':
    case 'accounts':
      content = <AccountSkeleton compact={compact} />;
      break;
    case 'card':
      content = <CardSkeleton compact={compact} />;
      break;
    case 'table':
      content = <TableSkeleton rows={rows || count} />;
      break;
    case 'page':
    default:
      content = (
        <PageSkeleton
          rows={rows}
          cardCount={cardCount || count}
        />
      );
      break;
  }

  return (
    <div
      aria-busy="true"
      aria-label={statusLabel}
      className={joinClasses('w-full', className)}
      data-testid="loading-skeleton"
      data-variant={normalizedVariant}
      role="status"
    >
      <span className="sr-only">{statusLabel}</span>
      {content}
    </div>
  );
}

LoadingSkeleton.propTypes = {
  variant: PropTypes.string,
  type: PropTypes.string,
  rows: PropTypes.number,
  count: PropTypes.number,
  cardCount: PropTypes.number,
  compact: PropTypes.bool,
  label: PropTypes.string,
  className: PropTypes.string,
};

export {
  AccountSkeleton,
  CardSkeleton,
  PageSkeleton,
  TableSkeleton,
  LoadingSkeleton,
};

export default LoadingSkeleton;
