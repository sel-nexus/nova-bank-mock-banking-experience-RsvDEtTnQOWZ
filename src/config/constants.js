export const REFERENCE_DATE = '2025-01-15';

export const STORAGE_KEYS = Object.freeze({
  session: 'nova-bank-session',
  user: 'nova-bank-user',
  accounts: 'nova-bank-accounts',
  transactions: 'nova-bank-transactions',
  beneficiaries: 'nova-bank-beneficiaries',
  onboarding: 'nova-bank-onboarding',
  theme: 'nova-bank-theme',
});

export const ROUTES = Object.freeze({
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  accounts: '/accounts',
  accountDetails: '/accounts/:accountId',
  transfers: '/transfers',
  payments: '/payments',
  transactions: '/transactions',
  profile: '/profile',
  settings: '/settings',
  help: '/help',
  notFound: '*',
});

export const PRIVACY_COPY = Object.freeze({
  demoNotice:
    'This is a synthetic banking experience for demonstration purposes. It does not connect to real financial accounts or process real transactions.',
  dataNotice:
    'Information entered in this demo is stored only in your browser and is not sent to a bank or third party.',
  securityNotice:
    'Never enter real passwords, account numbers, or other sensitive information into this demo.',
  footer:
    'Nova Bank Demo is a fictional experience. No real banking services are provided.',
});

export const CURRENCY = Object.freeze({
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  locale: 'en-US',
  decimals: 2,
});

export const TOKEN_VALUES = Object.freeze({
  demoToken: 'nova-demo-token',
  tokenType: 'Bearer',
  expirySeconds: 3600,
  refreshExpirySeconds: 86400,
});

export const DEMO_CONSTANTS = Object.freeze({
  bankName: 'Nova Bank',
  supportEmail: 'support@novabank.demo',
  maxTransferAmount: 10000,
  minimumTransferAmount: 1,
  transactionPageSize: 10,
  recentTransactionCount: 5,
  initialBalance: 12500,
  initialSavingsBalance: 28450,
});

export const CURRENCY_CODE = CURRENCY.code;
export const CURRENCY_SYMBOL = CURRENCY.symbol;

export default Object.freeze({
  REFERENCE_DATE,
  STORAGE_KEYS,
  ROUTES,
  PRIVACY_COPY,
  CURRENCY,
  TOKEN_VALUES,
  DEMO_CONSTANTS,
});