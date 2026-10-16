import { test, expect } from './conftest.js';

const LOGIN_ROUTE = '/login';
const DASHBOARD_ROUTE = '/dashboard';
const PRODUCTS_ROUTE = '/products';
const OFFERS_ROUTE = '/offers';

const MIGUEL_CREDENTIALS = {
  userId: 'user-miguel-santos',
  password: 'NovaDemo123!',
};

const ROSA_CREDENTIALS = {
  userId: 'user-rosa-delacruz',
  password: 'NovaDemo123!',
};

async function openLogin(page) {
  await page.goto(LOGIN_ROUTE);
  await expect(
    page.getByRole('heading', { name: 'Access your demo' }),
  ).toBeVisible();
}

async function signIn(page, credentials) {
  await page.getByLabel('User ID').fill(credentials.userId);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function signInAs(page, credentials = MIGUEL_CREDENTIALS) {
  await openLogin(page);
  await signIn(page, credentials);
  await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));
}

test.describe('catalogue journeys', () => {
  test('filters product categories and shows only matching synthetic products', async ({
    page,
  }) => {
    await signInAs(page);

    await page.goto(PRODUCTS_ROUTE);

    await expect(
      page.getByRole('heading', { name: 'All products' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Nova Rewards Card' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Growth Savings' }),
    ).toBeVisible();

    await page.getByLabel('Category').selectOption('Cards');

    await expect(
      page.getByRole('heading', { name: 'Nova Rewards Card' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Growth Savings' }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'HomeStart Loan' }),
    ).not.toBeVisible();
  });

  test('opens product details and routes product questions to synthetic support', async ({
    page,
  }) => {
    await signInAs(page);

    await page.goto('/products/product-nova-credit');

    await expect(
      page.getByRole('heading', { name: 'Nova Rewards Card' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Benefits and features' }),
    ).toBeVisible();
    await expect(page.getByText('No annual fee')).toBeVisible();
    await expect(page.getByText('No application is submitted')).toBeVisible();

    await page.getByRole('button', { name: 'Ask about this product' }).click();

    await expect(page).toHaveURL(
      new RegExp('/help\\?topic=Nova%20Rewards%20Card$'),
    );
    await expect(
      page.getByRole('heading', { name: 'How can we help?' }),
    ).toBeVisible();
  });

  test('filters active offers by category and excludes claimed offers', async ({
    page,
  }) => {
    await signInAs(page);

    await page.goto(OFFERS_ROUTE);

    await expect(
      page.getByRole('heading', { name: 'All active offers' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Grow your savings' }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'More rewards for your everyday',
      }).first(),
    ).toBeVisible();
    await expect(page.getByText('Welcome to Nova Bank')).not.toBeVisible();

    await page.getByLabel('Category').selectOption('savings');

    await expect(
      page.getByRole('heading', { name: 'Grow your savings' }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'More rewards for your everyday',
      }),
    ).not.toBeVisible();
    await expect(page.getByText('Welcome to Nova Bank')).not.toBeVisible();
  });

  test('shows offer validity and records simulated interest from the offer details modal', async ({
    page,
  }) => {
    await signInAs(page);

    await page.goto(OFFERS_ROUTE);

    await page.getByRole('button', { name: 'View offer' }).first().click();

    const offerDialog = page.getByRole('dialog', {
      name: 'Grow your savings',
    });

    await expect(offerDialog).toBeVisible();
    await expect(offerDialog.getByText('Valid from')).toBeVisible();
    await expect(offerDialog.getByText('Sep 1, 2026')).toBeVisible();
    await expect(offerDialog.getByText('Valid until')).toBeVisible();
    await expect(offerDialog.getByText('Dec 31, 2026')).toBeVisible();

    await offerDialog.getByRole('button', { name: "I'm interested" }).click();

    await expect(offerDialog.getByRole('status')).toHaveText(
      'Your interest was recorded locally. No application or real account action was started.',
    );
  });

  test('opens an active offer detail page and records simulated interest for another persona', async ({
    page,
  }) => {
    await signInAs(page, ROSA_CREDENTIALS);

    await page.goto('/offers/offer-rewards-card');

    await expect(
      page.getByRole('heading', {
        name: 'More rewards for your everyday',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Eligibility' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Offer validity' }),
    ).toBeVisible();
    await expect(page.getByText('Oct 1, 2026')).toBeVisible();
    await expect(page.getByText('Nov 30, 2026')).toBeVisible();

    await page.getByRole('button', { name: 'Express interest' }).click();

    await expect(page.getByRole('status')).toHaveText(
      'Your interest was recorded locally. No application was submitted and no real financial action was started.',
    );
  });
});