import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mockApi from './mockApi.js';
import resilienceService from './resilienceService.js';
import storageService from './storageService.js';

const EXPECTED_GROUP_METHODS = Object.freeze({
  analytics: [
    'clearEvents',
    'getAnalyticsSummary',
    'getEventCount',
    'getEventCounts',
    'getEvents',
    'recordEvent',
    'recordPageView',
    'trackEvent',
  ],
  auth: [
    'authenticate',
    'clearRememberedUserId',
    'getActivePersona',
    'getCurrentSession',
    'getCurrentUser',
    'getDefaultPersona',
    'getLockoutStatus',
    'getRecoveryPrompt',
    'getRememberedUserId',
    'isAuthenticated',
    'login',
    'logout',
    'rememberUserId',
    'requestPasswordRecovery',
    'validateCredentials',
  ],
  account: [
    'getAccountById',
    'getAccountCount',
    'getAccountDetails',
    'getAccountForPersona',
    'getAccountsForPersona',
    'isAccountAvailable',
    'isAccountOwnedByPersona',
    'listAccounts',
    'validateAccountOwnership',
  ],
  chat: [
    'clearConversations',
    'createConversation',
    'detectChatIntent',
    'endConversation',
    'escalateConversation',
    'getChatWelcome',
    'getConversation',
    'getConversations',
    'getTopicResponseResult',
    'getTopicResponseText',
    'getWelcomeMessage',
    'listConversations',
    'matchChatIntent',
    'requestEscalation',
    'sendChatMessage',
    'sendMessage',
    'sendTopicMessage',
  ],
  customer: [
    'getActivePersona',
    'getCurrentUser',
    'getDefaultPersona',
    'getPersona',
    'getPortfolio',
    'getPortfolioByPersonaId',
    'getPortfolioForPersona',
    'getPortfolioSummary',
    'getPortfolioViewModel',
  ],
  notification: [
    'clearNotificationState',
    'getNotificationById',
    'getNotificationDetails',
    'getNotificationResult',
    'getNotificationSummary',
    'getNotifications',
    'getUnreadCount',
    'getUnreadNotificationCount',
    'listNotifications',
    'markAllNotificationsRead',
    'markNotificationRead',
    'markNotificationUnread',
    'setNotificationRead',
  ],
  offer: [
    'clearOfferInterests',
    'getOfferById',
    'getOfferDetails',
    'getOfferInterests',
    'getOfferResult',
    'getOffers',
    'hasOfferInterest',
    'listOffers',
    'recordOfferInterest',
  ],
  product: [
    'getProductById',
    'getProductCategories',
    'getProductDetails',
    'getProductResult',
    'getProducts',
    'getProductsByCategory',
    'getProductsByCategoryResult',
    'listProducts',
    'listProductsByCategory',
  ],
  resilience: [
    'configureResilience',
    'executeWithResilience',
    'getDeterministicLatency',
    'getMockLatency',
    'getResilienceConfig',
    'getResilienceState',
    'getRetryStatus',
    'isFacilitatorErrorModeEnabled',
    'recordRetry',
    'resetResilience',
    'resetRetryState',
    'setErrorMode',
    'setFacilitatorErrorMode',
    'shouldFail',
    'waitForMockLatency',
  ],
  storage: [
    'clearStorage',
    'getSession',
    'getStorageDefault',
    'getStorageItem',
    'hasStorageItem',
    'isAllowedStorageKey',
    'migrateStorage',
    'removeSession',
    'removeStorageItem',
    'resetStorage',
    'setSession',
    'setStorageItem',
  ],
  support: [
    'clearContactEnquiries',
    'getBranchById',
    'getBranchOperatingHours',
    'getBranchResult',
    'getBranches',
    'getContactEnquiries',
    'getContactInquiries',
    'getFAQs',
    'getFaqById',
    'getFaqResult',
    'getFaqs',
    'getOperatingHours',
    'getOperatingHoursResult',
    'getSupportArticleById',
    'getSupportArticles',
    'getSupportChannels',
    'listBranches',
    'listFaqs',
    'listSupportChannels',
    'submitContactEnquiry',
    'submitContactInquiry',
  ],
  transaction: [
    'getTransactionById',
    'getTransactionCount',
    'getTransactionResult',
    'getTransactions',
    'getTransactionsForAccount',
    'getTransactionsResult',
    'listTransactions',
  ],
});

