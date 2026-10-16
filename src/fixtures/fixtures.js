import { CURRENCY, DEMO_CONSTANTS } from '../config/constants.js';
import {
  getReferenceDateString,
  addDays,
} from '../domain/referenceClock.js';

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);

    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue);
    }
  }

  return value;
}

const referenceDate = getReferenceDateString();

const personas = [
  {
    id: 'user-miguel-santos',
    name: 'Miguel Santos',
    firstName: 'Miguel',
    lastName: 'Santos',
    email: 'miguel.santos@example.test',
    phone: '+1 555 010 2040',
    dateOfBirth: '1989-06-12',
    address: '125 Harbor Avenue, Austin, TX 78701',
    memberSince: '2019-04-18',
    isVerified: true,
    avatarUrl: '',
  },
  {
    id: 'user-rosa-delacruz',
    name: 'Rosa Delacruz',
    firstName: 'Rosa',
    lastName: 'Delacruz',
    email: 'rosa.delacruz@example.test',
    phone: '+1 555 010 2041',
    dateOfBirth: '1992-09-23',
    address: '48 Market Street, Austin, TX 78702',
    memberSince: '2021-08-04',
    isVerified: true,
    avatarUrl: '',
  },
];

const accounts = [
  {
    id: 'account-miguel-checking',
    userId: 'user-miguel-santos',
    name: 'Everyday Checking',
    type: 'checking',
    status: 'active',
    accountNumber: '100012345678',
    maskedAccountNumber: '•••• 5678',
    routingNumber: '021000021',
    balance: DEMO_CONSTANTS.initialBalance,
    availableBalance: 12180.45,
    currency: CURRENCY.code,
    openedAt: '2019-04-18',
    lastUpdated: `${referenceDate}T09:30:00.000Z`,
  },
  {
    id: 'account-miguel-savings',
    userId: 'user-miguel-santos',
    name: 'Growth Savings',
    type: 'savings',
    status: 'active',
    accountNumber: '100087654321',
    maskedAccountNumber: '•••• 4321',
    routingNumber: '021000021',
    balance: DEMO_CONSTANTS.initialSavingsBalance,
    availableBalance: DEMO_CONSTANTS.initialSavingsBalance,
    interestRate: 4.25,
    currency: CURRENCY.code,
    openedAt: '2020-02-11',
    lastUpdated: `${referenceDate}T09:30:00.000Z`,
  },
  {
    id: 'account-rosa-checking',
    userId: 'user-rosa-delacruz',
    name: 'Everyday Checking',
    type: 'checking',
    status: 'active',
    accountNumber: '100045678912',
    maskedAccountNumber: '•••• 8912',
    routingNumber: '021000021',
    balance: 8450.72,
    availableBalance: 8320.72,
    currency: CURRENCY.code,
    openedAt: '2021-08-04',
    lastUpdated: `${referenceDate}T09:30:00.000Z`,
  },
];

