import { getReferenceDateString, toIsoDate } from './referenceClock.js';
import {
  formatCurrency,
  formatDate,
  formatTransactionAmount,
  maskAccountNumber,
  safeDisplay,
} from '../utils/formatters.js';

const DEFAULT_TITLE = 'Nova Bank Demo Statement';
const DEFAULT_CURRENCY = 'PHP';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function cloneRows(rows) {
  return Array.isArray(rows) ? rows.filter((row) => isObject(row)) : [];
}

function getStatementAccount(statement, options) {
  return (
    (isObject(options.account) && options.account) ||
    (isObject(statement.account) && statement.account) ||
    {}
  );
}

function getStatementRows(statement, options) {
  if (Array.isArray(options.visibleRows)) {
    return cloneRows(options.visibleRows);
  }

  if (Array.isArray(statement.visibleRows)) {
    return cloneRows(statement.visibleRows);
  }

  if (Array.isArray(statement.rows)) {
    return cloneRows(statement.rows);
  }

  if (Array.isArray(statement.transactions)) {
    return cloneRows(statement.transactions);
  }

  return [];
}

function getMaskedAccountNumber(account) {
  const maskedAccountNumber = normalizeText(
    account.maskedAccountNumber || account.maskedAccount || account.accountMask,
  );

  if (maskedAccountNumber) {
    return maskedAccountNumber;
  }

  const accountNumber = account.accountNumber || account.number;
  return accountNumber ? maskAccountNumber(accountNumber) : '—';
}

function getReferenceDate(statement, options) {
  const requestedDate =
    options.referenceDate ||
    statement.referenceDate ||
    statement.asOf ||
    statement.date;

  return toIsoDate(requestedDate) || getReferenceDateString();
}

function formatFilterValue(value) {
  if (Array.isArray(value)) {
    return value.map(formatFilterValue).filter(Boolean).join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return normalizeText(value);
}

function formatFilters(filters) {
  if (!isObject(filters)) {
    return '';
  }

  return Object.entries(filters)
    .map(([key, value]) => {
      const formattedValue = formatFilterValue(value);
      return formattedValue ? `${key}: ${formattedValue}` : '';
    })
    .filter(Boolean)
    .join('; ');
}

function getRowDate(row) {
  return normalizeText(row.date || row.postedAt || row.createdAt);
}

function formatRowDate(row) {
  const value = getRowDate(row);
  return value ? formatDate(value) : '—';
}

function formatRowDescription(row) {
  return safeDisplay(
    row.description || row.merchantName || row.title || row.name,
  );
}

function formatRowAmount(row) {
  const currency = normalizeText(row.currency) || DEFAULT_CURRENCY;

  if (row.direction === 'credit' || row.direction === 'debit') {
    return formatTransactionAmount(row.amount, row.direction, currency);
  }

  return formatCurrency(row.amount, currency);
}

function formatRowStatus(row) {
  return safeDisplay(row.status);
}

function normalizeStatement(statement, options) {
  const source = isObject(statement) ? statement : {};
  const normalizedOptions = isObject(options) ? options : {};
  const account = getStatementAccount(source, normalizedOptions);
  const filters =
    normalizedOptions.filters !== undefined
      ? normalizedOptions.filters
      : source.filters;

  return {
    title:
      normalizeText(normalizedOptions.title || source.title) || DEFAULT_TITLE,
    account,
    accountName: normalizeText(
      account.name ||
        account.accountName ||
        normalizedOptions.accountName ||
        source.accountName,
    ),
    maskedAccountNumber: getMaskedAccountNumber(account),
    referenceDate: getReferenceDate(source, normalizedOptions),
    filters: formatFilters(filters),
    rows: getStatementRows(source, normalizedOptions),
  };
}

/**
 * Returns the visible rows included in a statement.
 *
 * @param {Object} statement
 * @param {{visibleRows?: Object[]}} [options]
 * @returns {Object[]}
 */
export function getVisibleStatementRows(statement, options = {}) {
  return normalizeStatement(statement, options).rows;
}

/**
 * Serializes a statement into deterministic, human-readable plain text.
 *
 * @param {Object} statement
 * @param {{
 *   account?: Object,
 *   accountName?: string,
 *   filters?: Object,
 *   referenceDate?: string|Date|number,
 *   title?: string,
 *   visibleRows?: Object[]
 * }} [options]
 * @returns {string}
 */
export function serializeStatement(statement = {}, options = {}) {
  const normalizedStatement = normalizeStatement(statement, options);
  const lines = [
    normalizedStatement.title,
    `Account: ${normalizedStatement.accountName || '—'}`,
    `Account number: ${normalizedStatement.maskedAccountNumber}`,
    `Reference date: ${normalizedStatement.referenceDate}`,
  ];

  if (normalizedStatement.filters) {
    lines.push(`Filters: ${normalizedStatement.filters}`);
  }

  lines.push(
    '',
    'Date | Description | Amount | Status',
    '--- | --- | ---: | ---',
  );

  if (normalizedStatement.rows.length === 0) {
    lines.push('— | No transactions | — | —');
  } else {
    normalizedStatement.rows.forEach((row) => {
      lines.push(
        `${formatRowDate(row)} | ${formatRowDescription(row)} | ${formatRowAmount(
          row,
        )} | ${formatRowStatus(row)}`,
      );
    });
  }

  return lines.join('\n');
}

/**
 * Alias for serializing a statement.
 *
 * @param {Object} statement
 * @param {Object} [options]
 * @returns {string}
 */
export function formatStatement(statement = {}, options = {}) {
  return serializeStatement(statement, options);
}

/**
 * Alias for creating statement text.
 *
 * @param {Object} statement
 * @param {Object} [options]
 * @returns {string}
 */
export function createStatementText(statement = {}, options = {}) {
  return serializeStatement(statement, options);
}

/**
 * Alias for serializing statement text.
 *
 * @param {Object} statement
 * @param {Object} [options]
 * @returns {string}
 */
export function serializeStatementText(statement = {}, options = {}) {
  return serializeStatement(statement, options);
}

export const statementFormatter = Object.freeze({
  createStatementText,
  formatStatement,
  getVisibleStatementRows,
  serializeStatement,
  serializeStatementText,
});

export default statementFormatter;