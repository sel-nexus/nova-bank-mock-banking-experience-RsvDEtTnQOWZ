import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSessionManager,
  SESSION_EXPIRY_MILLISECONDS,
  SESSION_INACTIVITY_WARNING_MILLISECONDS,
} from './sessionManager.js';

function createControlledSessionManager(options = {}) {
  let currentTime = 0;
  let timerSequence = 0;
  const timers = new Map();

  const manager = createSessionManager({
    autoStart: false,
    now: () => currentTime,
    timers: {
      setTimeout: (callback, delay) => {
        timerSequence += 1;
        timers.set(timerSequence, { callback, delay });
        return timerSequence;
      },
      clearTimeout: (timerId) => {
        timers.delete(timerId);
      },
    },
    ...options,
  });

  return {
    manager,
    timers,
    setTime: (time) => {
      currentTime = time;
    },
    runTimer: (delay) => {
      const timer = Array.from(timers.entries()).find(
        ([, scheduledTimer]) => scheduledTimer.delay === delay,
      );

      if (!timer) {
        throw new Error(`No timer scheduled for ${delay} milliseconds.`);
      }

      timers.delete(timer[0]);
      timer[1].callback();
    },
  };
}

describe('SessionManager', () => {
  let controlled;

  beforeEach(() => {
    controlled = createControlledSessionManager({
      warningAfterMilliseconds: 1000,
      expiryAfterMilliseconds: 500,
    });
  });

  it('starts an active session and records the activity signal', () => {
    const { manager, setTime } = controlled;

    setTime(100);
    const startedSnapshot = manager.start({ sessionId: 'demo-session' });

    expect(startedSnapshot.status).toBe('active');
    expect(startedSnapshot.isActive).toBe(true);
    expect(startedSnapshot.sessionId).toBe('demo-session');
    expect(startedSnapshot.remainingMilliseconds).toBe(1000);

    setTime(350);
    const activitySnapshot = manager.recordActivity('pointerdown');

    expect(activitySnapshot.status).toBe('active');
    expect(activitySnapshot.activitySignal).toBe('pointerdown');
    expect(activitySnapshot.lastActivityAt).toBe(
      new Date(350).toISOString(),
    );
    expect(activitySnapshot.remainingMilliseconds).toBe(1000);
  });

  it('enters the warning state and reports a decreasing countdown', () => {
    const { manager, runTimer, setTime } = controlled;

    setTime(0);
    manager.start({ sessionId: 'warning-session' });

    setTime(1000);
    runTimer(1000);

    expect(manager.getSnapshot()).toMatchObject({
      status: 'warning',
      isWarning: true,
      remainingMilliseconds: 500,
      remainingSeconds: 1,
    });

    setTime(1250);

    expect(manager.getSnapshot()).toMatchObject({
      status: 'warning',
      remainingMilliseconds: 250,
      remainingSeconds: 1,
    });
  });

  it('continues a warning session and resets its inactivity countdown', () => {
    const { manager, runTimer, setTime } = controlled;

    setTime(0);
    manager.start({ sessionId: 'continue-session' });

    setTime(1000);
    runTimer(1000);

    setTime(1200);
    const continuedSnapshot = manager.continueSession();

    expect(continuedSnapshot.status).toBe('active');
    expect(continuedSnapshot.isActive).toBe(true);
    expect(continuedSnapshot.activitySignal).toBe('continue');
    expect(continuedSnapshot.remainingMilliseconds).toBe(1000);
    expect(manager.getSnapshot().status).toBe('active');
  });

  it('force expires the active session immediately', () => {
    const { manager, setTime } = controlled;

    setTime(50);
    manager.start({ sessionId: 'force-expire-session' });

    setTime(200);
    const expiredSnapshot = manager.forceExpire();

    expect(expiredSnapshot.status).toBe('expired');
    expect(expiredSnapshot.isExpired).toBe(true);
    expect(expiredSnapshot.isActive).toBe(false);
    expect(expiredSnapshot.remainingMilliseconds).toBe(0);
    expect(manager.getSnapshot().status).toBe('expired');
  });

  it('expires a warning session when the warning countdown completes', () => {
    const { manager, runTimer, setTime } = controlled;

    manager.start({ sessionId: 'countdown-session' });

    setTime(1000);
    runTimer(1000);

    setTime(1500);
    runTimer(500);

    expect(manager.getSnapshot()).toMatchObject({
      status: 'expired',
      isExpired: true,
      remainingMilliseconds: 0,
      remainingSeconds: 0,
    });
  });

  it('clears the session for logout and ignores later activity', () => {
    const { manager, timers, setTime } = controlled;

    setTime(0);
    manager.start({ sessionId: 'logout-session' });

    expect(timers.size).toBe(1);

    setTime(100);
    const clearedSnapshot = manager.clear();

    expect(clearedSnapshot.status).toBe('cleared');
    expect(clearedSnapshot.isCleared).toBe(true);
    expect(manager.getSnapshot().status).toBe('cleared');
    expect(timers.size).toBe(0);

    setTime(200);
    const activitySnapshot = manager.recordActivity('click');

    expect(activitySnapshot).toBeNull();
    expect(manager.getSnapshot().status).toBe('cleared');
  });

  it('returns null when clearing a manager that has no session', () => {
    const manager = createSessionManager({
      autoStart: false,
      warningAfterMilliseconds: SESSION_INACTIVITY_WARNING_MILLISECONDS,
      expiryAfterMilliseconds: SESSION_EXPIRY_MILLISECONDS,
    });

    expect(manager.getSnapshot()).toBe(null);
    expect(manager.clear()).toBe(null);
    expect(manager.forceExpire()).toBe(null);
    expect(manager.continueSession()).toBe(null);
  });
});