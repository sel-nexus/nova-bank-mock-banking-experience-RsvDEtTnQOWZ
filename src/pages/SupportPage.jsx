import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ROUTES } from '../config/constants.js';
import supportService from '../services/supportService.js';
import { useOptionalChat } from '../state/ChatProvider.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
const HOTLINES = Object.freeze([
  {
    id: 'call-us',
    name: 'Call Us',
    description: 'Sample customer service hotline',
    phone: '(+63 2) 8000 0000',
    hours: 'Mon–Fri 08:00–17:00',
    action: 'Call sample',
  },
  {
    id: 'secure-message',
    name: 'Secure Message',
    description: 'Online enquiry form simulation. Estimated response: 24h.',
    phone: '',
    hours: 'Simulated message only',
    action: 'Open Message Form',
    href: '/contact',
  },
  {
    id: 'find-branch',
    name: 'Find a Branch / ATM',
    description: 'Static Metro Manila directory: Ayala, BGC, and Quezon Ave.',
    phone: '',
    hours: 'Sample locations',
    action: 'View Locations',
    href: '#branch-directory',
  },
  {
    id: 'lost-card',
    name: 'Lost or Stolen Card',
    description: '24/7 emergency blocking hotline. Demonstration number only.',
    phone: '(+63 2) 8000 0001',
    hours: '24/7',
    action: 'Report Lost Card',
    urgent: true,
  },
]);

const DEFAULT_HOURS = Object.freeze([
  ['Monday', '9:00 AM–5:00 PM'],
  ['Tuesday', '9:00 AM–5:00 PM'],
  ['Wednesday', '9:00 AM–5:00 PM'],
  ['Thursday', '9:00 AM–5:00 PM'],
  ['Friday', '9:00 AM–5:00 PM'],
  ['Saturday', 'Closed'],
  ['Sunday', 'Closed'],
]);