const transactions = [
  {
    id: 'transaction-miguel-payroll',
    accountId: 'account-miguel-checking',
    direction: 'credit',
    status: 'completed',
    type: 'deposit',
    amount: 4200,
    currency: CURRENCY.code,
    description: 'Payroll deposit',
    merchantName: 'Northstar Design Co.',
    category: 'Income',
    reference: 'PAY-20261015',
    date: '2026-10-15',
    postedAt: '2026-10-15T08:00:00.000Z',
    createdAt: '2026-10-15T07:59:00.000Z',
  },
  {
    id: 'transaction-miguel-rent',
    accountId: 'account-miguel-checking',
    direction: 'debit',
    status: 'completed',
    type: 'payment',
    amount: 1850,
    currency: CURRENCY.code,
    description: 'Rent payment',
    merchantName: 'Harbor Point Apartments',
    category: 'Housing',
    reference: 'PMT-20261003',
    date: '2026-10-03',
    postedAt: '2026-10-03T12:00:00.000Z',
    createdAt: '2026-10-03T11:59:00.000Z',
  },
  {
    id: 'transaction-miguel-market',
    accountId: 'account-miguel-checking',
    direction: 'debit',
    status: 'completed',
    type: 'card',
    amount: 86.42,
    currency: CURRENCY.code,
    description: 'Grocery purchase',
    merchantName: 'Greenway Market',
    merchantCategory: 'Groceries',
    category: 'Food',
    reference: 'CARD-7812',
    date: '2026-10-12',
    postedAt: '2026-10-12T18:42:00.000Z',
    createdAt: '2026-10-12T18:42:00.000Z',
  },
  {
    id: 'transaction-miguel-coffee',
    accountId: 'account-miguel-checking',
    direction: 'debit',
    status: 'completed',
    type: 'card',
    amount: 5.75,
    currency: CURRENCY.code,
    description: 'Coffee and pastry',
    merchantName: 'Juniper Coffee',
    merchantCategory: 'Coffee shops',
    category: 'Food',
    reference: 'CARD-4419',
    date: '2026-10-14',
    postedAt: '2026-10-14T08:15:00.000Z',
    createdAt: '2026-10-14T08:15:00.000Z',
  },
  {
    id: 'transaction-miguel-transfer',
    accountId: 'account-miguel-checking',
    direction: 'debit',
    status: 'completed',
    type: 'transfer',
    amount: 500,
    currency: CURRENCY.code,
    description: 'Transfer to Growth Savings',
    category: 'Transfer',
    reference: 'TRF-20261010',
    date: '2026-10-10',
    postedAt: '2026-10-10T14:20:00.000Z',
    createdAt: '2026-10-10T14:20:00.000Z',
  },
  {
    id: 'transaction-miguel-savings-transfer',
    accountId: 'account-miguel-savings',
    direction: 'credit',
    status: 'completed',
    type: 'transfer',
    amount: 500,
    currency: CURRENCY.code,
    description: 'Transfer from Everyday Checking',
    category: 'Transfer',
    reference: 'TRF-20261010',
    date: '2026-10-10',
    postedAt: '2026-10-10T14:20:00.000Z',
    createdAt: '2026-10-10T14:20:00.000Z',
  },
  {
    id: 'transaction-miguel-interest',
    accountId: 'account-miguel-savings',
    direction: 'credit',
    status: 'completed',
    type: 'interest',
    amount: 98.34,
    currency: CURRENCY.code,
    description: 'Monthly interest',
    category: 'Interest',
    reference: 'INT-20260930',
    date: '2026-09-30',
    postedAt: '2026-09-30T23:59:00.000Z',
    createdAt: '2026-09-30T23:59:00.000Z',
  },
  {
    id: 'transaction-miguel-streaming',
    accountId: 'account-miguel-checking',
    direction: 'debit',
    status: 'pending',
    type: 'card',
    amount: 15.99,
    currency: CURRENCY.code,
    description: 'Monthly subscription',
    merchantName: 'Streamly',
    merchantCategory: 'Entertainment',
    category: 'Entertainment',
    reference: 'CARD-9918',
    date: referenceDate,
    createdAt: `${referenceDate}T07:25:00.000Z`,
  },
  {
    id: 'transaction-rosa-payroll',
    accountId: 'account-rosa-checking',
    direction: 'credit',
    status: 'completed',
    type: 'deposit',
    amount: 3650,
    currency: CURRENCY.code,
    description: 'Payroll deposit',
    merchantName: 'Cedar Health Group',
    category: 'Income',
    reference: 'PAY-20261015-R',
    date: '2026-10-15',
    postedAt: '2026-10-15T08:00:00.000Z',
    createdAt: '2026-10-15T07:59:00.000Z',
  },
];

const products = [
  {
    id: 'product-everyday-checking',
    name: 'Everyday Checking',
    description: 'Flexible checking for everyday spending and bill payments.',
    type: 'checking',
    category: 'Bank accounts',
    icon: 'wallet',
    benefits: ['No monthly maintenance fee', 'Digital card access', 'Mobile check deposit'],
    available: true,
  },
  {
    id: 'product-growth-savings',
    name: 'Growth Savings',
    description: 'Build your savings with a competitive variable interest rate.',
    type: 'savings',
    category: 'Bank accounts',
    icon: 'trending-up',
    interestRate: 4.25,
    benefits: ['Competitive interest rate', 'Automatic transfers', 'No minimum balance'],
    available: true,
  },
  {
    id: 'product-nova-credit',
    name: 'Nova Rewards Card',
    description: 'Earn points on the purchases you make most.',
    type: 'credit',
    category: 'Cards',
    icon: 'credit-card',
    annualFee: 0,
    benefits: ['No annual fee', 'Contactless payments', 'Flexible payment options'],
    available: true,
  },
  {
    id: 'product-home-loan',
    name: 'HomeStart Loan',
    description: 'A simple way to finance your next home.',
    type: 'loan',
    category: 'Lending',
    icon: 'home',
    benefits: ['Personalized rates', 'Online application', 'Dedicated support'],
    available: true,
  },
];

