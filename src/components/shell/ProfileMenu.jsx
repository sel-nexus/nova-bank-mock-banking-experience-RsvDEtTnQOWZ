import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/constants.js';
import { useSession } from '../../hooks/useSession.js';
import { maskIdentifier } from '../../utils/formatters.js';
import { useAppContext } from '../../state/AppProvider.jsx';
import { useOptionalFacilitator } from '../../state/FacilitatorContext.jsx';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePersonaId(personaOrId) {
  if (typeof personaOrId === 'string' || typeof personaOrId === 'number') {
    return String(personaOrId).trim();
  }

  if (isObject(personaOrId)) {
    return String(
      personaOrId.id || personaOrId.userId || personaOrId.personaId || '',
    ).trim();
  }

  return '';
}

function getDisplayName(persona, fallbackName = '') {
  return (
    persona?.firstName ||
    persona?.name ||
    fallbackName ||
    'Customer'
  );
}

function getInitials(persona, fallbackName = '') {
  const name =
    persona?.name ||
    fallbackName ||
    `${persona?.firstName || ''} ${persona?.lastName || ''}`.trim();

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'NB';
}

function getPersonaIdentifier(persona) {
  return normalizePersonaId(persona);
}

/**
 * Renders the customer profile menu with persona and facilitator controls.
 *
 * @param {{
 *   persona?: Object,
 *   personaId?: string,
 *   userName?: string,
 *   personas?: Object[],
 *   open?: boolean,
 *   isOpen?: boolean,
 *   onOpenChange?: Function,
 *   onPersonaChange?: Function,
 *   onSwitchPersona?: Function,
 *   onReset?: Function,
 *   onLogout?: Function,
 *   showFacilitator?: boolean,
 *   showPersonaSwitcher?: boolean,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function ProfileMenu({
  persona: providedPersona,
  personaId = '',
  userName = '',
  personas: providedPersonas,
  open,
  isOpen,
  onOpenChange,
  onPersonaChange,
  onSwitchPersona,
  onReset,
  onLogout,
  showFacilitator = true,
  showPersonaSwitcher = true,
  className = '',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuId = useId();
  const containerRef = useRef(null);
  const [localOpen, setLocalOpen] = useState(false);
  const { persona: contextPersona, actions } = useAppContext();
  const {
    logout,
  } = useSession();
  const facilitator = useOptionalFacilitator();

  const selectedPersona =
    providedPersona ||
    contextPersona ||
    (personaId ? { id: personaId, name: userName } : null);
  const activePersonaId = getPersonaIdentifier(selectedPersona) || personaId || '';
  const displayName = getDisplayName(selectedPersona, userName);
  const initials = getInitials(selectedPersona, userName);
  const personas = Array.isArray(providedPersonas)
    ? providedPersonas
    : Array.isArray(facilitator?.personas)
      ? facilitator.personas
      : [];
  const isControlled = open !== undefined || isOpen !== undefined;
  const visible = isControlled
    ? open === true || isOpen === true
    : localOpen;
  const shouldShowFacilitator =
    showFacilitator && facilitator?.isOpen !== undefined;
  const errorMode = facilitator?.errorMode || 'disabled';

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      if (
        visible &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setLocalOpen(false);
        onOpenChange?.(false);
      }
    };

    const handleKeyDown = (event) => {
      if (visible && event.key === 'Escape') {
        event.preventDefault();
        setLocalOpen(false);
        onOpenChange?.(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onOpenChange, visible]);

  const setMenuVisibility = (nextVisible) => {
    setLocalOpen(nextVisible);
    onOpenChange?.(nextVisible);
  };

  const handlePersonaChange = (event) => {
    const nextPersonaId = event.target.value;
    const handler = onPersonaChange || onSwitchPersona;

    if (typeof handler === 'function') {
      handler(nextPersonaId);
    } else if (typeof facilitator?.switchPersona === 'function') {
      facilitator.switchPersona(nextPersonaId);
    }
  };

  const handleLogout = () => {
    const result =
      typeof onLogout === 'function' ? onLogout() : logout();

    if (result?.success !== false) {
      setMenuVisibility(false);
      navigate(ROUTES.login);
    }
  };

  const handleReset = () => {
    const result =
      typeof onReset === 'function'
        ? onReset()
        : facilitator?.resetDemonstration?.();

    if (result?.success !== false) {
      setMenuVisibility(false);
    }
  };

  const handleErrorModeChange = (event) => {
    facilitator?.setErrorMode?.(event.target.value);
  };

  const handleTimeout = () => {
    facilitator?.triggerInstantTimeout?.();
    setMenuVisibility(false);
  };

  const handleProfileNavigation = () => {
    setMenuVisibility(false);
    navigate(ROUTES.profile);
  };

  const handleSettingsNavigation = () => {
    setMenuVisibility(false);
    navigate(ROUTES.settings);
  };

  return (
    <div
      ref={containerRef}
      className={['relative', className].filter(Boolean).join(' ')}
      data-testid="profile-menu"
    >
      <button
        type="button"
        aria-label={`Open profile menu for ${displayName}`}
        aria-controls={visible ? menuId : undefined}
        aria-expanded={visible}
        onClick={() => setMenuVisibility(!visible)}
        className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-nova-navy text-xs font-bold text-white"
        >
          {initials}
        </span>
        <span className="hidden max-w-32 text-left xl:block">
          <span className="block truncate text-sm font-semibold text-nova-midnight">
            {displayName}
          </span>
          <span className="block text-xs text-nova-slate">Profile</span>
        </span>
        <span aria-hidden="true" className="hidden text-xs text-nova-slate xl:inline">
          ▾
        </span>
      </button>

      {visible && (
        <section
          id={menuId}
          aria-label="Profile menu"
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-nova-slate/20 bg-white shadow-elevated"
        >
          <header className="border-b border-nova-slate/20 bg-nova-sky/40 px-4 py-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-nova-navy font-bold text-white"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-nova-midnight">
                  {displayName}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-nova-navy">
                  {selectedPersona?.role || 'Retail Banking Customer'}
                </p>
                <p className="mt-0.5 text-xs text-nova-slate">
                  User ID: {selectedPersona?.username || maskIdentifier(activePersonaId)}
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-4 p-4">
            {showPersonaSwitcher && personas.length > 0 && (
              <div>
                <label
                  htmlFor={`${menuId}-persona`}
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-nova-slate"
                >
                  Demo persona
                </label>
                <select
                  id={`${menuId}-persona`}
                  value={activePersonaId}
                  onChange={handlePersonaChange}
                  className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                >
                  {personas.map((item, index) => {
                    const itemId = getPersonaIdentifier(item);
                    const itemName = getDisplayName(item, `Persona ${index + 1}`);

                    return (
                      <option key={itemId || `persona-${index}`} value={itemId}>
                        {itemName}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {shouldShowFacilitator && (
              <div className="rounded-lg border border-nova-slate/20 bg-nova-cream/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-nova-midnight">
                      Demonstration Facilitator
                    </p>
                    <p className="mt-1 text-xs text-nova-slate">
                      Configure the synthetic demonstration.
                    </p>
                  </div>
                  <span className="rounded-full bg-nova-sky px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-nova-blue">
                    {errorMode}
                  </span>
                </div>

                <label
                  htmlFor={`${menuId}-error-mode`}
                  className="mt-3 mb-1.5 block text-xs font-semibold text-nova-midnight"
                >
                  Error mode
                </label>
                <select
                  id={`${menuId}-error-mode`}
                  value={errorMode}
                  onChange={handleErrorModeChange}
                  className="min-h-10 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                >
                  <option value="disabled">Disabled</option>
                  <option value="transient">Transient errors</option>
                  <option value="persistent">Persistent errors</option>
                </select>

                <button
                  type="button"
                  onClick={handleTimeout}
                  className="mt-3 min-h-10 w-full rounded-lg border border-nova-navy px-3 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                >
                  Trigger instant timeout
                </button>
              </div>
            )}

            <nav aria-label="Profile actions" className="space-y-1">
              <button
                type="button"
                onClick={handleProfileNavigation}
                className={[
                  'w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:bg-nova-sky focus:bg-nova-sky focus:outline-none',
                  location.pathname === ROUTES.profile
                    ? 'bg-nova-sky text-nova-midnight'
                    : 'text-nova-ink',
                ].join(' ')}
              >
                View profile
              </button>
              <button
                type="button"
                onClick={handleSettingsNavigation}
                className={[
                  'w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:bg-nova-sky focus:bg-nova-sky focus:outline-none',
                  location.pathname === ROUTES.settings
                    ? 'bg-nova-sky text-nova-midnight'
                    : 'text-nova-ink',
                ].join(' ')}
              >
                Settings
              </button>
            </nav>

            <div className="border-t border-nova-slate/20 pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-nova-slate transition hover:bg-nova-coral/10 hover:text-nova-midnight focus:bg-nova-coral/10 focus:outline-none"
              >
                Reset demonstration
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-nova-midnight transition hover:bg-nova-coral/10 focus:bg-nova-coral/10 focus:outline-none"
              >
                Log out
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

ProfileMenu.propTypes = {
  persona: PropTypes.object,
  personaId: PropTypes.string,
  userName: PropTypes.string,
  personas: PropTypes.arrayOf(PropTypes.object),
  open: PropTypes.bool,
  isOpen: PropTypes.bool,
  onOpenChange: PropTypes.func,
  onPersonaChange: PropTypes.func,
  onSwitchPersona: PropTypes.func,
  onReset: PropTypes.func,
  onLogout: PropTypes.func,
  showFacilitator: PropTypes.bool,
  showPersonaSwitcher: PropTypes.bool,
  className: PropTypes.string,
};

export { ProfileMenu };
export default ProfileMenu;
