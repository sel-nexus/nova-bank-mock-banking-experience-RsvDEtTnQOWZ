import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { SupportPage } from './SupportPage.jsx';

const FAQS = [
  {
    id: 'faq-transfer',
    question: 'How do I transfer money?',
    answer: 'Open Transfers and follow the simulated transfer steps.',
    category: 'Transfers',
  },
  {
    id: 'faq-security',
    question: 'How do I keep my demo information safe?',
    answer: 'Use synthetic information only in this demonstration.',
    category: 'Security',
  },
];

const BRANCHES = [
  {
    id: 'branch-demo-central',
    name: 'Demo Central',
    address: '100 Synthetic Avenue',
    phone: '+1 555 010 4000',
    hours: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: 'Closed',
      sunday: 'Closed',
    },
    services: ['Account support', 'Cash services'],
  },
];

function renderSupport(props = {}) {
  return render(
    <SupportPage
      faqs={FAQS}
      branches={BRANCHES}
      {...props}
    />,
  );
}

describe('SupportPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders support channels and the synthetic banking disclaimer', () => {
    renderSupport();

    expect(screen.getByRole('heading', { name: 'Call Us' })).toBeInTheDocument();
    expect(screen.getByText('(+63 2) 8000 0000')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lost or Stolen Card' })).toBeInTheDocument();
    expect(screen.getByText('(+63 2) 8000 0001')).toBeInTheDocument();
  });

  it('filters FAQs by search text and expands the matching answer', async () => {
    const user = userEvent.setup();

    renderSupport();

    const searchInput = screen.getByLabelText('Search FAQs');
    await user.type(searchInput, 'transfer');

    expect(
      screen.getByRole('button', { name: /How do I transfer money\?/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /How do I keep my demo information safe\?/i,
      }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /How do I transfer money\?/i }),
    );

    expect(
      screen.getByText(
        'Open Transfers and follow the simulated transfer steps.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /How do I transfer money\?/i }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('supports keyboard expansion of an FAQ accordion item', async () => {
    const user = userEvent.setup();

    renderSupport();

    const faqButton = screen.getByRole('button', {
      name: /How do I keep my demo information safe\?/i,
    });

    faqButton.focus();
    await user.keyboard('{Enter}');

    expect(faqButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText('Use synthetic information only in this demonstration.'),
    ).toBeInTheDocument();

    await user.keyboard(' ');
    expect(faqButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands a branch directory entry and displays hours and services', async () => {
    const user = userEvent.setup();

    renderSupport();

    const branchButton = screen.getByRole('button', { name: /Demo Central/i });

    expect(branchButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(branchButton);

    expect(branchButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('100 Synthetic Avenue')).toBeInTheDocument();
    expect(screen.getAllByText('09:00–17:00').length).toBeGreaterThan(0);
    expect(screen.getByText('Account support')).toBeInTheDocument();
    expect(screen.getByText('Cash services')).toBeInTheDocument();
  });

  it('renders empty states when FAQ and branch collections have no results', () => {
    renderSupport({
      faqs: [],
      branches: [],
    });

    expect(
      screen.getByRole('heading', { name: 'No matching FAQs' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No branches available' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The fictional branch directory is not available right now.',
      ),
    ).toBeInTheDocument();
  });

  it('shows an FAQ empty state when a search has no matching questions', async () => {
    const user = userEvent.setup();

    renderSupport();

    await user.type(screen.getByLabelText('Search FAQs'), 'no-such-question');

    expect(
      screen.getByRole('heading', { name: 'No matching FAQs' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Try a different search term or clear the search to browse all support questions.',
      ),
    ).toBeInTheDocument();
  });
});