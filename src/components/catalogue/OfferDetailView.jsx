import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { StatusBadge } from '../shared/StatusBadge.jsx';
import {
  formatCurrency,
  formatDate,
  safeDisplay,
} from '../../utils/formatters.js';

function normalizeText(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

function getOfferCategory(offer, providedCategory) {
  const category = normalizeText(providedCategory || offer?.category);

  return category || 'Offer';
}

function getOfferValue(offer) {
  if (offer?.amount !== undefined && offer?.amount !== null) {
    return formatCurrency(offer.amount, offer.currency || 'USD');
  }

  if (offer?.percentage !== undefined && offer?.percentage !== null) {
    return `${offer.percentage}%`;
  }

  return '';
}

function getBenefits(offer, providedBenefits) {
  if (Array.isArray(providedBenefits) && providedBenefits.length > 0) {
    return providedBenefits.filter(Boolean);
  }

  if (Array.isArray(offer?.benefits) && offer.benefits.length > 0) {
    return offer.benefits.filter(Boolean);
  }

  return [
    'Review the simulated offer details and eligibility information.',
    'Explore how this synthetic offer may fit your demonstration goals.',
    'Express interest without submitting a real application.',
  ];
}

function getEligibility(offer, providedEligibility) {
  if (typeof providedEligibility === 'boolean') {
    return providedEligibility;
  }

  if (typeof offer?.eligible === 'boolean') {
    return offer.eligible;
  }

  if (typeof offer?.isEligible === 'boolean') {
    return offer.isEligible;
  }

  if (typeof offer?.available === 'boolean') {
    return offer.available;
  }

  if (typeof offer?.status === 'string') {
    return !['unavailable', 'expired', 'claimed', 'ineligible'].includes(
      offer.status.trim().toLowerCase(),
    );
  }

  return true;
}

function getValidity(offer, providedValidFrom, providedValidUntil) {
  return {
    from: providedValidFrom || offer?.validFrom || '',
    until: providedValidUntil || offer?.validUntil || '',
  };
}

/**
 * Renders synthetic offer details, benefits, eligibility, validity, terms, and
 * simulated actions without starting a real application.
 *
 * @param {{
 *   offer?: Object,
 *   offerData?: Object,
 *   category?: string,
 *   benefits?: Array,
 *   eligible?: boolean,
 *   isEligible?: boolean,
 *   validFrom?: string|Date|number,
 *   validUntil?: string|Date|number,
 *   terms?: React.ReactNode,
 *   onExpressInterest?: Function,
 *   onInterest?: Function,
 *   onApply?: Function,
 *   onLearnMore?: Function,
 *   interestLabel?: string,
 *   applyLabel?: string,
 *   learnMoreLabel?: string,
 *   className?: string,
 *   compact?: boolean
 * }} props
 * @returns {JSX.Element}
 */
function OfferDetailView({
  offer,
  offerData,
  category = '',
  benefits,
  eligible,
  isEligible,
  validFrom = '',
  validUntil = '',
  terms,
  onExpressInterest,
  onInterest,
  onApply,
  onLearnMore,
  interestLabel = 'Express interest',
  applyLabel = 'Express interest',
  learnMoreLabel = 'Learn more',
  className = '',
  compact = false,
}) {
  const titleId = useId();
  const benefitsId = useId();
  const eligibilityId = useId();
  const validityId = useId();
  const termsId = useId();

  const catalogueOffer = offer || offerData || {};
  const offerTitle = safeDisplay(
    catalogueOffer.title || catalogueOffer.name,
    'Nova Bank offer',
  );
  const offerCategory = getOfferCategory(catalogueOffer, category);
  const offerValue = getOfferValue(catalogueOffer);
  const offerBenefits = getBenefits(catalogueOffer, benefits);
  const offerEligibility = getEligibility(
    catalogueOffer,
    eligible !== undefined ? eligible : isEligible,
  );
  const validity = getValidity(catalogueOffer, validFrom, validUntil);
  const isAvailable =
    catalogueOffer.available !== false &&
    !['unavailable', 'expired', 'claimed'].includes(
      normalizeText(catalogueOffer.status).toLowerCase(),
    );
  const interestHandler = onExpressInterest || onInterest || onApply;
  const hasLearnMoreAction = typeof onLearnMore === 'function';

  const handleInterest = () => {
    interestHandler?.(catalogueOffer);
  };

  const handleLearnMore = () => {
    onLearnMore?.(catalogueOffer);
  };

  return (
    <section
      aria-labelledby={titleId}
      className={[
        'surface-card overflow-hidden',
        compact ? 'p-5' : 'p-5 sm:p-8',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="offer-detail-view"
    >
      <header className="flex flex-col gap-5 border-b border-nova-slate/20 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            {offerCategory}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2
              id={titleId}
              className="text-2xl font-bold text-nova-midnight sm:text-3xl"
            >
              {offerTitle}
            </h2>
            <StatusBadge
              status={isAvailable ? 'active' : 'unavailable'}
              label={isAvailable ? 'Available' : 'Unavailable'}
            />
          </div>
        </div>

        {offerValue && (
          <span className="shrink-0 rounded-full bg-nova-gold/30 px-3 py-1.5 text-sm font-bold text-nova-ink">
            {offerValue}
          </span>
        )}
      </header>

      <p className="mt-6 text-base leading-7 text-nova-ink">
        {safeDisplay(
          catalogueOffer.description || catalogueOffer.summary,
          'Explore this synthetic Nova Bank offer to learn more.',
        )}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)]">
        <div className="space-y-6">
          <section aria-labelledby={benefitsId}>
            <h3
              id={benefitsId}
              className="text-xl font-bold text-nova-midnight"
            >
              Benefits and highlights
            </h3>

            <ul className="mt-4 space-y-3">
              {offerBenefits.map((benefit, index) => (
                <li
                  key={`${catalogueOffer.id || 'offer'}-benefit-${index}`}
                  className="flex items-start gap-3 rounded-lg bg-nova-sky/50 p-4 text-sm text-nova-ink"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nova-mint font-bold text-nova-teal"
                  >
                    ✓
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby={termsId}
            className="rounded-lg bg-nova-cream p-4"
          >
            <h3
              id={termsId}
              className="text-xl font-bold text-nova-midnight"
            >
              Terms and conditions
            </h3>
            <p className="mt-3 text-sm leading-6 text-nova-slate">
              {terms || catalogueOffer.terms || (
                <>
                  Eligibility, availability, and offer terms are simulated for
                  this demonstration. Review the offer details carefully before
                  expressing interest.
                </>
              )}
            </p>

            {catalogueOffer.promoCode && (
              <div className="mt-4 rounded-lg bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
                  Promo code
                </p>
                <p className="mt-1 font-bold text-nova-midnight">
                  {catalogueOffer.promoCode}
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section
            aria-labelledby={eligibilityId}
            className="rounded-lg bg-nova-cream p-4"
          >
            <h3
              id={eligibilityId}
              className="text-lg font-bold text-nova-midnight"
            >
              Eligibility
            </h3>
            <p className="mt-3 text-sm font-semibold text-nova-midnight">
              {offerEligibility && isAvailable
                ? 'This offer is available to explore.'
                : 'This offer is not currently available.'}
            </p>
            <p className="mt-2 text-sm leading-6 text-nova-slate">
              Eligibility and availability are simulated for this
              demonstration. They do not represent a credit decision, approval,
              or real-world financial determination.
            </p>
          </section>

          <section
            aria-labelledby={validityId}
            className="rounded-lg border border-nova-slate/20 bg-nova-sky/50 p-4"
          >
            <h3
              id={validityId}
              className="text-lg font-bold text-nova-midnight"
            >
              Offer validity
            </h3>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="font-semibold text-nova-slate">Valid from</dt>
                <dd className="text-right font-semibold text-nova-midnight">
                  {validity.from ? formatDate(validity.from) : 'Current'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="font-semibold text-nova-slate">Valid until</dt>
                <dd className="text-right font-semibold text-nova-midnight">
                  {validity.until ? formatDate(validity.until) : 'Ongoing'}
                </dd>
              </div>
            </dl>
          </section>

          {(typeof interestHandler === 'function' || hasLearnMoreAction) && (
            <div className="space-y-3">
              {typeof interestHandler === 'function' && (
                <button
                  type="button"
                  onClick={handleInterest}
                  disabled={!isAvailable || !offerEligibility}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {interestLabel || applyLabel}
                </button>
              )}

              {hasLearnMoreAction && (
                <button
                  type="button"
                  onClick={handleLearnMore}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                >
                  {learnMoreLabel}
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

OfferDetailView.propTypes = {
  offer: PropTypes.object,
  offerData: PropTypes.object,
  category: PropTypes.string,
  benefits: PropTypes.arrayOf(PropTypes.node),
  eligible: PropTypes.bool,
  isEligible: PropTypes.bool,
  validFrom: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
    PropTypes.number,
  ]),
  validUntil: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
    PropTypes.number,
  ]),
  terms: PropTypes.node,
  onExpressInterest: PropTypes.func,
  onInterest: PropTypes.func,
  onApply: PropTypes.func,
  onLearnMore: PropTypes.func,
  interestLabel: PropTypes.string,
  applyLabel: PropTypes.string,
  learnMoreLabel: PropTypes.string,
  className: PropTypes.string,
  compact: PropTypes.bool,
};

export { OfferDetailView };
export default OfferDetailView;
