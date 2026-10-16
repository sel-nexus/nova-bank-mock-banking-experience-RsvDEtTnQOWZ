import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { FIXTURES } from '../fixtures/fixtures.js';
import { APP_ACTION_TYPES } from './appReducer.js';
import { useAppContext } from './AppProvider.jsx';
import resilienceService from '../services/resilienceService.js';
import sessionManager from '../services/sessionManager.js';

const FacilitatorContext = createContext(null);

const ERROR_MODES = Object.freeze([
  'disabled',
  'transient',
  'persistent',
]);

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function normalizePersonaId(personaOrId) {
  if (isObject(personaOrId)) {
    return normalizeText(
      personaOrId.id || personaOrId.userId || personaOrId.personaId,
    );
  }

  return normalizeText(personaOrId);
}

function normalizeErrorMode(mode) {
  if (mode === true) {
    return 'transient';
  }

  if (mode === false || mode === null || mode === undefined) {
    return 'disabled';
  }

  const normalizedMode = normalizeText(mode).toLowerCase();

  return ERROR_MODES.includes(normalizedMode) ? normalizedMode : null;
}

function getPersona(personaOrId) {
  const personaId = normalizePersonaId(personaOrId);

  if (!personaId) {
    return null;
  }

  return FIXTURES.personas.find((persona) => persona.id === personaId) || null;
}

/**
 * Provides facilitator controls backed by application state and local demo
 * services.
 *
 * @param {{children: React.ReactNode}} props
 * @returns {JSX.Element}
 */
export function FacilitatorProvider({ children }) {
  const { state, dispatch, actions, appSelectors } = useAppContext();
  const facilitator = state.facilitator || {};
  const persona = state.persona || null;

  const setPersona = useCallback(
    (personaOrId) => {
      const selectedPersona = getPersona(personaOrId);

      if (!selectedPersona) {
        return {
          success: false,
          error: {
            code: 'PERSONA_NOT_FOUND',
            message: 'No demo persona was found for the requested selection.',
          },
        };
      }

      dispatch({
        type: APP_ACTION_TYPES.PERSONA_SET,
        payload: {
          persona: selectedPersona,
        },
      });

      return {
        success: true,
        data: selectedPersona,
      };
    },
    [dispatch],
  );

  const switchPersona = useCallback(
    (personaOrId) => setPersona(personaOrId),
    [setPersona],
  );

  const setErrorMode = useCallback(
    (mode) => {
      const normalizedMode = normalizeErrorMode(mode);

      if (normalizedMode === null) {
        return {
          success: false,
          error: {
            code: 'INVALID_ERROR_MODE',
            message: 'Error Mode must be disabled, transient, or persistent.',
          },
        };
      }

      const configuredMode = resilienceService.setFacilitatorErrorMode(
        normalizedMode,
      );

      dispatch({
        type: APP_ACTION_TYPES.FACILITATOR_ERROR_MODE_SET,
        payload: {
          errorMode: configuredMode,
        },
      });

      return {
        success: true,
        data: {
          errorMode: configuredMode,
        },
      };
    },
    [dispatch],
  );

  const enableErrorMode = useCallback(
    (mode = 'transient') => setErrorMode(mode),
    [setErrorMode],
  );

  const disableErrorMode = useCallback(
    () => setErrorMode('disabled'),
    [setErrorMode],
  );

  const triggerInstantTimeout = useCallback(() => {
    const snapshot =
      typeof actions.expireSession === 'function'
        ? actions.expireSession()
        : sessionManager.forceExpire();

    return {
      success: true,
      data: {
        snapshot,
        status: snapshot?.status || 'expired',
      },
    };
  }, [actions]);

  const instantTimeout = useCallback(
    () => triggerInstantTimeout(),
    [triggerInstantTimeout],
  );

  const resetDemonstration = useCallback(() => {
    try {
      const resetResult =
        typeof actions.resetDemo === 'function'
          ? actions.resetDemo()
          : resilienceService.resetResilience();

      return {
        success: true,
        data: resetResult,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESET_DEMONSTRATION_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'The demonstration could not be reset.',
        },
      };
    }
  }, [actions]);

  const resetDemo = useCallback(
    () => resetDemonstration(),
    [resetDemonstration],
  );

  const value = useMemo(
    () => ({
      state: facilitator,
      facilitator,
      persona,
      personas: FIXTURES.personas,
      errorModes: ERROR_MODES,
      isOpen: appSelectors.selectIsFacilitatorOpen(state),
      status: appSelectors.selectFacilitatorStatus(state),
      isLoading: appSelectors.selectIsFacilitatorLoading(state),
      errorMode: appSelectors.selectFacilitatorErrorMode(state),
      isErrorModeEnabled:
        appSelectors.selectIsFacilitatorErrorModeEnabled(state),
      hasError: appSelectors.selectHasFacilitatorError(state),
      setPersona,
      switchPersona,
      setErrorMode,
      enableErrorMode,
      disableErrorMode,
      triggerInstantTimeout,
      instantTimeout,
      resetDemonstration,
      resetDemo,
    }),
    [
      appSelectors,
      facilitator,
      persona,
      state,
      setPersona,
      switchPersona,
      setErrorMode,
      enableErrorMode,
      disableErrorMode,
      triggerInstantTimeout,
      instantTimeout,
      resetDemonstration,
      resetDemo,
    ],
  );

  return (
    <FacilitatorContext.Provider value={value}>
      {children}
    </FacilitatorContext.Provider>
  );
}

FacilitatorProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Returns facilitator state and actions.
 *
 * @returns {Object}
 */
export function useFacilitatorContext() {
  const context = useContext(FacilitatorContext);

  if (!context) {
    throw new Error(
      'useFacilitatorContext must be used within a FacilitatorProvider.',
    );
  }

  return context;
}

/**
 * Alias for useFacilitatorContext.
 *
 * @returns {Object}
 */
export function useFacilitator() {
  return useFacilitatorContext();
}

export default FacilitatorProvider;