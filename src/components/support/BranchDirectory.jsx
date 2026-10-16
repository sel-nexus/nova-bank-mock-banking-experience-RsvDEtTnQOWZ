import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_BRANCHES = Object.freeze([
  {
    id: 'branch-ayala',
    name: 'Ayala',
    area: 'Makati',
    address: 'Ayala Avenue, Makati City',
    phone: '+63 2 8555 0101',
    hours: 'Monday–Friday, 9:00 AM–5:00 PM',
    services: ['Account support', 'Cash services', 'ATM'],
    atmAvailable: true,
    atmHours: 'Available 24 hours',
    coordinates: '14.5547, 121.0244',
  },
  {
    id: 'branch-bgc',
    name: 'BGC',
    area: 'Taguig',
    address: 'Bonifacio High Street, Bonifacio Global City',
    phone: '+63 2 8555 0102',
    hours: 'Monday–Friday, 9:00 AM–5:00 PM',
    services: ['Account support', 'Cash services', 'ATM'],
    atmAvailable: true,
    atmHours: 'Available 24 hours',
    coordinates: '14.5507, 121.0509',
  },
  {
    id: 'branch-quezon-avenue',
    name: 'Quezon Avenue',
    area: 'Quezon City',
    address: 'Quezon Avenue, Quezon City',
    phone: '+63 2 8555 0103',
    hours: 'Monday–Friday, 9:00 AM–5:00 PM',
    services: ['Account support', 'Cash services', 'ATM'],
    atmAvailable: true,
    atmHours: 'Available 24 hours',
    coordinates: '14.6426, 121.0347',
  },
]);

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

function getBranchId(branch, index) {
  return (
    normalizeText(branch?.id || branch?.branchId || branch?.name) ||
    `branch-${index + 1}`
  );
}

function getBranchName(branch) {
  return normalizeText(branch?.name || branch?.branchName) || 'Nova Bank branch';
}

function getBranchAddress(branch) {
  return (
    normalizeText(branch?.address || branch?.location || branch?.street) ||
    'Location unavailable'
  );
}

function getBranchHours(branch) {
  return (
    normalizeText(branch?.hours || branch?.openingHours || branch?.operatingHours) ||
    'Sample hours unavailable'
  );
}

function getBranchServices(branch) {
  if (Array.isArray(branch?.services)) {
    return branch.services.filter(Boolean).map(normalizeText).filter(Boolean);
  }

  return [];
}

