import { FIXTURES } from '../fixtures/fixtures.js';
import {
  getReferenceDateString,
  toIsoDate,
} from './referenceClock.js';

const OFFER_INTERESTS = new Map();
let interestSequence = 0;

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneValue(value) {
  if (value === undefined || value === null || typeof value !== 'object') {
    return value;
  }

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // Fall through to the JSON-compatible clone.
    }
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function normalizeIdentifier(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
}

function normalizePersonaId(personaOrId) {
  if (typeof personaOrId === 'string' || typeof personaOrId === 'number') {
    return normalizeIdentifier(personaOrId);
  }

  if (isObject(personaOrId)) {
    return normalizeIdentifier(personaOrId.id || personaOrId.userId);
  }

  return '';
}

function normalizeOfferId(offerOrId) {
  if (typeof offerOrId === 'string' || typeof offerOrId === 'number') {
    return normalizeIdentifier(offerOrId);
  }

  if (isObject(offerOrId)) {
    return normalizeIdentifier(offerOrId.id || offerOrId.offerId);
  }

  return '';
}

function normalizeOptions(options) {
  return isObject(options) ? options : {};
}

function getPersona(personaOrId) {
  const personaId = normalizePersonaId(personaOrId);

  if (!personaId) {
    return null;
  }

  return FIXTURES.personas.find((persona) => persona.id === personaId) || null;
}

function getOffer(offerOrId) {
  const offerId = normalizeOfferId(offerOrId);

  if (!offerId) {
    return null;
  }

  return FIXTURES.offers.find((offer) => offer.id === offerId) || null;
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeIdentifier).filter(Boolean);
  }

  const normalizedValue = normalizeIdentifier(value);
  return normalizedValue ? [normalizedValue] : [];
}

function isOfferEligibleForPersona(offer, personaId) {
  const eligiblePersonaIds = normalizeList(
    offer.eligiblePersonaIds ||
      offer.eligibleUserIds ||
      offer.personaIds ||
      offer.userIds,
  );
  const excludedPersonaIds = normalizeList(
    offer.excludedPersonaIds || offer.excludedUserIds,
  );

  if (excludedPersonaIds.includes(personaId)) {
    return false;
  }

  return (
    eligiblePersonaIds.length === 0 || eligiblePersonaIds.includes(personaId)
  );
}

function isOfferActive(offer, referenceDate) {
  const validFrom = toIsoDate(offer.validFrom);
  const validUntil = toIsoDate(offer.validUntil);

  if (!validFrom || !validUntil || validFrom > validUntil) {
    return false;
  }

  return referenceDate >= validFrom && referenceDate <= validUntil;
}

function matchesOffer(offer, options) {
  const search = normalizeIdentifier(options.search || options.query).toLowerCase();
  const category = normalizeIdentifier(options.category).toLowerCase();
  const status = normalizeIdentifier(options.status).toLowerCase();

  if (category && String(offer.category || '').toLowerCase() !== category) {
    return false;
  }

  if (status && String(offer.status || '').toLowerCase() !== status) {
    return false;
  }

  if (
    search &&
    ![
      offer.title,
      offer.description,
      offer.category,
      offer.terms,
      offer.promoCode,
    ].some((value) => String(value || '').toLowerCase().includes(search))
  ) {
    return false;
  }

  return true;
}

function resolveArguments(personaOrOptions, maybeOptions) {
  if (isObject(personaOrOptions) && maybeOptions === undefined) {
    const looksLikeOptions =
      Object.prototype.hasOwnProperty.call(personaOrOptions, 'activeOnly') ||
      Object.prototype.hasOwnProperty.call(personaOrOptions, 'includeExpired') ||
      Object.prototype.hasOwnProperty.call(personaOrOptions, 'category') ||
      Object.prototype.hasOwnProperty.call(personaOrOptions, 'status') ||
      Object.prototype.hasOwnProperty.call(personaOrOptions, 'search') ||
      Object.prototype.hasOwnProperty.call(personaOrOptions, 'query') ||
      Object.prototype.hasOwnProperty.call(personaOrOptions, 'referenceDate') ||
      Object.prototype.hasOwnProperty.call(personaOrOptions, 'includeClaimed');

    if (looksLikeOptions) {
      return {
        personaId: '',
        options: normalizeOptions(personaOrOptions),
      };
    }
  }

  return {
    personaId: normalizePersonaId(personaOrOptions),
    options: normalizeOptions(maybeOptions),
  };
}

function getFilteredOffers(personaId, options) {
  const referenceDate =
    toIsoDate(options.referenceDate || options.asOf) ||
    getReferenceDateString();
  const activeOnly = options.activeOnly !== false && options.includeExpired !== true;
  const includeClaimed = options.includeClaimed === true;

  return FIXTURES.offers.filter((offer) => {
    if (personaId && !isOfferEligibleForPersona(offer, personaId)) {
      return false;
    }

    if (!includeClaimed && offer.status !== 'available') {
      return false;
    }

    if (activeOnly && !isOfferActive(offer, referenceDate)) {
      return false;
    }

    return matchesOffer(offer, options);
  });
}

