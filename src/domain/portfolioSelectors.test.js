import { describe, expect, it } from 'vitest';
import { FIXTURES } from '../fixtures/fixtures.js';
import {
  calculateRelationshipBalance,
  getDepositEligibleAccounts,
  getRelationshipBalanceSummary,
  isDepositAccount,
  isDepositEligibleAccount,
  selectRelationshipAccounts,
} from './portfolioSelectors.js';

describe('portfolioSelectors', () => {
  it('calculates Miguel Santos relationship balance from checking and savings accounts', () => {
    const miguelAccounts = FIXTURES.accounts.filter(
      (account) => account.userId === 'user-miguel-santos',
    );

    expect(calculateRelationshipBalance(miguelAccounts)).toBe(40950);
    expect(getRelationshipBalanceSummary(miguelAccounts)).toEqual({
      balance: 40950,
      accountCount: 2,
      currency: 'USD',
    });
  });

  it('calculates Rosa Delacruz relationship balance from her eligible checking account', () => {
    const rosaAccounts = FIXTURES.accounts.filter(
      (account) => account.userId === 'user-rosa-delacruz',
    );

    expect(calculateRelationshipBalance(rosaAccounts)).toBe(8450.72);
    expect(getRelationshipBalanceSummary(rosaAccounts)).toEqual({
      balance: 8450.72,
      accountCount: 1,
      currency: 'USD',
    });
  });

  it('excludes credit and loan accounts from deposit and relationship balances', () => {
    const accounts = [
      {
        id: 'checking-account',
        type: 'checking',
        status: 'active',
        balance: 1000,
        currency: 'USD',
      },
      {
        id: 'savings-account',
        type: 'savings',
        status: 'active',
        balance: 2500,
        currency: 'USD',
      },
      {
        id: 'credit-account',
        type: 'credit',
        status: 'active',
        balance: 9000,
        currency: 'USD',
      },
      {
        id: 'loan-account',
        type: 'loan',
        status: 'active',
        balance: 15000,
        currency: 'USD',
      },
    ];

    expect(isDepositAccount(accounts[0])).toBe(true);
    expect(isDepositAccount(accounts[1])).toBe(true);
    expect(isDepositAccount(accounts[2])).toBe(false);
    expect(isDepositAccount(accounts[3])).toBe(false);

    expect(
      getDepositEligibleAccounts(accounts).map((account) => account.id),
    ).toEqual(['checking-account', 'savings-account']);
    expect(
      selectRelationshipAccounts(accounts).map((account) => account.id),
    ).toEqual(['checking-account', 'savings-account']);
    expect(calculateRelationshipBalance(accounts)).toBe(3500);
  });

  it('excludes inactive and unsupported accounts from relationship balance calculations', () => {
    const accounts = [
      {
        id: 'active-checking',
        type: 'checking',
        status: 'active',
        balance: 1200,
        currency: 'USD',
      },
      {
        id: 'inactive-savings',
        type: 'savings',
        status: 'inactive',
        balance: 800,
        currency: 'USD',
      },
      {
        id: 'credit-account',
        type: 'credit',
        status: 'active',
        balance: 5000,
        currency: 'USD',
      },
    ];

    expect(isDepositEligibleAccount(accounts[0])).toBe(true);
    expect(isDepositEligibleAccount(accounts[1])).toBe(false);
    expect(isDepositEligibleAccount(accounts[2])).toBe(false);
    expect(calculateRelationshipBalance(accounts)).toBe(1200);
  });

  it('returns safe empty results for invalid account collections', () => {
    expect(selectRelationshipAccounts(null)).toEqual([]);
    expect(getDepositEligibleAccounts(undefined)).toEqual([]);
    expect(calculateRelationshipBalance(null)).toBe(0);
    expect(getRelationshipBalanceSummary(null)).toEqual({
      balance: 0,
      accountCount: 0,
      currency: null,
    });
  });
});