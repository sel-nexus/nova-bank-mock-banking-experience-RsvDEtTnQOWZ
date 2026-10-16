import { DEMO_CONSTANTS } from '../config/constants.js';
import { FIXTURES } from '../fixtures/fixtures.js';
import { getReferenceDateString } from '../domain/referenceClock.js';

const SUPPORT_CHANNELS = Object.freeze([
  {
    id: 'channel-help-center',
    type: 'help-center',
    name: 'Help center',
    description: 'Browse answers to common Nova Bank Demo questions.',
    availability: 'Always available',
    available: true,
    route: '/help',
  },
  {
    id: 'channel-email',
    type: 'email',
    name: 'Email support',
    description: 'Send a question to the Nova Bank Demo support team.',
    availability: 'Replies are simulated locally',
    available: true,
    address: DEMO_CONSTANTS.supportEmail,
  },
  {
    id: 'channel-chat',
    type: 'chat',
    name: 'Demo support chat',
    description: 'Chat with synthetic Nova Bank Demo support.',
    availability: 'Available in this demonstration',
    available: true,
    route: '/help',
  },
  {
    id: 'channel-branch',
    type: 'branch',
    name: 'Branch support',
    description: 'Find a fictional branch and review its operating hours.',
    availability: 'See individual branch hours',
    available: true,
    route: '/help',
  },
]);

const enquiries = [];
let enquirySequence = 0;

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function normalizeIdentifier(value) {
  if (isObject(value)) {
    return normalizeText(value.id);
  }

  return normalizeText(value);
}

function normalizeOptions(options) {
  return isObject(options) ? options : {};
}

function normalizeSearch(value) {
  return normalizeText(value).toLowerCase();
}

function matchesSearch(values, search) {
  if (!search) {
    return true;
  }

  return values.some((value) =>
    normalizeSearch(value).includes(search),
  );
}

function createSuccess(data, message) {
  return {
    success: true,
    ...(data !== undefined ? { data: cloneValue(data) } : {}),
    ...(message ? { message } : {}),
  };
}

function createFailure(code, message, details) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details: cloneValue(details) } : {}),
    },
  };
}

function getFixtureFaq(faqOrId) {
  const faqId = normalizeIdentifier(faqOrId);

  if (!faqId) {
    return null;
  }

  return FIXTURES.faqs.find((faq) => faq.id === faqId) || null;
}

function getFixtureBranch(branchOrId) {
  const branchId = normalizeIdentifier(branchOrId);

  if (!branchId) {
    return null;
  }

  return FIXTURES.branches.find((branch) => branch.id === branchId) || null;
}

function getFixtureArticle(articleOrId) {
  const articleId = normalizeIdentifier(articleOrId);

  if (!articleId) {
    return null;
  }

  return FIXTURES.supportArticles.find((article) => article.id === articleId) || null;
}

function getFilteredFaqs(options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const search = normalizeSearch(
    normalizedOptions.search || normalizedOptions.query,
  );
  const category = normalizeSearch(normalizedOptions.category);
  const popularOnly = normalizedOptions.popularOnly === true;

  return FIXTURES.faqs.filter((faq) => {
    if (
      category &&
      normalizeSearch(faq.category) !== category
    ) {
      return false;
    }

    if (popularOnly && faq.popular !== true) {
      return false;
    }

    return matchesSearch(
      [faq.question, faq.answer, faq.category],
      search,
    );
  });
}

function getFilteredBranches(options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const search = normalizeSearch(
    normalizedOptions.search || normalizedOptions.query,
  );
  const service = normalizeSearch(normalizedOptions.service);
  const openOnly = normalizedOptions.openOnly === true;

  return FIXTURES.branches.filter((branch) => {
    if (
      service &&
      !branch.services.some((item) => normalizeSearch(item) === service)
    ) {
      return false;
    }

    if (
      search &&
      !matchesSearch(
        [
          branch.name,
          branch.address,
          branch.phone,
          ...(Array.isArray(branch.services) ? branch.services : []),
        ],
        search,
      )
    ) {
      return false;
    }

    if (openOnly && !isBranchOpen(branch, normalizedOptions.day)) {
      return false;
    }

    return true;
  });
}

function getFilteredArticles(options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const search = normalizeSearch(
    normalizedOptions.search || normalizedOptions.query,
  );
  const category = normalizeSearch(normalizedOptions.category);

  return FIXTURES.supportArticles.filter((article) => {
    if (
      category &&
      normalizeSearch(article.category) !== category
    ) {
      return false;
    }

    return matchesSearch(
      [
        article.title,
        article.summary,
        article.content,
        article.category,
        ...(Array.isArray(article.tags) ? article.tags : []),
      ],
      search,
    );
  });
}

