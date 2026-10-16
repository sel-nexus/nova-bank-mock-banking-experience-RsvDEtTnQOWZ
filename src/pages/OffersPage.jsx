import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { offerService } from '../domain/offerService.js';
import { DEFAULT_FIXTURE_USER_ID } from '../fixtures/fixtures.js';
import { useAppContext } from '../state/AppProvider.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { Modal } from '../components/shared/Modal.jsx';
import { StatusBadge } from '../components/shared/StatusBadge.jsx';
import { formatCurrency, formatDate, safeDisplay } from '../utils/formatters.js';

const CATEGORY_ORDER = Object.freeze([
  { value: 'all', label: 'All offers' },
  { value: 'savings', label: 'Savings' },
  { value: 'cards', label: 'Cards' },
  { value: 'loans', label: 'Loans' },
]);

const CATEGORY_STYLES = Object.freeze({
  savings: {
    icon: '↗',
    accent: 'bg-nova-mint text-nova-teal',
  },
  cards: {
    icon: '▣',
    accent: 'bg-nova-sky text-nova-blue',
  },
  loans: {
    icon: '$',
    accent: 'bg-nova-gold/30 text-nova-ink',
  },
  all: {
    icon: '★',
    accent: 'bg-nova-lime text-nova-midnight',
  },
});

