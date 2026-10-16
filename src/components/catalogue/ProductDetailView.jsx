import React from 'react';
import PropTypes from 'prop-types';
import { StatusBadge } from '../shared/StatusBadge.jsx';
import { safeDisplay } from '../../utils/formatters.js';

function normalizeText(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

function getProductTypeLabel(type) {
  const normalizedType = normalizeText(type);

  if (!normalizedType) {
    return 'Product';
  }

  return normalizedType
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getProductCategory(product, providedCategory) {
  const category = normalizeText(
    providedCategory || product?.category,
  );

  return category || getProductTypeLabel(product?.type);
}

function getProductValue(product) {
  if (product?.interestRate !== undefined) {
    return `${product.interestRate}% APY`;
  }

  if (product?.annualFee !== undefined) {
    return product.annualFee === 0
      ? 'No annual fee'
      : `${product.annualFee} annual fee`;
  }

  return '';
}

function getBenefits(product, providedBenefits) {
  if (Array.isArray(providedBenefits) && providedBenefits.length > 0) {
    return providedBenefits.filter(Boolean);
  }

  if (Array.isArray(product?.benefits) && product.benefits.length > 0) {
    return product.benefits.filter(Boolean);
  }

  return [
    'Review the product details and simulated features.',
    'Explore how this product may fit your demonstration goals.',
    'Learn more without submitting a real application.',
  ];
}

function getEligibility(product, providedEligibility) {
  if (typeof providedEligibility === 'boolean') {
    return providedEligibility;
  }

  if (typeof product?.eligible === 'boolean') {
    return product.eligible;
  }

  if (typeof product?.isEligible === 'boolean') {
    return product.isEligible;
  }

  if (typeof product?.available === 'boolean') {
    return product.available;
  }

  return true;
}

/**
 * Renders synthetic product details, benefits, eligibility information, and a
 * non-application Learn More action.
 *
 * @param {{
 *   product?: Object,
 *   productData?: Object,
 *   category?: string,
 *   benefits?: Array,
 *   eligible?: boolean,
 *   isEligible?: boolean,
 *   onLearnMore?: Function,
 *   onLearnMoreClick?: Function,
 *   learnMoreLabel?: string,
 *   className?: string,
 *   compact?: boolean
 * }} props
 * @returns {JSX.Element}
 */
function ProductDetailView({
  product,
  productData,
  category,
  benefits,
  eligible,
  isEligible,
  onLearnMore,
  onLearnMoreClick,
  learnMoreLabel,
  className,
  compact,
}) {
  const catalogueProduct = product || productData || {};
  const productName = safeDisplay(
    catalogueProduct.name || catalogueProduct.title,
    'Nova Bank product',
  );
  const productCategory = getProductCategory(catalogueProduct, category);
  const productType = getProductTypeLabel(catalogueProduct.type);
  const productValue = getProductValue(catalogueProduct);
  const productBenefits = getBenefits(catalogueProduct, benefits);
  const productEligibility = getEligibility(
    catalogueProduct,
    eligible !== undefined ? eligible : isEligible,
  );
  const isAvailable = catalogueProduct.available !== false;
  const detailHandler = onLearnMore || onLearnMoreClick;

  const handleLearnMore = () => {
    detailHandler?.(catalogueProduct);
  };

  return (
    <section
      aria-labelledby="product-detail-view-title"
      className={[
        'surface-card overflow-hidden',
        compact ? 'p-5' : 'p-5 sm:p-8',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="product-detail-view"
    >
      <header className="flex flex-col gap-5 border-b border-nova-slate/20 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            {productCategory}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2
              id="product-detail-view-title"
              className="text-2xl font-bold text-nova-midnight sm:text-3xl"
            >
              {productName}
            </h2>
            <StatusBadge
              status={isAvailable ? 'active' : 'unavailable'}
              label={isAvailable ? 'Available' : 'Unavailable'}
            />
          </div>
          <p className="mt-2 text-sm text-nova-slate">{productType}</p>
        </div>

        {productValue && (
          <span className="shrink-0 rounded-full bg-nova-gold/30 px-3 py-1.5 text-sm font-bold text-nova-ink">
            {productValue}
          </span>
        )}
      </header>

      <p className="mt-6 text-base leading-7 text-nova-ink">
        {safeDisplay(
          catalogueProduct.description || catalogueProduct.summary,
          'Explore this synthetic Nova Bank product to learn more.',
        )}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)]">
        <section aria-labelledby="product-benefits-title">
          <h3
            id="product-benefits-title"
            className="text-xl font-bold text-nova-midnight"
          >
            Benefits and features
          </h3>

          <ul className="mt-4 space-y-3">
            {productBenefits.map((benefit, index) => (
              <li
                key={`${catalogueProduct.id || 'product'}-benefit-${index}`}
                className="flex items-start gap-3 rounded-lg bg-nova-sky/50 p-4 text-sm text-nova-ink"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nova-mint font-bold text-nova-teal"
                >
                  ✓
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <section
            aria-labelledby="product-eligibility-title"
            className="rounded-lg bg-nova-cream p-4"
          >
            <h3
              id="product-eligibility-title"
              className="text-lg font-bold text-nova-midnight"
            >
              Eligibility
            </h3>
            <p className="mt-3 text-sm font-semibold text-nova-midnight">
              {productEligibility && isAvailable
                ? 'This product is available to explore.'
                : 'This product is not currently available.'}
            </p>
            <p className="mt-2 text-sm leading-6 text-nova-slate">
              Eligibility and availability are simulated for this demonstration.
              They do not represent a credit decision, approval, or real-world
              financial determination.
            </p>
          </section>

          <button
            type="button"
            onClick={handleLearnMore}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
          >
            {learnMoreLabel}
          </button>
        </aside>
      </div>

      <p className="mt-6 rounded-lg bg-nova-sky/70 px-4 py-3 text-sm leading-6 text-nova-slate">
        Learn more about this synthetic product without starting an application.
        No real account is opened, no financial action is taken, and no
        application is submitted.
      </p>
    </section>
  );
}

ProductDetailView.propTypes = {
  product: PropTypes.object,
  productData: PropTypes.object,
  category: PropTypes.string,
  benefits: PropTypes.arrayOf(PropTypes.node),
  eligible: PropTypes.bool,
  isEligible: PropTypes.bool,
  onLearnMore: PropTypes.func,
  onLearnMoreClick: PropTypes.func,
  learnMoreLabel: PropTypes.string,
  className: PropTypes.string,
  compact: PropTypes.bool,
};

ProductDetailView.defaultProps = {
  product: undefined,
  productData: undefined,
  category: '',
  benefits: undefined,
  eligible: undefined,
  isEligible: undefined,
  onLearnMore: undefined,
  onLearnMoreClick: undefined,
  learnMoreLabel: 'Learn more',
  className: '',
  compact: false,
};

export { ProductDetailView };
export default ProductDetailView;