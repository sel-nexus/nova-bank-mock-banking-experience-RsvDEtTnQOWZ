import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import { DEFAULT_FIXTURE_USER_ID } from '../fixtures/fixtures.js';
import { offerService } from '../domain/offerService.js';
import {
  isOfferActive,
  isOfferEligible,
} from '../domain/offerSelectors.js';
import { useAppContext } from '../state/AppProvider.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { StatusBadge } from '../components/shared/StatusBadge.jsx';
import {
  formatCurrency,
  formatDate,
  safeDisplay,
} from '../utils/formatters.js';

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

function getOfferId(providedOfferId, routeOfferId) {
  return normalizeText(providedOfferId || routeOfferId);
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

function getOfferCategory(offer) {
  return safeDisplay(offer?.category, 'Offer');
}

function getOfferBenefits(offer) {
  if (Array.isArray(offer?.benefits)) {
    const benefits = offer.benefits.filter(Boolean);

    if (benefits.length > 0) {
      return benefits;
    }
  }

  const category = normalizeText(offer?.category).toLowerCase();

  if (category.includes('saving')) {
    return [
      'Explore a synthetic opportunity to grow your savings.',
      'Review the offer details before expressing interest.',
      'Track your selected offers locally in this demonstration.',
    ];
  }

  if (category.includes('card')) {
    return [
      'Learn more about the featured card opportunity.',
      'Review simulated rewards and eligibility information.',
      'Express interest without submitting a real application.',
    ];
  }

  return [
    'Review the offer details and simulated value.',
    'Understand the applicable demonstration terms.',
    'Express interest locally without affecting a real account.',
  ];
}

function getEligibilityMessage(offer, eligible) {
  if (!offer) {
    return 'Offer eligibility information is unavailable.';
  }

  if (eligible) {
    return 'This offer is available to explore for the active demo persona.';
  }

  return 'This offer is not currently eligible for the active demo persona.';
}

/**
 * Renders details for an active synthetic offer, including eligibility,
 * benefits, validity, terms, and simulated interest feedback.
 *
 * @param {{
 *   offerId?: string,
 *   personaId?: string,
 *   offer?: Object,
 *   onExpressInterest?: Function,
 *   onApply?: Function,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function OfferDetailPage({
  offerId: providedOfferId,
  personaId: providedPersonaId,
  offer: providedOffer,
  onExpressInterest,
  onApply,
  className,
}) {
  const navigate = useNavigate();
  const { offerId: routeOfferId } = useParams();
  const { persona, session } = useAppContext();
  const [feedback, setFeedback] = useState('');

  const activePersonaId = getPersonaId(
    persona,
    session,
    providedPersonaId,
  );
  const activeOfferId = getOfferId(providedOfferId, routeOfferId);
  const hasProvidedOffer = providedOffer !== undefined;

  const offer = useMemo(() => {
    if (hasProvidedOffer) {
      return providedOffer || null;
    }

    if (!activeOfferId) {
      return null;
    }

    try {
      return offerService.getOfferById(activeOfferId, activePersonaId);
    } catch {
      return null;
    }
  }, [activeOfferId, activePersonaId, hasProvidedOffer, providedOffer]);

  const eligible = useMemo(
    () => Boolean(offer && isOfferEligible(offer, activePersonaId)),
    [activePersonaId, offer],
  );

  const active = useMemo(
    () => Boolean(offer && isOfferActive(offer)),
    [offer],
  );

  const benefits = useMemo(() => getOfferBenefits(offer), [offer]);
  const offerValue = getOfferValue(offer);

  const handleInterest = () => {
    setFeedback('');

    try {
      const handler = onExpressInterest || onApply;

      if (typeof handler === 'function') {
        const result = handler(offer);

        if (result?.success === false) {
          setFeedback(
            result.error?.message ||
              'Your interest could not be recorded in this demonstration.',
          );
          return;
        }
      } else {
        const result = offerService.recordOfferInterest(
          activePersonaId,
          offer.id,
        );

        if (result?.success === false) {
          setFeedback(
            result.error?.message ||
              'Your interest could not be recorded in this demonstration.',
          );
          return;
        }
      }

      setFeedback(
        'Your interest was recorded locally. No application was submitted and no real financial action was started.',
      );
    } catch {
      setFeedback(
        'Your interest could not be recorded right now. Please try again.',
      );
    }
  };

  if (!offer) {
    return (
      <div
        className={['page-container', className].filter(Boolean).join(' ')}
        data-testid="offer-detail-page"
      >
        <div className="mb-6">
          <NavLink
            to={ROUTES.dashboard}
            className="text-sm font-semibold text-nova-blue underline-offset-2 hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            ← Back to dashboard
          </NavLink>
        </div>

        <EmptyState
          title="Offer not found"
          description="The requested synthetic offer could not be found or is no longer available."
          icon="!"
          action={{
            label: 'Back to dashboard',
            onClick: () => navigate(ROUTES.dashboard),
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={['page-container', className].filter(Boolean).join(' ')}
      data-testid="offer-detail-page"
    >
      <div className="mb-6">
        <NavLink
          to={ROUTES.dashboard}
          className="text-sm font-semibold text-nova-blue underline-offset-2 hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
        >
          ← Back to dashboard
        </NavLink>
      </div>

      <header className="page-header mb-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            {getOfferCategory(offer)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-nova-midnight sm:text-4xl">
              {safeDisplay(offer.title, 'Nova Bank offer')}
            </h1>
            <StatusBadge
              status={active ? 'active' : 'unavailable'}
              label={active ? 'Available' : 'Unavailable'}
            />
          </div>
          <p className="mt-2 max-w-2xl text-base text-nova-slate">
            Review this synthetic offer and learn how it may fit your
            demonstration experience.
          </p>
        </div>
      </header>

      <section
        aria-labelledby="offer-overview-title"
        className="mb-8 overflow-hidden rounded-card bg-nova-midnight p-6 text-white shadow-elevated sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-lime">
              Offer overview
            </p>
            <h2
              id="offer-overview-title"
              className="mt-2 max-w-3xl text-2xl font-bold sm:text-3xl"
            >
              {safeDisplay(offer.title, 'Nova Bank offer')}
            </h2>
          </div>

          {offerValue && (
            <span className="shrink-0 rounded-full bg-nova-gold px-4 py-2 text-lg font-bold text-nova-midnight">
              {offerValue}
            </span>
          )}
        </div>

        <p className="mt-6 max-w-3xl text-base leading-7 text-nova-sky">
          {safeDisplay(
            offer.description,
            'Offer details are not available for this synthetic offer.',
          )}
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="space-y-8">
          <section
            aria-labelledby="offer-eligibility-title"
            className="surface-card p-5 sm:p-6"
          >
            <h2
              id="offer-eligibility-title"
              className="text-2xl font-bold text-nova-midnight"
            >
              Eligibility
            </h2>
            <div className="mt-4 rounded-lg bg-nova-cream p-4">
              <p className="font-semibold text-nova-midnight">
                {getEligibilityMessage(offer, eligible)}
              </p>
              <p className="mt-2 text-sm leading-6 text-nova-slate">
                Eligibility shown here is simulated for this demonstration. It
                does not represent a credit decision, approval, or real-world
                financial eligibility determination.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="offer-benefits-title"
            className="surface-card p-5 sm:p-6"
          >
            <h2
              id="offer-benefits-title"
              className="text-2xl font-bold text-nova-midnight"
            >
              Benefits and highlights
            </h2>

            <ul className="mt-5 space-y-3">
              {benefits.map((benefit, index) => (
                <li
                  key={`${offer.id || 'offer'}-benefit-${index}`}
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
            aria-labelledby="offer-terms-title"
            className="surface-card p-5 sm:p-6"
          >
            <h2
              id="offer-terms-title"
              className="text-2xl font-bold text-nova-midnight"
            >
              Terms and conditions
            </h2>
            <p className="mt-4 text-sm leading-6 text-nova-slate">
              {safeDisplay(
                offer.terms,
                'Eligibility, availability, and offer terms are simulated for demonstration purposes. Review the offer details carefully before expressing interest.',
              )}
            </p>

            {offer.promoCode && (
              <div className="mt-5 rounded-lg bg-nova-cream p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
                  Promo code
                </p>
                <p className="mt-1 font-bold text-nova-midnight">
                  {offer.promoCode}
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section
            aria-labelledby="offer-validity-title"
            className="surface-card p-5 sm:p-6"
          >
            <h2
              id="offer-validity-title"
              className="text-xl font-bold text-nova-midnight"
            >
              Offer validity
            </h2>

            <dl className="mt-5 space-y-4">
              <div className="rounded-lg bg-nova-sky/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
                  Valid from
                </dt>
                <dd className="mt-1 font-semibold text-nova-midnight">
                  {offer.validFrom
                    ? formatDate(offer.validFrom)
                    : 'Current demo period'}
                </dd>
              </div>
              <div className="rounded-lg bg-nova-sky/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
                  Valid until
                </dt>
                <dd className="mt-1 font-semibold text-nova-midnight">
                  {offer.validUntil
                    ? formatDate(offer.validUntil)
                    : 'Current demo period'}
                </dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby="offer-action-title"
            className="surface-card p-5 sm:p-6"
          >
            <h2
              id="offer-action-title"
              className="text-xl font-bold text-nova-midnight"
            >
              Interested in this offer?
            </h2>
            <p className="mt-3 text-sm leading-6 text-nova-slate">
              Express interest to record a local demonstration response. No
              application is submitted and no real account action is taken.
            </p>

            {feedback && (
              <p
                role="status"
                className="mt-4 rounded-lg border border-nova-teal/30 bg-nova-mint px-3 py-2 text-sm text-nova-ink"
              >
                {feedback}
              </p>
            )}

            <button
              type="button"
              onClick={handleInterest}
              disabled={!active || !eligible}
              className="mt-5 min-h-11 w-full rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Express interest
            </button>
          </section>

          <section
            aria-label="Synthetic offer disclaimer"
            className="rounded-lg bg-nova-sky/70 px-4 py-4 text-sm text-nova-slate"
          >
            <p className="font-semibold text-nova-midnight">
              Synthetic offer information
            </p>
            <p className="mt-2 leading-6">
              This offer, its value, eligibility, terms, and availability are
              simulated for demonstration purposes. No real financial product
              is opened or requested.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

OfferDetailPage.propTypes = {
  offerId: PropTypes.string,
  personaId: PropTypes.string,
  offer: PropTypes.object,
  onExpressInterest: PropTypes.func,
  onApply: PropTypes.func,
  className: PropTypes.string,
};

OfferDetailPage.defaultProps = {
  offerId: '',
  personaId: '',
  offer: undefined,
  onExpressInterest: undefined,
  onApply: undefined,
  className: '',
};

export { OfferDetailPage };
export default OfferDetailPage;