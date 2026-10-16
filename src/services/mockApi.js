import authService from './authService.js';
import analyticsService from './analyticsService.js';
import chatService from './chatService.js';
import notificationService from './notificationService.js';
import resilienceService from './resilienceService.js';
import storageService from './storageService.js';
import supportService from './supportService.js';
import { accountService } from '../domain/accountService.js';
import { offerService } from '../domain/offerService.js';
import { portfolioService } from '../domain/portfolioService.js';
import { productService } from '../domain/productService.js';
import { transactionService } from '../domain/transactionService.js';

const BROWSER_UNAVAILABLE_ERROR = Object.freeze({
  code: 'BROWSER_UNAVAILABLE',
  message: 'The mock API is available only in a browser environment.',
});

const MOCK_API_ERROR = Object.freeze({
  code: 'MOCK_API_ERROR',
  message: 'The mock API operation could not be completed.',
});

function isBrowserEnvironment() {
  return (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.window !== 'undefined' &&
    typeof globalThis.document !== 'undefined'
  );
}

function cloneValue(value) {
  if (value === undefined || value === null || typeof value !== 'object') {
    return value;
  }

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // Fall through to the JSON-compatible clone.
    }
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function normalizeResponse(value) {
  if (
    value &&
    typeof value === 'object' &&
    typeof value.success === 'boolean'
  ) {
    if (
      value.success === false &&
      value.error &&
      typeof value.error === 'object' &&
      value.error.success === false
    ) {
      return normalizeResponse(value.error);
    }

    return cloneValue(value);
  }

  return {
    success: true,
    data: cloneValue(value),
  };
}

function normalizeError(error) {
  if (error && typeof error === 'object') {
    return {
      code: error.code || MOCK_API_ERROR.code,
      message: error.message || MOCK_API_ERROR.message,
      ...(error.details ? { details: cloneValue(error.details) } : {}),
    };
  }

  return {
    ...MOCK_API_ERROR,
    ...(error ? { message: String(error) } : {}),
  };
}

async function execute(operation) {
  if (!isBrowserEnvironment()) {
    return {
      success: false,
      error: cloneValue(BROWSER_UNAVAILABLE_ERROR),
    };
  }

  try {
    return normalizeResponse(await Promise.resolve().then(operation));
  } catch (error) {
    return {
      success: false,
      error: normalizeError(error),
    };
  }
}

const auth = Object.freeze({
  authenticate: (...args) => execute(() => authService.authenticate(...args)),
  clearRememberedUserId: () =>
    execute(() => authService.clearRememberedUserId()),
  getActivePersona: () => execute(() => authService.getActivePersona()),
  getCurrentSession: () => execute(() => authService.getCurrentSession()),
  getCurrentUser: () => execute(() => authService.getCurrentUser()),
  getDefaultPersona: () => execute(() => authService.getDefaultPersona()),
  getLockoutStatus: (...args) =>
    execute(() => authService.getLockoutStatus(...args)),
  getRecoveryPrompt: () => execute(() => authService.getRecoveryPrompt()),
  getRememberedUserId: () => execute(() => authService.getRememberedUserId()),
  isAuthenticated: () => execute(() => authService.isAuthenticated()),
  login: (...args) => execute(() => authService.login(...args)),
  logout: () => execute(() => authService.logout()),
  rememberUserId: (...args) =>
    execute(() => authService.rememberUserId(...args)),
  requestPasswordRecovery: (...args) =>
    execute(() => authService.requestPasswordRecovery(...args)),
  validateCredentials: (...args) =>
    execute(() => authService.validateCredentials(...args)),
});

const customer = Object.freeze({
  getActivePersona: () => execute(() => authService.getActivePersona()),
  getCurrentUser: () => execute(() => authService.getCurrentUser()),
  getDefaultPersona: () => execute(() => authService.getDefaultPersona()),
  getPersona: (...args) => execute(() => {
    const personaId = args[0];
    const persona = portfolioService.getPortfolio(personaId)?.persona || null;
    return persona;
  }),
  getPortfolio: (...args) =>
    execute(() => portfolioService.getPortfolio(...args)),
  getPortfolioByPersonaId: (...args) =>
    execute(() => portfolioService.getPortfolioByPersonaId(...args)),
  getPortfolioForPersona: (...args) =>
    execute(() => portfolioService.getPortfolioForPersona(...args)),
  getPortfolioSummary: (...args) =>
    execute(() => portfolioService.getPortfolioSummary(...args)),
  getPortfolioViewModel: (...args) =>
    execute(() => portfolioService.getPortfolioViewModel(...args)),
});

