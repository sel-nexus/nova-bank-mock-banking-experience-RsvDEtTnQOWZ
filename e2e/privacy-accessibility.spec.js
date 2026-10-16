import { test, expect } from './conftest.js';

const LOGIN_ROUTE = '/login';
const DASHBOARD_ROUTE = '/dashboard';
const HELP_ROUTE = '/help';

const MIGUEL_CREDENTIALS = {
  userId: 'user-miguel-santos',
  password: 'NovaDemo123!',
};

const FULL_ACCOUNT_NUMBERS = ['100012345678', '100087654321', '100045678912'];

async function openLogin(page) {
  await page.goto(LOGIN_ROUTE);
  await expect(
    page.getByRole('heading', { name: 'Access your demo' }),
  ).toBeVisible();
}

async function signIn(page, credentials = MIGUEL_CREDENTIALS) {
  await page.getByLabel('User ID').fill(credentials.userId);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));
}

async function assertNoSensitiveBrowserValues(page) {
  const browserValues = await page.evaluate(() => [
    ...Object.values(window.localStorage),
    ...Object.values(window.sessionStorage),
  ]);

  const serializedValues = browserValues.join(' ');

  expect(serializedValues).not.toContain(MIGUEL_CREDENTIALS.password);
  expect(serializedValues).not.toMatch(/password|passcode/i);

  FULL_ACCOUNT_NUMBERS.forEach((accountNumber) => {
    expect(serializedValues).not.toContain(accountNumber);
  });
}

test.describe('privacy and accessibility release acceptance', () => {
  test('makes no external network requests while opening public support content', async ({
    page,
    assertNoNetworkRequests,
  }) => {
    await page.goto(HELP_ROUTE);

    await expect(
      page.getByRole('heading', { name: 'How can we help?' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'This is a synthetic banking experience for demonstration purposes. It does not connect to real financial accounts or process real transactions.',
      ),
    ).toBeVisible();

    assertNoNetworkRequests();
  });

  test('keeps credentials and full account identifiers out of browser storage and rendered content', async ({
    page,
    assertNoNetworkRequests,
  }) => {
    await openLogin(page);
    await signIn(page);

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(
      page.getByRole('note', {
        name: 'Privacy and synthetic data notice',
      }),
    ).toBeVisible();

    const renderedText = await page.locator('body').innerText();

    expect(renderedText).not.toContain(MIGUEL_CREDENTIALS.password);
    expect(renderedText).not.toMatch(/password|passcode/i);

    FULL_ACCOUNT_NUMBERS.forEach((accountNumber) => {
      expect(renderedText).not.toContain(accountNumber);
    });

    await assertNoSensitiveBrowserValues();
    assertNoNetworkRequests();
  });

  test('provides keyboard-operable sign-in controls and preserves focus after keyboard submission', async ({
    page,
    assertNoNetworkRequests,
  }) => {
    await openLogin(page);

    const userIdInput = page.getByLabel('User ID');
    const passwordInput = page.getByLabel('Password');
    const signInButton = page.getByRole('button', { name: 'Sign in' });

    await userIdInput.focus();
    await expect(userIdInput).toBeFocused();
    await userIdInput.fill(MIGUEL_CREDENTIALS.userId);

    await passwordInput.focus();
    await expect(passwordInput).toBeFocused();
    await passwordInput.fill(MIGUEL_CREDENTIALS.password);

    await signInButton.focus();
    await expect(signInButton).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));
    await expect(
      page.getByRole('heading', { name: /Welcome back, Miguel/i }),
    ).toBeVisible();

    assertNoNetworkRequests();
  });

  test('supports keyboard focus management for offer dialogs', async ({
    page,
    assertNoNetworkRequests,
  }) => {
    await openLogin(page);
    await signIn(page);

    await page.goto('/offers');
    const viewOfferButton = page.getByRole('button', { name: 'View offer' }).first();

    await viewOfferButton.click();

    const offerDialog = page.getByRole('dialog', {
      name: 'Grow your savings',
    });
    const closeButton = offerDialog.getByRole('button', {
      name: 'Close offer details',
    });

    await expect(offerDialog).toBeVisible();
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(offerDialog).not.toBeVisible();
    await expect(viewOfferButton).toBeFocused();

    assertNoNetworkRequests();
  });

  test('renders required landmarks and synthetic notices for public and authenticated experiences', async ({
    page,
    assertNoNetworkRequests,
  }) => {
    await openLogin(page);

    await expect(page.getByRole('main')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Banking made clear, simple, and yours.',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Synthetic banking experience', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('Demo credentials only', { exact: true }),
    ).toBeVisible();

    await signIn(page);

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeVisible();
    await expect(
      page.getByRole('note', {
        name: 'Privacy and synthetic data notice',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Open support chat' }),
    ).toBeVisible();

    assertNoNetworkRequests();
  });

  test('remains usable at a narrow viewport suitable for 200 percent zoom', async ({
    page,
    assertNoNetworkRequests,
  }) => {
    await page.setViewportSize({ width: 720, height: 900 });
    await page.goto(HELP_ROUTE);

    await expect(
      page.getByRole('heading', { name: 'How can we help?' }),
    ).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByLabel('Search FAQs')).toBeVisible();

    const layoutMetrics = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));

    expect(layoutMetrics.documentWidth).toBeLessThanOrEqual(
      layoutMetrics.viewportWidth + 1,
    );

    assertNoNetworkRequests();
  });
});