const offers = [
  {
    id: 'offer-savings-bonus',
    title: 'Grow your savings',
    description: 'Move money into Growth Savings and earn a bonus when you reach your goal.',
    terms: 'Eligibility and account terms apply.',
    category: 'Savings',
    amount: 100,
    status: 'available',
    validFrom: '2026-09-01',
    validUntil: '2026-12-31',
  },
  {
    id: 'offer-rewards-card',
    title: 'More rewards for your everyday',
    description: 'Apply for the Nova Rewards Card and earn points on qualifying purchases.',
    terms: 'Subject to credit approval.',
    category: 'Cards',
    percentage: 3,
    status: 'available',
    validFrom: '2026-10-01',
    validUntil: '2026-11-30',
  },
  {
    id: 'offer-welcome-bonus',
    title: 'Welcome to Nova Bank',
    description: 'Your welcome offer has been claimed.',
    category: 'Welcome',
    amount: 50,
    promoCode: 'WELCOME-NOVA',
    status: 'claimed',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
  },
];

const supportRequests = [
  {
    id: 'support-request-card',
    type: 'question',
    status: 'resolved',
    subject: 'Question about a card transaction',
    description: 'I would like more information about a recent card transaction.',
    category: 'Cards',
    priority: 'normal',
    createdAt: '2026-10-08T14:30:00.000Z',
    updatedAt: '2026-10-09T10:15:00.000Z',
    resolvedAt: '2026-10-09T10:15:00.000Z',
  },
  {
    id: 'support-request-transfer',
    type: 'request',
    status: 'open',
    subject: 'Help with a scheduled transfer',
    description: 'I need help reviewing an upcoming transfer.',
    category: 'Transfers',
    priority: 'normal',
    createdAt: '2026-10-15T16:10:00.000Z',
    updatedAt: '2026-10-15T16:10:00.000Z',
  },
];

const supportArticles = [
  {
    id: 'article-reset-password',
    title: 'How do I reset my password?',
    summary: 'Learn how to securely reset your demo password.',
    content:
      'Open Settings, select Security, and choose Reset password. This demo does not connect to a real bank.',
    category: 'Security',
    tags: ['password', 'security', 'account access'],
    updatedAt: '2026-09-20',
  },
  {
    id: 'article-transfer-money',
    title: 'How do I transfer money?',
    summary: 'Move money between your Nova Bank accounts.',
    content:
      'Open Transfers, choose the source and destination accounts, enter an amount, review the details, and confirm.',
    category: 'Transfers',
    tags: ['transfers', 'accounts', 'money movement'],
    updatedAt: '2026-10-01',
  },
  {
    id: 'article-dispute-transaction',
    title: 'How can I report a transaction?',
    summary: 'Find out what to do when a transaction looks unfamiliar.',
    content:
      'Review the transaction details and contact support. Never share real account information in this demo.',
    category: 'Transactions',
    tags: ['transactions', 'dispute', 'support'],
    updatedAt: '2026-08-28',
  },
];

const branches = [
  {
    id: 'branch-downtown-austin',
    name: 'Downtown Austin',
    address: '201 Congress Avenue, Austin, TX 78701',
    phone: '+1 555 010 3001',
    hours: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: '10:00-14:00',
      sunday: 'Closed',
    },
    services: ['Account support', 'Cash services', 'Safe deposit boxes'],
    latitude: 30.2672,
    longitude: -97.7431,
  },
  {
    id: 'branch-east-austin',
    name: 'East Austin',
    address: '1100 East Fifth Street, Austin, TX 78702',
    phone: '+1 555 010 3002',
    hours: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: 'Closed',
      sunday: 'Closed',
    },
    services: ['Account support', 'Cash services'],
    latitude: 30.264,
    longitude: -97.725,
  },
];

const faqs = [
  {
    id: 'faq-demo-data',
    question: 'Is this a real bank?',
    answer:
      'No. Nova Bank Demo is a synthetic banking experience and does not connect to real financial accounts.',
    category: 'About the demo',
    popular: true,
  },
  {
    id: 'faq-data-storage',
    question: 'Where is my information stored?',
    answer:
      'Information entered in this demo is stored only in your browser and is not sent to a bank or third party.',
    category: 'Privacy and security',
    popular: true,
  },
  {
    id: 'faq-transfer-limit',
    question: 'How much can I transfer?',
    answer: `The demonstration transfer limit is ${CURRENCY.symbol}${DEMO_CONSTANTS.maxTransferAmount.toLocaleString()} per transfer.`,
    category: 'Transfers',
    popular: false,
  },
  {
    id: 'faq-support',
    question: 'How do I contact support?',
    answer: `You can submit a support request in the Help area or email ${DEMO_CONSTANTS.supportEmail}.`,
    category: 'Support',
    popular: true,
  },
];

