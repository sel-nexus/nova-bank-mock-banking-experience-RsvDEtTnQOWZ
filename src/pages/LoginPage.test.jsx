import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LoginPage } from './LoginPage.jsx';
import { ProtectedRoute } from '../routes/ProtectedRoute.jsx';
import { ROUTES } from '../config/constants.js';
import authService from '../services/authService.js';
import sessionManager from '../services/sessionManager.js';
import storageService from '../services/storageService.js';
import { AppProvider } from '../state/AppProvider.jsx';

const VALID_USER_ID = 'user-miguel-santos';
const VALID_PASSWORD = 'demo-only';

function LocationProbe() {
  const location = useLocation();

  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderLogin(initialEntries = [ROUTES.login]) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <LoginPage />
        <LocationProbe />
      </MemoryRouter>
    </AppProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    storageService.resetStorage();
    sessionManager.clear();
  });

  afterEach(() => {
    cleanup();
    sessionManager.clear();
    storageService.resetStorage();
  });

  it('renders an accessible sign-in form with the expected controls and demo notice', () => {
    renderLogin();

    expect(
      screen.getByRole('heading', { name: 'Access your demo' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('User ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
    expect(
      screen.getByRole('button', { name: 'Sign in' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Demo credentials only')).toBeInTheDocument();
  });

  it('shows a required-field error when User ID and password are missing', async () => {
    const user = userEvent.setup();

    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('alert', {
        name: '',
      }),
    ).toHaveTextContent('Enter your User ID and password to continue.');
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('shows an authentication error for invalid credentials', async () => {
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText('User ID'), VALID_USER_ID);
    await user.type(screen.getByLabelText('Password'), 'incorrect-demo-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The User ID or password is incorrect.',
    );
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('toggles password visibility between hidden and visible states', async () => {
    const user = userEvent.setup();

    renderLogin();

    const passwordInput = screen.getByLabelText('Password');

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide password' }));

    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('navigates to password recovery help from the recovery link', async () => {
    const user = userEvent.setup();

    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        `${ROUTES.help}?topic=password`,
      );
    });
  });

  it('navigates to the dashboard after successful sign-in', async () => {
    const user = userEvent.setup();

    renderLogin();

    await user.type(screen.getByLabelText('User ID'), VALID_USER_ID);
    await user.type(screen.getByLabelText('Password'), VALID_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        ROUTES.dashboard,
      );
    });
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('keeps the signed-in session when a protected route is opened', async () => {
    const user = userEvent.setup();

    render(
      <AppProvider>
        <MemoryRouter initialEntries={[ROUTES.login]}>
          <Routes>
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route
                path={ROUTES.dashboard}
                element={<h1>Portfolio</h1>}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </AppProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: /Miguel Santos/ }),
    );
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('heading', { name: 'Portfolio' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Access your demo' })).not.toBeInTheDocument();
  });

  it('locks the demo account after five unsuccessful sign-in attempts', async () => {
    const user = userEvent.setup();

    renderLogin();

    const userIdInput = screen.getByLabelText('User ID');
    const passwordInput = screen.getByLabelText('Password');
    const signInButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(userIdInput, VALID_USER_ID);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await user.clear(passwordInput);
      await user.type(passwordInput, 'incorrect-demo-password');
      await user.click(signInButton);
    }

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many unsuccessful attempts. Please try again after the temporary lockout period.',
    );
    expect(authService.getLockoutStatus(VALID_USER_ID).locked).toBe(true);
    expect(authService.isAuthenticated()).toBe(false);
  });
});