function createSuccess(data, message) {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

function createFailure(code, message, details) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

/**
 * Returns active offers available to a persona.
 *
 * @param {string|Object} [personaOrOptions]
 * @param {Object} [maybeOptions]
 * @returns {Object[]}
 */
export function getOffers(personaOrOptions, maybeOptions) {
  const { personaId, options } = resolveArguments(personaOrOptions, maybeOptions);

  if (personaId && !getPersona(personaId)) {
    return [];
  }

  return cloneValue(getFilteredOffers(personaId, options));
}

/**
 * Alias for retrieving offers.
 *
 * @param {string|Object} [personaOrOptions]
 * @param {Object} [maybeOptions]
 * @returns {Object[]}
 */
export function listOffers(personaOrOptions, maybeOptions) {
  return getOffers(personaOrOptions, maybeOptions);
}

/**
 * Returns one eligible offer by identifier.
 *
 * @param {string|Object} offerOrId
 * @param {string|Object} [personaOrOptions]
 * @param {Object} [maybeOptions]
 * @returns {Object|null}
 */
export function getOfferById(offerOrId, personaOrOptions, maybeOptions) {
  const offer = getOffer(offerOrId);

  if (!offer) {
    return null;
  }

  const { personaId, options } = resolveArguments(personaOrOptions, maybeOptions);

  if (personaId && !getPersona(personaId)) {
    return null;
  }

  const matchingOffer = getFilteredOffers(personaId, options).find(
    (item) => item.id === offer.id,
  );

  return matchingOffer ? cloneValue(matchingOffer) : null;
}

/**
 * Alias for retrieving offer details.
 *
 * @param {string|Object} offerOrId
 * @param {string|Object} [personaOrOptions]
 * @param {Object} [maybeOptions]
 * @returns {Object|null}
 */
export function getOfferDetails(offerOrId, personaOrOptions, maybeOptions) {
  return getOfferById(offerOrId, personaOrOptions, maybeOptions);
}

/**
 * Returns a controlled response for an offer lookup.
 *
 * @param {string|Object} offerOrId
 * @param {string|Object} [personaOrOptions]
 * @param {Object} [maybeOptions]
 * @returns {{success: boolean, data?: Object, error?: Object}}
 */
export function getOfferResult(offerOrId, personaOrOptions, maybeOptions) {
  const offer = getOfferById(offerOrId, personaOrOptions, maybeOptions);

  if (!offer) {
    return createFailure(
      'OFFER_NOT_FOUND',
      'No eligible offer was found for the requested identifier.',
    );
  }

  return createSuccess(offer);
}

function createInterestKey(personaId, offerId) {
  return `${personaId}:${offerId}`;
}

/**
 * Records local interest in an eligible offer.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} offerOrId
 * @returns {{success: boolean, data?: Object, error?: Object}}
 */
export function recordOfferInterest(personaOrId, offerOrId) {
  const personaId = normalizePersonaId(personaOrId);
  const offerId = normalizeOfferId(offerOrId);

  if (!personaId || !getPersona(personaId)) {
    return createFailure(
      'PERSONA_NOT_FOUND',
      'No persona was found for the requested offer interest.',
    );
  }

  const offer = getOfferById(offerId, personaId);

  if (!offer) {
    return createFailure(
      'OFFER_NOT_FOUND',
      'No eligible offer was found for the requested identifier.',
    );
  }

  const key = createInterestKey(personaId, offerId);
  const existingInterest = OFFER_INTERESTS.get(key);

  if (existingInterest) {
    return createSuccess(cloneValue(existingInterest), 'Offer interest already recorded.');
  }

  interestSequence += 1;

  const interest = {
    id: `offer-interest-${interestSequence}`,
    offerId,
    userId: personaId,
    createdAt: `${getReferenceDateString()}T00:00:00.000Z`,
  };

  OFFER_INTERESTS.set(key, interest);

  return createSuccess(cloneValue(interest), 'Offer interest recorded locally.');
}

/**
 * Returns whether a persona has recorded interest in an offer.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} offerOrId
 * @returns {boolean}
 */
export function hasOfferInterest(personaOrId, offerOrId) {
  const personaId = normalizePersonaId(personaOrId);
  const offerId = normalizeOfferId(offerOrId);

  return Boolean(
    personaId &&
      offerId &&
      OFFER_INTERESTS.has(createInterestKey(personaId, offerId)),
  );
}

/**
 * Returns locally recorded offer interests for a persona.
 *
 * @param {string|Object} [personaOrId]
 * @returns {Object[]}
 */
export function getOfferInterests(personaOrId) {
  const personaId = normalizePersonaId(personaOrId);

  return cloneValue(
    Array.from(OFFER_INTERESTS.values()).filter(
      (interest) => !personaId || interest.userId === personaId,
    ),
  );
}

/**
 * Clears locally recorded offer interests.
 *
 * @param {string|Object} [personaOrId]
 * @returns {number}
 */
export function clearOfferInterests(personaOrId) {
  const personaId = normalizePersonaId(personaOrId);
  let removedCount = 0;

  for (const [key, interest] of OFFER_INTERESTS.entries()) {
    if (!personaId || interest.userId === personaId) {
      OFFER_INTERESTS.delete(key);
      removedCount += 1;
    }
  }

  if (!personaId) {
    interestSequence = 0;
  }

  return removedCount;
}

export const offerService = Object.freeze({
  clearOfferInterests,
  getOfferById,
  getOfferDetails,
  getOfferInterests,
  getOfferResult,
  getOffers,
  hasOfferInterest,
  listOffers,
  recordOfferInterest,
});

export default offerService;