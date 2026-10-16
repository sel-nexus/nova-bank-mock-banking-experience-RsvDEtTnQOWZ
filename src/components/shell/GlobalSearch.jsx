import React, {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/constants.js';
import { useGlobalSearch } from '../../hooks/useGlobalSearch.js';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getResultRoute(result) {
  return result?.route || ROUTES.dashboard;
}

function getResultKey(result, index) {
  return `${result?.domain || 'result'}-${result?.id || index}`;
}

/**
 * Renders a local cross-domain search field for accounts, products, and offers.
 *
 * @param {{
 *   personaId?: string,
 *   value?: string,
 *   query?: string,
 *   onChange?: Function,
 *   onQueryChange?: Function,
 *   onSelect?: Function,
 *   onResultSelect?: Function,
 *   domains?: string[],
 *   placeholder?: string,
 *   searchLabel?: string,
 *   noResultsLabel?: string,
 *   maxResults?: number,
 *   showResults?: boolean,
 *   className?: string,
 *   inputClassName?: string
 * }} props
 * @returns {JSX.Element}
 */
function GlobalSearch({
  personaId = '',
  value,
  query,
  onChange,
  onQueryChange,
  onSelect,
  onResultSelect,
  domains,
  placeholder = 'Search accounts, products, and offers',
  searchLabel = 'Search accounts, products, and offers',
  noResultsLabel = 'No matching results found.',
  maxResults = 8,
  showResults = true,
  className = '',
  inputClassName = '',
}) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const resultsId = useId();
  const isControlled = value !== undefined || query !== undefined;
  const controlledQuery =
    value !== undefined ? normalizeText(value) : normalizeText(query);
  const [isOpen, setIsOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(controlledQuery);
  const search = useGlobalSearch({
    personaId,
    domains,
    limit: maxResults,
  });

  const activeQuery = isControlled ? controlledQuery : localQuery;
  const hasQuery = Boolean(activeQuery.trim());
  const shouldShowResults = showResults && isOpen && hasQuery;
  const results = search.results.slice(0, maxResults);

  useEffect(() => {
    if (isControlled) {
      search.setQuery(controlledQuery);
    }
  }, [controlledQuery, isControlled, search]);

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, []);

  const handleChange = (event) => {
    const nextQuery = event.target.value;

    if (!isControlled) {
      setLocalQuery(nextQuery);
    }

    search.setQuery(nextQuery);
    setIsOpen(true);

    if (typeof onChange === 'function') {
      onChange(nextQuery, event);
    }

    if (typeof onQueryChange === 'function') {
      onQueryChange(nextQuery, event);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key === 'Enter') {
      setIsOpen(true);
    }
  };

  const handleResultClick = (result) => {
    setIsOpen(false);

    if (!isControlled) {
      setLocalQuery('');
    }

    search.setQuery('');

    const selectHandler = onSelect || onResultSelect;

    if (typeof selectHandler === 'function') {
      selectHandler(result);
      return;
    }

    navigate(getResultRoute(result));
  };

  return (
    <div
      ref={containerRef}
      className={['relative w-full', className].filter(Boolean).join(' ')}
      data-testid="global-search"
    >
      <form
        role="search"
        aria-label="Global search"
        onSubmit={(event) => {
          event.preventDefault();
          setIsOpen(true);
        }}
      >
        <label htmlFor={`global-search-input-${resultsId}`} className="sr-only">
          {searchLabel}
        </label>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-lg text-nova-slate"
        >
          ⌕
        </span>

        <input
          ref={inputRef}
          id={`global-search-input-${resultsId}`}
          type="search"
          value={activeQuery}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={shouldShowResults ? resultsId : undefined}
          aria-expanded={shouldShowResults}
          className={[
            'min-h-11 w-full rounded-lg border border-nova-slate/30 bg-nova-cream/60 pl-9 pr-3 text-sm text-nova-ink outline-none transition focus:border-nova-blue focus:bg-white focus:ring-4 focus:ring-nova-blue/20',
            inputClassName,
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </form>

      {shouldShowResults && (
        <div
          id={resultsId}
          role="listbox"
          aria-label="Global search results"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-card border border-nova-slate/20 bg-white shadow-elevated"
        >
          {results.length > 0 ? (
            <ul className="py-2">
              {results.map((result, index) => (
                <li key={getResultKey(result, index)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left transition hover:bg-nova-sky/60 focus:bg-nova-sky/60 focus:outline-none"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="block min-w-0 truncate text-sm font-semibold text-nova-midnight">
                        {result.title}
                      </span>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-nova-slate">
                        {result.domain}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-nova-slate">
                      {result.description}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-4 text-sm text-nova-slate">
              {noResultsLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

GlobalSearch.propTypes = {
  personaId: PropTypes.string,
  value: PropTypes.string,
  query: PropTypes.string,
  onChange: PropTypes.func,
  onQueryChange: PropTypes.func,
  onSelect: PropTypes.func,
  onResultSelect: PropTypes.func,
  domains: PropTypes.arrayOf(PropTypes.string),
  placeholder: PropTypes.string,
  searchLabel: PropTypes.string,
  noResultsLabel: PropTypes.string,
  maxResults: PropTypes.number,
  showResults: PropTypes.bool,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
};

export { GlobalSearch };
export default GlobalSearch;
