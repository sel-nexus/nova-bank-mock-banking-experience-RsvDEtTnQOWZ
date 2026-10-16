import React from 'react';
import PropTypes from 'prop-types';
import { PRIVACY_COPY } from '../../config/constants.js';

function PrivacyBanner({ className, compact }) {
  const containerClassName = [
    'w-full border-y border-nova-navy/10 bg-nova-sky/70 text-nova-ink',
    compact ? 'px-4 py-3' : 'px-4 py-4 sm:px-6',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside
      role="note"
      aria-label="Privacy and synthetic data notice"
      className={containerClassName}
    >
      <div
        className={[
          'mx-auto flex w-full max-w-7xl items-start gap-3',
          compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base',
        ].join(' ')}
      >
        <div
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nova-navy text-sm font-bold text-white"
        >
          i
        </div>

        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-nova-midnight">
            Synthetic banking experience
          </p>
          <p>{PRIVACY_COPY.demoNotice}</p>
          {!compact && (
            <>
              <p>{PRIVACY_COPY.dataNotice}</p>
              <p className="font-medium">{PRIVACY_COPY.securityNotice}</p>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

PrivacyBanner.propTypes = {
  className: PropTypes.string,
  compact: PropTypes.bool,
};

PrivacyBanner.defaultProps = {
  className: '',
  compact: false,
};

export { PrivacyBanner };
export default PrivacyBanner;