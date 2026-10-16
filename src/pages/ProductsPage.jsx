import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import { productService } from '../domain/productService.js';
import { useAppContext } from '../state/AppProvider.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { safeDisplay } from '../utils/formatters.js';

const CATEGORY_ORDER = Object.freeze([
  'Savings',
  'Cards',
  'Loans',
  'Insurance',
  'Other products',
]);

const CATEGORY_STYLES = Object.freeze({
  Savings: {
    icon: '↗',
    description: 'Build your savings and prepare for the goals ahead.',
    accent: 'bg-nova-mint text-nova-teal',
  },
  Cards: {
    icon: '▣',
    description: 'Explore flexible cards for everyday spending and rewards.',
    accent: 'bg-nova-sky text-nova-blue',
  },
  Loans: {
    icon: '$',
    description: 'Consider lending options for your next major milestone.',
    accent: 'bg-nova-gold/30 text-nova-ink',
  },
  Insurance: {
    icon: '◇',
    description: 'Review protection options for the things that matter.',
    accent: 'bg-nova-coral/20 text-nova-midnight',
  },
  'Other products': {
    icon: '+',
    description: 'Explore other products available in the Nova Bank catalogue.',
    accent: 'bg-nova-sky text-nova-blue',
  },
});

function normalizeText(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

function getProductCategory(product) {
  const category = normalizeText(product?.category).toLowerCase();
  const type = normalizeText(product?.type).toLowerCase();

  if (category.includes('saving') || type === 'savings') {
    return 'Savings';
  }

  if (
    category.includes('card') ||
    type === 'credit' ||
    type === 'card'
  ) {
    return 'Cards';
  }

  if (
    category.includes('lend') ||
    category.includes('loan') ||
    type === 'loan'
  ) {
    return 'Loans';
  }

  if (category.includes('insur') || type === 'insurance') {
    return 'Insurance';
  }

  return 'Other products';
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

function getProductRoute(product) {
  if (typeof product?.route === 'string' && product.route.trim()) {
    return product.route;
  }

  return `${ROUTES.accounts}?product=${encodeURIComponent(product?.id || '')}`;
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

function getProductIcon(product, category) {
  const icon = normalizeText(product?.icon);

  if (icon) {
    return icon === 'wallet'
      ? '▣'
      : icon === 'trending-up'
        ? '↗'
        : icon === 'credit-card'
          ? '▤'
          : icon === 'home'
            ? '⌂'
            : icon;
  }

  return CATEGORY_STYLES[category]?.icon || '+';
}

function ProductCard({ product, onLearnMore, compact = false }) {
  const category = getProductCategory(product);
  const categoryStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES['Other products'];
  const productValue = getProductValue(product);
  const benefits = Array.isArray(product?.benefits)
    ? product.benefits.filter(Boolean).slice(0, compact ? 2 : 3)
    : [];

  return (
    <article className="surface-card flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-nova-blue/40 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div
          aria-hidden="true"
          className={[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold',
            categoryStyle.accent,
          ].join(' ')}
        >
          {getProductIcon(product, category)}
        </div>

        {productValue && (
          <span className="rounded-full bg-nova-gold/25 px-3 py-1 text-xs font-bold text-nova-ink">
            {productValue}
          </span>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-nova-blue">
          {getProductTypeLabel(product?.type)}
        </p>
        <h3 className="mt-1 text-xl font-bold text-nova-midnight">
          {safeDisplay(product?.name, 'Nova Bank product')}
        </h3>
        <p className="mt-3 text-sm leading-6 text-nova-slate">
          {safeDisplay(
            product?.description,
            'Explore this synthetic Nova Bank product to learn more.',
          )}
        </p>
      </div>

      {benefits.length > 0 && (
        <ul className="mt-5 space-y-2 text-sm text-nova-ink">
          {benefits.map((benefit, index) => (
            <li key={`${product?.id || 'product'}-benefit-${index}`} className="flex gap-2">
              <span aria-hidden="true" className="font-bold text-nova-teal">
                ✓
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-6">
        <NavLink
          to={getProductRoute(product)}
          onClick={() => onLearnMore?.(product)}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
        >
          Learn more
        </NavLink>
      </div>
    </article>
  );
}

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  onLearnMore: PropTypes.func,
  compact: PropTypes.bool,
};

/**
 * Renders the categorized Nova Bank Demo product catalogue.
 *
 * @param {{
 *   products?: Object[],
 *   recommendations?: Object[],
 *   category?: string,
 *   onLearnMore?: Function,
 *   onProductSelect?: Function,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function ProductsPage({
  products: providedProducts,
  recommendations: providedRecommendations,
  category: providedCategory = 'All',
  onLearnMore,
  onProductSelect,
  className = '',
}) {
  const navigate = useNavigate();
  const { persona } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState(providedCategory || 'All');
  const [loadError, setLoadError] = useState('');

  const products = useMemo(() => {
    if (Array.isArray(providedProducts)) {
      return providedProducts;
    }

    try {
      setLoadError('');
      return productService.getProducts({ available: true });
    } catch {
      setLoadError('The product catalogue could not be loaded right now.');
      return [];
    }
  }, [providedProducts]);

  const availableProducts = useMemo(
    () => products.filter((product) => product?.available !== false),
    [products],
  );

  const categories = useMemo(() => {
    const productCategories = availableProducts.map(getProductCategory);
    return [
      'All',
      ...CATEGORY_ORDER.filter((category) => productCategories.includes(category)),
    ];
  }, [availableProducts]);

  const filteredProducts = useMemo(
    () =>
      selectedCategory === 'All'
        ? availableProducts
        : availableProducts.filter(
            (product) => getProductCategory(product) === selectedCategory,
          ),
    [availableProducts, selectedCategory],
  );

  const groupedProducts = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        products: filteredProducts.filter(
          (product) => getProductCategory(product) === category,
        ),
      })).filter((group) => group.products.length > 0),
    [filteredProducts],
  );

  const recommendations = useMemo(() => {
    if (Array.isArray(providedRecommendations)) {
      return providedRecommendations.filter(
        (product) => product?.available !== false,
      );
    }

    return availableProducts
      .filter((product) => product?.recommended === true)
      .slice(0, 3);
  }, [availableProducts, providedRecommendations]);

  const handleLearnMore = (product) => {
    onLearnMore?.(product);
    onProductSelect?.(product);

    if (!onLearnMore && !onProductSelect) {
      navigate(getProductRoute(product));
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  return (
    <div
      className={['page-container', className].filter(Boolean).join(' ')}
      data-testid="products-page"
    >
      <header className="page-header mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            Product catalogue
          </p>
          <h1 className="mt-2 text-3xl font-bold text-nova-midnight sm:text-4xl">
            Find what fits your goals
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-nova-navy">
            You are exploring the catalogue as a Prospective Product Customer.
          </p>
          <p className="mt-2 max-w-2xl text-base text-nova-slate">
            Explore synthetic savings, cards, loans, and insurance products
            designed for this demonstration.
          </p>
        </div>

        <NavLink
          to={ROUTES.dashboard}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
        >
          Back to dashboard
        </NavLink>
      </header>

      {loadError && (
        <section
          role="alert"
          className="surface-card mb-8 border-nova-coral/40 bg-nova-coral/10 px-5 py-4 text-sm text-nova-midnight"
        >
          {loadError}
        </section>
      )}

      {recommendations.length > 0 && (
        <section aria-labelledby="recommended-products-title" className="mb-10">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-teal">
              {persona?.firstName ? `For you, ${persona.firstName}` : 'Explore next'}
            </p>
            <h2
              id="recommended-products-title"
              className="mt-1 text-2xl font-bold text-nova-midnight"
            >
              Recommended products
            </h2>
            <p className="mt-1 text-sm text-nova-slate">
              Options that may complement your synthetic banking relationship.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 3).map((product) => (
              <ProductCard
                key={`recommended-${product.id}`}
                product={product}
                onLearnMore={handleLearnMore}
                compact
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="all-products-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="all-products-title"
              className="text-2xl font-bold text-nova-midnight"
            >
              All products
            </h2>
            <p className="mt-1 text-sm text-nova-slate">
              Browse the catalogue by product category.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <label
              htmlFor="products-category"
              className="mb-1.5 block text-sm font-semibold text-nova-midnight"
            >
              Category
            </label>
            <select
              id="products-category"
              value={categories.includes(selectedCategory) ? selectedCategory : 'All'}
              onChange={handleCategoryChange}
              className="min-h-11 w-full rounded-lg border border-[#E9E9E9] bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-navy focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'All' ? 'All categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {groupedProducts.length > 0 ? (
          <div className="space-y-10">
            {groupedProducts.map(({ category, products: categoryProducts }) => {
              const categoryStyle =
                CATEGORY_STYLES[category] || CATEGORY_STYLES['Other products'];

              return (
                <section
                  key={category}
                  aria-labelledby={`products-category-${category
                    .toLowerCase()
                    .replace(/\s+/g, '-')}`}
                >
                  <div className="mb-4 flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={[
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold',
                        categoryStyle.accent,
                      ].join(' ')}
                    >
                      {categoryStyle.icon}
                    </span>
                    <div>
                      <h3
                        id={`products-category-${category
                          .toLowerCase()
                          .replace(/\s+/g, '-')}`}
                        className="text-xl font-bold text-nova-midnight"
                      >
                        {category}
                      </h3>
                      <p className="mt-1 text-sm text-nova-slate">
                        {categoryStyle.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onLearnMore={handleLearnMore}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No products found"
            description={
              selectedCategory === 'All'
                ? 'There are no available products in the synthetic catalogue right now.'
                : `There are no available products in the ${selectedCategory.toLowerCase()} category.`
            }
            icon="—"
            compact
            action={
              selectedCategory !== 'All'
                ? {
                    label: 'View all products',
                    onClick: () => setSelectedCategory('All'),
                  }
                : undefined
            }
          />
        )}
      </section>

    </div>
  );
}

ProductsPage.propTypes = {
  products: PropTypes.arrayOf(PropTypes.object),
  recommendations: PropTypes.arrayOf(PropTypes.object),
  category: PropTypes.string,
  onLearnMore: PropTypes.func,
  onProductSelect: PropTypes.func,
  className: PropTypes.string,
};

export { ProductsPage };
export default ProductsPage;
