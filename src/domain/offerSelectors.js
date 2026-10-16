import { getReferenceDateString, toIsoDate } from './referenceClock.js';

const AVAILABLE_STATUS = 'available';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function normalizeIdentifier(value) {
  return normalizeText(value);
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeIdentifier).filter(Boolean);
  }

  const normalizedValue = normalizeIdentifier(value);
  return normalizedValue ? [normalizedValue] : [];
}

function normalizeOptions(options) {
  return isObject(options) ? options : {};
}

function resolveReferenceDate(options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const requestedDate =
    normalizedOptions.referenceDate ||
    normalizedOptions.asOf ||
    normalizedOptions.date;

  if (requestedDate === undefined) {
    return getReferenceDateString();
  }

  return toIsoDate(requestedDate);
}

function getOfferCategories(offer) {
  return normalizeList(offer?.category).map((category) =>
    category.toLowerCase(),
  );
}

function getOfferSegments(offer) {
  return normalizeList(
    offer?.segments ||
      offer?.segment ||
      offer?.eligibleSegments ||
      offer?.eligibleSegment,
  ).map((segment) => segment.toLowerCase());
}

function getOfferEligiblePersonaIds(offer) {
  return normalizeList(
    offer?.eligiblePersonaIds ||
      offer?.eligibleUserIds ||
      offer?.personaIds ||
      offer?.userIds,
  );
}

function getOfferExcludedPersonaIds(offer) {
  return normalizeList(
    offer?.excludedPersonaIds || offer?.excludedUserIds,
  );
}

function getPersonaId(personaOrId) {
  if (typeof personaOrId === 'string' || typeof personaOrId === 'number') {
    return normalizeIdentifier(personaOrId);
  }

  if (isObject(personaOrId)) {
    return normalizeIdentifier(
      personaOrId.id || personaOrId.userId || personaOrId.personaId,
    );
  }

  return '';
}

function getPersonaSegments(personaOrId, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const persona = isObject(personaOrId) ? personaOrId : {};

  return normalizeList(
    normalizedOptions.segments ||
      normalizedOptions.segment ||
      persona.segments ||
      persona.segment,
  ).map((segment) => segment.toLowerCase());
}

function hasMatchingValue(values, requestedValues) {
  if (requestedValues.length === 0) {
    return true;
  }

  return values.some((value) => requestedValues.includes(value));
}

/**
 * Determines whether an offer has a valid inclusive date window.
 *
 * @param {Object} offer
 * @param {string|Date|number} [referenceDate]
 * @returns {boolean}
 */
export function isOfferWithinValidity(offer, referenceDate) {
  if (!isObject(offer)) {
    return false;
  }

  const validFrom = toIsoDate(offer.validFrom);
  const validUntil = toIsoDate(offer.validUntil);
  const normalizedReferenceDate =
    referenceDate === undefined
      ? getReferenceDateString()
      : toIsoDate(referenceDate);

  if (!validFrom || !validUntil || !normalizedReferenceDate) {
    return false;
  }

  return (
    validFrom <= validUntil &&
    normalizedReferenceDate >= validFrom &&
    normalizedReferenceDate <= validUntil
  );
}

/**
 * Alias for determining whether an offer is valid on a date.
 *
 * @param {Object} offer
 * @param {string|Date|number} [referenceDate]
 * @returns {boolean}
 */
export function isOfferValid(offer, referenceDate) {
  return isOfferWithinValidity(offer, referenceDate);
}

/**
 * Determines whether an offer is currently active and available.
 *
 * @param {Object} offer
 * @param {Object|string|Date|number} [options]
 * @returns {boolean}
 */
export function isOfferActive(offer, options = {}) {
  const normalizedOptions =
    typeof options === 'object' && options !== null && !Array.isArray(options)
      ? options
      : { referenceDate: options };

  if (
    !isObject(offer) ||
    (offer.status !== undefined &&
      normalizeText(offer.status).toLowerCase() !== AVAILABLE_STATUS)
  ) {
    return false;
  }

  return isOfferWithinValidity(offer, resolveReferenceDate(normalizedOptions));
}

/**
 * Determines whether an offer is expired on a reference date.
 *
 * @param {Object} offer
 * @param {string|Date|number} [referenceDate]
 * @returns {boolean}
 */
export function isOfferExpired(offer, referenceDate) {
  if (!isObject(offer)) {
    return false;
  }

  if (normalizeText(offer.status).toLowerCase() === 'expired') {
    return true;
  }

  const validUntil = toIsoDate(offer.validUntil);
  const normalizedReferenceDate =
    referenceDate === undefined
      ? getReferenceDateString()
      : toIsoDate(referenceDate);

  return Boolean(
    validUntil &&
      normalizedReferenceDate &&
      normalizedReferenceDate > validUntil,
  );
}

/**
 * Determines whether an offer belongs to a category.
 *
 * @param {Object} offer
 * @param {string|string[]} category
 * @returns {boolean}
 */
export function isOfferInCategory(offer, category) {
  if (!isObject(offer)) {
    return false;
  }

  const requestedCategories = normalizeList(category).map((value) =>
    value.toLowerCase(),
  );

  return (
    requestedCategories.length > 0 &&
    hasMatchingValue(getOfferCategories(offer), requestedCategories)
  );
}

