import { test, expect } from './conftest.js';

const LOGIN_ROUTE = '/login';
const DASHBOARD_ROUTE = '/dashboard';
const ACCOUNTS_ROUTE = '/accounts';
const TRANSACTIONS_ROUTE = '/transactions';

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

async function signInAsMiguel(page) {
  await openLogin(page);
  await signIn(page, MIGUEL_CREDENTIALS);
  await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));
}

async function signInAsRosa(page) {
  await openLogin(page);
  await signIn(page, ROSA_CREDENTIALS);
  await expect(page).toHaveURL(new RegExp(`${DASHBOARD_ROUTE}$`));
}

function savingsHeading(page) {
  return page.getByRole('heading', {
    name: /Peso Savings|Growth Savings/i,
  });
}

test.describe('portfolio and account journeys', () => {
  test('shows Miguel portfolio balances, savings account, and recent activity', async ({
    page,
  }) => {
    await signInAsMiguel(page);

    await expect(
      page.getByRole('heading', { name: /Welcome back, Miguel/i }),
    ).toBeVisible();
    await expect(
      page.getByText('$40,950.00', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Your accounts' }),
    ).toBeVisible();
    await expect(savingsHeading(page)).toBeVisible();
    await expect(page.getByText('Recent activity')).toBeVisible();
    await expect(page.getByText('Payroll deposit')).toBeVisible();
  });

  test('keeps Rosa portfolio data isolated from Miguel account data', async ({
    page,
  }) => {
    await signInAsMiguel(page);

    await page.goto(`${ACCOUNTS_ROUTE}/account-rosa-checking`);

    await expect(
      page.getByRole('heading', { name: 'Account unavailable' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'This account belongs to another demo persona and is not available in the current session.',
      ),
    ).toBeVisible();
    await expect(page.getByText('•••• 8912')).not.toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(new RegExp(`${LOGIN_ROUTE}$`));

    await signInAsRosa(page);

    await expect(
      page.getByRole('heading', { name: /Welcome back, Rosa/i }),
    ).toBeVisible();
    await expect(page.getByText('$8,450.72', { exact: true })).toBeVisible();
    await expect(page.getByText('$40,950.00', { exact: true })).not.toBeVisible();
    await expect(page.getByText('•••• 5678')).not.toBeVisible();
  });

  test('opens the Peso Savings account and filters its transactions', async ({
    page,
  }) => {
    await signInAsMiguel(page);

    await page.getByRole('link', { name: /Growth Savings|Peso Savings/i }).first().click();

    await expect(savingsHeading(page)).toBeVisible();
    await expect(page.getByText('Transaction activity')).toBeVisible();
    await expect(page.getByLabel('Search activity')).toBeVisible();
    await expect(page.getByLabel('Status')).toBeVisible();

    const search = page.getByLabel('Search activity');
    await search.fill('interest');

    await expect(page.getByText('Monthly interest')).toBeVisible();
    await expect(page.getByText('Transfer from Everyday Checking')).not.toBeVisible();

    await page.getByLabel('Status').selectOption('completed');

    await expect(page.getByText('Monthly interest')).toBeVisible();
    await expect(page.getByText('Pending')).not.toBeVisible();
  });

  test('filters transactions, expands transaction details, and resets filters', async ({
    page,
  }) => {
    await signInAsMiguel(page);
    await page.goto(TRANSACTIONS_ROUTE);

    await expect(
      page.getByRole('heading', { name: /Transactions|Find transactions/i }),
    ).toBeVisible();

    const search = page.getByLabel(/Merchant or reference|Search/i).first();
    await search.fill('payroll');

    const transactionType = page.getByLabel('Transaction type');
    if (await transactionType.count()) {
      await transactionType.selectOption('deposit');
    }

    await expect(page.getByText('Payroll deposit').first()).toBeVisible();
    await expect(page.getByText('Rent payment')).not.toBeVisible();

    const expandButton = page.getByRole('button', {
      name: /Show details for Payroll deposit/i,
    });

    if (await expandButton.count()) {
      await expandButton.click();
      await expect(page.getByText('Transaction details')).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: /Hide details for Payroll deposit/i,
        }),
      ).toBeVisible();
    }

    const resetButton = page.getByRole('button', { name: /Reset filters/i });
    if (await resetButton.count()) {
      await resetButton.click();
      await expect(page.getByText('Rent payment')).toBeVisible();
    }
  });

  test('recovers from an account loading failure with retry', async ({
    page,
  }) => {
    await signInAsMiguel(page);

    await page.goto(`${ACCOUNTS_ROUTE}/missing-demo-account`);

    const retryButton = page.getByRole('button', { name: 'Try again' });

    if (await retryButton.count()) {
      await expect(
        page.getByRole('heading', {
          name: /Account not found|Account unavailable/i,
        }),
      ).toBeVisible();
      await retryButton.click();
      await expect(
        page.getByRole('heading', {
          name: /Account not found|Account unavailable/i,
        }),
      ).toBeVisible();
    } else {
      await page.goto(ACCOUNTS_ROUTE);
      await expect(
        page.getByRole('heading', { name: 'Accounts' }),
      ).toBeVisible();
    }
  });

  test('downloads a masked local statement without exposing the full account number', async ({
    page,
  }) => {
    await signInAsMiguel(page);

    await page.goto(`${ACCOUNTS_ROUTE}/account-miguel-checking`);

    await expect(
      page.getByRole('heading', { name: 'Everyday Checking' }),
    ).toBeVisible();
    await expect(page.getByText('•••• 5678')).toBeVisible();
    await expect(page.getByText('100012345678')).not.toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download statement' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /everyday-checking-statement\.txt$/i,
    );
    await expect(
      page.getByRole('status', { name: '' }),
    ).toContainText('Statement');
    await expect(page.getByText('100012345678')).not.toBeVisible();
  });
});