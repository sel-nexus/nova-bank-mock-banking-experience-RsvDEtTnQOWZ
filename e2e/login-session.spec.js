import { test, expect } from './conftest.js';

const LOGIN_ROUTE = '/login';
const DASHBOARD_ROUTE = '/dashboard';

async function openLogin(page) {
  await page.goto(LOGIN_ROUTE);
  await expect(page.getByRole('heading', { name: 'Access your demo' })).toBeVisible();
}

async function signIn(page, credentials) {
  await page.getByLabel('User ID').fill(credentials.userId);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.describe('login and session journeys', () => {
  test('validates required login fields before submitting', async ({ page }) => {
    await openLogin(page);

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toHaveText(
      'Enter your User ID and password to continue.',
    );
    await expect(page).toHaveURL(new RegExp(`${LOGIN_ROUTE}$`));
  });

  test('signs in with synthetic credentials and opens the dashboard', async ({
    page,
    credentials,
  }) => {
    await openLogin(page);

    await signIn(page, credentials);

    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));
    await expect(
      page.getByRole('heading', { name: /Welcome back, Miguel/i }),
    ).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('rejects invalid credentials and keeps the user on the login page', async ({
    page,
    credentials,
  }) => {
    await openLogin(page);

    await signIn(page, {
      userId: credentials.userId,
      password: 'incorrect-demo-password',
    });

    await expect(page.getByRole('alert')).toHaveText(
      'The User ID or password is incorrect.',
    );
    await expect(page).toHaveURL(new RegExp(`${LOGIN_ROUTE}$`));
  });

  test('locks the demo account after five unsuccessful attempts and allows reset', async ({
    page,
    credentials,
  }) => {
    await openLogin(page);

    const userIdInput = page.getByLabel('User ID');
    const passwordInput = page.getByLabel('Password');
    const signInButton = page.getByRole('button', { name: 'Sign in' });

    await userIdInput.fill(credentials.userId);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await passwordInput.fill('incorrect-demo-password');
      await signInButton.click();
    }

    await expect(page.getByRole('alert')).toHaveText(
      'Too many unsuccessful attempts. Please try again after the temporary lockout period.',
    );

    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload();

    await expect(
      page.getByRole('heading', { name: 'Access your demo' }),
    ).toBeVisible();

    await signIn(page, credentials);

    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));
  });

  test('logs out and prevents dashboard access through browser history', async ({
    page,
    credentials,
  }) => {
    await openLogin(page);
    await signIn(page, credentials);

    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));

    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page).toHaveURL(new RegExp(`${LOGIN_ROUTE}$`));
    await expect(
      page.getByRole('heading', { name: 'Access your demo' }),
    ).toBeVisible();

    await page.goBack();

    await expect(page).toHaveURL(new RegExp(`${LOGIN_ROUTE}$`));
    await expect(
      page.getByRole('heading', { name: 'Access your demo' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Welcome back, Miguel/i }),
    ).not.toBeVisible();
  });

  test('shows an inactivity warning and continues the active session', async ({
    page,
    credentials,
  }) => {
    test.setTimeout(30_000);

    await page.clock.install({
      time: new Date('2026-10-16T00:00:00.000Z'),
    });
    await openLogin(page);
    await signIn(page, credentials);

    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));

    await page.clock.fastForward(120_000);

    const warning = page.getByRole('dialog', {
      name: 'Are you still there?',
    });
    await expect(warning).toBeVisible();
    await expect(
      warning.getByRole('button', { name: 'Continue session' }),
    ).toBeVisible();

    await warning.getByRole('button', { name: 'Continue session' }).click();

    await expect(warning).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));
  });

  test('expires an inactive session and returns the user to login', async ({
    page,
    credentials,
  }) => {
    test.setTimeout(30_000);

    await page.clock.install({
      time: new Date('2026-10-16T00:00:00.000Z'),
    });
    await openLogin(page);
    await signIn(page, credentials);

    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));

    await page.clock.fastForward(150_000);

    const expiredDialog = page.getByRole('dialog', {
      name: 'Your session has ended',
    });
    await expect(expiredDialog).toBeVisible();

    await expiredDialog.getByRole('button', { name: 'Sign in again' }).click();

    await expect(page).toHaveURL(new RegExp(`${LOGIN_ROUTE}$`));
    await expect(
      page.getByRole('heading', { name: 'Access your demo' }),
    ).toBeVisible();
  });
});