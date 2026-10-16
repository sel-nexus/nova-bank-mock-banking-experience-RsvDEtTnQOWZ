import { FIXTURES, DEFAULT_FIXTURE_USER_ID } from '../fixtures/fixtures.js';
import { getReferenceDateString } from '../domain/referenceClock.js';

const DEFAULT_AGENT_NAME = 'Nova Support';
const DEFAULT_WELCOME_TOPIC = 'general';
const MAX_MESSAGE_LENGTH = 500;
const MAX_CONVERSATIONS_PER_PERSONA = 20;

const conversations = new Map();
let conversationSequence = 0;
let messageSequence = 0;

const TOPIC_RESPONSES = Object.freeze({
  account:
    'I can help with your Nova Bank Demo accounts. You can review balances, account details, and masked account numbers from the Accounts area.',
  balance:
    'Your current balances are available on the Dashboard and Accounts pages. Select an account to see its available balance and recent activity.',
  card:
    'For card questions, open the Transactions area to review card activity. This demo does not connect to real cards or process real payments.',
  password:
    'To reset your demo password, open Settings and choose the password reset option. Never enter a real password into this demonstration.',
  security:
    'For your security, use only synthetic information in this demo. Nova Bank Demo does not connect to real financial accounts.',
  transaction:
    'You can review transaction dates, descriptions, categories, and statuses in the Transactions area. Transactions shown here are synthetic.',
  transfer:
    'To transfer money, open Transfers, choose the source and destination accounts, enter an amount, review the details, and confirm. Transfers in this demo are simulated locally.',
  payment:
    'Payments shown in this experience are synthetic. Review the payment details and status from the Transactions area.',
  help:
    'I can help explain accounts, transfers, payments, transactions, cards, and security. Tell me what you would like to know.',
  general:
    'I can help with your Nova Bank Demo experience. Ask me about transfers, transactions, accounts, cards, payments, or security.',
});

const INTENTS = Object.freeze([
  {
    topic: 'transfer',
    keywords: [
      'transfer',
      'move money',
      'send money',
      'money transfer',
      'bank transfer',
    ],
  },
  {
    topic: 'transaction',
    keywords: [
      'transaction',
      'transactions',
      'activity',
      'recent activity',
      'statement',
      'charge',
    ],
  },
  {
    topic: 'balance',
    keywords: ['balance', 'available balance', 'how much money', 'funds'],
  },
  {
    topic: 'card',
    keywords: ['card', 'credit card', 'debit card', 'card payment'],
  },
  {
    topic: 'payment',
    keywords: ['payment', 'bill', 'pay a bill', 'paid'],
  },
  {
    topic: 'password',
    keywords: ['password', 'passcode', 'sign in', 'login', 'log in'],
  },
  {
    topic: 'security',
    keywords: ['security', 'secure', 'fraud', 'privacy', 'safe'],
  },
  {
    topic: 'account',
    keywords: ['account', 'accounts', 'checking', 'savings'],
  },
  {
    topic: 'help',
    keywords: ['help', 'support', 'what can you do', 'options'],
  },
]);

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
    return normalizeText(value.id || value.userId || value.personaId);
  }

  return normalizeText(value);
}

function normalizePersonaId(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  return normalizeIdentifier(personaOrId);
}

function getPersona(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  const personaId = normalizePersonaId(personaOrId);

  if (!personaId) {
    return null;
  }

  return FIXTURES.personas.find((persona) => persona.id === personaId) || null;
}

function getConversationId(conversationOrId) {
  if (isObject(conversationOrId)) {
    return normalizeText(conversationOrId.id || conversationOrId.conversationId);
  }

  return normalizeText(conversationOrId);
}

function getNowTimestamp() {
  return `${getReferenceDateString()}T00:00:00.000Z`;
}

function createConversationId() {
  conversationSequence += 1;
  return `chat-conversation-${conversationSequence}`;
}

