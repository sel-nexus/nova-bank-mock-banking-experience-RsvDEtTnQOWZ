const REFERENCE_DATE = '2026-10-16';
const REFERENCE_DATE_TIME = `${REFERENCE_DATE}T00:00:00.000Z';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns a new Date for the fixed reference instant.
 *
 * @returns {Date}
 */
export function getReferenceDate() {
  return new Date(REFERENCE_DATE_TIME);
}

/**
 * Returns the fixed reference date as an ISO calendar date.
 *
 * @returns {string}
 */
export function getReferenceDateString() {
  return REFERENCE_DATE;
}

/**
 * Returns the fixed reference timestamp in milliseconds.
 *
 * @returns {number}
 */
export function getReferenceTimestamp() {
  return getReferenceDate().getTime();
}

/**
 * Converts a date-like value to an ISO calendar date.
 *
 * @param {Date|string|number} value
 * @returns {string|null}
 */
export function toIsoDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim();

    if (ISO_DATE_PATTERN.test(normalizedValue)) {
      const parsedDate = new Date(`${normalizedValue}T00:00:00.000Z`);

      return Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== normalizedValue
        ? null
        : normalizedValue;
    }

    const parsedDate = new Date(normalizedValue);

    return Number.isNaN(parsedDate.getTime())
      ? null
      : parsedDate.toISOString().slice(0, 10);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsedDate = new Date(value);

    return Number.isNaN(parsedDate.getTime())
      ? null
      : parsedDate.toISOString().slice(0, 10);
  }

  return null;
}

/**
 * Adds a whole number of calendar days to a date.
 *
 * @param {Date|string|number} value
 * @param {number} days
 * @returns {string|null}
 */
export function addDays(value, days) {
  const isoDate = toIsoDate(value);

  if (isoDate === null || !Number.isInteger(days)) {
    return null;
  }

  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

/**
 * Calculates the number of calendar days between two dates.
 *
 * @param {Date|string|number} startDate
 * @param {Date|string|number} endDate
 * @returns {number|null}
 */
export function differenceInDays(startDate, endDate) {
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);

  if (start === null || end === null) {
    return null;
  }

  const startTime = new Date(`${start}T00:00:00.000Z`).getTime();
  const endTime = new Date(`${end}T00:00:00.000Z`).getTime();

  return Math.round((endTime - startTime) / MILLISECONDS_PER_DAY);
}

/**
 * Creates an inclusive date window relative to the reference date.
 *
 * @param {number} daysBefore
 * @param {number} daysAfter
 * @returns {{startDate: string, endDate: string, referenceDate: string}|null}
 */
export function createReferenceDateWindow(daysBefore = 0, daysAfter = 0) {
  if (
    !Number.isInteger(daysBefore) ||
    !Number.isInteger(daysAfter) ||
    daysBefore < 0 ||
    daysAfter < 0
  ) {
    return null;
  }

  return {
    startDate: addDays(REFERENCE_DATE, -daysBefore),
    endDate: addDays(REFERENCE_DATE, daysAfter),
    referenceDate: REFERENCE_DATE,
  };
}

/**
 * Creates an inclusive date window from a start date and a day length.
 *
 * @param {Date|string|number} startDate
 * @param {number} numberOfDays
 * @returns {{startDate: string, endDate: string}|null}
 */
export function createDateWindow(startDate, numberOfDays) {
  const normalizedStartDate = toIsoDate(startDate);

  if (
    normalizedStartDate === null ||
    !Number.isInteger(numberOfDays) ||
    numberOfDays < 1
  ) {
    return null;
  }

  return {
    startDate: normalizedStartDate,
    endDate: addDays(normalizedStartDate, numberOfDays - 1),
  };
}

/**
 * Determines whether a date falls within an inclusive date window.
 *
 * @param {Date|string|number} value
 * @param {Date|string|number} startDate
 * @param {Date|string|number} endDate
 * @returns {boolean}
 */
export function isDateWithinWindow(value, startDate, endDate) {
  const normalizedValue = toIsoDate(value);
  const normalizedStartDate = toIsoDate(startDate);
  const normalizedEndDate = toIsoDate(endDate);

  if (
    normalizedValue === null ||
    normalizedStartDate === null ||
    normalizedEndDate === null
  ) {
    return false;
  }

  return (
    normalizedStartDate <= normalizedEndDate &&
    normalizedValue >= normalizedStartDate &&
    normalizedValue <= normalizedEndDate
  );
}

/**
 * Determines whether a date is before the fixed reference date.
 *
 * @param {Date|string|number} value
 * @returns {boolean}
 */
export function isBeforeReferenceDate(value) {
  const normalizedValue = toIsoDate(value);
  return normalizedValue !== null && normalizedValue < REFERENCE_DATE;
}

/**
 * Determines whether a date is after the fixed reference date.
 *
 * @param {Date|string|number} value
 * @returns {boolean}
 */
export function isAfterReferenceDate(value) {
  const normalizedValue = toIsoDate(value);
  return normalizedValue !== null && normalizedValue > REFERENCE_DATE;
}

/**
 * Determines whether a date is the fixed reference date.
 *
 * @param {Date|string|number} value
 * @returns {boolean}
 */
export function isReferenceDate(value) {
  return toIsoDate(value) === REFERENCE_DATE;
}

/**
 * Returns the start and end dates for the current reference month.
 *
 * @returns {{startDate: string, endDate: string}}
 */
export function getReferenceMonthWindow() {
  return {
    startDate: '2026-10-01',
    endDate: '2026-10-31',
  };
}

/**
 * Returns the start and end dates for the current reference year.
 *
 * @returns {{startDate: string, endDate: string}}
 */
export function getReferenceYearWindow() {
  return {
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  };
}

export const REFERENCE_CLOCK_DATE = REFERENCE_DATE;
export const REFERENCE_CLOCK = Object.freeze({
  date: REFERENCE_DATE,
  timestamp: REFERENCE_DATE_TIME,
});

export default Object.freeze({
  REFERENCE_DATE,
  REFERENCE_CLOCK_DATE,
  REFERENCE_CLOCK,
  addDays,
  createDateWindow,
  createReferenceDateWindow,
  differenceInDays,
  getReferenceDate,
  getReferenceDateString,
  getReferenceMonthWindow,
  getReferenceTimestamp,
  getReferenceYearWindow,
  isAfterReferenceDate,
  isBeforeReferenceDate,
  isDateWithinWindow,
  isReferenceDate,
  toIsoDate,
});