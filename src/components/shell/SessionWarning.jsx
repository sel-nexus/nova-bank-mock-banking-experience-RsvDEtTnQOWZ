import React, { useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/constants.js';
import { useSession } from '../../hooks/useSession.js';
import { Modal } from '../shared/Modal.jsx';

function SessionWarning({
  onContinue,
  onSignIn,
  className = '',
}) {
  const navigate = useNavigate();
  const continueButtonRef = useRef(null);
  const signInButtonRef = useRef(null);
  const descriptionId = useId();
  const {
    isWarning,
    isExpired,
    remainingSeconds,
    continueSession,
    logout,
  } = useSession();

  const isVisible = isWarning || isExpired;
  const secondsRemaining = Math.max(
    0,
    Number.isFinite(remainingSeconds) ? Math.ceil(remainingSeconds) : 0,
  );

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const targetRef = isExpired ? signInButtonRef : continueButtonRef;
    const timerId = globalThis.setTimeout(() => {
      targetRef.current?.focus();
    }, 0);

    return () => {
      globalThis.clearTimeout(timerId);
    };
  }, [isExpired, isVisible]);

  const handleContinue = () => {
    try {
      const result = continueSession();

      if (result?.status === 'active' || result?.isActive === true) {
        onContinue?.(result);
      }
    } catch {
      // The session lifecycle service owns recovery state.
    }
  };

  const handleSignIn = () => {
    try {
      const result = logout();

      if (result?.success === false) {
        return;
      }
    } catch {
      // Navigation still provides a recovery path when local cleanup fails.
    }

    onSignIn?.();
    navigate(ROUTES.login);
  };

  return (
    <Modal
      open={isVisible}
      onClose={isExpired ? handleSignIn : handleContinue}
      title={isExpired ? 'Your session has ended' : 'Are you still there?'}
      describedBy={descriptionId}
      initialFocusRef={isExpired ? signInButtonRef : continueButtonRef}
      closeOnBackdrop={false}
      closeOnEscape={false}
      showCloseButton={false}
      className={className}
      contentClassName="max-w-lg"
    >
      <div id={descriptionId} className="space-y-4 text-sm text-nova-ink sm:text-base">
        {isExpired ? (
          <>
            <p>
              Your session ended because there was no activity for a while.
              Please sign in again to continue using Nova Bank Demo.
            </p>
            <p className="rounded-lg bg-nova-sky/60 px-4 py-3 text-sm text-nova-slate">
              This is a synthetic banking experience. No real account or
              session information is affected.
            </p>
          </>
        ) : (
          <>
            <p>
              Your session will expire in{' '}
              <strong className="font-bold text-nova-midnight">
                {secondsRemaining} seconds
              </strong>{' '}
              due to inactivity.
            </p>
            <p>
              Continue your session to keep working, or sign in again if you
              are finished.
            </p>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {!isExpired && (
          <button
            ref={continueButtonRef}
            type="button"
            onClick={handleContinue}
            className="min-h-11 rounded-lg bg-nova-navy px-5 py-3 font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
          >
            Continue session
          </button>
        )}

        <button
          ref={signInButtonRef}
          type="button"
          onClick={handleSignIn}
          className={[
            'min-h-11 rounded-lg px-5 py-3 font-semibold transition focus:outline-none focus:ring-4 focus:ring-nova-blue/30',
            isExpired
              ? 'bg-nova-navy text-white hover:bg-nova-midnight'
              : 'border border-nova-navy text-nova-navy hover:bg-nova-sky',
          ].join(' ')}
        >
          Sign in again
        </button>
      </div>
    </Modal>
  );
}

SessionWarning.propTypes = {
  onContinue: PropTypes.func,
  onSignIn: PropTypes.func,
  className: PropTypes.string,
};

export { SessionWarning };
export default SessionWarning;
