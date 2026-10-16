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
      'transaction-savings-supermarket',
      'transaction-savings-goal',
    ]);
  });

  it('filters fixture transactions by merchant, description, and reference search text', () => {
    expect(
      getTransactionIds(
        selectTransactionsBySearch(fixtureTransactions, 'manila supermarket'),
      ),
    ).toEqual(['transaction-savings-supermarket']);

    expect(
      getTransactionIds(
        selectTransactionsBySearch(fixtureTransactions, 'REF-TX-882194'),
      ),
    ).toEqual(['transaction-savings-coffee']);

    expect(
      getTransactionIds(
        selectTransactionsBySearch(fixtureTransactions, 'payroll'),
      ),
    ).toEqual(['transaction-payroll-credit']);
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
      'transaction-savings-supermarket',
      'transaction-savings-coffee',
      'transaction-savings-transit',
      'transaction-card-declined',
    ]);

    expect(
      getTransactionIds(selectTransactionsByCategory(fixtureTransactions, 'groceries')),
    ).toEqual(['transaction-savings-supermarket']);

    expect(
      getTransactionIds(
        selectTransactions(fixtureTransactions, {
          category: 'dining',
          includeFuture: true,
        }),
      ),
    ).toEqual(['transaction-savings-coffee']);
  });

  it('filters fixture transactions by direction and supports merchant-category matching', () => {
    expect(
      getTransactionIds(selectTransactionsByDirection(fixtureTransactions, 'credit')),
    ).toEqual([
      'transaction-savings-salary',
      'transaction-payroll-credit',
      'transaction-rosa-salary',
    ]);

    expect(
      getTransactionIds(
        selectTransactions(fixtureTransactions, {
          category: 'groceries',
          includeFuture: true,
        }),
      ),
    ).toEqual(['transaction-savings-supermarket']);
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
      'transaction-savings-transit',
      'transaction-card-declined',
      'transaction-savings-coffee',
      'transaction-savings-goal',
      'transaction-savings-supermarket',
      'transaction-savings-salary',
    ]);

    expect(
      getTransactionIds(
        sortTransactions(sixTransactions, {
          sortBy: 'date',
          sortOrder: 'desc',
        }),
      ),
    ).toEqual([
      'transaction-savings-salary',
      'transaction-savings-supermarket',
      'transaction-savings-goal',
      'transaction-savings-coffee',
      'transaction-card-declined',
      'transaction-savings-transit',
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
      'transaction-savings-salary',
      'transaction-savings-goal',
      'transaction-savings-supermarket',
      'transaction-savings-transit',
      'transaction-savings-coffee',
      'transaction-card-declined',
    ]);
    expect(getTransactionIds(sourceTransactions)).toEqual(originalIds);
  });

  it('combines fixture filtering and sorting for a transaction enquiry', () => {
    const transactions = selectAndSortTransactions(fixtureTransactions, {
      search: 'REF-TX-88219',
      type: 'card',
      sortBy: 'amount',
      sortOrder: 'asc',
      includeFuture: true,
    });

    expect(getTransactionIds(transactions)).toEqual([
      'transaction-card-declined',
      'transaction-savings-coffee',
      'transaction-savings-transit',
      'transaction-savings-supermarket',
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