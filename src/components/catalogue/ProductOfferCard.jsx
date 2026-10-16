import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../config/constants.js';
import { StatusBadge } from '../shared/StatusBadge.jsx';
import {
  formatCurrency,
  formatDate,
  safeDisplay,
} from '../../utils/formatters.js';

function normalizeText(value) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

function getItemId(item) {
  return item?.id || item?.productId || item?.offerId || '';
}

function getItemType(item, providedType) {
  const normalizedType = normalizeText(providedType).toLowerCase();

  if (normalizedType === 'offer' || normalizedType === 'product') {
    return normalizedType;
  }

  if (
    item?.offerId ||
    item?.title ||
    item?.validFrom ||
    item?.validUntil ||
    item?.percentage !== undefined
  ) {
    return 'offer';
  }

  return 'product';
}

function getCategory(item, providedCategory, itemType) {
  const category = normalizeText(
    providedCategory || item?.category || item?.type,
  );

  if (category) {
    return category;
  }

  return itemType === 'offer' ? 'Offer' : 'Product';
}

function getValue(item, itemType) {
  if (itemType === 'offer') {
    if (item?.amount !== undefined) {
      return formatCurrency(item.amount, item.currency || 'USD');
    }

    if (item?.percentage !== undefined) {
      return `${item.percentage}%`;
    }

    return '';
  }

  if (item?.interestRate !== undefined) {
    return `${item.interestRate}% APY`;
  }

  if (item?.annualFee !== undefined) {
    return item.annualFee === 0
      ? 'No annual fee'
      : `${formatCurrency(item.annualFee, item.currency || 'USD')} annual fee`;
  }

  return '';
}

function getDetailRoute(item, itemType, providedRoute) {
  if (typeof providedRoute === 'string' && providedRoute.trim()) {
    return providedRoute;
  }

  const itemId = getItemId(item);

  if (itemType === 'offer') {
    return itemId
      ? `${ROUTES.dashboard}?offer=${encodeURIComponent(String(itemId))}`
      : ROUTES.dashboard;
  }

  return itemId
    ? `${ROUTES.accounts}?product=${encodeURIComponent(String(itemId))}`
    : ROUTES.accounts;
}

function getValidity(item, validFrom, validUntil) {
  return {
    from: validFrom || item?.validFrom || '',
    until: validUntil || item?.validUntil || '',
  };
}

function getEligibility(item, eligibility) {
  if (typeof eligibility === 'boolean') {
    return eligibility;
  }

  if (typeof item?.eligible === 'boolean') {
    return item.eligible;
  }

  if (typeof item?.isEligible === 'boolean') {
    return item.isEligible;
  }

  const status = normalizeText(
    eligibility || item?.eligibilityStatus || item?.eligibility,
  ).toLowerCase();

  if (status) {
    return !['ineligible', 'unavailable', 'declined', 'not eligible'].includes(
      status,
    );
  }

  return null;
}

function getDescription(item) {
  return safeDisplay(
    item?.description || item?.summary,
    'Explore this synthetic catalogue item to learn more.',
  );
}

/**
 * Renders a reusable synthetic product or offer catalogue card.
 *
 * @param {{
 *   item?: Object,
 *   product?: Object,
 *   offer?: Object,
 *   type?: 'product'|'offer',
 *   category?: string,
 *   recommended?: boolean,
 *   featured?: boolean,
 *   validFrom?: string|Date|number,
 *   validUntil?: string|Date|number,
 *   eligibility?: boolean|string,
 *   detailRoute?: string,
 *   detailLabel?: string,
 *   onDetail?: Function,
 *   onDetails?: Function,
 *   onSelect?: Function,
 *   className?: string,
 *   compact?: boolean
 * }} props
 * @returns {JSX.Element}
 */
