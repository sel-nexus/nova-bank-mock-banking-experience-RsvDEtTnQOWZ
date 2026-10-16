import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import { productService } from '../domain/productService.js';
import { useAppContext } from '../state/AppProvider.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { StatusBadge } from '../components/shared/StatusBadge.jsx';
import { safeDisplay } from '../utils/formatters.js';

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

function getProductCategory(product) {
  const category = normalizeText(product?.category);

  if (category) {
    return category;
  }

  return getProductTypeLabel(product?.type);
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

function getProductIcon(product) {
  const icon = normalizeText(product?.icon);

  if (icon === 'wallet') {
    return '▣';
  }

  if (icon === 'trending-up') {
    return '↗';
  }

  if (icon === 'credit-card') {
    return '▤';
  }

  if (icon === 'home') {
    return '⌂';
  }

  return icon || '+';
}

function getProductId(productId, routeProductId) {
  return normalizeText(productId || routeProductId);
}

/**
 * Renders synthetic product details, eligibility information, benefits, and a
 * support-oriented action without presenting an application flow.
 *
 * @param {{
 *   productId?: string,
 *   product?: Object,
 *   onContact?: Function,
 *   onAction?: Function,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function ProductDetailPage({
  productId: providedProductId = '',
  product: providedProduct,
  onContact,
  onAction,
  className = '',
}) {
  const navigate = useNavigate();
  const { productId: routeProductId } = useParams();
  const { persona } = useAppContext();
  const [loadError, setLoadError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const productId = getProductId(providedProductId, routeProductId);
  const product = useMemo(() => {
    if (providedProduct !== undefined) {
      return providedProduct || null;
    }

    if (!productId) {
      return null;
    }

    try {
      setLoadError('');
      return productService.getProductById(productId);
    } catch {
      setLoadError('The product details could not be loaded right now.');
      return null;
    }
  }, [productId, providedProduct]);

  const benefits = Array.isArray(product?.benefits)
    ? product.benefits.filter(Boolean)
    : [];
  const isAvailable = product?.available !== false;
  const productValue = getProductValue(product);

  const handleContact = () => {
    setActionMessage('');

    try {
      if (typeof onContact === 'function') {
        onContact(product);
        setActionMessage(
          'Your product question was noted locally. No application was submitted.',
        );
        return;
      }

      if (typeof onAction === 'function') {
        onAction(product);
        setActionMessage(
          'Your product question was noted locally. No application was submitted.',
        );
        return;
      }

      navigate(
        `${ROUTES.help}?topic=${encodeURIComponent(
          product?.name || 'product',
        )}`,
      );
    } catch {
      setActionMessage(
        'Product support is unavailable right now. Please try again.',
      );
    }
  };

  if (!product) {
    return (
      <div
        className={['page-container', className].filter(Boolean).join(' ')}
        data-testid="product-detail-page"
      >
        <div className="mb-6">
          <NavLink
            to={ROUTES.accounts}
            className="text-sm font-semibold text-nova-blue underline-offset-2 hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            ← Back to products
          </NavLink>
        </div>

        {loadError ? (
          <section
            role="alert"
            className="surface-card px-6 py-10 text-center sm:px-8"
          >
            <h1 className="text-2xl font-bold text-nova-midnight">
              Product details unavailable
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-nova-slate sm:text-base">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-nova-navy px-5 py-3 font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
            >
              Try again
            </button>
          </section>
        ) : (
          <EmptyState
            title="Product not found"
            description="The requested synthetic product could not be found in the Nova Bank catalogue."
            icon="!"
            action={{
              label: 'Back to products',
              onClick: () => navigate(ROUTES.accounts),
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={['page-container', className].filter(Boolean).join(' ')}
      data-testid="product-detail-page"
    >
      <div className="mb-6">
        <NavLink
          to={ROUTES.accounts}
          className="text-sm font-semibold text-nova-blue underline-offset-2 hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
        >
          ← Back to products
        </NavLink>
      </div>

      <header className="page-header mb-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            {getProductCategory(product)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-nova-midnight sm:text-4xl">
              {safeDisplay(product.name, 'Nova Bank product')}
            </h1>
            <StatusBadge
              status={isAvailable ? 'active' : 'unavailable'}
              label={isAvailable ? 'Available' : 'Unavailable'}
            />
          </div>
          <p className="mt-2 text-base text-nova-slate">
            {getProductTypeLabel(product.type)}
          </p>
        </div>
      </header>

      <section
        aria-labelledby="product-overview-title"
        className="mb-8 overflow-hidden rounded-card bg-nova-navy p-6 text-white shadow-elevated sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-nova-lime text-2xl font-bold text-nova-midnight"
            >
              {getProductIcon(product)}
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FEF4C8]">
                Product overview
              </p>
              <h2
                id="product-overview-title"
                className="mt-2 text-2xl font-bold sm:text-3xl"
              >
                {safeDisplay(product.name, 'Nova Bank product')}
              </h2>
            </div>
          </div>

          {productValue && (
            <span className="shrink-0 rounded-full bg-nova-gold px-3 py-1.5 text-sm font-bold text-nova-midnight">
              {productValue}
            </span>
          )}
        </div>

        <p className="mt-6 max-w-3xl text-base leading-7 text-white/90">
          {safeDisplay(
            product.description,
            'Explore this synthetic Nova Bank product to learn more.',
          )}
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="space-y-8">
          <section
            aria-labelledby="product-benefits-title"
            className="surface-card p-5 sm:p-6"
          >
            <h2
              id="product-benefits-title"
              className="text-2xl font-bold text-nova-midnight"
            >
              Benefits and features
            </h2>

            {benefits.length > 0 ? (
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit, index) => (
                  <li
                    key={`${product.id || 'product'}-benefit-${index}`}
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
            ) : (
              <p className="mt-4 text-sm text-nova-slate">
                Product feature details are not available for this item yet.
              </p>
            )}
          </section>

          <section
            aria-labelledby="product-eligibility-title"
            className="surface-card p-5 sm:p-6"
          >
            <h2
              id="product-eligibility-title"
              className="text-2xl font-bold text-nova-midnight"
            >
              Eligibility
            </h2>
            <div className="mt-4 rounded-lg bg-nova-cream p-4">
              <p className="font-semibold text-nova-midnight">
                {isAvailable
                  ? persona?.firstName
                    ? `${persona.firstName}, this product is available to explore.`
                    : 'This product is available to explore.'
                  : 'This product is not currently available.'}
              </p>
              <p className="mt-2 text-sm leading-6 text-nova-slate">
                Availability shown here is specific to this synthetic
                demonstration. It does not represent a credit decision,
                account approval, or real-world eligibility determination.
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section
            aria-labelledby="product-action-title"
            className="surface-card p-5 sm:p-6"
          >
            <h2
              id="product-action-title"
              className="text-xl font-bold text-nova-midnight"
            >
              Have a question?
            </h2>
            <p className="mt-3 text-sm leading-6 text-nova-slate">
              Explore support resources to learn more about this synthetic
              product. No application or real account action is started here.
            </p>

            {actionMessage && (
              <p
                role="status"
                className="mt-4 rounded-lg border border-nova-teal/30 bg-nova-mint px-3 py-2 text-sm text-nova-ink"
              >
                {actionMessage}
              </p>
            )}

            <button
              type="button"
              onClick={handleContact}
              className="mt-5 min-h-11 w-full rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
            >
              Ask about this product
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

ProductDetailPage.propTypes = {
  productId: PropTypes.string,
  product: PropTypes.object,
  onContact: PropTypes.func,
  onAction: PropTypes.func,
  className: PropTypes.string,
};

export { ProductDetailPage };
export default ProductDetailPage;
