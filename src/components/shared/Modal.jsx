import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

const noop = () => {};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.getClientRects().length > 0,
  );
}

function getDocument() {
  return typeof document !== 'undefined' ? document : null;
}

/**
 * Renders a focus-managed accessible modal dialog.
 *
 * @param {{
 *   open?: boolean,
 *   isOpen?: boolean,
 *   onClose?: Function,
 *   title?: React.ReactNode,
 *   titleId?: string,
 *   children?: React.ReactNode,
 *   closeLabel?: string,
 *   showCloseButton?: boolean,
 *   closeOnBackdrop?: boolean,
 *   closeOnEscape?: boolean,
 *   initialFocusRef?: Object,
 *   className?: string,
 *   contentClassName?: string,
 *   labelledBy?: string,
 *   describedBy?: string
 * }} props
 * @returns {JSX.Element|null}
 */
function Modal({
  open = false,
  isOpen = false,
  onClose = noop,
  title,
  titleId: providedTitleId = '',
  children = null,
  closeLabel = 'Close dialog',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  initialFocusRef = null,
  className = '',
  contentClassName = '',
  labelledBy,
  describedBy,
}) {
  const dialogRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const titleId = useId();
  const resolvedTitleId = providedTitleId || `modal-title-${titleId}`;
  const visible = open || isOpen;
  const hasTitle = title !== undefined && title !== null;
  const resolvedLabelledBy = labelledBy || (hasTitle ? resolvedTitleId : undefined);

  const restoreFocus = useCallback(() => {
    const element = previouslyFocusedElementRef.current;

    if (element && typeof element.focus === 'function') {
      try {
        element.focus({ preventScroll: true });
      } catch {
        element.focus();
      }
    }

    previouslyFocusedElementRef.current = null;
  }, []);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const documentObject = getDocument();

    if (!documentObject) {
      return undefined;
    }

    previouslyFocusedElementRef.current = documentObject.activeElement;

    const focusTimer = globalThis.setTimeout(() => {
      const preferredElement = initialFocusRef?.current;
      const focusableElements = getFocusableElements(dialogRef.current);
      const elementToFocus =
        preferredElement &&
        typeof preferredElement.focus === 'function' &&
        dialogRef.current?.contains(preferredElement)
          ? preferredElement
          : focusableElements[0] || dialogRef.current;

      if (!elementToFocus || typeof elementToFocus.focus !== 'function') {
        return;
      }

      try {
        elementToFocus.focus({ preventScroll: true });
      } catch {
        elementToFocus.focus();
      }
    }, 0);

    return () => {
      globalThis.clearTimeout(focusTimer);
    };
  }, [initialFocusRef, visible]);

  useEffect(() => {
    if (visible) {
      return undefined;
    }

    if (previouslyFocusedElementRef.current) {
      restoreFocus();
    }

    return undefined;
  }, [restoreFocus, visible]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const documentObject = getDocument();

    if (!documentObject) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (closeOnEscape) {
          event.preventDefault();
          onClose();
        }

        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && documentObject.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        documentObject.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    documentObject.addEventListener('keydown', handleKeyDown);

    return () => {
      documentObject.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeOnEscape, onClose, visible]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const documentObject = getDocument();

    if (!documentObject) {
      return undefined;
    }

    const body = documentObject.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  const modal = (
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-nova-midnight/60 backdrop-blur-sm"
        inert="true"
      />

      <section
        ref={dialogRef}
        aria-describedby={describedBy}
        aria-labelledby={resolvedLabelledBy}
        aria-modal="true"
        className={[
          'relative z-10 my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-nova-slate/20 bg-white shadow-elevated outline-none sm:max-h-[calc(100vh-3rem)]',
          contentClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        tabIndex="-1"
      >
        {(hasTitle || showCloseButton) && (
          <header className="flex items-start justify-between gap-4 border-b border-nova-slate/20 px-5 py-4 sm:px-6">
            {hasTitle ? (
              <h2
                id={resolvedTitleId}
                className="min-w-0 text-xl font-bold text-nova-midnight sm:text-2xl"
              >
                {title}
              </h2>
            ) : (
              <span />
            )}

            {showCloseButton && (
              <button
                type="button"
                aria-label={closeLabel}
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-nova-slate transition hover:bg-nova-sky hover:text-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </header>
        )}

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      </section>
    </div>
  );

  const documentObject = getDocument();

  return documentObject?.body ? createPortal(modal, documentObject.body) : modal;
}

Modal.propTypes = {
  open: PropTypes.bool,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  titleId: PropTypes.string,
  children: PropTypes.node,
  closeLabel: PropTypes.string,
  showCloseButton: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  initialFocusRef: PropTypes.shape({
    current: PropTypes.object,
  }),
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  labelledBy: PropTypes.string,
  describedBy: PropTypes.string,
};

export { Modal };
export default Modal;