function ProductOfferCard({
  item,
  product,
  offer,
  type,
  category,
  recommended,
  featured,
  validFrom,
  validUntil,
  eligibility,
  detailRoute,
  detailLabel,
  onDetail,
  onDetails,
  onSelect,
  className,
  compact,
}) {
  const catalogueItem = item || product || offer || {};
  const itemType = getItemType(catalogueItem, type);
  const itemCategory = getCategory(catalogueItem, category, itemType);
  const itemId = getItemId(catalogueItem);
  const itemTitle = safeDisplay(
    catalogueItem.name || catalogueItem.title,
    itemType === 'offer' ? 'Nova Bank offer' : 'Nova Bank product',
  );
  const itemValue = getValue(catalogueItem, itemType);
  const validity = getValidity(catalogueItem, validFrom, validUntil);
  const itemEligibility = getEligibility(catalogueItem, eligibility);
  const isRecommended =
    recommended === true ||
    featured === true ||
    catalogueItem.recommended === true ||
    catalogueItem.isRecommended === true ||
    catalogueItem.featured === true ||
    catalogueItem.isFeatured === true;
  const detailHandler = onDetail || onDetails || onSelect;
  const route = getDetailRoute(catalogueItem, itemType, detailRoute);
  const benefits = Array.isArray(catalogueItem.benefits)
    ? catalogueItem.benefits.filter(Boolean).slice(0, compact ? 2 : 3)
    : [];

  const handleDetail = () => {
    detailHandler?.(catalogueItem);
  };

  return (
    <article
      className={[
        'surface-card flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-nova-blue/40 sm:p-6',
        isRecommended ? 'border-2 border-nova-gold/70' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="product-offer-card"
      data-item-type={itemType}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-nova-blue">
            {itemCategory}
          </p>
          <h2 className="mt-1 text-xl font-bold text-nova-midnight">
            {itemTitle}
          </h2>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {isRecommended && (
            <span className="rounded-full bg-nova-gold/30 px-3 py-1 text-xs font-bold text-nova-ink">
              Recommended
            </span>
          )}

          {itemValue && (
            <span className="rounded-full bg-nova-sky px-3 py-1 text-xs font-bold text-nova-blue">
              {itemValue}
            </span>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-nova-slate">
        {getDescription(catalogueItem)}
      </p>

      {benefits.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-nova-ink">
          {benefits.map((benefit, index) => (
            <li
              key={`${itemId || 'catalogue-item'}-benefit-${index}`}
              className="flex gap-2"
            >
              <span aria-hidden="true" className="font-bold text-nova-teal">
                ✓
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-6">
        {(validity.from || validity.until || itemEligibility !== null) && (
          <div className="mb-4 space-y-2 rounded-lg bg-nova-cream/70 p-3 text-xs text-nova-slate">
            {(validity.from || validity.until) && (
              <p>
                Valid:{' '}
                <span className="font-semibold text-nova-ink">
                  {validity.from ? formatDate(validity.from) : 'Current'}–
                  {validity.until ? formatDate(validity.until) : 'ongoing'}
                </span>
              </p>
            )}

            {itemEligibility !== null && (
              <div className="flex items-center justify-between gap-3">
                <span>Eligibility</span>
                <StatusBadge
                  status={itemEligibility ? 'active' : 'unavailable'}
                  label={itemEligibility ? 'Eligible' : 'Not eligible'}
                />
              </div>
            )}
          </div>
        )}

        <NavLink
          to={route}
          onClick={handleDetail}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-nova-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/30"
        >
          {detailLabel}
        </NavLink>
      </div>
    </article>
  );
}

ProductOfferCard.propTypes = {
  item: PropTypes.object,
  product: PropTypes.object,
  offer: PropTypes.object,
  type: PropTypes.oneOf(['product', 'offer']),
  category: PropTypes.string,
  recommended: PropTypes.bool,
  featured: PropTypes.bool,
  validFrom: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
    PropTypes.number,
  ]),
  validUntil: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
    PropTypes.number,
  ]),
  eligibility: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  detailRoute: PropTypes.string,
  detailLabel: PropTypes.string,
  onDetail: PropTypes.func,
  onDetails: PropTypes.func,
  onSelect: PropTypes.func,
  className: PropTypes.string,
  compact: PropTypes.bool,
};

ProductOfferCard.defaultProps = {
  item: undefined,
  product: undefined,
  offer: undefined,
  type: undefined,
  category: '',
  recommended: false,
  featured: false,
  validFrom: '',
  validUntil: '',
  eligibility: undefined,
  detailRoute: '',
  detailLabel: 'View details',
  onDetail: undefined,
  onDetails: undefined,
  onSelect: undefined,
  className: '',
  compact: false,
};

export { ProductOfferCard };
export default ProductOfferCard;