function normalizeText(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

function getPersonaId(persona, session, providedPersonaId) {
  return (
    providedPersonaId ||
    persona?.id ||
    persona?.userId ||
    session?.userId ||
    DEFAULT_FIXTURE_USER_ID
  );
}

function getOfferCategory(offer) {
  const category = normalizeText(offer?.category).toLowerCase();
  const type = normalizeText(offer?.type).toLowerCase();

  if (category.includes('saving') || type === 'savings') {
    return 'savings';
  }

  if (
    category.includes('card') ||
    type === 'card' ||
    type === 'credit'
  ) {
    return 'cards';
  }

  if (category.includes('loan') || category.includes('lend') || type === 'loan') {
    return 'loans';
  }

  return category || 'other';
}

function getOfferValue(offer) {
  if (offer?.amount !== undefined) {
    return formatCurrency(offer.amount, offer.currency || 'USD');
  }

  if (offer?.percentage !== undefined) {
    return `${offer.percentage}%`;
  }

  return '';
}

function getOfferIcon(offer) {
  return CATEGORY_STYLES[getOfferCategory(offer)]?.icon || '+';
}

function getOfferAccent(offer) {
  return CATEGORY_STYLES[getOfferCategory(offer)]?.accent || 'bg-nova-sky text-nova-blue';
}

function OfferCard({ offer, featured, onSelect, onInterest }) {
  const offerValue = getOfferValue(offer);

  return (
    <article
      className={[
        'surface-card flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-nova-blue/40 sm:p-6',
        featured ? 'border-2 border-nova-gold/70' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          aria-hidden="true"
          className={[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold',
            getOfferAccent(offer),
          ].join(' ')}
        >
          {getOfferIcon(offer)}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {featured && (
            <span className="rounded-full bg-nova-gold/30 px-3 py-1 text-xs font-bold text-nova-ink">
              Featured
            </span>
          )}
          {offerValue && (
            <span className="rounded-full bg-nova-sky px-3 py-1 text-xs font-bold text-nova-blue">
              {offerValue}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-nova-blue">
          {safeDisplay(offer.category, 'Offer')}
        </p>
        <h3 className="mt-1 text-xl font-bold text-nova-midnight">
          {safeDisplay(offer.title, 'Nova Bank offer')}
        </h3>
        <p className="mt-3 text-sm leading-6 text-nova-slate">
          {safeDisplay(
            offer.description,
            'Explore this synthetic offer to learn more.',
          )}
        </p>
      </div>

      <div className="mt-auto pt-6">
        <p className="text-xs text-nova-slate">
          Available through {offer.validUntil ? formatDate(offer.validUntil) : 'the current demo period'}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onSelect?.(offer)}
            className="min-h-11 flex-1 rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            View offer
          </button>
          <button
            type="button"
            onClick={() => onInterest?.(offer)}
            className="min-h-11 flex-1 rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
          >
            I'm interested
          </button>
        </div>
      </div>
    </article>
  );
}

OfferCard.propTypes = {
  offer: PropTypes.object.isRequired,
  featured: PropTypes.bool,
  onSelect: PropTypes.func,
  onInterest: PropTypes.func,
};

OfferCard.defaultProps = {
  featured: false,
  onSelect: undefined,
  onInterest: undefined,
};

/**
 * Renders the active, persona-scoped Nova Bank Demo offer catalogue.
 *
 * @param {{
 *   personaId?: string,
 *   offers?: Object[],
 *   featuredOffers?: Object[],
 *   category?: string,
 *   onOfferSelect?: Function,
 *   onInterest?: Function,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function OffersPage({
  personaId: providedPersonaId,
  offers: providedOffers,
  featuredOffers: providedFeaturedOffers,
  category: providedCategory,
  onOfferSelect,
  onInterest,
  className,
}) {
  const { persona, session } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState(
    normalizeText(providedCategory).toLowerCase() || 'all',
  );
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [loadError, setLoadError] = useState('');

  const activePersonaId = getPersonaId(
    persona,
    session,
    providedPersonaId,
  );

  const offers = useMemo(() => {
    if (Array.isArray(providedOffers)) {
      return providedOffers;
    }

    try {
      setLoadError('');
      return offerService.getOffers(activePersonaId, {
        activeOnly: true,
      });
    } catch {
      setLoadError('The offer catalogue could not be loaded right now.');
      return [];
    }
  }, [activePersonaId, providedOffers]);

  const availableOffers = useMemo(
    () => offers.filter((offer) => offer?.status === undefined || offer.status === 'available'),
    [offers],
  );

  const featuredOffers = useMemo(() => {
    if (Array.isArray(providedFeaturedOffers)) {
      return providedFeaturedOffers;
    }

    const explicitlyFeatured = availableOffers.filter(
      (offer) => offer.featured === true || offer.isFeatured === true,
    );

    return (explicitlyFeatured.length > 0
      ? explicitlyFeatured
      : availableOffers
    ).slice(0, 2);
  }, [availableOffers, providedFeaturedOffers]);

  const filteredOffers = useMemo(
    () =>
      selectedCategory === 'all'
        ? availableOffers
        : availableOffers.filter(
            (offer) => getOfferCategory(offer) === selectedCategory,
          ),
    [availableOffers, selectedCategory],
  );

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleSelect = (offer) => {
    setInterestMessage('');
    setSelectedOffer(offer);
    onOfferSelect?.(offer);
  };

  const handleInterest = (offer) => {
    setInterestMessage('');

    try {
      const result =
        typeof onInterest === 'function'
          ? onInterest(offer)
          : offerService.recordOfferInterest(activePersonaId, offer.id);

      if (result?.success === false) {
        setInterestMessage(
          result.error?.message ||
            'Your interest could not be recorded in this demonstration.',
        );
        return;
      }

      setInterestMessage(
        'Your interest was recorded locally. No application or real account action was started.',
      );
      setSelectedOffer(offer);
    } catch {
      setInterestMessage(
        'Your interest could not be recorded right now. Please try again.',
      );
    }
  };

  return (
    <>
      <div
        className={['page-container', className].filter(Boolean).join(' ')}
        data-testid="offers-page"
      >
        <header className="page-header mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
              Offers for you
            </p>
            <h1 className="mt-2 text-3xl font-bold text-nova-midnight sm:text-4xl">
              Make more of your banking
            </h1>
            <p className="mt-2 max-w-2xl text-base text-nova-slate">
              Explore current synthetic offers selected for your Nova Bank Demo
              experience.
            </p>
          </div>

          <StatusBadge status="simulated" label="Demo offers" />
        </header>

        {loadError && (
          <section
            role="alert"
            className="surface-card mb-8 border-nova-coral/40 bg-nova-coral/10 px-5 py-4 text-sm text-nova-midnight"
          >
            {loadError}
          </section>
        )}

        {featuredOffers.length > 0 && (
          <section
            aria-labelledby="featured-offers-title"
            className="mb-10"
          >
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-teal">
                Personalized highlights
              </p>
              <h2
                id="featured-offers-title"
                className="mt-1 text-2xl font-bold text-nova-midnight"
              >
                Featured offers
              </h2>
              <p className="mt-1 text-sm text-nova-slate">
                A few active offers to explore first.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {featuredOffers.map((offer) => (
                <OfferCard
                  key={`featured-${offer.id}`}
                  offer={offer}
                  featured
                  onSelect={handleSelect}
                  onInterest={handleInterest}
                />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="all-offers-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                id="all-offers-title"
                className="text-2xl font-bold text-nova-midnight"
              >
                All active offers
              </h2>
              <p className="mt-1 text-sm text-nova-slate">
                Browse available offers by category.
              </p>
            </div>

            <div className="w-full sm:w-56">
              <label
                htmlFor="offers-category"
                className="mb-1.5 block text-sm font-semibold text-nova-midnight"
              >
                Category
              </label>
              <select
                id="offers-category"
                value={CATEGORY_ORDER.some(
                  (option) => option.value === selectedCategory,
                )
                  ? selectedCategory
                  : 'all'}
                onChange={handleCategoryChange}
                className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
              >
                {CATEGORY_ORDER.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredOffers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onSelect={handleSelect}
                  onInterest={handleInterest}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No offers found"
              description={
                selectedCategory === 'all'
                  ? 'There are no active offers available in this synthetic catalogue right now.'
                  : `There are no active offers in the ${
                      CATEGORY_ORDER.find(
                        (option) => option.value === selectedCategory,
                      )?.label?.toLowerCase() || selectedCategory
                    } category right now.`
              }
              compact
              action={
                selectedCategory !== 'all'
                  ? {
                      label: 'View all offers',
                      onClick: () => setSelectedCategory('all'),
                    }
                  : undefined
              }
            />
          )}
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-nova-sky/60 px-4 py-3 text-sm text-nova-slate">
          <p>Offer availability and terms are simulated for demonstration purposes.</p>
          <p className="text-xs">
            No application or real financial action is submitted.
          </p>
        </div>
      </div>

      <Modal
        open={Boolean(selectedOffer)}
        onClose={() => setSelectedOffer(null)}
        title={selectedOffer?.title || 'Offer details'}
        closeLabel="Close offer details"
        contentClassName="max-w-xl"
      >
        {selectedOffer && (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="active" label="Available" />
              <span className="text-sm text-nova-slate">
                {safeDisplay(selectedOffer.category, 'Offer')}
              </span>
            </div>

            <p className="mt-5 text-base leading-7 text-nova-ink">
              {safeDisplay(
                selectedOffer.description,
                'Offer details are not available.',
              )}
            </p>

            {selectedOffer.terms && (
              <div className="mt-5 rounded-lg bg-nova-cream p-4 text-sm text-nova-slate">
                <p className="font-semibold text-nova-midnight">Terms</p>
                <p className="mt-1">{selectedOffer.terms}</p>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-nova-sky/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
                  Valid from
                </p>
                <p className="mt-1 font-semibold text-nova-midnight">
                  {selectedOffer.validFrom
                    ? formatDate(selectedOffer.validFrom)
                    : 'Current demo period'}
                </p>
              </div>
              <div className="rounded-lg bg-nova-sky/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
                  Valid until
                </p>
                <p className="mt-1 font-semibold text-nova-midnight">
                  {selectedOffer.validUntil
                    ? formatDate(selectedOffer.validUntil)
                    : 'Current demo period'}
                </p>
              </div>
            </div>

            {interestMessage && (
              <p
                role="status"
                className="mt-5 rounded-lg border border-nova-teal/30 bg-nova-mint px-3 py-2 text-sm text-nova-ink"
              >
                {interestMessage}
              </p>
            )}

            <button
              type="button"
              onClick={() => handleInterest(selectedOffer)}
              className="mt-6 min-h-11 w-full rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
            >
              I'm interested
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

OffersPage.propTypes = {
  personaId: PropTypes.string,
  offers: PropTypes.arrayOf(PropTypes.object),
  featuredOffers: PropTypes.arrayOf(PropTypes.object),
  category: PropTypes.string,
  onOfferSelect: PropTypes.func,
  onInterest: PropTypes.func,
  className: PropTypes.string,
};

OffersPage.defaultProps = {
  personaId: '',
  offers: undefined,
  featuredOffers: undefined,
  category: 'all',
  onOfferSelect: undefined,
  onInterest: undefined,
  className: '',
};

export { OffersPage };
export default OffersPage;