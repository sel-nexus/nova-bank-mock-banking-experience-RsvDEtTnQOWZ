import React, { useId } from 'react';
import PropTypes from 'prop-types';

function EmptyState({
  title = 'Nothing here yet',
  description = 'There are no results to display right now.',
  message = '',
  action = null,
  actionLabel = '',
  actionText = '',
  onAction,
  onRetry,
  retryLabel = 'Try again',
  icon = '—',
  children,
  className = '',
  compact = false,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const resolvedTitle = title || 'Nothing here yet';
  const resolvedDescription =
    description || message || 'There are no results to display right now.';
  const resolvedAction =
    action && typeof action === 'object' ? action : {};
  const resolvedActionLabel =
    resolvedAction.label ||
    actionLabel ||
    actionText ||
    (onRetry ? retryLabel : '') ||
    'Try again';
  const resolvedActionHandler =
    resolvedAction.onClick || onAction || onRetry;
  const resolvedIcon = icon || '—';
  const hasDescription = Boolean(children || resolvedDescription);

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={hasDescription ? descriptionId : undefined}
      className={[
        'surface-card flex w-full flex-col items-center justify-center text-center',
        compact ? 'px-5 py-8 sm:px-6' : 'px-6 py-12 sm:px-8 sm:py-16',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="empty-state"
    >
      <div
        aria-hidden="true"
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-nova-sky text-2xl font-bold text-nova-blue"
      >
        {resolvedIcon}
      </div>

      <h2
        id={titleId}
        className="text-xl font-bold text-nova-midnight sm:text-2xl"
      >
        {resolvedTitle}
      </h2>

      {hasDescription && (
        <div
          id={descriptionId}
          className="mt-3 max-w-xl text-sm text-nova-slate sm:text-base"
        >
          {children || <p>{resolvedDescription}</p>}
        </div>
      )}

      {typeof resolvedActionHandler === 'function' && (
        <button
          type="button"
          onClick={resolvedActionHandler}
          disabled={resolvedAction.disabled === true}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-nova-navy px-5 py-3 font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resolvedActionLabel}
        </button>
      )}
    </section>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  message: PropTypes.string,
  action: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
  }),
  actionLabel: PropTypes.string,
  actionText: PropTypes.string,
  onAction: PropTypes.func,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
  icon: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  compact: PropTypes.bool,
};

export { EmptyState };
export default EmptyState;