const account = Object.freeze({
  getAccountById: (...args) =>
    execute(() => accountService.getAccountById(...args)),
  getAccountCount: (...args) =>
    execute(() => accountService.getAccountCount(...args)),
  getAccountDetails: (...args) =>
    execute(() => accountService.getAccountDetails(...args)),
  getAccountForPersona: (...args) =>
    execute(() => accountService.getAccountForPersona(...args)),
  getAccountsForPersona: (...args) =>
    execute(() => accountService.getAccountsForPersona(...args)),
  isAccountAvailable: (...args) =>
    execute(() => accountService.isAccountAvailable(...args)),
  isAccountOwnedByPersona: (...args) =>
    execute(() => accountService.isAccountOwnedByPersona(...args)),
  listAccounts: (...args) => execute(() => accountService.listAccounts(...args)),
  validateAccountOwnership: (...args) =>
    execute(() => accountService.validateAccountOwnership(...args)),
});

const transaction = Object.freeze({
  getTransactionById: (...args) =>
    execute(() => transactionService.getTransactionById(...args)),
  getTransactionCount: (...args) =>
    execute(() => transactionService.getTransactionCount(...args)),
  getTransactionResult: (...args) =>
    execute(() => transactionService.getTransactionResult(...args)),
  getTransactions: (...args) =>
    execute(() => transactionService.getTransactions(...args)),
  getTransactionsForAccount: (...args) =>
    execute(() => transactionService.getTransactionsForAccount(...args)),
  getTransactionsResult: (...args) =>
    execute(() => transactionService.getTransactionsResult(...args)),
  listTransactions: (...args) =>
    execute(() => transactionService.listTransactions(...args)),
});

const product = Object.freeze({
  getProductById: (...args) =>
    execute(() => productService.getProductById(...args)),
  getProductCategories: (...args) =>
    execute(() => productService.getProductCategories(...args)),
  getProductDetails: (...args) =>
    execute(() => productService.getProductDetails(...args)),
  getProductResult: (...args) =>
    execute(() => productService.getProductResult(...args)),
  getProducts: (...args) => execute(() => productService.getProducts(...args)),
  getProductsByCategory: (...args) =>
    execute(() => productService.getProductsByCategory(...args)),
  getProductsByCategoryResult: (...args) =>
    execute(() => productService.getProductsByCategoryResult(...args)),
  listProducts: (...args) =>
    execute(() => productService.listProducts(...args)),
  listProductsByCategory: (...args) =>
    execute(() => productService.listProductsByCategory(...args)),
});

const offer = Object.freeze({
  clearOfferInterests: (...args) =>
    execute(() => offerService.clearOfferInterests(...args)),
  getOfferById: (...args) =>
    execute(() => offerService.getOfferById(...args)),
  getOfferDetails: (...args) =>
    execute(() => offerService.getOfferDetails(...args)),
  getOfferInterests: (...args) =>
    execute(() => offerService.getOfferInterests(...args)),
  getOfferResult: (...args) =>
    execute(() => offerService.getOfferResult(...args)),
  getOffers: (...args) => execute(() => offerService.getOffers(...args)),
  hasOfferInterest: (...args) =>
    execute(() => offerService.hasOfferInterest(...args)),
  listOffers: (...args) => execute(() => offerService.listOffers(...args)),
  recordOfferInterest: (...args) =>
    execute(() => offerService.recordOfferInterest(...args)),
});

