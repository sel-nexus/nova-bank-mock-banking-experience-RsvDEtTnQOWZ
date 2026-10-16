import React, { useCallback, useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
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

function getInputValue(value, fallback = '') {
  return value === undefined || value === null ? fallback : normalizeText(value);
}

function joinClasses(...values) {
  return values.filter(Boolean).join(' ');
}

/**
 * Renders keyboard-accessible controls for filtering and sorting a collection.
 *
 * @param {{
 *   filters?: Object,
 *   value?: Object,
 *   search?: string,
 *   query?: string,
 *   category?: string,
 *   type?: string,
 *   startDate?: string,
 *   endDate?: string,
 *   dateFrom?: string,
 *   dateTo?: string,
 *   sortBy?: string,
 *   sortOrder?: string,
 *   categories?: Array,
 *   categoryOptions?: Array,
 *   types?: Array,
 *   typeOptions?: Array,
 *   sortOptions?: Array,
 *   showCategory?: boolean,
 *   showType?: boolean,
 *   showDateRange?: boolean,
 *   showSearch?: boolean,
 *   showSort?: boolean,
 *   showReset?: boolean,
 *   onChange?: Function,
 *   onFilterChange?: Function,
 *   onSearchChange?: Function,
 *   onCategoryChange?: Function,
 *   onTypeChange?: Function,
 *   onStartDateChange?: Function,
 *   onEndDateChange?: Function,
 *   onSortChange?: Function,
 *   onReset?: Function,
 *   onSubmit?: Function,
 *   resetLabel?: string,
 *   searchLabel?: string,
 *   searchPlaceholder?: string,
 *   categoryLabel?: string,
 *   typeLabel?: string,
 *   startDateLabel?: string,
 *   endDateLabel?: string,
 *   sortLabel?: string,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function FilterBar({
  filters,
  value,
  search,
  query,
  category,
  type,
  startDate,
  endDate,
  dateFrom,
  dateTo,
  sortBy,
  sortOrder,
  categories,
  categoryOptions,
  types,
  typeOptions,
  sortOptions,
  showCategory,
  showType,
  showDateRange,
  showSearch,
  showSort,
  showReset,
  onChange,
  onFilterChange,
  onSearchChange,
  onCategoryChange,
  onTypeChange,
  onStartDateChange,
  onEndDateChange,
  onSortChange,
  onReset,
  onSubmit,
  resetLabel,
  searchLabel,
  searchPlaceholder,
  categoryLabel,
  typeLabel,
  startDateLabel,
  endDateLabel,
  sortLabel,
  className,
}) {
  const searchId = useId();
  const categoryId = useId();
  const typeId = useId();
  const startDateId = useId();
  const endDateId = useId();
  const sortId = useId();

  const initialValues = isObject(filters)
    ? filters
    : isObject(value)
      ? value
      : {};

  const [localValues, setLocalValues] = useState({
    search: getInputValue(initialValues.search ?? initialValues.query ?? search ?? query),
    category: getInputValue(initialValues.category ?? category),
    type: getInputValue(initialValues.type ?? type),
    startDate: getInputValue(
      initialValues.startDate ?? initialValues.dateFrom ?? startDate ?? dateFrom,
    ),
    endDate: getInputValue(
      initialValues.endDate ?? initialValues.dateTo ?? endDate ?? dateTo,
    ),
    sortBy: getInputValue(initialValues.sortBy ?? sortBy),
    sortOrder: getInputValue(initialValues.sortOrder ?? sortOrder, 'desc'),
  });

  const currentValues = useMemo(
    () => ({
      search: getInputValue(
        initialValues.search ??
          initialValues.query ??
          search ??
          query ??
          localValues.search,
      ),
      category: getInputValue(initialValues.category ?? category ?? localValues.category),
      type: getInputValue(initialValues.type ?? type ?? localValues.type),
      startDate: getInputValue(
        initialValues.startDate ??
          initialValues.dateFrom ??
          startDate ??
          dateFrom ??
          localValues.startDate,
      ),
      endDate: getInputValue(
        initialValues.endDate ??
          initialValues.dateTo ??
          endDate ??
          dateTo ??
          localValues.endDate,
      ),
      sortBy: getInputValue(initialValues.sortBy ?? sortBy ?? localValues.sortBy),
      sortOrder: getInputValue(
        initialValues.sortOrder ?? sortOrder ?? localValues.sortOrder,
        'desc',
      ),
    }),
    [
      category,
      dateFrom,
      dateTo,
      endDate,
      initialValues,
      localValues,
      query,
      search,
      sortBy,
      sortOrder,
      startDate,
      type,
    ],
  );

  const emitChange = useCallback(
    (field, nextValue) => {
      const nextValues = {
        ...currentValues,
        [field]: nextValue,
      };

      setLocalValues(nextValues);

      if (typeof onChange === 'function') {
        onChange(nextValues);
      }

      if (typeof onFilterChange === 'function') {
        onFilterChange(nextValues);
      }

      const handlers = {
        search: onSearchChange,
        category: onCategoryChange,
        type: onTypeChange,
        startDate: onStartDateChange,
        endDate: onEndDateChange,
        sortBy: onSortChange,
        sortOrder: onSortChange,
      };

      if (typeof handlers[field] === 'function') {
        handlers[field](nextValue, nextValues);
      }
    },
    [
      currentValues,
      onCategoryChange,
      onChange,
      onEndDateChange,
      onFilterChange,
      onSearchChange,
      onSortChange,
      onStartDateChange,
      onTypeChange,
    ],
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (typeof onSubmit === 'function') {
      onSubmit(currentValues, event);
    }
  };

  const handleReset = () => {
    const resetValues = {
      search: '',
      category: '',
      type: '',
      startDate: '',
      endDate: '',
      sortBy: '',
      sortOrder: 'desc',
    };

    setLocalValues(resetValues);

    if (typeof onChange === 'function') {
      onChange(resetValues);
    }

    if (typeof onFilterChange === 'function') {
      onFilterChange(resetValues);
    }

    if (typeof onReset === 'function') {
      onReset(resetValues);
    }
  };

  const normalizedCategories = normalizeOptions(categoryOptions || categories);
  const normalizedTypes = normalizeOptions(typeOptions || types);
  const normalizedSortOptions = normalizeOptions(sortOptions);
  const hasActiveFilters = Object.entries(currentValues).some(
    ([key, currentValue]) =>
      key === 'sortOrder'
        ? currentValue !== 'desc'
        : Boolean(currentValue),
  );

  const controlClassName =
    'min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20';

  return (
    <form
      aria-label="Filter and sort controls"
      className={joinClasses(
        'surface-card w-full p-4 sm:p-5',
        className,
      )}
      data-testid="filter-bar"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showSearch && (
          <div className="sm:col-span-2 lg:col-span-2">
            <label
              htmlFor={searchId}
              className="mb-1.5 block text-sm font-semibold text-nova-midnight"
            >
              {searchLabel}
            </label>
            <input
              id={searchId}
              type="search"
              value={currentValues.search}
              onChange={(event) => emitChange('search', event.target.value)}
              placeholder={searchPlaceholder}
              className={controlClassName}
              autoComplete="off"
            />
          </div>
        )}

        {showCategory && (
          <div>
            <label
              htmlFor={categoryId}
              className="mb-1.5 block text-sm font-semibold text-nova-midnight"
            >
              {categoryLabel}
            </label>
            <select
              id={categoryId}
              value={currentValues.category}
              onChange={(event) => emitChange('category', event.target.value)}
              className={controlClassName}
            >
              <option value="">All categories</option>
              {normalizedCategories.map((option) => (
                <option key={`category-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showType && (
          <div>
            <label
              htmlFor={typeId}
              className="mb-1.5 block text-sm font-semibold text-nova-midnight"
            >
              {typeLabel}
            </label>
            <select
              id={typeId}
              value={currentValues.type}
              onChange={(event) => emitChange('type', event.target.value)}
              className={controlClassName}
            >
              <option value="">All types</option>
              {normalizedTypes.map((option) => (
                <option key={`type-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDateRange && (
          <>
            <div>
              <label
                htmlFor={startDateId}
                className="mb-1.5 block text-sm font-semibold text-nova-midnight"
              >
                {startDateLabel}
              </label>
              <input
                id={startDateId}
                type="date"
                value={currentValues.startDate}
                onChange={(event) =>
                  emitChange('startDate', event.target.value)
                }
                className={controlClassName}
              />
            </div>

            <div>
              <label
                htmlFor={endDateId}
                className="mb-1.5 block text-sm font-semibold text-nova-midnight"
              >
                {endDateLabel}
              </label>
              <input
                id={endDateId}
                type="date"
                value={currentValues.endDate}
                onChange={(event) => emitChange('endDate', event.target.value)}
                className={controlClassName}
              />
            </div>
          </>
        )}

        {showSort && (
          <div>
            <label
              htmlFor={sortId}
              className="mb-1.5 block text-sm font-semibold text-nova-midnight"
            >
              {sortLabel}
            </label>
            <select
              id={sortId}
              value={
                normalizedSortOptions.length > 0
                  ? currentValues.sortBy
                  : `${currentValues.sortBy}:${currentValues.sortOrder}`
              }
              onChange={(event) => {
                if (normalizedSortOptions.length > 0) {
                  emitChange('sortBy', event.target.value);
                  return;
                }

                const [nextSortBy, nextSortOrder = 'desc'] =
                  event.target.value.split(':');
                emitChange('sortBy', nextSortBy);
                emitChange('sortOrder', nextSortOrder);
              }}
              className={controlClassName}
            >
              <option value="">Sort by</option>
              {normalizedSortOptions.length > 0
                ? normalizedSortOptions.map((option) => (
                    <option key={`sort-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))
                : [
                    ['date:desc', 'Newest first'],
                    ['date:asc', 'Oldest first'],
                    ['amount:desc', 'Highest amount'],
                    ['amount:asc', 'Lowest amount'],
                  ].map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                      {optionLabel}
                    </option>
                  ))}
            </select>
          </div>
        )}

        {showReset && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className="min-h-11 w-full rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetLabel}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

FilterBar.propTypes = {
  filters: PropTypes.object,
  value: PropTypes.object,
  search: PropTypes.string,
  query: PropTypes.string,
  category: PropTypes.string,
  type: PropTypes.string,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  dateFrom: PropTypes.string,
  dateTo: PropTypes.string,
  sortBy: PropTypes.string,
  sortOrder: PropTypes.string,
  categories: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ),
  categoryOptions: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ),
  types: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ),
  typeOptions: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ),
  sortOptions: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ),
  showCategory: PropTypes.bool,
  showType: PropTypes.bool,
  showDateRange: PropTypes.bool,
  showSearch: PropTypes.bool,
  showSort: PropTypes.bool,
  showReset: PropTypes.bool,
  onChange: PropTypes.func,
  onFilterChange: PropTypes.func,
  onSearchChange: PropTypes.func,
  onCategoryChange: PropTypes.func,
  onTypeChange: PropTypes.func,
  onStartDateChange: PropTypes.func,
  onEndDateChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onReset: PropTypes.func,
  onSubmit: PropTypes.func,
  resetLabel: PropTypes.string,
  searchLabel: PropTypes.string,
  searchPlaceholder: PropTypes.string,
  categoryLabel: PropTypes.string,
  typeLabel: PropTypes.string,
  startDateLabel: PropTypes.string,
  endDateLabel: PropTypes.string,
  sortLabel: PropTypes.string,
  className: PropTypes.string,
};

FilterBar.defaultProps = {
  filters: undefined,
  value: undefined,
  search: '',
  query: '',
  category: '',
  type: '',
  startDate: '',
  endDate: '',
  dateFrom: '',
  dateTo: '',
  sortBy: '',
  sortOrder: 'desc',
  categories: [],
  categoryOptions: undefined,
  types: [],
  typeOptions: undefined,
  sortOptions: [],
  showCategory: true,
  showType: true,
  showDateRange: true,
  showSearch: true,
  showSort: true,
  showReset: true,
  onChange: undefined,
  onFilterChange: undefined,
  onSearchChange: undefined,
  onCategoryChange: undefined,
  onTypeChange: undefined,
  onStartDateChange: undefined,
  onEndDateChange: undefined,
  onSortChange: undefined,
  onReset: undefined,
  onSubmit: undefined,
  resetLabel: 'Reset filters',
  searchLabel: 'Search',
  searchPlaceholder: 'Search',
  categoryLabel: 'Category',
  typeLabel: 'Type',
  startDateLabel: 'From date',
  endDateLabel: 'To date',
  sortLabel: 'Sort',
  className: '',
};

export { FilterBar };
export default FilterBar;