function getBranchSearchText(branch) {
  return [
    getBranchName(branch),
    branch?.area,
    getBranchAddress(branch),
    branch?.phone,
    getBranchHours(branch),
    ...getBranchServices(branch),
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * Renders a searchable directory of synthetic branches and ATMs.
 *
 * @param {{
 *   branches?: Object[],
 *   locations?: Object[],
 *   search?: string,
 *   initialSearch?: string,
 *   onBranchSelect?: Function,
 *   onSelect?: Function,
 *   className?: string,
 *   title?: React.ReactNode,
 *   description?: React.ReactNode,
 *   showSearch?: boolean,
 *   showAtmDetails?: boolean
 * }} props
 * @returns {JSX.Element}
 */
function BranchDirectory({
  branches,
  locations,
  search,
  initialSearch = '',
  onBranchSelect,
  onSelect,
  className = '',
  title = 'Branch directory',
  description = 'Explore synthetic branch and ATM locations available in this demonstration.',
  showSearch = true,
  showAtmDetails = true,
}) {
  const [localSearch, setLocalSearch] = useState(initialSearch);
  const [expandedBranchId, setExpandedBranchId] = useState(null);

  const sourceBranches = Array.isArray(branches)
    ? branches
    : Array.isArray(locations)
      ? locations
      : DEFAULT_BRANCHES;

  const activeSearch = search !== undefined ? search : localSearch;
  const normalizedSearch = normalizeText(activeSearch).toLowerCase();

  const filteredBranches = useMemo(
    () =>
      sourceBranches.filter((branch) =>
        normalizedSearch
          ? getBranchSearchText(branch).includes(normalizedSearch)
          : true,
      ),
    [normalizedSearch, sourceBranches],
  );

  const handleBranchToggle = (branch, branchId) => {
    const nextExpandedId = expandedBranchId === branchId ? null : branchId;

    setExpandedBranchId(nextExpandedId);

    if (nextExpandedId) {
      onBranchSelect?.(branch);
      onSelect?.(branch);
    }
  };

  return (
    <section
      aria-labelledby="branch-directory-title"
      className={['w-full', className].filter(Boolean).join(' ')}
      data-testid="branch-directory"
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            Locations and ATMs
          </p>
          <h2
            id="branch-directory-title"
            className="mt-1 text-2xl font-bold text-nova-midnight sm:text-3xl"
          >
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-nova-slate sm:text-base">
            {description}
          </p>
        </div>

        <span className="rounded-full bg-nova-sky px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-nova-blue">
          Sample locations
        </span>
      </header>

      {showSearch && (
        <div className="surface-card mb-5 p-4 sm:p-5">
          <label
            htmlFor="branch-directory-search"
            className="mb-1.5 block text-sm font-semibold text-nova-midnight"
          >
            Search branches
          </label>
          <input
            id="branch-directory-search"
            type="search"
            value={activeSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Search Ayala, BGC, or Quezon Avenue"
            autoComplete="off"
            className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-white px-3 py-2 text-sm text-nova-ink transition focus:border-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          />
        </div>
      )}

      {filteredBranches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBranches.map((branch, index) => {
            const branchId = getBranchId(branch, index);
            const branchName = getBranchName(branch);
            const isExpanded = expandedBranchId === branchId;
            const services = getBranchServices(branch);
            const atmAvailable =
              branch?.atmAvailable !== false &&
              branch?.hasAtm !== false &&
              branch?.atm !== false;

            return (
              <article
                key={branchId}
                className="surface-card overflow-hidden"
                data-testid="branch-directory-item"
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={`${branchId}-details`}
                  onClick={() => handleBranchToggle(branch, branchId)}
                  className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-nova-sky/40 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-nova-blue/20 sm:p-6"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wide text-nova-blue">
                      Synthetic branch
                    </span>
                    <span className="mt-1 block text-xl font-bold text-nova-midnight">
                      {branchName}
                    </span>
                    <span className="mt-1 block text-sm text-nova-slate">
                      {normalizeText(branch?.area) || getBranchAddress(branch)}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nova-sky text-xl text-nova-blue"
                  >
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>

                <div className="border-t border-nova-slate/20 px-5 py-5 sm:px-6">
                  <p className="text-sm leading-6 text-nova-slate">
                    {getBranchAddress(branch)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-nova-mint px-3 py-1 text-xs font-semibold text-nova-teal">
                      Branch services
                    </span>
                    <span
                      className={[
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        atmAvailable
                          ? 'bg-nova-sky text-nova-blue'
                          : 'bg-nova-slate/15 text-nova-slate',
                      ].join(' ')}
                    >
                      {atmAvailable ? 'ATM available' : 'ATM unavailable'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div
                      id={`${branchId}-details`}
                      className="mt-5 border-t border-nova-slate/15 pt-5"
                    >
                      <dl className="space-y-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <dt className="font-semibold text-nova-slate">
                            Branch hours
                          </dt>
                          <dd className="text-right text-nova-ink">
                            {getBranchHours(branch)}
                          </dd>
                        </div>

                        {branch?.phone && (
                          <div className="flex items-start justify-between gap-4">
                            <dt className="font-semibold text-nova-slate">
                              Phone
                            </dt>
                            <dd className="text-right text-nova-ink">
                              {normalizeText(branch.phone)}
                            </dd>
                          </div>
                        )}

                        {branch?.coordinates && (
                          <div className="flex items-start justify-between gap-4">
                            <dt className="font-semibold text-nova-slate">
                              Coordinates
                            </dt>
                            <dd className="text-right text-nova-ink">
                              {normalizeText(branch.coordinates)}
                            </dd>
                          </div>
                        )}

                        {showAtmDetails && atmAvailable && (
                          <div className="rounded-lg bg-nova-sky/60 p-3">
                            <dt className="font-semibold text-nova-midnight">
                              ATM details
                            </dt>
                            <dd className="mt-1 text-sm text-nova-slate">
                              {normalizeText(branch?.atmHours) ||
                                'Available 24 hours'}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {services.length > 0 && (
                        <div className="mt-5">
                          <h3 className="text-xs font-bold uppercase tracking-wide text-nova-slate">
                            Available services
                          </h3>
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {services.map((service) => (
                              <li
                                key={`${branchId}-${service}`}
                                className="rounded-full bg-nova-cream px-3 py-1 text-xs font-semibold text-nova-ink"
                              >
                                {service}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section
          className="surface-card px-5 py-10 text-center sm:px-6"
          data-testid="branch-directory-empty"
        >
          <div
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-nova-sky text-xl font-bold text-nova-blue"
          >
            —
          </div>
          <h3 className="mt-4 text-xl font-bold text-nova-midnight">
            No locations found
          </h3>
          <p className="mt-2 text-sm text-nova-slate">
            Try searching for Ayala, BGC, or Quezon Avenue.
          </p>
        </section>
      )}

      <p className="mt-5 rounded-lg bg-nova-sky/60 px-4 py-3 text-xs leading-5 text-nova-slate">
        Branch names, addresses, phone numbers, operating hours, and ATM
        availability are sample values for demonstration only. They do not
        identify real banking locations or services.
      </p>
    </section>
  );
}

BranchDirectory.propTypes = {
  branches: PropTypes.arrayOf(PropTypes.object),
  locations: PropTypes.arrayOf(PropTypes.object),
  search: PropTypes.string,
  initialSearch: PropTypes.string,
  onBranchSelect: PropTypes.func,
  onSelect: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.node,
  description: PropTypes.node,
  showSearch: PropTypes.bool,
  showAtmDetails: PropTypes.bool,
};

export { BranchDirectory };
export default BranchDirectory;
