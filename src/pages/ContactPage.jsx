import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import supportService from '../services/supportService.js';
import { EmptyState } from '../components/shared/EmptyState.jsx';
const TOPIC_OPTIONS = Object.freeze([
  { value: 'accounts', label: 'Accounts' },
  { value: 'transfers', label: 'Transfers' },
  { value: 'payments', label: 'Payments' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'cards', label: 'Cards' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
]);

const CONFIRMATION_REFERENCE = 'NB-99214';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getValidationErrors(values) {
  const errors = {};

  if (!values.topic) {
    errors.topic = 'Select a topic.';
  }

  if (!values.subject) {
    errors.subject = 'Enter a subject.';
  } else if (values.subject.length > 120) {
    errors.subject = 'Subject must be 120 characters or fewer.';
  }

  if (!values.message) {
    errors.message = 'Enter a message.';
  } else if (values.message.length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  } else if (values.message.length > 2000) {
    errors.message = 'Message must be 2,000 characters or fewer.';
  }

  return errors;
}

/**
 * Renders a local contact enquiry form for the synthetic support experience.
 *
 * @param {{
 *   topic?: string,
 *   subject?: string,
 *   message?: string,
 *   name?: string,
 *   email?: string,
 *   onSubmit?: Function,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function ContactPage({
  topic: providedTopic = '',
  subject: providedSubject = '',
  message: providedMessage = '',
  name = '',
  email = '',
  onSubmit,
  className = '',
}) {
  const [topic, setTopic] = useState(normalizeText(providedTopic).toLowerCase());
  const [subject, setSubject] = useState(normalizeText(providedSubject));
  const [message, setMessage] = useState(normalizeText(providedMessage));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError('');
    setConfirmation(null);

    const values = {
      topic: normalizeText(topic).toLowerCase(),
      subject: normalizeText(subject),
      message: normalizeText(message),
    };
    const validationErrors = getValidationErrors(values);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const enquiry = {
        name: normalizeText(name) || 'Demo customer',
        email: normalizeText(email) || 'customer@example.test',
        subject: values.subject,
        message: values.message,
        category: values.topic,
        preferredChannel: 'Contact form',
      };

      const result =
        typeof onSubmit === 'function'
          ? onSubmit(enquiry)
          : supportService.submitContactEnquiry(enquiry);

      if (result?.success === false) {
        setSubmitError(
          result.error?.message ||
            'The contact enquiry could not be submitted. Please try again.',
        );
        return;
      }

      setErrors({});
      setConfirmation({
        reference: CONFIRMATION_REFERENCE,
        serviceReference: result?.data?.reference || '',
      });
      setSubject('');
      setMessage('');
    } catch {
      setSubmitError(
        'The contact enquiry could not be submitted. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field, value) => {
    if (field === 'topic') {
      setTopic(value);
    }

    if (field === 'subject') {
      setSubject(value);
    }

    if (field === 'message') {
      setMessage(value);
    }

    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });

    setSubmitError('');
  };

  return (
    <div
      className={['page-container', className].filter(Boolean).join(' ')}
      data-testid="contact-page"
    >
      <header className="page-header mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            Contact support
          </p>
          <h1 className="mt-2 text-3xl font-bold text-nova-midnight sm:text-4xl">
            How can we help?
          </h1>
          <p className="mt-2 max-w-2xl text-base text-nova-slate">
            Send a question to the synthetic Nova Bank Demo support team. Your
            enquiry is stored locally in this browser only.
          </p>
        </div>

        <NavLink
          to={ROUTES.help}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
        >
          Back to help
        </NavLink>
      </header>

      {confirmation ? (
        <section
          role="status"
          aria-labelledby="contact-confirmation-title"
          className="surface-card mx-auto max-w-3xl px-6 py-10 text-center sm:px-10 sm:py-14"
        >
          <div
            aria-hidden="true"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-nova-mint text-3xl font-bold text-nova-teal"
          >
            ✓
          </div>
          <h2
            id="contact-confirmation-title"
            className="mt-5 text-2xl font-bold text-nova-midnight sm:text-3xl"
          >
            Your enquiry was received
          </h2>
          <p className="mt-3 text-base text-nova-slate">
            Thank you. Your question was recorded locally for this synthetic
            banking experience.
          </p>
          <p className="mt-5 rounded-lg bg-nova-sky/60 px-4 py-3 font-semibold text-nova-midnight">
            Confirmation #{confirmation.reference}
          </p>
          <p className="mt-3 text-sm font-semibold text-nova-midnight">
            Message received. Reference #{confirmation.reference}.
          </p>
          <p className="mt-4 text-sm text-nova-slate">
            No real bank or support team receives this message.
          </p>
          <button
            type="button"
            onClick={() => setConfirmation(null)}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-nova-navy px-5 py-3 font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
          >
            Send another enquiry
          </button>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.65fr)]">
          <section
            aria-labelledby="contact-form-title"
            className="surface-card p-5 sm:p-8"
          >
            <h2
              id="contact-form-title"
              className="text-2xl font-bold text-nova-midnight"
            >
              Contact enquiry
            </h2>
            <p className="mt-2 text-sm text-nova-slate">
              Complete the form below. All fields are required.
            </p>

            {submitError && (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-nova-coral/40 bg-nova-coral/10 px-4 py-3 text-sm text-nova-midnight"
              >
                {submitError}
              </p>
            )}

            {Object.keys(errors).length > 0 && (
              <div role="alert" className="sr-only">
                Review the highlighted fields before sending the message.
              </div>
            )}

            <form className="mt-6" onSubmit={handleSubmit} noValidate>
              <div>
                <label
                  htmlFor="contact-topic"
                  className="mb-1.5 block text-sm font-semibold text-nova-midnight"
                >
                  Topic
                </label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(event) =>
                    handleFieldChange('topic', event.target.value)
                  }
                  aria-invalid={Boolean(errors.topic)}
                  aria-describedby={errors.topic ? 'contact-topic-error' : undefined}
                  className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                >
                  <option value="">Select a topic</option>
                  {TOPIC_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.topic && (
                  <p
                    id="contact-topic-error"
                    className="mt-1.5 text-sm text-nova-midnight"
                  >
                    {errors.topic}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label
                  htmlFor="contact-subject"
                  className="mb-1.5 block text-sm font-semibold text-nova-midnight"
                >
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={subject}
                  onChange={(event) =>
                    handleFieldChange('subject', event.target.value)
                  }
                  maxLength={120}
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={
                    errors.subject ? 'contact-subject-error' : undefined
                  }
                  placeholder="What would you like help with?"
                  className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                />
                {errors.subject && (
                  <p
                    id="contact-subject-error"
                    className="mt-1.5 text-sm text-nova-midnight"
                  >
                    {errors.subject}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label
                  htmlFor="contact-message"
                  className="mb-1.5 block text-sm font-semibold text-nova-midnight"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(event) =>
                    handleFieldChange('message', event.target.value)
                  }
                  rows={7}
                  maxLength={2000}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? 'contact-message-error' : undefined
                  }
                  placeholder="Tell us how we can help."
                  className="w-full resize-y rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                />
                <div className="mt-1.5 flex justify-between gap-3 text-xs text-nova-slate">
                  {errors.message ? (
                    <p id="contact-message-error" className="text-sm text-nova-midnight">
                      {errors.message}
                    </p>
                  ) : (
                    <span>Do not include real account or personal information.</span>
                  )}
                  <span className="shrink-0">{message.length}/2000</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-nova-navy px-5 py-3 font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Sending enquiry…' : 'Send Message (Simulated)'}
              </button>
            </form>
          </section>

          <aside className="space-y-4">
            <section className="surface-card p-5 sm:p-6">
              <h2 className="text-xl font-bold text-nova-midnight">
                Before you send
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-nova-slate">
                <li className="flex gap-3">
                  <span aria-hidden="true" className="font-bold text-nova-teal">
                    ✓
                  </span>
                  <span>Use synthetic information only.</span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="font-bold text-nova-teal">
                    ✓
                  </span>
                  <span>Messages are saved locally in this demonstration.</span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="font-bold text-nova-teal">
                    ✓
                  </span>
                  <span>No real support response will be sent.</span>
                </li>
              </ul>
            </section>

            <EmptyState
              title="Need quick answers?"
              description="Browse frequently asked questions and fictional support resources."
              compact
              action={{
                label: 'Open help center',
                onClick: () => {
                  window.location.assign(ROUTES.help);
                },
              }}
            />
          </aside>
        </div>
      )}

    </div>
  );
}

ContactPage.propTypes = {
  topic: PropTypes.string,
  subject: PropTypes.string,
  message: PropTypes.string,
  name: PropTypes.string,
  email: PropTypes.string,
  onSubmit: PropTypes.func,
  className: PropTypes.string,
};

export { ContactPage };
export default ContactPage;