const support = Object.freeze({
  clearContactEnquiries: () =>
    execute(() => supportService.clearContactEnquiries()),
  getBranchById: (...args) =>
    execute(() => supportService.getBranchById(...args)),
  getBranchOperatingHours: (...args) =>
    execute(() => supportService.getBranchOperatingHours(...args)),
  getBranchResult: (...args) =>
    execute(() => supportService.getBranchResult(...args)),
  getBranches: (...args) => execute(() => supportService.getBranches(...args)),
  getContactEnquiries: () =>
    execute(() => supportService.getContactEnquiries()),
  getContactInquiries: () =>
    execute(() => supportService.getContactInquiries()),
  getFAQs: (...args) => execute(() => supportService.getFAQs(...args)),
  getFaqById: (...args) => execute(() => supportService.getFaqById(...args)),
  getFaqResult: (...args) => execute(() => supportService.getFaqResult(...args)),
  getFaqs: (...args) => execute(() => supportService.getFaqs(...args)),
  getOperatingHours: (...args) =>
    execute(() => supportService.getOperatingHours(...args)),
  getOperatingHoursResult: (...args) =>
    execute(() => supportService.getOperatingHoursResult(...args)),
  getSupportArticleById: (...args) =>
    execute(() => supportService.getSupportArticleById(...args)),
  getSupportArticles: (...args) =>
    execute(() => supportService.getSupportArticles(...args)),
  getSupportChannels: (...args) =>
    execute(() => supportService.getSupportChannels(...args)),
  listBranches: (...args) =>
    execute(() => supportService.listBranches(...args)),
  listFaqs: (...args) => execute(() => supportService.listFaqs(...args)),
  listSupportChannels: (...args) =>
    execute(() => supportService.listSupportChannels(...args)),
  submitContactEnquiry: (...args) =>
    execute(() => supportService.submitContactEnquiry(...args)),
  submitContactInquiry: (...args) =>
    execute(() => supportService.submitContactInquiry(...args)),
});

const chat = Object.freeze({
  clearConversations: (...args) =>
    execute(() => chatService.clearConversations(...args)),
  createConversation: (...args) =>
    execute(() => chatService.createConversation(...args)),
  detectChatIntent: (...args) =>
    execute(() => chatService.detectChatIntent(...args)),
  endConversation: (...args) =>
    execute(() => chatService.endConversation(...args)),
  escalateConversation: (...args) =>
    execute(() => chatService.escalateConversation(...args)),
  getChatWelcome: (...args) =>
    execute(() => chatService.getChatWelcome(...args)),
  getConversation: (...args) =>
    execute(() => chatService.getConversation(...args)),
  getConversations: (...args) =>
    execute(() => chatService.getConversations(...args)),
  getTopicResponseResult: (...args) =>
    execute(() => chatService.getTopicResponseResult(...args)),
  getTopicResponseText: (...args) =>
    execute(() => chatService.getTopicResponseText(...args)),
  getWelcomeMessage: (...args) =>
    execute(() => chatService.getWelcomeMessage(...args)),
  listConversations: (...args) =>
    execute(() => chatService.listConversations(...args)),
  matchChatIntent: (...args) =>
    execute(() => chatService.matchChatIntent(...args)),
  requestEscalation: (...args) =>
    execute(() => chatService.requestEscalation(...args)),
  sendChatMessage: (...args) =>
    execute(() => chatService.sendChatMessage(...args)),
  sendMessage: (...args) => execute(() => chatService.sendMessage(...args)),
  sendTopicMessage: (...args) =>
    execute(() => chatService.sendTopicMessage(...args)),
});

const notification = Object.freeze({
  clearNotificationState: (...args) =>
    execute(() => notificationService.clearNotificationState(...args)),
  getNotificationById: (...args) =>
    execute(() => notificationService.getNotificationById(...args)),
  getNotificationDetails: (...args) =>
    execute(() => notificationService.getNotificationDetails(...args)),
  getNotificationResult: (...args) =>
    execute(() => notificationService.getNotificationResult(...args)),
  getNotificationSummary: (...args) =>
    execute(() => notificationService.getNotificationSummary(...args)),
  getNotifications: (...args) =>
    execute(() => notificationService.getNotifications(...args)),
  getUnreadCount: (...args) =>
    execute(() => notificationService.getUnreadCount(...args)),
  getUnreadNotificationCount: (...args) =>
    execute(() => notificationService.getUnreadNotificationCount(...args)),
  listNotifications: (...args) =>
    execute(() => notificationService.listNotifications(...args)),
  markAllNotificationsRead: (...args) =>
    execute(() => notificationService.markAllNotificationsRead(...args)),
  markNotificationRead: (...args) =>
    execute(() => notificationService.markNotificationRead(...args)),
  markNotificationUnread: (...args) =>
    execute(() => notificationService.markNotificationUnread(...args)),
  setNotificationRead: (...args) =>
    execute(() => notificationService.setNotificationRead(...args)),
});

