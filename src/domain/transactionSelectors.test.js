import { describe, expect, it } from 'vitest';
import { FIXTURES } from '../fixtures/fixtures.js';
import {
  filterTransactions,
  selectAndSortTransactions,
  selectTransactions,
  selectTransactionsByCategory,
  selectTransactionsByDateRange,
  selectTransactionsByDirection,
  selectTransactionsBySearch,
  sortTransactions,
} from './transactionSelectors.js';

const fixtureTransactions = FIXTURES.transactions;

function getTransactionIds(transactions) {
  return transactions.map((transaction) => transaction.id);
}

describe('transactionSelectors', () => {
  it('filters fixture transactions by an inclusive date range', () => {
    const transactions = selectTransactionsByDateRange(
      fixtureTransactions,
      '2026-10-10',
      '2026-10-12',
    );

    expect(getTransactionIds(transactions)).toEqual([
      'transaction-miguel-market',
      'transaction-miguel-transfer',
      'transaction-miguel-savings-transfer',
    ]);
  });

  it('filters fixture transactions by merchant, description, and reference search text', () => {
    expect(
      getTransactionIds(
        selectTransactionsBySearch(fixtureTransactions, 'greenway'),
      ),
    ).toEqual(['transaction-miguel-market']);

    expect(
      getTransactionIds(
        selectTransactionsBySearch(fixtureTransactions, 'CARD-9918'),
      ),
    ).toEqual(['transaction-miguel-streaming']);

    expect(
      getTransactionIds(
        selectTransactionsBySearch(fixtureTransactions, 'payroll'),
      ),
    ).toEqual([
      'transaction-miguel-payroll',
      'transaction-rosa-payroll',
    ]);
  });

  it('filters fixture transactions by type and category', () => {
    expect(
      getTransactionIds(
        selectTransactions(fixtureTransactions, {
          type: 'card',
          includeFuture: true,
        }),
      ),
    ).toEqual([
      'transaction-miguel-market',
      'transaction-miguel-coffee',
      'transaction-miguel-streaming',
    ]);

    expect(
      getTransactionIds(selectTransactionsByCategory(fixtureTransactions, 'food')),
    ).toEqual([
      'transaction-miguel-market',
      'transaction-miguel-coffee',
    ]);

    expect(
      getTransactionIds(
        selectTransactions(fixtureTransactions, {
          category: 'entertainment',
          includeFuture: true,
        }),
      ),
    ).toEqual(['transaction-miguel-streaming']);
  });

  it('filters fixture transactions by direction and supports merchant-category matching', () => {
    expect(
      getTransactionIds(selectTransactionsByDirection(fixtureTransactions, 'credit')),
    ).toEqual([
      'transaction-miguel-payroll',
      'transaction-miguel-savings-transfer',
      'transaction-miguel-interest',
      'transaction-rosa-payroll',
    ]);

    expect(
      getTransactionIds(
        selectTransactions(fixtureTransactions, {
          category: 'groceries',
          includeFuture: true,
        }),
      ),
    ).toEqual(['transaction-miguel-market']);
  });

  it('sorts the six dated fixture transactions in ascending and descending order', () => {
    const sixTransactions = fixtureTransactions.slice(0, 6);

    expect(
      getTransactionIds(
        sortTransactions(sixTransactions, {
          sortBy: 'date',
          sortOrder: 'asc',
        }),
      ),
    ).toEqual([
      'transaction-miguel-transfer',
      'transaction-miguel-savings-transfer',
      'transaction-miguel-market',
      'transaction-miguel-coffee',
      'transaction-miguel-rent',
      'transaction-miguel-payroll',
    ]);

    expect(
      getTransactionIds(
        sortTransactions(sixTransactions, {
          sortBy: 'date',
          sortOrder: 'desc',
        }),
      ),
    ).toEqual([
      'transaction-miguel-payroll',
      'transaction-miguel-rent',
      'transaction-miguel-coffee',
      'transaction-miguel-market',
      'transaction-miguel-transfer',
      'transaction-miguel-savings-transfer',
    ]);
  });

  it('sorts fixture transactions by amount without mutating the source collection', () => {
    const sourceTransactions = fixtureTransactions.slice(0, 6);
    const originalIds = getTransactionIds(sourceTransactions);

    const sortedTransactions = sortTransactions(sourceTransactions, {
      sortBy: 'amount',
      sortOrder: 'desc',
    });

    expect(getTransactionIds(sortedTransactions)).toEqual([
      'transaction-miguel-payroll',
      'transaction-miguel-rent',
      'transaction-miguel-transfer',
      'transaction-miguel-savings-transfer',
      'transaction-miguel-market',
      'transaction-miguel-coffee',
    ]);
    expect(getTransactionIds(sourceTransactions)).toEqual(originalIds);
  });

  it('combines fixture filtering and sorting for a transaction enquiry', () => {
    const transactions = selectAndSortTransactions(fixtureTransactions, {
      search: 'card',
      type: 'card',
      sortBy: 'amount',
      sortOrder: 'asc',
      includeFuture: true,
    });

    expect(getTransactionIds(transactions)).toEqual([
      'transaction-miguel-coffee',
      'transaction-miguel-market',
      'transaction-miguel-streaming',
    ]);
  });

  it('returns all six fixture transactions when cleared filters are applied', () => {
    const sixTransactions = fixtureTransactions.slice(0, 6);

    const resetResult = filterTransactions(sixTransactions, {
      search: '',
      startDate: '',
      endDate: '',
      type: '',
      category: '',
      includeFuture: true,
    });

    expect(resetResult).toEqual(sixTransactions);
  });

  it('returns an empty result for empty and invalid transaction collections', () => {
    expect(filterTransactions([], { search: 'anything' })).toEqual([]);
    expect(filterTransactions(null)).toEqual([]);
    expect(selectTransactions(undefined)).toEqual([]);
    expect(sortTransactions(null)).toEqual([]);
    expect(selectAndSortTransactions([], {})).toEqual([]);
  });

  it('does not include future transactions unless explicitly requested', () => {
    const transactions = [
      {
        id: 'transaction-past',
        date: '2026-10-15',
        description: 'Past transaction',
        amount: 10,
      },
      {
        id: 'transaction-today',
        date: '2026-10-16',
        description: 'Today transaction',
        amount: 20,
      },
      {
        id: 'transaction-future',
        date: '2026-10-17',
        description: 'Future transaction',
        amount: 30,
      },
    ];

    expect(
      getTransactionIds(selectTransactions(transactions)),
    ).toEqual(['transaction-past', 'transaction-today']);

    expect(
      getTransactionIds(
        selectTransactions(transactions, { includeFuture: true }),
      ),
    ).toEqual([
      'transaction-past',
      'transaction-today',
      'transaction-future',
    ]);
  });
});