/**
 * Filters offers by category.
 *
 * @param {Object[]} offers
 * @param {string|string[]} category
 * @returns {Object[]}
 */
export function selectOffersByCategory(offers, category) {
  if (!Array.isArray(offers)) {
    return [];
  }

  return offers.filter((offer) => isOfferInCategory(offer, category));
}

/**
 * Alias for selecting offers by category.
 *
 * @param {Object[]} offers
 * @param {string|string[]} category
 * @returns {Object[]}
 */
export function filterOffersByCategory(offers, category) {
  return selectOffersByCategory(offers, category);
}

/**
 * Determines whether an offer matches one or more audience segments.
 *
 * @param {Object} offer
 * @param {string|string[]} segment
 * @returns {boolean}
 */
export function isOfferInSegment(offer, segment) {
  const requestedSegments = normalizeList(segment).map((value) =>
    value.toLowerCase(),
  );

  if (requestedSegments.length === 0) {
    return true;
  }

  const offerSegments = getOfferSegments(offer);
  return offerSegments.length > 0 && hasMatchingValue(offerSegments, requestedSegments);
}

/**
 * Filters offers by audience segment.
 *
 * @param {Object[]} offers
 * @param {string|string[]} segment
 * @returns {Object[]}
 */
export function selectOffersBySegment(offers, segment) {
  if (!Array.isArray(offers)) {
    return [];
  }

  return offers.filter((offer) => isOfferInSegment(offer, segment));
}

/**
 * Alias for selecting offers by segment.
 *
 * @param {Object[]} offers
 * @param {string|string[]} segment
 * @returns {Object[]}
 */
export function filterOffersBySegment(offers, segment) {
  return selectOffersBySegment(offers, segment);
}

/**
 * Determines whether a persona is eligible for an offer.
 *
 * @param {Object} offer
 * @param {string|Object} [personaOrId]
 * @param {Object} [options]
 * @returns {boolean}
 */
export function isOfferEligible(offer, personaOrId, options = {}) {
  if (!isObject(offer)) {
    return false;
  }

  const normalizedOptions = normalizeOptions(options);
  const personaId = getPersonaId(personaOrId);
  const eligiblePersonaIds = getOfferEligiblePersonaIds(offer);
  const excludedPersonaIds = getOfferExcludedPersonaIds(offer);
  const requestedSegments = getPersonaSegments(personaOrId, normalizedOptions);
  const offerSegments = getOfferSegments(offer);

  if (excludedPersonaIds.includes(personaId)) {
    return false;
  }

  if (eligiblePersonaIds.length > 0 && !eligiblePersonaIds.includes(personaId)) {
    return false;
  }

  if (
    offerSegments.length > 0 &&
    !hasMatchingValue(offerSegments, requestedSegments)
  ) {
    return false;
  }

  return true;
}

/**
 * Filters offers eligible for a persona.
 *
 * @param {Object[]} offers
 * @param {string|Object} [personaOrId]
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function selectEligibleOffers(offers, personaOrId, options = {}) {
  if (!Array.isArray(offers)) {
    return [];
  }

  return offers.filter((offer) =>
    isOfferEligible(offer, personaOrId, options),
  );
}

/**
 * Alias for selecting eligible offers.
 *
 * @param {Object[]} offers
 * @param {string|Object} [personaOrId]
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function filterEligibleOffers(offers, personaOrId, options = {}) {
  return selectEligibleOffers(offers, personaOrId, options);
}

/**
 * Selects currently active, available offers.
 *
 * @param {Object[]} offers
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function selectActiveOffers(offers, options = {}) {
  if (!Array.isArray(offers)) {
    return [];
  }

  const normalizedOptions = normalizeOptions(options);

  return offers.filter((offer) => isOfferActive(offer, normalizedOptions));
}

/**
 * Alias for selecting active offers.
 *
 * @param {Object[]} offers
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function filterActiveOffers(offers, options = {}) {
  return selectActiveOffers(offers, options);
}

/**
 * Selects offers whose validity period has expired.
 *
 * @param {Object[]} offers
 * @param {string|Date|number} [referenceDate]
 * @returns {Object[]}
 */
export function selectExpiredOffers(offers, referenceDate) {
  if (!Array.isArray(offers)) {
    return [];
  }

  return offers.filter((offer) => isOfferExpired(offer, referenceDate));
}

/**
 * Alias for selecting expired offers.
 *
 * @param {Object[]} offers
 * @param {string|Date|number} [referenceDate]
 * @returns {Object[]}
 */
export function filterExpiredOffers(offers, referenceDate) {
  return selectExpiredOffers(offers, referenceDate);
}

export const offerSelectors = Object.freeze({
  filterActiveOffers,
  filterEligibleOffers,
  filterExpiredOffers,
  filterOffersByCategory,
  filterOffersBySegment,
  isOfferActive,
  isOfferEligible,
  isOfferExpired,
  isOfferInCategory,
  isOfferInSegment,
  isOfferValid,
  isOfferWithinValidity,
  selectActiveOffers,
  selectEligibleOffers,
  selectExpiredOffers,
  selectOffersByCategory,
  selectOffersBySegment,
});

export default offerSelectors;