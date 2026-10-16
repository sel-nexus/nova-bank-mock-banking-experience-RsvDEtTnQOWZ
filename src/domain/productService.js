import { FIXTURES } from '../fixtures/fixtures.js';

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

function normalizeValue(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function normalizeProductId(productOrId) {
  if (typeof productOrId === 'string' || typeof productOrId === 'number') {
    return normalizeValue(productOrId);
  }

  if (isObject(productOrId)) {
    return normalizeValue(productOrId.id);
  }

  return '';
}

function normalizeFilter(value) {
  return normalizeValue(value).toLowerCase();
}

function normalizeOptions(options) {
  return isObject(options) ? options : {};
}

function matchesProduct(product, options) {
  const normalizedCategory = normalizeFilter(options.category);
  const normalizedType = normalizeFilter(options.type);
  const normalizedSearch = normalizeFilter(options.search || options.query);

  if (
    normalizedCategory &&
    normalizeFilter(product.category) !== normalizedCategory
  ) {
    return false;
  }

  if (normalizedType && normalizeFilter(product.type) !== normalizedType) {
    return false;
  }

  if (options.available === true && product.available === false) {
    return false;
  }

  if (options.available === false && product.available !== false) {
    return false;
  }

  if (normalizedSearch) {
    const searchableValues = [
      product.name,
      product.description,
      product.category,
      product.type,
      ...(Array.isArray(product.benefits) ? product.benefits : []),
    ];

    if (
      !searchableValues.some((value) =>
        normalizeFilter(value).includes(normalizedSearch),
      )
    ) {
      return false;
    }
  }

  return true;
}

function sortProducts(products, options) {
  const sortBy = normalizeValue(options.sortBy || options.sortField).toLowerCase();
  const sortOrder =
    normalizeValue(options.sortOrder || options.order).toLowerCase() === 'desc'
      ? 'desc'
      : 'asc';

  if (!sortBy) {
    return products;
  }

  const allowedSortFields = new Set([
    'id',
    'name',
    'category',
    'type',
    'interestRate',
    'annualFee',
  ]);

  if (!allowedSortFields.has(sortBy)) {
    return products;
  }

  return products
    .map((product, index) => ({ product, index }))
    .sort((first, second) => {
      const firstValue = first.product[sortBy];
      const secondValue = second.product[sortBy];

      let comparison;

      if (
        typeof firstValue === 'number' &&
        Number.isFinite(firstValue) &&
        typeof secondValue === 'number' &&
        Number.isFinite(secondValue)
      ) {
        comparison = firstValue - secondValue;
      } else {
        comparison = String(firstValue || '').localeCompare(
          String(secondValue || ''),
        );
      }

      if (comparison === 0) {
        comparison = first.index - second.index;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    })
    .map(({ product }) => product);
}

function getFilteredProducts(options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const products = FIXTURES.products.filter((product) =>
    matchesProduct(product, normalizedOptions),
  );
  const sortedProducts = sortProducts(products, normalizedOptions);
  const limit =
    Number.isInteger(normalizedOptions.limit) && normalizedOptions.limit >= 0
      ? normalizedOptions.limit
      : null;

  return limit === null ? sortedProducts : sortedProducts.slice(0, limit);
}

function createSuccess(data, message) {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

function createFailure(code, message) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * Returns products from the synthetic catalogue.
 *
 * @param {{
 *   category?: string,
 *   type?: string,
 *   search?: string,
 *   query?: string,
 *   available?: boolean,
 *   sortBy?: string,
 *   sortOrder?: 'asc'|'desc',
 *   limit?: number
 * }} [options]
 * @returns {Object[]}
 */
export function getProducts(options = {}) {
  return cloneValue(getFilteredProducts(options));
}

/**
 * Alias for retrieving products from the synthetic catalogue.
 *
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function listProducts(options = {}) {
  return getProducts(options);
}

/**
 * Returns products belonging to a catalogue category.
 *
 * @param {string} category
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function getProductsByCategory(category, options = {}) {
  return getProducts({
    ...normalizeOptions(options),
    category,
  });
}

/**
 * Alias for retrieving products belonging to a catalogue category.
 *
 * @param {string} category
 * @param {Object} [options]
 * @returns {Object[]}
 */
export function listProductsByCategory(category, options = {}) {
  return getProductsByCategory(category, options);
}

/**
 * Returns the distinct product categories in the synthetic catalogue.
 *
 * @param {{available?: boolean}} [options]
 * @returns {string[]}
 */
export function getProductCategories(options = {}) {
  return Array.from(
    new Set(
      getFilteredProducts(options)
        .map((product) => product.category)
        .filter((category) => typeof category === 'string' && category.trim()),
    ),
  );
}

/**
 * Returns one product by its identifier.
 *
 * @param {string|Object} productOrId
 * @returns {Object|null}
 */
export function getProductById(productOrId) {
  const productId = normalizeProductId(productOrId);

  if (!productId) {
    return null;
  }

  const product = FIXTURES.products.find((item) => item.id === productId);
  return product ? cloneValue(product) : null;
}

/**
 * Alias for retrieving product details by identifier.
 *
 * @param {string|Object} productOrId
 * @returns {Object|null}
 */
export function getProductDetails(productOrId) {
  return getProductById(productOrId);
}

/**
 * Returns a controlled response for a product detail lookup.
 *
 * @param {string|Object} productOrId
 * @returns {{success: boolean, data?: Object, error?: Object}}
 */
export function getProductResult(productOrId) {
  const product = getProductById(productOrId);

  if (!product) {
    return createFailure(
      'PRODUCT_NOT_FOUND',
      'No product was found for the requested identifier.',
    );
  }

  return createSuccess(product);
}

/**
 * Returns a controlled response for a category product listing.
 *
 * @param {string} category
 * @param {Object} [options]
 * @returns {{success: boolean, data?: Object[], error?: Object}}
 */
export function getProductsByCategoryResult(category, options = {}) {
  const normalizedCategory = normalizeValue(category);

  if (!normalizedCategory) {
    return createFailure(
      'INVALID_CATEGORY',
      'A product category is required.',
    );
  }

  return createSuccess(getProductsByCategory(normalizedCategory, options));
}

export const productService = Object.freeze({
  getProductById,
  getProductCategories,
  getProductDetails,
  getProductResult,
  getProducts,
  getProductsByCategory,
  getProductsByCategoryResult,
  listProducts,
  listProductsByCategory,
});

export default productService;