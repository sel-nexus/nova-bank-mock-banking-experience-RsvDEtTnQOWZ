import React, { useEffect, useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function normalizeOption(option) {
  if (isObject(option)) {
    const value = normalizeText(option.value ?? option.id ?? option.key);
    const label = normalizeText(option.label ?? option.name ?? value);

    return {
      value,
      label: label || value,
    };
  }

  const value = normalizeText(option);

  return {
    value,
    label: value,
  };
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map(normalizeOption)
    .filter((option) => option.value);
}

function getFilterSource(filters, value, initialFilters) {
  if (isObject(filters)) {
    return filters;
  }

  if (isObject(value)) {
    return value;
  }

  if (isObject(initialFilters)) {
    return initialFilters;
  }

  return {};
}

function normalizeFilters(source) {
  return {
    search: normalizeText(source.search ?? source.query),
    startDate: normalizeText(source.startDate ?? source.dateFrom),
    endDate: normalizeText(source.endDate ?? source.dateTo),
    type: normalizeText(source.type),
    category: normalizeText(source.category),
    sortBy: normalizeText(source.sortBy ?? source.sortField),
    sortOrder: normalizeText(source.sortOrder ?? source.order) || 'desc',
  };
}

function getFilterLabel(field, value, options, fallback) {
  const option = options.find((item) => item.value === value);

  return option?.label || value || fallback;
}

function getSummaryItems(filters, typeOptions, categoryOptions, sortOptions) {
  const summaryItems = [];

  if (filters.search) {
    summaryItems.push(`Search: ${filters.search}`);
  }

  if (filters.startDate) {
    summaryItems.push(`From: ${filters.startDate}`);
  }

  if (filters.endDate) {
    summaryItems.push(`To: ${filters.endDate}`);
  }

  if (filters.type) {
    summaryItems.push(
      `Type: ${getFilterLabel(
        'type',
        filters.type,
        typeOptions,
        filters.type,
      )}`,
    );
  }

  if (filters.category) {
    summaryItems.push(
      `Category: ${getFilterLabel(
        'category',
        filters.category,
        categoryOptions,
        filters.category,
      )}`,
    );
  }

  if (filters.sortBy) {
    const sortLabel = getFilterLabel(
      'sortBy',
      filters.sortBy,
      sortOptions,
      filters.sortBy,
    );
    const orderLabel = filters.sortOrder === 'asc' ? 'ascending' : 'descending';
    summaryItems.push(`Sort: ${sortLabel} (${orderLabel})`);
  }

  return summaryItems;
}

/**
 * Renders filter and sorting controls for synthetic transaction activity.
 *
 * @param {{
 *   filters?: Object,
 *   value?: Object,
 *   initialFilters?: Object,
 *   search?: string,
 *   query?: string,
 *   startDate?: string,
 *   endDate?: string,
 *   dateFrom?: string,
 *   dateTo?: string,
 *   type?: string,
 *   category?: string,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   types?: Array,
 *   typeOptions?: Array,
 *   categories?: Array,
 *   categoryOptions?: Array,
 *   sortOptions?: Array,
 *   showSearch?: boolean,
 *   showDateRange?: boolean,
 *   showType?: boolean,
 *   showCategory?: boolean,
 *   showSort?: boolean,
 *   showReset?: boolean,
 *   onChange?: Function,
 *   onFilterChange?: Function,
 *   onSearchChange?: Function,
 *   onStartDateChange?: Function,
 *   onEndDateChange?: Function,
 *   onTypeChange?: Function,
 *   onCategoryChange?: Function,
 *   onSortChange?: Function,
 *   onReset?: Function,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function TransactionEnquiry({
  filters,
  value,
  initialFilters,
  search = '',
  query = '',
  startDate = '',
  endDate = '',
  dateFrom = '',
  dateTo = '',
  type = '',
  category = '',
  sortBy = '',
  sortOrder = 'desc',
  types = [],
  typeOptions,
  categories = [],
  categoryOptions,
  sortOptions = [],
  showSearch = true,
  showDateRange = true,
  showType = true,
  showCategory = true,
  showSort = true,
  showReset = true,
  onChange,
  onFilterChange,
  onSearchChange,
  onStartDateChange,
  onEndDateChange,
  onTypeChange,
  onCategoryChange,
  onSortChange,
  onReset,
  className = '',
}) {
  const searchId = useId();
  const startDateId = useId();
  const endDateId = useId();
  const typeId = useId();
  const categoryId = useId();
  const sortId = useId();
  const summaryId = useId();

  const hasExternalFilters =
    isObject(filters) || isObject(value) || isObject(initialFilters);

  const externalSource = getFilterSource(filters, value, initialFilters);
  const propFilters = normalizeFilters({
    ...externalSource,
    search: externalSource.search ?? externalSource.query ?? search ?? query,
    startDate:
      externalSource.startDate ??
      externalSource.dateFrom ??
      startDate ??
      dateFrom,
    endDate:
      externalSource.endDate ?? externalSource.dateTo ?? endDate ?? dateTo,
    type: externalSource.type ?? type,
    category: externalSource.category ?? category,
    sortBy: externalSource.sortBy ?? externalSource.sortField ?? sortBy,
    sortOrder: externalSource.sortOrder ?? externalSource.order ?? sortOrder,
  });

  const [localFilters, setLocalFilters] = useState(propFilters);

  useEffect(() => {
    if (hasExternalFilters) {
      setLocalFilters(propFilters);
    }
  }, [hasExternalFilters, propFilters]);

  const currentFilters = hasExternalFilters ? propFilters : localFilters;
  const normalizedTypes = useMemo(
    () => normalizeOptions(typeOptions || types),
    [typeOptions, types],
  );
  const normalizedCategories = useMemo(
    () => normalizeOptions(categoryOptions || categories),
    [categoryOptions, categories],
  );
  const normalizedSortOptions = useMemo(
    () => normalizeOptions(sortOptions),
    [sortOptions],
  );

  const summaryItems = useMemo(
    () =>
      getSummaryItems(
        currentFilters,
        normalizedTypes,
        normalizedCategories,
        normalizedSortOptions,
      ),
    [
      currentFilters,
      normalizedCategories,
      normalizedSortOptions,
      normalizedTypes,
    ],
  );

  const emitChange = (field, nextValue, event) => {
    const nextFilters = {
      ...currentFilters,
      [field]: nextValue,
    };

    if (!hasExternalFilters) {
      setLocalFilters(nextFilters);
    }

    onChange?.(nextFilters, event);
    onFilterChange?.(nextFilters, event);

    if (field === 'search') {
      onSearchChange?.(nextValue, nextFilters, event);
    }

    if (field === 'startDate') {
      onStartDateChange?.(nextValue, nextFilters, event);
    }

    if (field === 'endDate') {
      onEndDateChange?.(nextValue, nextFilters, event);
    }

    if (field === 'type') {
      onTypeChange?.(nextValue, nextFilters, event);
    }

    if (field === 'category') {
      onCategoryChange?.(nextValue, nextFilters, event);
    }

    if (field === 'sortBy' || field === 'sortOrder') {
      onSortChange?.(nextValue, nextFilters, event);
    }
  };

  const handleSortChange = (event) => {
    const nextValue = event.target.value;
    const selectedOption = normalizedSortOptions.find(
      (option) => option.value === nextValue,
    );

    if (selectedOption) {
      emitChange('sortBy', nextValue, event);
      return;
    }

    const [nextSortBy, nextSortOrder = 'desc'] = nextValue.split(':');
    emitChange('sortBy', nextSortBy, event);
    emitChange('sortOrder', nextSortOrder, event);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      startDate: '',
      endDate: '',
      type: '',
      category: '',
      sortBy: '',
      sortOrder: 'desc',
    };

    if (!hasExternalFilters) {
      setLocalFilters(resetFilters);
    }

    onChange?.(resetFilters);
    onFilterChange?.(resetFilters);
    onReset?.(resetFilters);
  };

  const hasActiveFilters = summaryItems.length > 0;
  const controlClassName =
    'min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20';

  return (
    <section
      aria-label="Transaction filters"
      className={['surface-card w-full p-4 sm:p-5', className]
        .filter(Boolean)
        .join(' ')}
      data-testid="transaction-enquiry"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-nova-blue">
            Transaction enquiry
          </p>
          <h2 className="mt-1 text-xl font-bold text-nova-midnight sm:text-2xl">
            Find transactions
          </h2>
          <p className="mt-1 text-sm text-nova-slate">
            Search and refine your synthetic transaction activity.
          </p>
        </div>

        {showReset && (
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="min-h-10 rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showSearch && (
          <div className="sm:col-span-2">
            <label
              htmlFor={searchId}
              className="mb-1.5 block text-sm font-semibold text-nova-midnight"
            >
              Merchant or reference
            </label>
            <input
              id={searchId}
              type="search"
              value={currentFilters.search}
              onChange={(event) =>
                emitChange('search', event.target.value, event)
              }
              placeholder="Search merchant or reference"
              autoComplete="off"
              className={controlClassName}
            />
          </div>
        )}

        {showDateRange && (
          <>
            <div>
              <label
                htmlFor={startDateId}
                className="mb-1.5 block text-sm font-semibold text-nova-midnight"
              >
                From date
              </label>
              <input
                id={startDateId}
                type="date"
                value={currentFilters.startDate}
                onChange={(event) =>
                  emitChange('startDate', event.target.value, event)
                }
                className={controlClassName}
              />
            </div>

            <div>
              <label
                htmlFor={endDateId}
                className="mb-1.5 block text-sm font-semibold text-nova-midnight"
              >
                To date
              </label>
              <input
                id={endDateId}
                type="date"
                value={currentFilters.endDate}
                onChange={(event) =>
                  emitChange('endDate', event.target.value, event)
                }
                className={controlClassName}
              />
            </div>
          </>
        )}

        {showType && (
          <div>
            <label
              htmlFor={typeId}
              className="mb-1.5 block text-sm font-semibold text-nova-midnight"
            >
              Transaction type
            </label>
            <select
              id={typeId}
              value={currentFilters.type}
              onChange={(event) =>
                emitChange('type', event.target.value, event)
              }
              className={controlClassName}
            >
              <option value="">All types</option>
              {normalizedTypes.map((option) => (
                <option key={`transaction-type-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showCategory && (
          <div>
            <label
              htmlFor={categoryId}
              className="mb-1.5 block text-sm font-semibold text-nova-midnight"
            >
              Category
            </label>
            <select
              id={categoryId}
              value={currentFilters.category}
              onChange={(event) =>
                emitChange('category', event.target.value, event)
              }
              className={controlClassName}
            >
              <option value="">All categories</option>
              {normalizedCategories.map((option) => (
                <option
                  key={`transaction-category-${option.value}`}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showSort && (
          <div>
            <label
              htmlFor={sortId}
              className="mb-1.5 block text-sm font-semibold text-nova-midnight"
            >
              Sort by
            </label>
            <select
              id={sortId}
              value={
                normalizedSortOptions.length > 0
                  ? currentFilters.sortBy
                  : `${currentFilters.sortBy}:${currentFilters.sortOrder}`
              }
              onChange={handleSortChange}
              className={controlClassName}
            >
              <option value="">Sort by</option>
              {normalizedSortOptions.length > 0
                ? normalizedSortOptions.map((option) => (
                    <option key={`transaction-sort-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))
                : [
                    ['date:desc', 'Newest first'],
                    ['date:asc', 'Oldest first'],
                    ['amount:desc', 'Highest amount'],
                    ['amount:asc', 'Lowest amount'],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
            </select>
          </div>
        )}
      </div>

      <div
        aria-labelledby={summaryId}
        className="mt-5 rounded-lg bg-nova-sky/50 px-4 py-3"
        data-testid="transaction-filter-summary"
      >
        <h3
          id={summaryId}
          className="text-sm font-semibold text-nova-midnight"
        >
          Current filters
        </h3>
        {hasActiveFilters ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {summaryItems.map((item) => (
              <li
                key={item}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-nova-ink"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-nova-slate">
            No filters applied. Showing all transactions.
          </p>
        )}
      </div>
    </section>
  );
}

TransactionEnquiry.propTypes = {
  filters: PropTypes.object,
  value: PropTypes.object,
  initialFilters: PropTypes.object,
  search: PropTypes.string,
  query: PropTypes.string,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  dateFrom: PropTypes.string,
  dateTo: PropTypes.string,
  type: PropTypes.string,
  category: PropTypes.string,
  sortBy: PropTypes.string,
  sortOrder: PropTypes.string,
  types: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ),
  typeOptions: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ),
  categories: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ),
  categoryOptions: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ),
  sortOptions: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ),
  showSearch: PropTypes.bool,
  showDateRange: PropTypes.bool,
  showType: PropTypes.bool,
  showCategory: PropTypes.bool,
  showSort: PropTypes.bool,
  showReset: PropTypes.bool,
  onChange: PropTypes.func,
  onFilterChange: PropTypes.func,
  onSearchChange: PropTypes.func,
  onStartDateChange: PropTypes.func,
  onEndDateChange: PropTypes.func,
  onTypeChange: PropTypes.func,
  onCategoryChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onReset: PropTypes.func,
  className: PropTypes.string,
};

export { TransactionEnquiry };
export default TransactionEnquiry;
