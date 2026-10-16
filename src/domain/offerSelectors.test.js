import { describe, expect, it } from 'vitest';
import { FIXTURES } from '../fixtures/fixtures.js';
import {
  filterActiveOffers,
  filterEligibleOffers,
  filterExpiredOffers,
  filterOffersByCategory,
  isOfferActive,
  isOfferEligible,
  isOfferExpired,
  isOfferInCategory,
  isOfferValid,
  isOfferWithinValidity,
  selectActiveOffers,
  selectEligibleOffers,
  selectExpiredOffers,
  selectOffersByCategory,
} from './offerSelectors.js';

describe('offerSelectors', () => {
  it('treats an offer validity window as inclusive on the reference date', () => {
    const offer = {
      id: 'offer-reference-date',
      status: 'available',
      validFrom: '2026-10-16',
      validUntil: '2026-10-16',
    };

    expect(isOfferWithinValidity(offer, '2026-10-16')).toBe(true);
    expect(isOfferValid(offer, '2026-10-16')).toBe(true);
    expect(isOfferActive(offer, { referenceDate: '2026-10-16' })).toBe(true);
    expect(isOfferWithinValidity(offer, '2026-10-15')).toBe(false);
    expect(isOfferWithinValidity(offer, '2026-10-17')).toBe(false);
  });

  it('selects active available fixture offers for the fixed reference date', () => {
    const activeOffers = selectActiveOffers(FIXTURES.offers);

    expect(activeOffers.map((offer) => offer.id)).toEqual([
      'offer-savings-bonus',
      'offer-ipon-bonus',
      'offer-peso-savings-bonus',
      'offer-rewards-card',
      'offer-dining-cashback',
      'offer-personal-loan',
      'offer-home-loan-waiver',
      'offer-term-deposit',
      'offer-referral-reward',
    ]);
    expect(filterActiveOffers(FIXTURES.offers)).toEqual(activeOffers);
  });

  it('excludes the expired New Year Cashback offer from active offers', () => {
    const offers = [
      ...FIXTURES.offers,
      {
        id: 'offer-new-year-cashback',
        title: 'New Year Cashback',
        category: 'Cashback',
        status: 'available',
        validFrom: '2026-01-01',
        validUntil: '2026-01-31',
      },
    ];

    const activeOffers = selectActiveOffers(offers, {
      referenceDate: '2026-10-16',
    });

    expect(activeOffers.some((offer) => offer.title === 'New Year Cashback')).toBe(
      false,
    );
    expect(
      selectExpiredOffers(offers, '2026-10-16').map((offer) => offer.id),
    ).toContain('offer-new-year-cashback');
    expect(
      filterExpiredOffers(offers, '2026-10-16').map((offer) => offer.id),
    ).toContain('offer-new-year-cashback');
    expect(isOfferExpired(offers[offers.length - 1], '2026-10-16')).toBe(true);
  });

  it('filters offers by category without mutating the source collection', () => {
    const offers = [...FIXTURES.offers];

    expect(selectOffersByCategory(offers, 'savings').map((offer) => offer.id)).toEqual([
      'offer-savings-bonus',
      'offer-ipon-bonus',
      'offer-peso-savings-bonus',
      'offer-term-deposit',
      'offer-referral-reward',
    ]);
    expect(filterOffersByCategory(offers, 'CARDS').map((offer) => offer.id)).toEqual([
      'offer-rewards-card',
      'offer-dining-cashback',
      'offer-welcome-bonus',
    ]);
    expect(isOfferInCategory(FIXTURES.offers[0], 'SAVINGS')).toBe(true);
    expect(isOfferInCategory(FIXTURES.offers[0], 'cards')).toBe(false);
    expect(offers).toEqual(FIXTURES.offers);
  });

  it('filters offers by eligible persona and excludes explicitly excluded personas', () => {
    const personaScopedOffer = {
      id: 'offer-persona-scoped',
      title: 'Persona scoped offer',
      category: 'Savings',
      status: 'available',
      validFrom: '2026-10-01',
      validUntil: '2026-12-31',
      eligiblePersonaIds: ['user-miguel-santos'],
    };

    expect(isOfferEligible(personaScopedOffer, 'user-miguel-santos')).toBe(true);
    expect(isOfferEligible(personaScopedOffer, 'user-rosa-delacruz')).toBe(false);
    expect(
      selectEligibleOffers([personaScopedOffer], 'user-miguel-santos'),
    ).toEqual([personaScopedOffer]);
    expect(
      filterEligibleOffers([personaScopedOffer], 'user-rosa-delacruz'),
    ).toEqual([]);

    const excludedOffer = {
      ...personaScopedOffer,
      id: 'offer-excluded-persona',
      eligiblePersonaIds: [],
      excludedPersonaIds: ['user-miguel-santos'],
    };

    expect(isOfferEligible(excludedOffer, 'user-miguel-santos')).toBe(false);
    expect(isOfferEligible(excludedOffer, 'user-rosa-delacruz')).toBe(true);
  });

  it('rejects malformed or reversed validity windows', () => {
    expect(
      isOfferWithinValidity(
        {
          status: 'available',
          validFrom: '2026-12-31',
          validUntil: '2026-01-01',
        },
        '2026-10-16',
      ),
    ).toBe(false);
    expect(
      isOfferActive(
        {
          status: 'claimed',
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
        },
        { referenceDate: '2026-10-16' },
      ),
    ).toBe(false);
    expect(isOfferExpired(null, '2026-10-16')).toBe(false);
    expect(selectActiveOffers(null)).toEqual([]);
  });
});