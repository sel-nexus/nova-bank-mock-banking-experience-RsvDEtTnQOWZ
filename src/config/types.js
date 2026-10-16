/**
 * @typedef {Object} ApiError
 * @property {string} code
 * @property {string} message
 * @property {Object<string, string|string[]>} [details]
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {T} [data]
 * @property {ApiError} [error]
 * @property {string} [message]
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} items
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalItems
 * @property {number} totalPages
 * @property {boolean} hasNextPage
 * @property {boolean} hasPreviousPage
 */

/**
 * @typedef {Object} Persona
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [avatarUrl]
 * @property {string} [phone]
 * @property {string} [dateOfBirth]
 * @property {string} [address]
 * @property {string} [memberSince]
 * @property {boolean} [isVerified]
 */

/**
 * @typedef {'checking'|'savings'|'credit'|'loan'|'investment'} AccountType
 */

/**
 * @typedef {'active'|'inactive'|'closed'|'pending'} AccountStatus
 */

/**
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} name
 * @property {AccountType} type
 * @property {AccountStatus} status
 * @property {string} [accountNumber]
 * @property {string} [maskedAccountNumber]
 * @property {string} [routingNumber]
 * @property {number} balance
 * @property {number} [availableBalance]
 * @property {number} [creditLimit]
 * @property {number} [interestRate]
 * @property {string} currency
 * @property {string} [openedAt]
 * @property {string} [lastUpdated]
 */

/**
 * @typedef {'credit'|'debit'} TransactionDirection
 */

/**
 * @typedef {'pending'|'completed'|'failed'|'cancelled'} TransactionStatus
 */

/**
 * @typedef {'card'|'transfer'|'payment'|'deposit'|'withdrawal'|'fee'|'interest'|'refund'|'other'} TransactionType
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} accountId
 * @property {TransactionDirection} direction
 * @property {TransactionStatus} status
 * @property {TransactionType} type
 * @property {number} amount
 * @property {string} currency
 * @property {string} description
 * @property {string} [merchantName]
 * @property {string} [merchantCategory]
 * @property {string} [category]
 * @property {string} [reference]
 * @property {string} date
 * @property {string} [postedAt]
 * @property {string} [createdAt]
 */

/**
 * @typedef {'checking'|'savings'|'credit'|'loan'|'investment'|'insurance'} ProductType
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {ProductType} type
 * @property {string} [category]
 * @property {string} [imageUrl]
 * @property {string} [icon]
 * @property {number} [interestRate]
 * @property {number} [annualFee]
 * @property {string[]} [benefits]
 * @property {boolean} [available]
 */

/**
 * @typedef {'available'|'claimed'|'expired'|'unavailable'} OfferStatus
 */

/**
 * @typedef {Object} Offer
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} [terms]
 * @property {string} category
 * @property {number} [amount]
 * @property {number} [percentage]
 * @property {string} [promoCode]
 * @property {string} [imageUrl]
 * @property {OfferStatus} status
 * @property {string} validFrom
 * @property {string} validUntil
 */

/**
 * @typedef {'question'|'incident'|'request'|'feedback'} SupportRequestType
 */

/**
 * @typedef {'open'|'in-progress'|'resolved'|'closed'} SupportRequestStatus
 */

/**
 * @typedef {Object} SupportRequest
 * @property {string} id
 * @property {SupportRequestType} type
 * @property {SupportRequestStatus} status
 * @property {string} subject
 * @property {string} description
 * @property {string} [category]
 * @property {string} [priority]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} [resolvedAt]
 */

/**
 * @typedef {Object} SupportArticle
 * @property {string} id
 * @property {string} title
 * @property {string} summary
 * @property {string} content
 * @property {string} category
 * @property {string[]} [tags]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {'user'|'assistant'|'system'} ChatMessageRole
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {ChatMessageRole} role
 * @property {string} content
 * @property {string} createdAt
 * @property {boolean} [isTyping]
 */

/**
 * @typedef {'active'|'ended'|'waiting'} ChatStatus
 */

/**
 * @typedef {Object} ChatConversation
 * @property {string} id
 * @property {ChatStatus} status
 * @property {ChatMessage[]} messages
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} [assignedAgent]
 */

/**
 * @typedef {Object} Session
 * @property {string} token
 * @property {string} [refreshToken]
 * @property {'Bearer'|string} [tokenType]
 * @property {string} userId
 * @property {string} createdAt
 * @property {string} expiresAt
 * @property {string} [refreshExpiresAt]
 */

/**
 * @typedef {Object} Beneficiary
 * @property {string} id
 * @property {string} name
 * @property {string} accountNumber
 * @property {string} [maskedAccountNumber]
 * @property {string} [bankName]
 * @property {string} [routingNumber]
 * @property {string} [nickname]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} TransferRequest
 * @property {string} fromAccountId
 * @property {string} toAccountId
 * @property {number} amount
 * @property {string} [description]
 * @property {string} [scheduledDate]
 */

/**
 * @typedef {Object} Transfer
 * @property {string} id
 * @property {string} fromAccountId
 * @property {string} toAccountId
 * @property {number} amount
 * @property {string} currency
 * @property {TransactionStatus} status
 * @property {string} [description]
 * @property {string} createdAt
 * @property {string} [completedAt]
 */

export {};