function normalizeText(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

function getFaqQuestion(faq) {
  return faq?.question || faq?.title || 'Frequently asked question';
}

function getFaqAnswer(faq) {
  return faq?.answer || faq?.content || faq?.summary || 'No answer is available.';
}

function getBranchHours(branch) {
  if (!branch?.hours || typeof branch.hours !== 'object') {
    return DEFAULT_HOURS;
  }

  return DEFAULT_HOURS.map(([day]) => {
    const key = day.toLowerCase();
    const value = branch.hours[key];

    if (!value) {
      return [day, 'Closed'];
    }

    const [opening, closing] = String(value).split('-');

    if (!opening || !closing) {
      return [day, value];
    }

    return [day, `${opening}–${closing}`];
  });
}

function getBranchServices(branch) {
  return Array.isArray(branch?.services)
    ? branch.services.filter(Boolean)
    : [];
}

/**
 * Renders support resources, synthetic contact information, FAQs, and
 * fictional branch locations for the Nova Bank Demo.
 *
 * @param {{
 *   faqs?: Object[],
 *   branches?: Object[],
 *   className?: string,
 *   onFaqSelect?: Function,
 *   onBranchSelect?: Function
 * }} props
 * @returns {JSX.Element}
 */
function SupportPage({
  faqs: providedFaqs,
  branches: providedBranches,
  className = '',
  onFaqSelect,
  onBranchSelect,
}) {
  const [faqs, setFaqs] = useState(
    Array.isArray(providedFaqs) ? providedFaqs : [],
  );
  const [branches, setBranches] = useState(
    Array.isArray(providedBranches) ? providedBranches : [],
  );
  const [search, setSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [expandedBranchId, setExpandedBranchId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const chat = useOptionalChat();

  useEffect(() => {
    let isMounted = true;

    if (Array.isArray(providedFaqs) && Array.isArray(providedBranches)) {
      setFaqs(providedFaqs);
      setBranches(providedBranches);
      setLoadError('');
      return () => {
        isMounted = false;
      };
    }

    try {
      const nextFaqs = Array.isArray(providedFaqs)
        ? providedFaqs
        : supportService.getFaqs();
      const nextBranches = Array.isArray(providedBranches)
        ? providedBranches
        : supportService.getBranches();

      if (isMounted) {
        setFaqs(nextFaqs);
        setBranches(nextBranches);
        setLoadError('');
      }
    } catch {
      if (isMounted) {
        setFaqs(Array.isArray(providedFaqs) ? providedFaqs : []);
        setBranches(Array.isArray(providedBranches) ? providedBranches : []);
        setLoadError('Support information could not be loaded right now.');
      }
    }

    return () => {
      isMounted = false;
    };
  }, [providedBranches, providedFaqs]);

  const filteredFaqs = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    if (!normalizedSearch) {
      return faqs;
    }

    return faqs.filter((faq) =>
      [
        faq?.question,
        faq?.title,
        faq?.answer,
        faq?.content,
        faq?.category,
      ].some((value) =>
        normalizeText(value).toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [faqs, search]);

  const handleFaqToggle = (faq) => {
    const faqId = faq?.id || faq?.question;
    const nextId = expandedFaqId === faqId ? null : faqId;

    setExpandedFaqId(nextId);

    if (nextId && typeof onFaqSelect === 'function') {
      onFaqSelect(faq);
    }
  };

  const handleBranchToggle = (branch) => {
    const branchId = branch?.id || branch?.name;
    const nextId = expandedBranchId === branchId ? null : branchId;

    setExpandedBranchId(nextId);

    if (nextId && typeof onBranchSelect === 'function') {
      onBranchSelect(branch);
    }
  };

  return (
    <main
      className={['page-container', className].filter(Boolean).join(' ')}
      data-testid="support-page"
    >
      <header className="page-header mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            Help and support
          </p>
          <h1 className="mt-2 text-3xl font-bold text-nova-midnight sm:text-4xl">
            How can we help today?
          </h1>
          <p className="mt-2 max-w-2xl text-base text-nova-slate">
            You are using help and support as a Customer Support User. These
            channels, FAQs, and the chat assistant are simulated.
          </p>
        </div>

        <a
          href={ROUTES.dashboard}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
        >
          Back to dashboard
        </a>
      </header>

      {loadError && (
        <section
          role="alert"
          className="surface-card mb-8 border-nova-coral/40 bg-nova-coral/10 px-5 py-4 text-sm text-nova-midnight"
        >
          {loadError}
        </section>
      )}

      <section
        aria-labelledby="support-contact-title"
        className="mb-8"
      >
        <h2
          id="support-contact-title"
          className="mb-4 text-2xl font-bold text-nova-midnight"
        >
          Contact channels
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOTLINES.map((hotline) => (
            <article
              key={hotline.id}
              className={[
                'surface-card flex h-full flex-col p-5',
                hotline.urgent ? 'border-2 border-nova-navy' : '',
              ].join(' ')}
            >
              <h3 className="text-lg font-bold text-nova-midnight">
                {hotline.name}
              </h3>
              {hotline.phone && (
                <p className="mt-3 text-lg font-bold text-nova-navy">
                  {hotline.phone}
                </p>
              )}
              <p className="mt-2 flex-1 text-sm leading-6 text-nova-slate">
                {hotline.description}
              </p>
              <p className="mt-2 text-xs font-semibold text-nova-slate">
                {hotline.hours}
              </p>
              {hotline.href ? (
                <a
                  href={hotline.href}
                  className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-nova-navy underline-offset-2 hover:underline"
                >
                  {hotline.action}
                </a>
              ) : (
                <p className="mt-4 text-sm font-semibold text-nova-navy">
                  {hotline.action}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section
        aria-label="Immediate assistance"
        className="mb-8 rounded-card bg-[#FEF4C8] px-5 py-5 sm:px-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl font-semibold text-nova-midnight">
            Need immediate help? Start a secure demonstration chat with the Nova Bank Assistant.
          </p>
          <button
            type="button"
            onClick={() => chat?.openChat?.()}
            className="min-h-11 rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
          >
            Launch Chat Assistant
          </button>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="surface-card p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-teal">
            Safety first
          </p>
          <h2 className="mt-2 text-2xl font-bold text-nova-midnight">
            Emergency guidance
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-nova-ink">
            <div className="rounded-lg border border-nova-coral/40 bg-nova-coral/10 p-4">
              <h3 className="font-bold text-nova-midnight">
                For a real emergency
              </h3>
              <p className="mt-1">
                Call your local emergency services immediately. Do not use this
                demonstration to report an emergency or urgent safety issue.
              </p>
            </div>

            <div className="rounded-lg bg-nova-cream p-4">
              <h3 className="font-bold text-nova-midnight">
                Suspected fraud or identity theft
              </h3>
              <p className="mt-1">
                Contact the relevant real financial institution using a trusted
                number from an official statement or website. Never share
                passwords, verification codes, or account numbers here.
              </p>
            </div>

            <div className="rounded-lg bg-nova-sky/60 p-4">
              <h3 className="font-bold text-nova-midnight">
                Demo support limitation
              </h3>
              <p className="mt-1">
                Nova Bank Demo cannot freeze cards, reverse transactions,
                contact emergency responders, or provide real financial advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="support-hours-title"
        className="mb-8 surface-card p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
              Availability
            </p>
            <h2
              id="support-hours-title"
              className="mt-2 text-2xl font-bold text-nova-midnight"
            >
              Support hours
            </h2>
            <p className="mt-2 text-sm text-nova-slate">
              Sample hours for this fictional demonstration support service.
            </p>
          </div>

          <span className="rounded-full bg-nova-mint px-3 py-1 text-xs font-bold text-nova-teal">
            Local demo support
          </span>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {DEFAULT_HOURS.map(([day, hours]) => (
            <div
              key={day}
              className="flex items-center justify-between gap-3 rounded-lg bg-nova-cream px-4 py-3 text-sm"
            >
              <span className="font-semibold text-nova-midnight">{day}</span>
              <span className="text-right text-nova-slate">{hours}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="faq-title" className="mb-8">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            Answers
          </p>
          <h2 id="faq-title" className="mt-2 text-2xl font-bold text-nova-midnight">
            Frequently asked questions
          </h2>
          <p className="mt-1 text-sm text-nova-slate">
            Search common questions about the Nova Bank Demo experience.
          </p>
        </div>

        <div className="surface-card p-4 sm:p-5">
          <label
            htmlFor="support-faq-search"
            className="mb-1.5 block text-sm font-semibold text-nova-midnight"
          >
            Search FAQs
          </label>
          <input
            id="support-faq-search"
            data-testid="support-faq-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search support questions"
            autoComplete="off"
            className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          />

          {filteredFaqs.length > 0 ? (
            <div className="mt-5 divide-y divide-nova-slate/20">
              {filteredFaqs.map((faq, index) => {
                const faqId = faq?.id || faq?.question || `faq-${index}`;
                const answerId = `${faqId}-answer`;
                const isExpanded = expandedFaqId === faqId;

                return (
                  <div key={faqId} data-testid="support-faq-item">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={answerId}
                      onClick={() => handleFaqToggle(faq)}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-nova-midnight transition hover:text-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                    >
                      <span>{getFaqQuestion(faq)}</span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-xl text-nova-blue"
                      >
                        {isExpanded ? '−' : '+'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div
                        id={answerId}
                        className="pb-4 pr-8 text-sm leading-6 text-nova-slate"
                      >
                        {getFaqAnswer(faq)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No matching FAQs"
              description="Try a different search term or clear the search to browse all support questions."
              compact
              className="mt-5"
              action={
                search
                  ? {
                      label: 'Clear search',
                      onClick: () => setSearch(''),
                    }
                  : undefined
              }
            />
          )}
        </div>
      </section>

      <section id="branch-directory" aria-labelledby="branch-directory-title" className="mb-8">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            Locations
          </p>
          <h2
            id="branch-directory-title"
            className="mt-2 text-2xl font-bold text-nova-midnight"
          >
            Branch directory
          </h2>
          <p className="mt-1 text-sm text-nova-slate">
            Browse fictional Nova Bank locations and their sample services.
          </p>
        </div>

        {branches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {branches.map((branch, index) => {
              const branchId = branch?.id || branch?.name || `branch-${index}`;
              const isExpanded = expandedBranchId === branchId;
              const services = getBranchServices(branch);

              return (
                <article
                  key={branchId}
                  className="surface-card overflow-hidden"
                  data-testid="support-branch"
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => handleBranchToggle(branch)}
                    className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-nova-sky/40 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-nova-blue/20 sm:p-6"
                  >
                    <span className="min-w-0">
                      <span className="block text-xl font-bold text-nova-midnight">
                        {branch?.name || 'Nova Bank branch'}
                      </span>
                      <span className="mt-2 block text-sm text-nova-slate">
                        {branch?.address || 'Address unavailable'}
                      </span>
                      {branch?.phone && (
                        <span className="mt-1 block text-sm text-nova-blue">
                          {branch.phone}
                        </span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-xl text-nova-blue"
                    >
                      {isExpanded ? '−' : '+'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-nova-slate/20 bg-nova-cream/60 px-5 py-5 sm:px-6">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-nova-slate">
                        Hours
                      </h3>
                      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        {getBranchHours(branch).map(([day, hours]) => (
                          <div
                            key={`${branchId}-${day}`}
                            className="flex justify-between gap-3"
                          >
                            <dt className="font-semibold text-nova-midnight">
                              {day}
                            </dt>
                            <dd className="text-nova-slate">{hours}</dd>
                          </div>
                        ))}
                      </dl>

                      {services.length > 0 && (
                        <>
                          <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-nova-slate">
                            Services
                          </h3>
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {services.map((service) => (
                              <li
                                key={service}
                                className="rounded-full bg-nova-sky px-3 py-1 text-xs font-semibold text-nova-blue"
                              >
                                {service}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No branches available"
            description="The fictional branch directory is not available right now."
            compact
          />
        )}
      </section>
    </main>
  );
}

SupportPage.propTypes = {
  faqs: PropTypes.arrayOf(PropTypes.object),
  branches: PropTypes.arrayOf(PropTypes.object),
  className: PropTypes.string,
  onFaqSelect: PropTypes.func,
  onBranchSelect: PropTypes.func,
};

export { SupportPage };
export default SupportPage;