const analytics = Object.freeze({
  clearEvents: () => execute(() => analyticsService.clearEvents()),
  getAnalyticsSummary: () =>
    execute(() => analyticsService.getAnalyticsSummary()),
  getEventCount: () => execute(() => analyticsService.getEventCount()),
  getEventCounts: () => execute(() => analyticsService.getEventCounts()),
  getEvents: (...args) => execute(() => analyticsService.getEvents(...args)),
  recordEvent: (...args) =>
    execute(() => analyticsService.recordEvent(...args)),
  recordPageView: (...args) =>
    execute(() => analyticsService.recordPageView(...args)),
  trackEvent: (...args) =>
    execute(() => analyticsService.trackEvent(...args)),
});

const resilience = Object.freeze({
  configureResilience: (...args) =>
    execute(() => resilienceService.configureResilience(...args)),
  executeWithResilience: (...args) =>
    execute(() => resilienceService.executeWithResilience(...args)),
  getDeterministicLatency: (...args) =>
    execute(() => resilienceService.getDeterministicLatency(...args)),
  getMockLatency: (...args) =>
    execute(() => resilienceService.getMockLatency(...args)),
  getResilienceConfig: () =>
    execute(() => resilienceService.getResilienceConfig()),
  getResilienceState: () =>
    execute(() => resilienceService.getResilienceState()),
  getRetryStatus: (...args) =>
    execute(() => resilienceService.getRetryStatus(...args)),
  isFacilitatorErrorModeEnabled: () =>
    execute(() => resilienceService.isFacilitatorErrorModeEnabled()),
  recordRetry: (...args) =>
    execute(() => resilienceService.recordRetry(...args)),
  resetResilience: () => execute(() => resilienceService.resetResilience()),
  resetRetryState: (...args) =>
    execute(() => resilienceService.resetRetryState(...args)),
  setErrorMode: (...args) =>
    execute(() => resilienceService.setErrorMode(...args)),
  setFacilitatorErrorMode: (...args) =>
    execute(() => resilienceService.setFacilitatorErrorMode(...args)),
  shouldFail: (...args) =>
    execute(() => resilienceService.shouldFail(...args)),
  waitForMockLatency: (...args) =>
    execute(() => resilienceService.waitForMockLatency(...args)),
});

const storage = Object.freeze({
  clearStorage: () => execute(() => storageService.clearStorage()),
  getSession: () => execute(() => storageService.getSession()),
  getStorageDefault: (...args) =>
    execute(() => storageService.getStorageDefault(...args)),
  getStorageItem: (...args) =>
    execute(() => storageService.getStorageItem(...args)),
  hasStorageItem: (...args) =>
    execute(() => storageService.hasStorageItem(...args)),
  isAllowedStorageKey: (...args) =>
    execute(() => storageService.isAllowedStorageKey(...args)),
  migrateStorage: () => execute(() => storageService.migrateStorage()),
  removeSession: () => execute(() => storageService.removeSession()),
  removeStorageItem: (...args) =>
    execute(() => storageService.removeStorageItem(...args)),
  resetStorage: () => execute(() => storageService.resetStorage()),
  setSession: (...args) => execute(() => storageService.setSession(...args)),
  setStorageItem: (...args) =>
    execute(() => storageService.setStorageItem(...args)),
});

export const mockApi = Object.freeze({
  analytics,
  auth,
  account,
  chat,
  customer,
  notification,
  offer,
  product,
  resilience,
  storage,
  support,
  transaction,
});

export const api = mockApi;

export {
  analytics,
  auth,
  account,
  chat,
  customer,
  notification,
  offer,
  product,
  resilience,
  storage,
  support,
  transaction,
};

export default mockApi;