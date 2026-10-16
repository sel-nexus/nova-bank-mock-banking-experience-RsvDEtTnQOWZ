import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../state/AppProvider.jsx';
import sessionManager from '../services/sessionManager.js';

/**
 * Provides the current session snapshot and session lifecycle actions.
 *
 * @returns {{
 *   session: Object|null,
 *   snapshot: Object|null,
 *   status: string,
 *   isActive: boolean,
 *   isWarning: boolean,
 *   isExpired: boolean,
 *   isCleared: boolean,
 *   isAuthenticated: boolean,
 *   remainingMilliseconds: number,
 *   remainingSeconds: number,
 *   lastActivityAt: string|null,
 *   warningAt: string|null,
 *   expiresAt: string|null,
 *   continueSession: Function,
 *   logout: Function,
 *   expireSession: Function,
 *   forceExpire: Function,
 *   recordActivity: Function,
 *   signalActivity: Function,
 *   startSession: Function
 * }}
 */
export function useSession() {
  const { state, actions } = useAppContext();
  const [snapshot, setSnapshot] = useState(() =>
    sessionManager.getSnapshot(),
  );

  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return unsubscribe;
  }, []);

  const continueSession = useCallback(() => {
    const nextSnapshot = actions.continueSession();
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }, [actions]);

  const logout = useCallback(() => {
    const result = actions.logout();

    if (result?.success) {
      setSnapshot(sessionManager.getSnapshot());
    }

    return result;
  }, [actions]);

  const expireSession = useCallback(() => {
    const nextSnapshot = actions.expireSession();
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }, [actions]);

  const recordActivity = useCallback(
    (signal = 'activity') => {
      const nextSnapshot = actions.recordActivity(signal);
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    },
    [actions],
  );

  const startSession = useCallback(
    (session) => {
      const nextSnapshot = actions.startSession(session);
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    },
    [actions],
  );

  return useMemo(() => {
    const session = state.session || {};
    const currentSnapshot = snapshot || {};
    const status = currentSnapshot.status || session.status || 'signed-out';

    return {
      session,
      snapshot,
      status,
      isActive: currentSnapshot.isActive === true || status === 'active',
      isWarning:
        currentSnapshot.isWarning === true || status === 'warning',
      isExpired:
        currentSnapshot.isExpired === true || status === 'expired',
      isCleared:
        currentSnapshot.isCleared === true || status === 'cleared',
      isAuthenticated: session.isAuthenticated === true,
      remainingMilliseconds: currentSnapshot.remainingMilliseconds || 0,
      remainingSeconds: currentSnapshot.remainingSeconds || 0,
      lastActivityAt: currentSnapshot.lastActivityAt || null,
      warningAt: currentSnapshot.warningAt || null,
      expiresAt: currentSnapshot.expiresAt || session.expiresAt || null,
      continueSession,
      logout,
      expireSession,
      forceExpire: expireSession,
      recordActivity,
      signalActivity: recordActivity,
      startSession,
    };
  }, [
    continueSession,
    expireSession,
    logout,
    recordActivity,
    snapshot,
    startSession,
    state.session,
  ]);
}

export default useSession;