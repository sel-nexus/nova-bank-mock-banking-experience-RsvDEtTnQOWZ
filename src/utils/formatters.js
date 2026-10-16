import { CURRENCY } from '../config/constants.js';

/**
 * The default placeholder used when a value cannot be displayed safely.
 */
export const DISPLAY_PLACEHOLDER = '—';

/**
 * Converts a value to a finite number.
 *
 * @param {unknown} value
 * @returns {number|null}
 */
function toFiniteNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

/**
 * Formats a numeric amount as a currency value.
 *
 * @param {number|string|null|undefined} amount
 * @param {string} [currency=CURRENCY.code]
 * @param {string} [locale=CURRENCY.locale]
 * @returns {string}
 */
export function formatCurrency(
  amount,
  currency = CURRENCY.code,
  locale = CURRENCY.locale,
) {
  const numericAmount = toFiniteNumber(amount);

  if (numericAmount === null) {
    return DISPLAY_PLACEHOLDER;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: CURRENCY.decimals,
      maximumFractionDigits: CURRENCY.decimals,
    }).format(numericAmount);
  } catch {
    return DISPLAY_PLACEHOLDER;
  }
}

/**
 * Formats an amount as Philippine pesos.
 *
 * @param {number|string|null|undefined} amount
 * @param {string} [locale='en-PH']
 * @returns {string}
 */
export function formatPhpCurrency(amount, locale = 'en-PH') {
  return formatCurrency(amount, 'PHP', locale);
}

/**
 * Formats an amount as Philippine pesos.
 *
 * @param {number|string|null|undefined} amount
 * @param {string} [locale='en-PH']
 * @returns {string}
 */
export function formatPHPCurrency(amount, locale = 'en-PH') {
  return formatPhpCurrency(amount, locale);
}

/**
 * Formats a number with grouped thousands and a fixed number of decimals.
 *
 * @param {number|string|null|undefined} value
 * @param {number} [decimals=2]
 * @param {string} [locale=CURRENCY.locale]
 * @returns {string}
 */
export function formatNumber(
  value,
  decimals = CURRENCY.decimals,
  locale = CURRENCY.locale,
) {
  const numericValue = toFiniteNumber(value);

  if (numericValue === null || !Number.isInteger(decimals) || decimals < 0) {
    return DISPLAY_PLACEHOLDER;
  }

  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numericValue);
  } catch {
    return DISPLAY_PLACEHOLDER;
  }
}

/**
 * Parses a date-like value into a valid Date.
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {Date|null}
 */
function toValidDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date using a readable short date format.
 *
 * @param {Date|string|number|null|undefined} value
 * @param {string} [locale=CURRENCY.locale]
 * @returns {string}
 */
export function formatDate(value, locale = CURRENCY.locale) {
  const date = toValidDate(value);

  if (!date) {
    return DISPLAY_PLACEHOLDER;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return DISPLAY_PLACEHOLDER;
  }
}

/**
 * Formats a date and time using a readable short format.
 *
 * @param {Date|string|number|null|undefined} value
 * @param {string} [locale=CURRENCY.locale]
 * @returns {string}
 */
export function formatDateTime(value, locale = CURRENCY.locale) {
  const date = toValidDate(value);

  if (!date) {
    return DISPLAY_PLACEHOLDER;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return DISPLAY_PLACEHOLDER;
  }
}

/**
 * Formats a date as an ISO calendar date.
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {string}
 */
export function formatIsoDate(value) {
  const date = toValidDate(value);

  if (!date) {
    return DISPLAY_PLACEHOLDER;
  }

  return date.toISOString().slice(0, 10);
}

/**
 * Masks an identifier while preserving its final characters.
 *
 * @param {string|number|null|undefined} value
 * @param {number} [visibleCharacters=4]
 * @param {string} [maskCharacter='•']
 * @returns {string}
 */
export function maskIdentifier(
  value,
  visibleCharacters = 4,
  maskCharacter = '•',
) {
  if (value === null || value === undefined) {
    return DISPLAY_PLACEHOLDER;
  }

  const identifier = String(value).replace(/\s+/g, '');

  if (
    identifier.length === 0 ||
    !Number.isInteger(visibleCharacters) ||
    visibleCharacters < 0 ||
    visibleCharacters >= identifier.length ||
    typeof maskCharacter !== 'string' ||
    maskCharacter.length === 0
  ) {
    return identifier || DISPLAY_PLACEHOLDER;
  }

  const visiblePart = identifier.slice(-visibleCharacters);
  const maskedPart = maskCharacter.repeat(identifier.length - visibleCharacters);

  return `${maskedPart} ${visiblePart}`;
}

/**
 * Masks an account number while preserving its final four characters.
 *
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
export function maskAccountNumber(value) {
  return maskIdentifier(value, 4);
}

/**
 * Normalizes text by trimming it and collapsing consecutive whitespace.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim().replace(/\s+/g, ' ');
}

/**
 * Converts text to title case after normalizing whitespace.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function toTitleCase(value) {
  return normalizeText(value)
    .toLocaleLowerCase()
    .replace(/(^|[\s-])([a-zÀ-ÿ])/g, (_, separator, character) => {
      return `${separator}${character.toLocaleUpperCase()}`;
    });
}

/**
 * Returns a safe, trimmed display value for nullable input.
 *
 * @param {unknown} value
 * @param {string} [fallback=DISPLAY_PLACEHOLDER]
 * @returns {string}
 */
export function safeDisplay(value, fallback = DISPLAY_PLACEHOLDER) {
  if (value === null || value === undefined) {
    return fallback;
  }

  const displayValue = normalizeText(value);
  return displayValue || fallback;
}

/**
 * Formats a transaction amount with its direction.
 *
 * @param {number|string|null|undefined} amount
 * @param {'credit'|'debit'|string} direction
 * @param {string} [currency=CURRENCY.code]
 * @returns {string}
 */
export function formatTransactionAmount(
  amount,
  direction,
  currency = CURRENCY.code,
) {
  const numericAmount = toFiniteNumber(amount);

  if (numericAmount === null) {
    return DISPLAY_PLACEHOLDER;
  }

  const prefix = direction === 'credit' ? '+' : direction === 'debit' ? '-' : '';

  return `${prefix}${formatCurrency(Math.abs(numericAmount), currency)}`;
}

export default Object.freeze({
  DISPLAY_PLACEHOLDER,
  formatCurrency,
  formatPhpCurrency,
  formatPHPCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatIsoDate,
  maskIdentifier,
  maskAccountNumber,
  normalizeText,
  toTitleCase,
  safeDisplay,
  formatTransactionAmount,
});