function normalizeDay(day) {
  const value = normalizeSearch(day);

  if (!value) {
    return 'monday';
  }

  const aliases = {
    mon: 'monday',
    tue: 'tuesday',
    wed: 'wednesday',
    thu: 'thursday',
    fri: 'friday',
    sat: 'saturday',
    sun: 'sunday',
  };

  return aliases[value] || value;
}

function getBranchHours(branch, day) {
  if (!branch || !isObject(branch.hours)) {
    return null;
  }

  const normalizedDay = normalizeDay(day);

  return {
    day: normalizedDay,
    hours: branch.hours[normalizedDay] || 'Closed',
  };
}

function isBranchOpen(branch, day) {
  const hours = getBranchHours(branch, day);

  if (!hours || hours.hours === 'Closed') {
    return false;
  }

  const match = String(hours.hours).match(
    /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/,
  );

  if (!match) {
    return true;
  }

  const currentTime = new Date().getUTCHours() * 60 + new Date().getUTCMinutes();
  const openingTime = Number(match[1]) * 60 + Number(match[2]);
  const closingTime = Number(match[3]) * 60 + Number(match[4]);

  return currentTime >= openingTime && currentTime < closingTime;
}

function createEnquiryId() {
  enquirySequence += 1;
  return `support-enquiry-${enquirySequence}`;
}