function createMessageId() {
  messageSequence += 1;
  return `chat-message-local-${messageSequence}`;
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

function getPersonaDisplayName(persona) {
  return (
    normalizeText(persona?.firstName) ||
    normalizeText(persona?.name).split(' ')[0] ||
    'there'
  );
}

function getPersonaConversationIds(personaId) {
  return Array.from(conversations.values())
    .filter((conversation) => conversation.userId === personaId)
    .map((conversation) => conversation.id);
}

function trimMessage(value) {
  return normalizeText(value).slice(0, MAX_MESSAGE_LENGTH);
}

function createMessage(role, content, values = {}) {
  return {
    id: createMessageId(),
    role,
    content: trimMessage(content),
    createdAt: getNowTimestamp(),
    ...values,
  };
}

function createWelcomeMessage(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  const persona = getPersona(personaOrId);
  const name = getPersonaDisplayName(persona);

  return createMessage(
    'assistant',
    `Welcome, ${name}. I’m Nova Support, your synthetic banking assistant. I can help with accounts, transfers, payments, transactions, cards, and security. What would you like to know?`,
    {
      topic: DEFAULT_WELCOME_TOPIC,
    },
  );
}

function normalizeTopic(topic) {
  const normalizedTopic = normalizeText(topic).toLowerCase();

  if (normalizedTopic === 'transfers') {
    return 'transfer';
  }

  if (normalizedTopic === 'transactions') {
    return 'transaction';
  }

  if (normalizedTopic === 'accounts') {
    return 'account';
  }

  return TOPIC_RESPONSES[normalizedTopic] ? normalizedTopic : DEFAULT_WELCOME_TOPIC;
}

function getTopicResponse(topic, personaOrId) {
  const normalizedTopic = normalizeTopic(topic);
  const persona = getPersona(personaOrId);
  const name = getPersonaDisplayName(persona);
  const response = TOPIC_RESPONSES[normalizedTopic];

  if (normalizedTopic === DEFAULT_WELCOME_TOPIC && persona) {
    return `Thanks for reaching out, ${name}. ${response}`;
  }

  return response;
}

function normalizeSearchText(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectIntent(message) {
  const normalizedMessage = normalizeSearchText(message);

  if (!normalizedMessage) {
    return {
      topic: DEFAULT_WELCOME_TOPIC,
      confidence: 0,
    };
  }

  let selectedIntent = null;
  let selectedScore = 0;

  INTENTS.forEach((intent) => {
    const score = intent.keywords.reduce((total, keyword) => {
      const normalizedKeyword = normalizeSearchText(keyword);

      return normalizedMessage.includes(normalizedKeyword)
        ? total + normalizedKeyword.length
        : total;
    }, 0);

    if (score > selectedScore) {
      selectedIntent = intent;
      selectedScore = score;
    }
  });

  return {
    topic: selectedIntent?.topic || DEFAULT_WELCOME_TOPIC,
    confidence: selectedIntent ? Math.min(1, selectedScore / 20) : 0,
  };
}

function getConversationForPersona(conversationOrId, personaOrId) {
  const conversationId = getConversationId(conversationOrId);
  const personaId = normalizePersonaId(personaOrId);
  const conversation = conversations.get(conversationId);

  if (!conversation || conversation.userId !== personaId) {
    return null;
  }

  return conversation;
}

function createConversationRecord(persona) {
  const createdAt = getNowTimestamp();
  const conversation = {
    id: createConversationId(),
    userId: persona.id,
    status: 'active',
    assignedAgent: DEFAULT_AGENT_NAME,
    createdAt,
    updatedAt: createdAt,
    messages: [createWelcomeMessage(persona.id)],
  };

  conversations.set(conversation.id, conversation);
  return conversation;
}

function resolveConversation(personaOrId, conversationOrId) {
  const persona = getPersona(personaOrId);

  if (!persona) {
    return {
      persona: null,
      conversation: null,
      error: createFailure(
        'PERSONA_NOT_FOUND',
        'No persona was found for the requested chat scope.',
      ),
    };
  }

  if (conversationOrId !== undefined && conversationOrId !== null) {
    const conversation = getConversationForPersona(conversationOrId, persona.id);

    if (!conversation) {
      return {
        persona,
        conversation: null,
        error: createFailure(
          'CONVERSATION_NOT_FOUND',
          'No conversation was found for this persona.',
        ),
      };
    }

    return {
      persona,
      conversation,
      error: null,
    };
  }

  const existingConversation = Array.from(conversations.values())
    .reverse()
    .find(
      (conversation) =>
        conversation.userId === persona.id && conversation.status !== 'ended',
    );

  return {
    persona,
    conversation: existingConversation || createConversationRecord(persona),
    error: null,
  };
}

/**
 * Returns a persona-sensitive scripted welcome message.
 *
 * @param {string|Object} [personaOrId]
 * @returns {Object}
 */
export function getChatWelcome(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  const persona = getPersona(personaOrId);

  if (!persona) {
    return createFailure(
      'PERSONA_NOT_FOUND',
      'No persona was found for the chat welcome message.',
    );
  }

  return createSuccess(createWelcomeMessage(persona.id));
}

/**
 * Alias for retrieving the scripted chat welcome.
 *
 * @param {string|Object} [personaOrId]
 * @returns {Object}
 */
export function getWelcomeMessage(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  return getChatWelcome(personaOrId);
}

/**
 * Returns a scripted response for a supported chat topic.
 *
 * @param {string} topic
 * @param {string|Object} [personaOrId]
 * @returns {Object}
 */
export function getTopicResponseResult(
  topic,
  personaOrId = DEFAULT_FIXTURE_USER_ID,
) {
  const persona = getPersona(personaOrId);

  if (!persona) {
    return createFailure(
      'PERSONA_NOT_FOUND',
      'No persona was found for the requested chat topic.',
    );
  }

  const normalizedTopic = normalizeTopic(topic);

  return createSuccess({
    topic: normalizedTopic,
    response: getTopicResponse(normalizedTopic, persona.id),
  });
}

/**
 * Returns a scripted response for a topic.
 *
 * @param {string} topic
 * @param {string|Object} [personaOrId]
 * @returns {string}
 */
export function getTopicResponseText(
  topic,
  personaOrId = DEFAULT_FIXTURE_USER_ID,
) {
  const persona = getPersona(personaOrId);
  return persona ? getTopicResponse(topic, persona.id) : '';
}

/**
 * Matches free text to a supported chat intent.
 *
 * @param {string} message
 * @returns {{topic: string, confidence: number}}
 */
export function matchChatIntent(message) {
  return detectIntent(message);
}

/**
 * Alias for matching free-text chat intent.
 *
 * @param {string} message
 * @returns {{topic: string, confidence: number}}
 */
export function detectChatIntent(message) {
  return matchChatIntent(message);
}

/**
 * Creates a local chat conversation for a persona.
 *
 * @param {string|Object} [personaOrId]
 * @returns {{success: boolean, data?: Object, error?: Object}}
 */
export function createConversation(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  const persona = getPersona(personaOrId);

  if (!persona) {
    return createFailure(
      'PERSONA_NOT_FOUND',
      'No persona was found for the requested chat conversation.',
    );
  }

  return createSuccess(createConversationRecord(persona));
}

/**
 * Returns a persona-scoped conversation.
 *
 * @param {string|Object} conversationOrId
 * @param {string|Object} [personaOrId]
 * @returns {Object|null}
 */
export function getConversation(
  conversationOrId,
  personaOrId = DEFAULT_FIXTURE_USER_ID,
) {
  const conversation = getConversationForPersona(conversationOrId, personaOrId);
  return conversation ? cloneValue(conversation) : null;
}

/**
 * Returns all conversations belonging to a persona.
 *
 * @param {string|Object} [personaOrId]
 * @returns {Object[]}
 */
export function getConversations(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  const persona = getPersona(personaOrId);

  if (!persona) {
    return [];
  }

  return cloneValue(
    Array.from(conversations.values()).filter(
      (conversation) => conversation.userId === persona.id,
    ),
  );
}

/**
 * Alias for listing persona-scoped chat conversations.
 *
 * @param {string|Object} [personaOrId]
 * @returns {Object[]}
 */
export function listConversations(personaOrId = DEFAULT_FIXTURE_USER_ID) {
  return getConversations(personaOrId);
}

/**
 * Sends a message and returns a simulated assistant response.
 *
 * @param {string|Object} personaOrId
 * @param {string} message
 * @param {string|Object} [conversationOrId]
 * @returns {{success: boolean, data?: Object, error?: Object, message?: string}}
 */
export function sendMessage(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  message,
  conversationOrId,
) {
  const resolved = resolveConversation(personaOrId, conversationOrId);

  if (resolved.error) {
    return resolved.error;
  }

  const content = trimMessage(message);

  if (!content) {
    return createFailure(
      'INVALID_MESSAGE',
      'A chat message is required.',
    );
  }

  const conversation = resolved.conversation;
  const intent = detectIntent(content);
  const userMessage = createMessage('user', content, {
    topic: intent.topic,
  });
  const assistantMessage = createMessage(
    'assistant',
    getTopicResponse(intent.topic, resolved.persona.id),
    {
      topic: intent.topic,
      confidence: intent.confidence,
    },
  );

  conversation.messages.push(userMessage, assistantMessage);
  conversation.updatedAt = getNowTimestamp();

  if (conversation.messages.length > MAX_MESSAGE_LENGTH) {
    conversation.messages = conversation.messages.slice(-MAX_MESSAGE_LENGTH);
  }

  return createSuccess(
    {
      conversation: conversation,
      userMessage,
      assistantMessage,
      intent,
    },
    'Your message was answered by the local demo assistant.',
  );
}

/**
 * Alias for sending a free-text chat message.
 *
 * @param {string|Object} personaOrId
 * @param {string} message
 * @param {string|Object} [conversationOrId]
 * @returns {Object}
 */
export function sendChatMessage(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  message,
  conversationOrId,
) {
  return sendMessage(personaOrId, message, conversationOrId);
}

/**
 * Sends a topic request to the simulated assistant.
 *
 * @param {string|Object} personaOrId
 * @param {string} topic
 * @param {string|Object} [conversationOrId]
 * @returns {Object}
 */
export function sendTopicMessage(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  topic,
  conversationOrId,
) {
  return sendMessage(
    personaOrId,
    getTopicResponseText(topic, personaOrId),
    conversationOrId,
  );
}

/**
 * Escalates a persona-scoped conversation to simulated support.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} [conversationOrId]
 * @param {string} [reason]
 * @returns {{success: boolean, data?: Object, error?: Object, message?: string}}
 */
export function escalateConversation(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  conversationOrId,
  reason = 'Customer requested support.',
) {
  const resolved = resolveConversation(personaOrId, conversationOrId);

  if (resolved.error) {
    return resolved.error;
  }

  const conversation = resolved.conversation;
  const normalizedReason = trimMessage(reason) || 'Customer requested support.';

  conversation.status = 'waiting';
  conversation.assignedAgent = DEFAULT_AGENT_NAME;
  conversation.updatedAt = getNowTimestamp();

  const escalationMessage = createMessage(
    'assistant',
    'I have sent this conversation to simulated Nova Support. A support response is not sent to a real bank or third party.',
    {
      topic: 'escalation',
      escalationReason: normalizedReason,
    },
  );

  conversation.messages.push(escalationMessage);

  return createSuccess(
    {
      conversation,
      escalation: {
        id: `chat-escalation-${conversation.id}`,
        status: 'submitted',
        reason: normalizedReason,
        createdAt: getNowTimestamp(),
        estimatedResponse: 'A simulated support response would be available shortly.',
      },
    },
    'Your conversation was escalated locally.',
  );
}

/**
 * Alias for escalating a chat conversation.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} [conversationOrId]
 * @param {string} [reason]
 * @returns {Object}
 */
export function requestEscalation(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  conversationOrId,
  reason,
) {
  return escalateConversation(personaOrId, conversationOrId, reason);
}

/**
 * Ends a persona-scoped chat conversation.
 *
 * @param {string|Object} personaOrId
 * @param {string|Object} [conversationOrId]
 * @returns {Object}
 */
export function endConversation(
  personaOrId = DEFAULT_FIXTURE_USER_ID,
  conversationOrId,
) {
  const resolved = resolveConversation(personaOrId, conversationOrId);

  if (resolved.error) {
    return resolved.error;
  }

  resolved.conversation.status = 'ended';
  resolved.conversation.updatedAt = getNowTimestamp();

  return createSuccess(resolved.conversation, 'The chat conversation has ended.');
}

/**
 * Clears local conversations for one persona or all personas.
 *
 * @param {string|Object} [personaOrId]
 * @returns {number}
 */
export function clearConversations(personaOrId) {
  const normalizedPersonaId =
    personaOrId === undefined ? '' : normalizePersonaId(personaOrId);
  let removedCount = 0;

  for (const [conversationId, conversation] of conversations.entries()) {
    if (
      !normalizedPersonaId ||
      conversation.userId === normalizedPersonaId
    ) {
      conversations.delete(conversationId);
      removedCount += 1;
    }
  }

  if (!normalizedPersonaId) {
    conversationSequence = 0;
    messageSequence = 0;
  }

  return removedCount;
}

export const chatService = Object.freeze({
  clearConversations,
  createConversation,
  detectChatIntent,
  endConversation,
  escalateConversation,
  getChatWelcome,
  getConversation,
  getConversations,
  getTopicResponseResult,
  getTopicResponseText,
  getWelcomeMessage,
  listConversations,
  matchChatIntent,
  requestEscalation,
  sendChatMessage,
  sendMessage,
  sendTopicMessage,
});

export default chatService;