import React, { useCallback, useState } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppProvider, useAppContext } from './AppProvider.jsx';
import { FacilitatorProvider, useFacilitator } from './FacilitatorContext.jsx';
import { useDomainData } from '../hooks/useDomainData.js';
import authService from '../services/authService.js';
import resilienceService from '../services/resilienceService.js';
import sessionManager from '../services/sessionManager.js';
import storageService from '../services/storageService.js';

const VALID_USER_ID = 'user-miguel-santos';
const VALID_PASSWORD = 'demo-only';
const SECOND_PERSONA_ID = 'user-rosa-delacruz';

function createDeferred() {
  let resolve;
  let reject;

  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

function StateHarness() {
  const { state, actions } = useAppContext();
  const facilitator = useFacilitator();

  return (
    <div>
      <p data-testid="persona-name">{state.persona?.name || 'No persona'}</p>
      <p data-testid="session-status">{state.session.status}</p>
      <p data-testid="authenticated">
        {state.session.isAuthenticated ? 'authenticated' : 'signed out'}
      </p>
      <p data-testid="error-mode">{facilitator.errorMode}</p>

      <button
        type="button"
        onClick={() =>
          actions.login({
            userId: VALID_USER_ID,
            password: VALID_PASSWORD,
          })
        }
      >
        Sign in
      </button>

      <button type="button" onClick={() => actions.logout()}>
        Sign out
      </button>

      <button
        type="button"
        onClick={() => facilitator.switchPersona(SECOND_PERSONA_ID)}
      >
        Switch persona
      </button>

      <button
        type="button"
        onClick={() => facilitator.setErrorMode('persistent')}
      >
        Enable persistent errors
      </button>

      <button
        type="button"
        onClick={() => facilitator.resetDemonstration()}
      >
        Reset demonstration
      </button>

      <button
        type="button"
        onClick={() => facilitator.triggerInstantTimeout()}
      >
        Trigger timeout
      </button>
    </div>
  );
}

function StaleResponseHarness({ requests }) {
  const { persona } = useAppContext();
  const [reloadKey, setReloadKey] = useState(0);

  const loadData = useCallback(() => {
    const request = {
      personaId: persona?.id || '',
      deferred: createDeferred(),
    };

    requests.push(request);
    return request.deferred.promise;
  }, [persona?.id, requests]);

  const result = useDomainData(loadData, {
    enabled: Boolean(persona?.id),
    dependencies: [persona?.id],
    reloadKey,
    initialData: null,
  });

  return (
    <div>
      <p data-testid="loaded-owner">
        {result.data?.owner || 'No response'}
      </p>
      <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
        Reload data
      </button>
    </div>
  );
}

function renderStateHarness() {
  return render(
    <AppProvider>
      <FacilitatorProvider>
        <StateHarness />
      </FacilitatorProvider>
    </AppProvider>,
  );
}

describe('AppProvider', () => {
  beforeEach(() => {
    storageService.resetStorage();
    resilienceService.resetResilience();
    sessionManager.clear();
  });

  afterEach(() => {
    cleanup();
    sessionManager.clear();
    storageService.resetStorage();
    resilienceService.resetResilience();
  });

  it('switches the active persona through facilitator controls', async () => {
    const user = userEvent.setup();

    renderStateHarness();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByTestId('persona-name')).toHaveTextContent(
      'Miguel Santos',
    );

    await user.click(
      screen.getByRole('button', { name: 'Switch persona' }),
    );

    expect(await screen.findByTestId('persona-name')).toHaveTextContent(
      'Rosa Delacruz',
    );
    expect(screen.getByTestId('authenticated')).toHaveTextContent(
      'authenticated',
    );
  });

  it('resets the demonstration and clears persona and protected session state', async () => {
    const user = userEvent.setup();

    renderStateHarness();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('authenticated')).toHaveTextContent(
      'authenticated',
    );

    await user.click(
      screen.getByRole('button', { name: 'Enable persistent errors' }),
    );

    expect(screen.getByTestId('error-mode')).toHaveTextContent('persistent');

    await user.click(
      screen.getByRole('button', { name: 'Reset demonstration' }),
    );

    await waitFor(() => {
      expect(screen.getByTestId('persona-name')).toHaveTextContent(
        'No persona',
      );
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'signed out',
      );
      expect(screen.getByTestId('session-status')).toHaveTextContent(
        'signed-out',
      );
      expect(screen.getByTestId('error-mode')).toHaveTextContent('disabled');
    });

    expect(authService.isAuthenticated()).toBe(false);
  });

  it('updates facilitator error mode and expires the protected session on timeout', async () => {
    const user = userEvent.setup();

    renderStateHarness();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('session-status')).toHaveTextContent(
      'active',
    );

    await user.click(
      screen.getByRole('button', { name: 'Enable persistent errors' }),
    );

    expect(screen.getByTestId('error-mode')).toHaveTextContent('persistent');

    await user.click(screen.getByRole('button', { name: 'Trigger timeout' }));

    await waitFor(() => {
      expect(screen.getByTestId('session-status')).toHaveTextContent('expired');
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'signed out',
      );
      expect(screen.getByTestId('persona-name')).toHaveTextContent(
        'No persona',
      );
    });
  });

  it('protects session state by signing the user out explicitly', async () => {
    const user = userEvent.setup();

    renderStateHarness();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByTestId('session-status')).toHaveTextContent(
      'active',
    );
    expect(screen.getByTestId('authenticated')).toHaveTextContent(
      'authenticated',
    );

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(screen.getByTestId('session-status')).toHaveTextContent(
        'signed-out',
      );
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'signed out',
      );
      expect(screen.getByTestId('persona-name')).toHaveTextContent(
        'No persona',
      );
    });
  });

  it('ignores stale domain responses after the active persona changes', async () => {
    const user = userEvent.setup();
    const requests = [];

    render(
      <AppProvider>
        <FacilitatorProvider>
          <StateHarness />
          <StaleResponseHarness requests={requests} />
        </FacilitatorProvider>
      </AppProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(requests).toHaveLength(1);
      expect(requests[0].personaId).toBe(VALID_USER_ID);
    });

    await user.click(
      screen.getByRole('button', { name: 'Switch persona' }),
    );

    await waitFor(() => {
      expect(requests).toHaveLength(2);
      expect(requests[1].personaId).toBe(SECOND_PERSONA_ID);
    });

    await act(async () => {
      requests[0].deferred.resolve({ owner: 'Miguel Santos' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('loaded-owner')).toHaveTextContent(
        'No response',
      );
    });

    await act(async () => {
      requests[1].deferred.resolve({ owner: 'Rosa Delacruz' });
    });

    expect(await screen.findByTestId('loaded-owner')).toHaveTextContent(
      'Rosa Delacruz',
    );
  });
});