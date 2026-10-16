import React from 'react';
import PropTypes from 'prop-types';

function PrivacyNotice({ className, compact }) {
  return (
    <aside
      role="note"
      aria-label="Chat privacy reminder"
      className={[
        'w-full rounded-lg border border-nova-slate/20 bg-nova-sky/60 text-nova-ink',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="chat-privacy-notice"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nova-navy text-xs font-bold text-white"
        >
          i
        </span>

        <div className="min-w-0 text-xs leading-5 sm:text-sm">
          <p className="font-semibold text-nova-midnight">
            Protect your privacy
          </p>
          <p className="mt-1">
            Do not enter real card numbers, passwords, verification codes, or
            other sensitive information in this synthetic chat.
          </p>
        </div>
      </div>
    </aside>
  );
}

PrivacyNotice.propTypes = {
  className: PropTypes.string,
  compact: PropTypes.bool,
};

PrivacyNotice.defaultProps = {
  className: '',
  compact: false,
};

export { PrivacyNotice };
export default PrivacyNotice;