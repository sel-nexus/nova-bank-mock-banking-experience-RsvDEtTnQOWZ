import React, { useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_FAQS = Object.freeze([
  {
    id: 'faq-login',
    category: 'Login',
    question: 'How do I sign in to Nova Bank Demo?',
    answer:
      'Use the demo User ID and password provided for the experience, then select Sign in. Nova Bank Demo uses synthetic credentials only and does not connect to a real bank.',
  },
  {
    id: 'faq-forgot-login',
    category: 'Login',
    question: 'What should I do if I forget my User ID or password?',
    answer:
      'Use the recovery links on the sign-in page or open the Help area for simulated guidance. Never enter a real password or sensitive information into this demonstration.',
  },
  {
    id: 'faq-filter-transactions',
    category: 'Filtering and export',
    question: 'How can I filter my transactions?',
    answer:
      'Open Transactions and use the enquiry controls to search by merchant or reference, select a date range, choose a transaction type or category, and sort the results.',
  },
  {
    id: 'faq-export-statement',
    category: 'Filtering and export',
    question: 'Can I export a filtered transaction statement?',
    answer:
      'Yes. After applying your filters, use the Download statement action to create a local text statement containing the visible synthetic transaction activity.',
  },
  {
    id: 'faq-rates',
    category: 'Rates',
    question: 'Where can I find account interest rates?',
    answer:
      'Interest rates are shown in the details for eligible synthetic accounts and products. Rates in this experience are examples for demonstration and are not financial offers.',
  },
  {
    id: 'faq-available-credit',
    category: 'Available credit',
    question: 'What is available credit?',
    answer:
      'Available credit is the remaining amount of a simulated credit limit that may be available for eligible activity. It is not a real credit decision or an approval.',
  },
]);

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function getFaqId(faq, index) {
  return (
    normalizeText(faq?.id || faq?.faqId || faq?.question) ||
    `faq-${index + 1}`
  );
}

function getFaqCategory(faq) {
  return normalizeText(faq?.category || faq?.topic || faq?.section) || 'General';
}

function getFaqQuestion(faq) {
  return (
    normalizeText(faq?.question || faq?.title || faq?.prompt) ||
    'Frequently asked question'
  );
}

function getFaqAnswer(faq) {
  return (
    faq?.answer ||
    faq?.content ||
    faq?.description ||
    'No answer is available for this question.'
  );
}

function getSearchableText(faq) {
  return [
    getFaqCategory(faq),
    getFaqQuestion(faq),
    getFaqAnswer(faq),
    ...(Array.isArray(faq?.tags) ? faq.tags : []),
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * Renders a searchable, keyboard-accessible FAQ accordion for common synthetic
 * banking questions.
 *
 * @param {{
 *   faqs?: Object[],
 *   items?: Object[],
 *   questions?: Object[],
 *   search?: string,
 *   query?: string,
 *   initialSearch?: string,
 *   expandedId?: string|number,
 *   defaultExpandedId?: string|number,
 *   onSearchChange?: Function,
 *   onToggle?: Function,
 *   onSelect?: Function,
 *   searchLabel?: string,
 *   searchPlaceholder?: string,
 *   emptyTitle?: string,
 *   emptyDescription?: string,
 *   title?: React.ReactNode,
 *   description?: React.ReactNode,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function FaqAccordion({
  faqs,
  items,
  questions,
  search,
  query,
  initialSearch,
  expandedId,
  defaultExpandedId,
  onSearchChange,
  onToggle,
  onSelect,
  searchLabel,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  title,
  description,
  className,
}) {
  const searchInputId = useId();
  const listId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const isSearchControlled = search !== undefined || query !== undefined;
  const controlledSearch =
    search !== undefined ? normalizeText(search) : normalizeText(query);
  const [localSearch, setLocalSearch] = useState(
    normalizeText(initialSearch),
  );
  const [localExpandedId, setLocalExpandedId] = useState(() =>
    defaultExpandedId === undefined || defaultExpandedId === null
      ? null
      : String(defaultExpandedId),
  );

  const sourceFaqs = Array.isArray(faqs)
    ? faqs
    : Array.isArray(items)
      ? items
      : Array.isArray(questions)
        ? questions
        : DEFAULT_FAQS;

  const activeSearch = isSearchControlled ? controlledSearch : localSearch;
  const normalizedSearch = activeSearch.toLowerCase();

  const filteredFaqs = useMemo(
    () =>
      sourceFaqs.filter((faq) =>
        normalizedSearch
          ? getSearchableText(faq).includes(normalizedSearch)
          : true,
      ),
    [normalizedSearch, sourceFaqs],
  );

  const isExpandedControlled =
    expandedId !== undefined && expandedId !== null;
  const activeExpandedId = isExpandedControlled
    ? String(expandedId)
    : localExpandedId;

  const handleSearchChange = (event) => {
    const nextSearch = event.target.value;

    if (!isSearchControlled) {
      setLocalSearch(nextSearch);
    }

    onSearchChange?.(nextSearch, event);
  };

  const handleToggle = (faq) => {
    const faqId = getFaqId(faq, sourceFaqs.indexOf(faq));
    const nextExpandedId = activeExpandedId === faqId ? null : faqId;

    if (!isExpandedControlled) {
      setLocalExpandedId(nextExpandedId);
    }

    onToggle?.(faq, nextExpandedId !== null, nextExpandedId);
    onSelect?.(faq, nextExpandedId !== null);
  };

  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      className={['w-full', className].filter(Boolean).join(' ')}
      data-testid="faq-accordion"
    >
      {(title || description) && (
        <header className="mb-5">
          {title && (
            <h2
              id={titleId}
              className="text-2xl font-bold text-nova-midnight sm:text-3xl"
            >
              {title}
            </h2>
          )}
          {description && (
            <p
              id={descriptionId}
              className="mt-2 max-w-2xl text-sm leading-6 text-nova-slate sm:text-base"
            >
              {description}
            </p>
          )}
        </header>
      )}

      <div className="surface-card p-4 sm:p-5">
        <label
          htmlFor={searchInputId}
          className="mb-1.5 block text-sm font-semibold text-nova-midnight"
        >
          {searchLabel}
        </label>
        <input
          id={searchInputId}
          type="search"
          value={activeSearch}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          autoComplete="off"
          aria-controls={listId}
          className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
        />

        {filteredFaqs.length > 0 ? (
          <div
            id={listId}
            className="mt-5 divide-y divide-nova-slate/20"
            data-testid="faq-list"
          >
            {filteredFaqs.map((faq, index) => {
              const faqId = getFaqId(faq, index);
              const answerId = `${listId}-${faqId}-answer`;
              const isExpanded = activeExpandedId === faqId;

              return (
                <article key={faqId} data-testid="faq-item">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={answerId}
                    onClick={() => handleToggle(faq)}
                    className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-nova-midnight transition hover:text-nova-blue focus:outline-none focus:ring-4 focus:ring-inset focus:ring-nova-blue/20 sm:text-base"
                  >
                    <span className="min-w-0">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-nova-blue">
                        {getFaqCategory(faq)}
                      </span>
                      <span>{getFaqQuestion(faq)}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nova-sky text-xl font-normal text-nova-blue"
                    >
                      {isExpanded ? '−' : '+'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      id={answerId}
                      role="region"
                      aria-label={getFaqQuestion(faq)}
                      className="pb-5 pr-12 text-sm leading-6 text-nova-slate"
                    >
                      {typeof getFaqAnswer(faq) === 'string' ? (
                        <p>{getFaqAnswer(faq)}</p>
                      ) : (
                        getFaqAnswer(faq)
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="mt-5 rounded-lg bg-nova-sky/50 px-4 py-6 text-center"
            data-testid="faq-empty-state"
          >
            <h3 className="font-semibold text-nova-midnight">{emptyTitle}</h3>
            <p className="mt-1 text-sm text-nova-slate">
              {emptyDescription}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

FaqAccordion.propTypes = {
  faqs: PropTypes.arrayOf(PropTypes.object),
  items: PropTypes.arrayOf(PropTypes.object),
  questions: PropTypes.arrayOf(PropTypes.object),
  search: PropTypes.string,
  query: PropTypes.string,
  initialSearch: PropTypes.string,
  expandedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultExpandedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSearchChange: PropTypes.func,
  onToggle: PropTypes.func,
  onSelect: PropTypes.func,
  searchLabel: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  title: PropTypes.node,
  description: PropTypes.node,
  className: PropTypes.string,
};

FaqAccordion.defaultProps = {
  faqs: undefined,
  items: undefined,
  questions: undefined,
  search: undefined,
  query: undefined,
  initialSearch: '',
  expandedId: undefined,
  defaultExpandedId: undefined,
  onSearchChange: undefined,
  onToggle: undefined,
  onSelect: undefined,
  searchLabel: 'Search frequently asked questions',
  searchPlaceholder: 'Search login, filtering, rates, or available credit',
  emptyTitle: 'No matching questions',
  emptyDescription:
    'Try a different search term or browse the available questions.',
  title: 'Frequently asked questions',
  description:
    'Find quick answers about signing in, filtering and exporting activity, rates, and available credit.',
  className: '',
};

export { FaqAccordion };
export default FaqAccordion;