function normalizeEnquiryInput(input) {
  const source = isObject(input) ? input : {};

  return {
    name: normalizeText(source.name || source.fullName),
    email: normalizeText(source.email),
    subject: normalizeText(source.subject),
    message: normalizeText(source.message || source.description),
    category: normalizeText(source.category) || 'General',
    preferredChannel: normalizeText(
      source.preferredChannel || source.channel,
    ),
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Returns frequently asked questions from the local support fixture.
 *
 * @param {{search?: string, query?: string, category?: string, popularOnly?: boolean}} [options]
 * @returns {Object[]}
 */
export function getFaqs(options = {}) {
  return cloneValue(getFilteredFaqs(options));
}

/**
 * Alias for retrieving frequently asked questions.
 *
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function listFaqs(options = {}) {
  return getFaqs(options);
}

/**
 * Alias using the conventional FAQ acronym capitalization.
 *
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function getFAQs(options = {}) {
  return getFaqs(options);
}

/**
 * Returns one FAQ by identifier.
 *
 * @param {string|Object} faqOrId
 * @returns {Object|null}
 */
export function getFaqById(faqOrId) {
  const faq = getFixtureFaq(faqOrId);
  return faq ? cloneValue(faq) : null;
}

/**
 * Returns a controlled FAQ lookup response.
 *
 * @param {string|Object} faqOrId
 * @returns {Object}
 */
export function getFaqResult(faqOrId) {
  const faq = getFaqById(faqOrId);

  return faq
    ? createSuccess(faq)
    : createFailure('FAQ_NOT_FOUND', 'No FAQ was found for the requested identifier.');
}

/**
 * Returns fictional branch locations.
 *
 * @param {{search?: string, query?: string, service?: string, openOnly?: boolean}} [options]
 * @returns {Object[]}
 */
export function getBranches(options = {}) {
  return cloneValue(getFilteredBranches(options));
}

/**
 * Alias for retrieving branch locations.
 *
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function listBranches(options = {}) {
  return getBranches(options);
}

/**
 * Returns one branch by identifier.
 *
 * @param {string|Object} branchOrId
 * @returns {Object|null}
 */
export function getBranchById(branchOrId) {
  const branch = getFixtureBranch(branchOrId);
  return branch ? cloneValue(branch) : null;
}

/**
 * Returns a controlled branch lookup response.
 *
 * @param {string|Object} branchOrId
 * @returns {Object}
 */
export function getBranchResult(branchOrId) {
  const branch = getBranchById(branchOrId);

  return branch
    ? createSuccess(branch)
    : createFailure(
        'BRANCH_NOT_FOUND',
        'No branch was found for the requested identifier.',
      );
}

/**
 * Returns operating hours for a branch.
 *
 * @param {string|Object} branchOrId
 * @param {string} [day]
 * @returns {{branch: Object, day?: string, hours?: string}|null}
 */
export function getBranchOperatingHours(branchOrId, day) {
  const branch = getFixtureBranch(branchOrId);

  if (!branch) {
    return null;
  }

  if (day !== undefined) {
    return cloneValue({
      branchId: branch.id,
      branchName: branch.name,
      ...getBranchHours(branch, day),
    });
  }

  return cloneValue({
    branchId: branch.id,
    branchName: branch.name,
    hours: branch.hours,
  });
}

/**
 * Alias for retrieving branch hours.
 *
 * @param {string|Object} branchOrId
 * @param {string} [day]
 * @returns {Object|null}
 */
export function getOperatingHours(branchOrId, day) {
  return getBranchOperatingHours(branchOrId, day);
}

/**
 * Returns a controlled operating-hours response.
 *
 * @param {string|Object} branchOrId
 * @param {string} [day]
 * @returns {Object}
 */
export function getOperatingHoursResult(branchOrId, day) {
  const hours = getBranchOperatingHours(branchOrId, day);

  return hours
    ? createSuccess(hours)
    : createFailure(
        'BRANCH_NOT_FOUND',
        'Operating hours are unavailable for the requested branch.',
      );
}

/**
 * Returns the local support channels.
 *
 * @param {{availableOnly?: boolean, type?: string}} [options]
 * @returns {Object[]}
 */
export function getSupportChannels(options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const requestedType = normalizeSearch(normalizedOptions.type);

  return cloneValue(
    SUPPORT_CHANNELS.filter((channel) => {
      if (normalizedOptions.availableOnly === true && !channel.available) {
        return false;
      }

      return !requestedType || normalizeSearch(channel.type) === requestedType;
    }),
  );
}

/**
 * Alias for retrieving support contact channels.
 *
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function listSupportChannels(options = {}) {
  return getSupportChannels(options);
}

/**
 * Returns support articles from the local fixture.
 *
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function getSupportArticles(options = {}) {
  return cloneValue(getFilteredArticles(options));
}

/**
 * Returns one support article by identifier.
 *
 * @param {string|Object} articleOrId
 * @returns {Object|null}
 */
export function getSupportArticleById(articleOrId) {
  const article = getFixtureArticle(articleOrId);
  return article ? cloneValue(article) : null;
}

/**
 * Submits a local contact enquiry and returns a synthetic confirmation.
 *
 * @param {Object} input
 * @returns {{success: boolean, data?: Object, error?: Object, message?: string}}
 */
export function submitContactEnquiry(input) {
  const enquiry = normalizeEnquiryInput(input);
  const details = {};

  if (!enquiry.name) {
    details.name = 'A name is required.';
  }

  if (!enquiry.email || !isValidEmail(enquiry.email)) {
    details.email = 'A valid email address is required.';
  }

  if (!enquiry.subject) {
    details.subject = 'A subject is required.';
  }

  if (!enquiry.message) {
    details.message = 'A message is required.';
  }

  if (Object.keys(details).length > 0) {
    return createFailure(
      'INVALID_ENQUIRY',
      'Please provide the required contact enquiry details.',
      details,
    );
  }

  const createdAt = `${getReferenceDateString()}T00:00:00.000Z`;
  const confirmation = {
    id: createEnquiryId(),
    reference: `NOVA-${String(enquirySequence).padStart(6, '0')}`,
    type: 'contact-enquiry',
    status: 'received',
    name: enquiry.name,
    email: enquiry.email,
    subject: enquiry.subject,
    message: enquiry.message,
    category: enquiry.category,
    ...(enquiry.preferredChannel
      ? { preferredChannel: enquiry.preferredChannel }
      : {}),
    createdAt,
    expectedResponse: 'This synthetic enquiry has been received locally.',
  };

  enquiries.push(confirmation);

  return createSuccess(
    confirmation,
    'Your enquiry was received by Nova Bank Demo support.',
  );
}

/**
 * Alias for submitting a contact inquiry.
 *
 * @param {Object} input
 * @returns {Object}
 */
export function submitContactInquiry(input) {
  return submitContactEnquiry(input);
}

/**
 * Returns locally submitted contact enquiries.
 *
 * @returns {Object[]}
 */
export function getContactEnquiries() {
  return cloneValue(enquiries);
}

/**
 * Alias for retrieving locally submitted contact inquiries.
 *
 * @returns {Object[]}
 */
export function getContactInquiries() {
  return getContactEnquiries();
}

/**
 * Clears local contact enquiries.
 *
 * @returns {number}
 */
export function clearContactEnquiries() {
  const removedCount = enquiries.length;
  enquiries.length = 0;
  enquirySequence = 0;
  return removedCount;
}

export const supportService = Object.freeze({
  clearContactEnquiries,
  getBranchById,
  getBranchOperatingHours,
  getBranchResult,
  getBranches,
  getContactEnquiries,
  getContactInquiries,
  getFAQs,
  getFaqById,
  getFaqResult,
  getFaqs,
  getOperatingHours,
  getOperatingHoursResult,
  getSupportArticleById,
  getSupportArticles,
  getSupportChannels,
  listBranches,
  listFaqs,
  listSupportChannels,
  submitContactEnquiry,
  submitContactInquiry,
});

export default supportService;