function expectResponseEnvelope(response) {
  expect(response).toBeDefined();
  expect(response).toEqual(
    expect.objectContaining({
      success: expect.any(Boolean),
    }),
  );

  if (response.success === false) {
    expect(response.error).toEqual(
      expect.objectContaining({
        code: expect.any(String),
        message: expect.any(String),
      }),
    );
  }
}

describe('mockApi', () => {
  beforeEach(() => {
    storageService.resetStorage();
    resilienceService.resetResilience();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    storageService.resetStorage();
    resilienceService.resetResilience();
  });

  it('exposes every documented mock API group and method as a callable facade', () => {
    expect(Object.keys(mockApi).sort()).toEqual(
      Object.keys(EXPECTED_GROUP_METHODS).sort(),
    );

    Object.entries(EXPECTED_GROUP_METHODS).forEach(
      ([groupName, methodNames]) => {
        expect(mockApi[groupName]).toBeDefined();

        methodNames.forEach((methodName) => {
          expect(mockApi[groupName][methodName]).toEqual(expect.any(Function));
        });
      },
    );
  });

  it('returns normalized asynchronous response envelopes for every mock API group', async () => {
    const calls = [
      ['analytics', mockApi.analytics.recordEvent('mock_api_test')],
      ['auth', mockApi.auth.validateCredentials('user-miguel-santos', 'invalid')],
      ['account', mockApi.account.getAccountsForPersona('user-miguel-santos')],
      ['chat', mockApi.chat.getChatWelcome('user-miguel-santos')],
      ['customer', mockApi.customer.getPortfolioSummary('user-miguel-santos')],
      ['notification', mockApi.notification.getNotifications('user-miguel-santos')],
      ['offer', mockApi.offer.getOffers('user-miguel-santos')],
      ['product', mockApi.product.getProducts({ available: true })],
      ['resilience', mockApi.resilience.getResilienceConfig()],
      ['storage', mockApi.storage.getStorageDefault('nova-bank-accounts')],
      ['support', mockApi.support.getFaqs()],
      ['transaction', mockApi.transaction.getTransactions('user-miguel-santos')],
    ];

    const responses = await Promise.all(
      calls.map(async ([groupName, request]) => {
        const response = await request;
        return { groupName, response };
      }),
    );

    expect(responses).toHaveLength(Object.keys(EXPECTED_GROUP_METHODS).length);

    responses.forEach(({ response }) => {
      expectResponseEnvelope(response);
    });

    const authResponse = responses.find(({ groupName }) => groupName === 'auth');
    expect(authResponse.response.success).toBe(false);
    expect(authResponse.response.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('supports asynchronous mock operations without using network APIs', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.reject(new Error('Network access is not permitted in mock API tests.')),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const response = await mockApi.account.getAccountsForPersona(
      'user-miguel-santos',
    );

    expectResponseEnvelope(response);
    expect(response.success).toBe(true);
    expect(response.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'account-miguel-checking',
        }),
      ]),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('propagates configured persistent error mode through the asynchronous resilience facade', async () => {
    const modeResponse = await mockApi.resilience.setErrorMode('persistent');
    expectResponseEnvelope(modeResponse);
    expect(modeResponse.success).toBe(true);
    expect(modeResponse.data).toBe('persistent');

    const response = await mockApi.resilience.executeWithResilience(
      () => 'should not execute',
      { key: 'mock-api-persistent-error', retryLimit: 1 },
    );

    expectResponseEnvelope(response);
    expect(response.success).toBe(false);
    expect(response.error).toEqual(
      expect.objectContaining({
        code: 'MOCK_PERSISTENT_FAILURE',
        message: 'Mock resilience failure.',
      }),
    );
    expect(response.data).toBeUndefined();
  });

  it('normalizes browser-unavailable operations into a structured error envelope', async () => {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    try {
      Reflect.deleteProperty(globalThis, 'window');
      Reflect.deleteProperty(globalThis, 'document');

      const response = await mockApi.storage.getSession();

      expectResponseEnvelope(response);
      expect(response.success).toBe(false);
      expect(response.error).toEqual(
        expect.objectContaining({
          code: 'BROWSER_UNAVAILABLE',
          message: 'The mock API is available only in a browser environment.',
        }),
      );
    } finally {
      globalThis.window = originalWindow;
      globalThis.document = originalDocument;
    }
  });
});