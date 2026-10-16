import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ContactPage from './ContactPage.jsx';
import supportService from '../services/supportService.js';

function renderContact(props = {}) {
  return render(
    <MemoryRouter>
      <ContactPage {...props} />
    </MemoryRouter>,
  );
}

describe('ContactPage', () => {
  beforeEach(() => {
    supportService.clearContactEnquiries();
  });

  afterEach(() => {
    cleanup();
    supportService.clearContactEnquiries();
    vi.unstubAllGlobals();
  });

  it('renders an accessible contact enquiry form with labelled controls', () => {
    renderContact();

    expect(
      screen.getByRole('heading', { name: 'Contact enquiry' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Topic')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send Message (Simulated)' }),
    ).toBeInTheDocument();
  });

  it('shows accessible validation feedback when required fields are empty', async () => {
    const user = userEvent.setup();

    renderContact();

    await user.click(screen.getByRole('button', { name: 'Send Message (Simulated)' }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Select a topic.')).toBeInTheDocument();
    expect(screen.getByText('Enter a subject.')).toBeInTheDocument();
    expect(screen.getByText('Enter a message.')).toBeInTheDocument();
    expect(screen.getByLabelText('Topic')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Subject')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Message')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(supportService.getContactEnquiries()).toEqual([]);
  });

  it('rejects messages shorter than the minimum length and keeps the form available', async () => {
    const user = userEvent.setup();

    renderContact();

    await user.selectOptions(screen.getByLabelText('Topic'), 'accounts');
    await user.type(screen.getByLabelText('Subject'), 'Account question');
    await user.type(screen.getByLabelText('Message'), 'Too short');
    await user.click(screen.getByRole('button', { name: 'Send Message (Simulated)' }));

    expect(screen.getByText('Message must be at least 10 characters.')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Send Message (Simulated)' }),
    ).toBeInTheDocument();
    expect(supportService.getContactEnquiries()).toEqual([]);
  });

  it('submits a valid enquiry locally and shows confirmation #NB-99214', async () => {
    const user = userEvent.setup();

    renderContact({
      name: 'Demo customer',
      email: 'customer@example.test',
    });

    await user.selectOptions(screen.getByLabelText('Topic'), 'transactions');
    await user.type(
      screen.getByLabelText('Subject'),
      'Question about a transaction',
    );
    await user.type(
      screen.getByLabelText('Message'),
      'Please explain this synthetic transaction.',
    );
    await user.click(screen.getByRole('button', { name: 'Send Message (Simulated)' }));

    expect(
      screen.getByRole('heading', { name: 'Your enquiry was received' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Confirmation #NB-99214')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your question was recorded locally for this synthetic banking experience.',
    );
    expect(
      screen.getByRole('button', { name: 'Send another enquiry' }),
    ).toBeInTheDocument();

    expect(supportService.getContactEnquiries()).toEqual([
      expect.objectContaining({
        type: 'contact-enquiry',
        status: 'received',
        subject: 'Question about a transaction',
        message: 'Please explain this synthetic transaction.',
        category: 'transactions',
      }),
    ]);
  });

  it('submits without network access and does not call fetch', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn(() =>
      Promise.reject(new Error('Network access is not permitted in this test.')),
    );

    vi.stubGlobal('fetch', fetchSpy);

    renderContact({
      name: 'Demo customer',
      email: 'customer@example.test',
    });

    await user.selectOptions(screen.getByLabelText('Topic'), 'security');
    await user.type(screen.getByLabelText('Subject'), 'Demo privacy question');
    await user.type(
      screen.getByLabelText('Message'),
      'How is this synthetic information handled?',
    );
    await user.click(screen.getByRole('button', { name: 'Send Message (Simulated)' }));

    expect(
      screen.getByRole('heading', { name: 'Your enquiry was received' }),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});