const notifications = [
  {
    id: 'notification-payroll',
    userId: 'user-miguel-santos',
    type: 'transaction',
    title: 'Payroll deposit received',
    message: 'Your payroll deposit of $4,200.00 was added to Everyday Checking.',
    read: false,
    createdAt: '2026-10-15T08:00:00.000Z',
    action: {
      label: 'View transaction',
      route: '/transactions',
    },
  },
  {
    id: 'notification-security',
    userId: 'user-miguel-santos',
    type: 'security',
    title: 'Your profile is up to date',
    message: 'Review your contact details regularly to keep your account secure.',
    read: true,
    createdAt: '2026-10-12T09:00:00.000Z',
  },
  {
    id: 'notification-offer',
    userId: 'user-miguel-santos',
    type: 'offer',
    title: 'A new offer is available',
    message: 'Explore the latest ways to get more from your Nova Bank accounts.',
    read: false,
    createdAt: '2026-10-10T13:00:00.000Z',
    action: {
      label: 'View offers',
      route: '/dashboard',
    },
  },
];

const chatConversations = [
  {
    id: 'chat-miguel-support',
    userId: 'user-miguel-santos',
    status: 'active',
    assignedAgent: 'Nova Support',
    createdAt: '2026-10-15T16:20:00.000Z',
    updatedAt: '2026-10-15T16:24:00.000Z',
    messages: [
      {
        id: 'chat-message-system',
        role: 'system',
        content: 'You are chatting with Nova Bank Demo support.',
        createdAt: '2026-10-15T16:20:00.000Z',
      },
      {
        id: 'chat-message-user',
        role: 'user',
        content: 'Can you help me review a transfer?',
        createdAt: '2026-10-15T16:21:00.000Z',
      },
      {
        id: 'chat-message-assistant',
        role: 'assistant',
        content:
          'Of course. I can help explain the transfer flow and show you where to find its status.',
        createdAt: '2026-10-15T16:24:00.000Z',
      },
    ],
  },
];

const credentials = [
  {
    id: 'credentials-miguel',
    userId: 'user-miguel-santos',
    email: 'miguel.santos@example.test',
    username: 'miguel.santos@example.test',
    password: 'NovaDemo123!',
    enabled: true,
  },
  {
    id: 'credentials-rosa',
    userId: 'user-rosa-delacruz',
    email: 'rosa.delacruz@example.test',
    username: 'rosa.delacruz@example.test',
    password: 'NovaDemo123!',
    enabled: true,
  },
];

const fixtureBundle = deepFreeze({
  referenceDate,
  personas,
  users: personas,
  accounts,
  transactions,
  products,
  offers,
  supportRequests,
  supportArticles,
  branches,
  faqs,
  notifications,
  chatConversations,
  credentials,
});

export const FIXTURES = fixtureBundle;
export const fixtures = fixtureBundle;
export const users = fixtureBundle.users;
export const personasFixture = fixtureBundle.personas;
export const accountFixtures = fixtureBundle.accounts;
export const transactionFixtures = fixtureBundle.transactions;
export const productFixtures = fixtureBundle.products;
export const offerFixtures = fixtureBundle.offers;
export const supportRequestFixtures = fixtureBundle.supportRequests;
export const supportArticleFixtures = fixtureBundle.supportArticles;
export const branchFixtures = fixtureBundle.branches;
export const faqFixtures = fixtureBundle.faqs;
export const notificationFixtures = fixtureBundle.notifications;
export const chatFixtures = fixtureBundle.chatConversations;
export const credentialFixtures = fixtureBundle.credentials;

export const DEFAULT_FIXTURE_USER_ID = 'user-miguel-santos';
export const DEFAULT_FIXTURE_ACCOUNT_ID = 'account-miguel-checking';

export const fixtureDates = deepFreeze({
  today: referenceDate,
  yesterday: addDays(referenceDate, -1),
  thirtyDaysAgo: addDays(referenceDate, -30),
});

export default FIXTURES;