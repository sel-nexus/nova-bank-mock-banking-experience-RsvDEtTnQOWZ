import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useFacilitator } from '../../state/FacilitatorContext.jsx';

function getPersonaId(persona) {
  return persona?.id || persona?.userId || '';
}

function getPersonaName(persona, index) {
  return (
    persona?.name ||
    [persona?.firstName, persona?.lastName].filter(Boolean).join(' ') ||
    `Persona ${index + 1}`
  );
}

function getActionError(result, fallbackMessage) {
  return result?.error?.message || fallbackMessage;
}

/**
 * Renders demonstration-only controls for switching personas and simulating
 * facilitator scenarios.
 *
 * @param {{
 *   title?: React.ReactNode,
 *   description?: React.ReactNode,
 *   className?: string,
 *   compact?: boolean,
 *   showDescription?: boolean,
 *   onPersonaChange?: Function,
 *   onErrorModeChange?: Function,
 *   onTimeout?: Function,
 *   onReset?: Function
 * }} props
 * @returns {JSX.Element}
 */
function FacilitatorPanel({
  title,
  description,
  className,
  compact,
  showDescription,
  onPersonaChange,
  onErrorModeChange,
  onTimeout,
  onReset,
}) {
  const personaId = useId();
  const errorModeId = useId();
  const [actionError, setActionError] = useState('');

  const facilitator = useFacilitator();
  const personas = Array.isArray(facilitator.personas)
    ? facilitator.personas
    : [];
  const activePersonaId = getPersonaId(facilitator.persona);
  const errorMode = facilitator.errorMode || 'disabled';

  const handlePersonaChange = (event) => {
    setActionError('');

    try {
      const result = facilitator.switchPersona(event.target.value);

      if (result?.success === false) {
        setActionError(
          getActionError(
            result,
            'The demonstration persona could not be changed.',
          ),
        );
        return;
      }

      onPersonaChange?.(event.target.value, result);
    } catch {
      setActionError('The demonstration persona could not be changed.');
    }
  };

  const handleErrorModeChange = (event) => {
    setActionError('');

    try {
      const result = facilitator.setErrorMode(event.target.value);

      if (result?.success === false) {
        setActionError(
          getActionError(result, 'The error mode could not be changed.'),
        );
        return;
      }

      onErrorModeChange?.(event.target.value, result);
    } catch {
      setActionError('The error mode could not be changed.');
    }
  };

  const handleTimeout = () => {
    setActionError('');

    try {
      const result = facilitator.triggerInstantTimeout();

      if (result?.success === false) {
        setActionError(
          getActionError(result, 'The session timeout could not be triggered.'),
        );
        return;
      }

      onTimeout?.(result);
    } catch {
      setActionError('The session timeout could not be triggered.');
    }
  };

  const handleReset = () => {
    setActionError('');

    try {
      const result = facilitator.resetDemonstration();

      if (result?.success === false) {
        setActionError(
          getActionError(result, 'The demonstration could not be reset.'),
        );
        return;
      }

      onReset?.(result);
    } catch {
      setActionError('The demonstration could not be reset.');
    }
  };

  return (
    <aside
      aria-label="Facilitator controls"
      className={[
        'surface-card w-full',
        compact ? 'p-4' : 'p-5 sm:p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="facilitator-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-nova-midnight sm:text-xl">
            {title}
          </h2>
          {showDescription && (
            <p className="mt-1 max-w-2xl text-sm text-nova-slate">
              {description}
            </p>
          )}
        </div>

        <span className="rounded-full bg-nova-sky px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-nova-blue">
          Demo only
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor={personaId}
            className="mb-1.5 block text-sm font-semibold text-nova-midnight"
          >
            Demo persona
          </label>
          <select
            id={personaId}
            value={activePersonaId}
            onChange={handlePersonaChange}
            className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            {personas.length === 0 && (
              <option value="">No personas available</option>
            )}
            {personas.map((persona, index) => (
              <option
                key={getPersonaId(persona) || `persona-${index}`}
                value={getPersonaId(persona)}
              >
                {getPersonaName(persona, index)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={errorModeId}
            className="mb-1.5 block text-sm font-semibold text-nova-midnight"
          >
            Error Mode
          </label>
          <select
            id={errorModeId}
            value={errorMode}
            onChange={handleErrorModeChange}
            className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            <option value="disabled">Disabled</option>
            <option value="transient">Transient errors</option>
            <option value="persistent">Persistent errors</option>
          </select>
        </div>
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-nova-coral/40 bg-nova-coral/10 px-3 py-2 text-sm text-nova-midnight"
        >
          {actionError}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={handleTimeout}
          className="min-h-11 rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
        >
          Instant session timeout
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="min-h-11 rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
        >
          Reset demonstration
        </button>
      </div>

      <p className="mt-4 text-xs text-nova-slate">
        Use these controls to configure the synthetic banking experience. No
        real accounts or sessions are affected.
      </p>
    </aside>
  );
}

FacilitatorPanel.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  className: PropTypes.string,
  compact: PropTypes.bool,
  showDescription: PropTypes.bool,
  onPersonaChange: PropTypes.func,
  onErrorModeChange: PropTypes.func,
  onTimeout: PropTypes.func,
  onReset: PropTypes.func,
};

FacilitatorPanel.defaultProps = {
  title: 'Facilitator controls',
  description: 'Configure the synthetic demonstration.',
  className: '',
  compact: false,
  showDescription: true,
  onPersonaChange: undefined,
  onErrorModeChange: undefined,
  onTimeout: undefined,
  onReset: undefined,
};

export { FacilitatorPanel };
export default FacilitatorPanel;