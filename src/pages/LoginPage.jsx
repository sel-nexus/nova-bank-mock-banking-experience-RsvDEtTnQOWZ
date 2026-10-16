import React, { useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import { FIXTURES } from '../fixtures/fixtures.js';
import authService from '../services/authService.js';
import { useAppContext } from '../state/AppProvider.jsx';

const DEMO_PASSWORD =
  FIXTURES.credentials.find((credential) => credential.username === 'miguel')
    ?.password || '';
const DEMO_ACCOUNTS = FIXTURES.personas.map((persona) => ({
  name: persona.name,
  userId: persona.username,
  role: persona.role,
}));

function getRedirectLocation(location) {
  const from = location.state?.from;

  if (!from) {
    return ROUTES.dashboard;
  }

  if (typeof from === 'string') {
    return from;
  }

  if (typeof from === 'object' && typeof from.pathname === 'string') {
    return {
      pathname: from.pathname,
      search: from.search || '',
      hash: from.hash || '',
    };
  }

  return ROUTES.dashboard;
}

function getErrorMessage(result) {
  return (
    result?.error?.message ||
    result?.message ||
    'We could not sign you in. Please check your User ID and password and try again.'
  );
}

/**
 * Renders the Nova Bank Demo authentication page.
 *
 * @param {{className?: string, onLogin?: Function}} props
 * @returns {JSX.Element}
 */
function LoginPage({ className = '', onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { actions } = useAppContext();
  const userIdInputId = useId();
  const passwordInputId = useId();
  const languageInputId = useId();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUserId, setRememberUserId] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const rememberedUserId = authService.getRememberedUserId();

      if (rememberedUserId) {
        setUserId(rememberedUserId);
        setRememberUserId(true);
      }
    } catch {
      // A missing browser storage value should not prevent sign-in.
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const normalizedUserId = userId.trim();

    if (!normalizedUserId || !password) {
      setError('Enter your User ID and password to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = actions.login({
        userId: normalizedUserId,
        password,
        rememberMe: rememberUserId,
      });

      if (result?.success === false) {
        setError(getErrorMessage(result));
        return;
      }

      if (typeof onLogin === 'function') {
        try {
          onLogin(result);
        } catch {
          // Consumer callbacks must not interrupt successful navigation.
        }
      }

      navigate(getRedirectLocation(location), { replace: true });
    } catch {
      setError(
        'We could not sign you in right now. Please try again in a moment.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpNavigation = (topic) => {
    navigate(`${ROUTES.help}?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <main
      className={[
        'min-h-screen bg-nova-cream px-4 py-8 sm:px-6 sm:py-12',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[960px] items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-card border border-[#E9E9E9] bg-white shadow-elevated md:grid-cols-2">
          <div className="relative overflow-hidden bg-nova-navy px-6 py-10 text-white sm:px-8 sm:py-12 md:px-8 md:py-12 lg:px-10">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-64 w-64 rounded-full border-[28px] border-white/15"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-black/15"
            />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DCB91C] text-xl font-extrabold text-nova-midnight"
                >
                  N
                </span>
                <div>
                  <p className="text-sm font-extrabold tracking-[0.18em]">
                    NOVA BANK
                  </p>
                  <p className="mt-0.5 text-xs text-white/85">
                    Secure Online Banking
                  </p>
                </div>
              </div>

              <div className="mt-16 max-w-md lg:mt-24">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#FEF4C8]">
                  Welcome back
                </p>
                <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
                  Banking made clear, simple, and yours.
                </h1>
                <p className="mt-5 text-base leading-7 text-white/90">
                  Sign in to explore your accounts, review activity, and try
                  simulated banking journeys in a safe demonstration
                  environment.
                </p>
              </div>

              <div className="mt-auto pt-12">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#DCB91C]/70 bg-[#DCB91C]/15 px-3 py-1.5 text-xs font-semibold text-[#FEF4C8]">
                    256-Bit SSL Encryption
                  </span>
                  <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                    Fraud Monitoring Simulation
                  </span>
                  <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                    Privacy Protected
                  </span>
                </div>
                <p className="mt-5 max-w-md text-xs leading-5 text-white/80">
                  Never enter real passwords, account numbers, or other
                  sensitive information into this demo.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-nova-blue">
                  Secure sign in
                </p>
                <h2 className="mt-2 text-2xl font-bold text-nova-midnight sm:text-3xl">
                  Access your demo
                </h2>
                <p className="mt-2 text-sm text-nova-slate">
                  Use your Nova Bank Demo credentials to continue.
                </p>
              </div>

              <div className="shrink-0">
                <label
                  htmlFor={languageInputId}
                  className="sr-only"
                >
                  Language
                </label>
                <select
                  id={languageInputId}
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="min-h-10 rounded-lg border border-nova-slate/30 bg-white px-2 py-2 text-xs font-semibold text-nova-ink focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                >
                  <option value="en">English</option>
                  <option value="fil">Filipino</option>
                </select>
              </div>
            </div>

            <form
              className="mt-8"
              onSubmit={handleSubmit}
              noValidate
            >
              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-nova-coral/40 bg-nova-coral/10 px-4 py-3 text-sm text-nova-midnight"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor={userIdInputId}
                  className="mb-1.5 block text-sm font-semibold text-nova-midnight"
                >
                  User ID
                </label>
                <input
                  id={userIdInputId}
                  type="text"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  autoComplete="username"
                  placeholder="Enter your User ID"
                  className="min-h-12 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2.5 text-nova-ink outline-none transition placeholder:text-nova-slate/70 focus:border-nova-blue focus:ring-4 focus:ring-nova-blue/20"
                />
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label
                    htmlFor={passwordInputId}
                    className="block text-sm font-semibold text-nova-midnight"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleHelpNavigation('password')}
                    className="text-xs font-semibold text-nova-blue underline-offset-2 transition hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id={passwordInputId}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="min-h-12 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2.5 pr-20 text-nova-ink outline-none transition placeholder:text-nova-slate/70 focus:border-nova-blue focus:ring-4 focus:ring-nova-blue/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-md px-2 text-xs font-semibold text-nova-blue transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-nova-ink">
                <input
                  type="checkbox"
                  checked={rememberUserId}
                  onChange={(event) => setRememberUserId(event.target.checked)}
                  className="h-4 w-4 rounded border-nova-slate/40 text-nova-blue accent-nova-blue focus:ring-4 focus:ring-nova-blue/20"
                />
                <span>Remember my User ID</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-7 flex min-h-12 w-full items-center justify-center rounded-lg bg-nova-navy px-5 py-3 font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => handleHelpNavigation('user-id')}
                className="font-semibold text-nova-blue underline-offset-2 transition hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
              >
                Forgot User ID?
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.help)}
                className="font-semibold text-nova-blue underline-offset-2 transition hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
              >
                Contact support
              </button>
            </div>

            <div className="mt-8 rounded-lg border border-[#DCB91C]/40 bg-[#FEF4C8] px-4 py-3 text-xs leading-5 text-nova-slate">
              <p className="font-semibold text-nova-midnight">
                Demo credentials only
              </p>
              <p className="mt-1">
                Choose a synthetic account to fill the form. The shared demo
                password is <span className="font-semibold text-nova-midnight">{DEMO_PASSWORD}</span>.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.userId}
                    type="button"
                    onClick={() => {
                      setUserId(account.userId);
                      setPassword(DEMO_PASSWORD);
                      setError('');
                    }}
                    className="rounded-lg border border-nova-slate/20 bg-white px-3 py-2 text-left transition hover:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                  >
                    <span className="block font-semibold text-nova-midnight">
                      {account.name}
                    </span>
                    <span className="mt-0.5 block break-all text-nova-slate">
                      {account.userId}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3">
                This experience does not connect to real financial accounts or
                process real transactions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

LoginPage.propTypes = {
  className: PropTypes.string,
  onLogin: PropTypes.func,
};

export { LoginPage };
export default LoginPage;
