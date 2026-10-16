import { test, expect } from './conftest.js';

const LOGIN_ROUTE = '/login';
const DASHBOARD_ROUTE = '/dashboard';

const MIGUEL_CREDENTIALS = {
  userId: 'user-miguel-santos',
  password: 'NovaDemo123!',
};

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

async function signInAsMiguel(page) {
  await openLogin(page);
  await signIn(page);
}

test.describe('support and chat journeys', () => {
  test('searches support FAQs and expands a matching answer', async ({ page }) => {
    await page.goto('/help');

    await expect(
      page.getByRole('heading', { name: 'How can we help?' }),
    ).toBeVisible();

    const search = page.getByLabel('Search FAQs');
    await search.fill('real bank');

    const faqButton = page.getByRole('button', {
      name: 'Is this a real bank?',
    });

    await expect(faqButton).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Where is my information stored?',
      }),
    ).not.toBeVisible();

    await faqButton.click();

    await expect(
      page.getByText(
        'No. Nova Bank Demo is a synthetic banking experience and does not connect to real financial accounts.',
      ),
    ).toBeVisible();
    await expect(faqButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('expands a fictional branch and shows its sample hours and services', async ({
    page,
  }) => {
    await page.goto('/help');

    const branchButton = page.getByRole('button', {
      name: /Downtown Austin/i,
    });

    await expect(branchButton).toBeVisible();
    await expect(branchButton).toHaveAttribute('aria-expanded', 'false');

    await branchButton.click();

    await expect(branchButton).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByText('201 Congress Avenue, Austin, TX 78701'),
    ).toBeVisible();
    await expect(page.getByText('09:00–17:00')).toBeVisible();
    await expect(page.getByText('Account support')).toBeVisible();
    await expect(page.getByText('Cash services')).toBeVisible();
  });

  test('submits a contact enquiry and displays a local confirmation', async ({
    page,
  }) => {
    await page.goto('/contact');

    await expect(
      page.getByRole('heading', { name: 'Contact enquiry' }),
    ).toBeVisible();

    await page.getByLabel('Topic').selectOption('transactions');
    await page.getByLabel('Subject').fill('Question about a transaction');
    await page
      .getByLabel('Message')
      .fill('Please explain this synthetic transaction.');
    await page.getByRole('button', { name: 'Send enquiry' }).click();

    await expect(
      page.getByRole('heading', { name: 'Your enquiry was received' }),
    ).toBeVisible();
    await expect(page.getByText('Confirmation #NB-99214')).toBeVisible();
    await expect(page.getByRole('status')).toContainText(
      'Your question was recorded locally for this synthetic banking experience.',
    );
    await expect(
      page.getByText('No real bank or support team receives this message.'),
    ).toBeVisible();
  });

  test('opens support chat, receives a topic response, and shows privacy copy', async ({
    page,
  }) => {
    await signInAsMiguel(page);

    await page.getByRole('button', { name: 'Open support chat' }).click();

    const chat = page.getByRole('dialog', { name: 'Nova Support' });

    await expect(chat).toBeVisible();
    await expect(
      chat.getByRole('textbox', { name: 'Message Nova Support' }),
    ).toBeVisible();
    await expect(
      chat.getByText(
        'This is a synthetic support conversation. No real bank or support team receives these messages.',
      ),
    ).toBeVisible();

    await chat.getByRole('button', { name: 'Accounts' }).click();

    await expect(
      chat.getByText(
        'I can help with your Nova Bank Demo accounts. You can review balances, account details, and masked account numbers from the Accounts area.',
      ),
    ).toBeVisible();
    await expect(
      chat.getByText(/Welcome to Nova Support|Synthetic chat assistance/),
    ).toBeVisible();
  });

  test('preserves the local chat conversation after closing and reopening it', async ({
    page,
  }) => {
    await signInAsMiguel(page);

    await page.getByRole('button', { name: 'Open support chat' }).click();

    const chat = page.getByRole('dialog', { name: 'Nova Support' });
    await chat.getByRole('button', { name: 'Security' }).click();

    const response = page.getByText(
      'For your security, use only synthetic information in this demo. Nova Bank Demo does not connect to real financial accounts.',
    );

    await expect(response).toBeVisible();

    await chat.getByRole('button', { name: 'Close support chat' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Nova Support' }),
    ).not.toBeVisible();

    await page.goto('/accounts');
    await expect(
      page.getByRole('heading', { name: 'Accounts' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Open support chat' }).click();

    const reopenedChat = page.getByRole('dialog', { name: 'Nova Support' });
    await expect(reopenedChat).toBeVisible();
    await expect(reopenedChat.getByText(response)).toBeVisible();
  });

  test('records simulated support escalation locally when escalation is available', async ({
    page,
  }) => {
    await signInAsMiguel(page);

    await page.getByRole('button', { name: 'Open support chat' }).click();

    const chat = page.getByRole('dialog', { name: 'Nova Support' });
    await expect(chat).toBeVisible();

    const escalationButton = chat.getByRole('button', { name: 'Escalate' });

    if (await escalationButton.count()) {
      await escalationButton.click();

      await expect(chat.getByRole('status')).toHaveText(
        'This conversation was escalated locally to simulated support. No real bank or support team was contacted.',
      );
      return;
    }

    await expect(
      chat.getByText(
        'This is a synthetic support conversation. No real bank or support team receives these messages.',
      ),
    ).toBeVisible();
  });
});