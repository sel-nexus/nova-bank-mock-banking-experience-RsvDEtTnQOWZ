import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import { DEFAULT_FIXTURE_USER_ID } from '../fixtures/fixtures.js';
import { portfolioService } from '../domain/portfolioService.js';
import { useAppContext } from '../state/AppProvider.jsx';
import { EmptyState } from '../components/shared/EmptyState.jsx';
import { StatusBadge } from '../components/shared/StatusBadge.jsx';
import {
  formatCurrency,
  formatDateTime,
  safeDisplay,
} from '../utils/formatters.js';

function getPersonaId(persona, session, providedPersonaId) {
  return (
    providedPersonaId ||
    persona?.id ||
    persona?.userId ||
    session?.userId ||
    DEFAULT_FIXTURE_USER_ID
  );
}

function getFirstName(persona, fallback = '') {
  return (
    persona?.firstName ||
    persona?.name?.split(/\s+/)[0] ||
    fallback ||
    'there'
  );
}

function getAccountRoute(accountId) {
  return `/accounts/${accountId}`;
}

function getOfferValue(offer) {
  if (offer?.amount !== undefined) {
    return formatCurrency(offer.amount);
  }

  if (offer?.percentage !== undefined) {
    return `${offer.percentage}%`;
  }

  return '';
}

/**
 * Renders the persona-specific Nova Bank Demo portfolio dashboard.
 *
 * @param {{
 *   personaId?: string,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
function PortfolioPage({ personaId: providedPersonaId, className }) {
  const { persona, session } = useAppContext();

  const activePersonaId = getPersonaId(
    persona,
    session,
    providedPersonaId,
  );

  const portfolio = useMemo(
    () => portfolioService.getPortfolioViewModel(activePersonaId),
    [activePersonaId],
  );

  if (!portfolio) {
    return (
      <div
        className={[
          'page-container flex min-h-[calc(100vh-8rem)] items-center justify-center',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <EmptyState
          title="Portfolio unavailable"
          description="We could not find a portfolio for the active demo persona."
          compact
        />
      </div>
    );
  }

  const {
    persona: portfolioPersona,
    greetingName,
    summary,
    accounts,
    recentTransactions,
    offers,
    recommendations,
  } = portfolio;

  const displayName = greetingName || getFirstName(portfolioPersona);
  const lastLogin = session?.createdAt || portfolioPersona?.lastLoginAt;

  return (
    <div
      className={['page-container', className].filter(Boolean).join(' ')}
      data-testid="portfolio-page"
    >
      <header className="page-header mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
            Your portfolio
          </p>
          <h1 className="mt-2 text-3xl font-bold text-nova-midnight sm:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-nova-slate">
            Here is a clear view of your synthetic banking relationship.
          </p>
        </div>

        <NavLink
          to={ROUTES.transactions}
          className="hidden min-h-11 shrink-0 items-center rounded-lg border border-nova-navy px-4 py-2 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20 sm:inline-flex"
        >
          View activity
        </NavLink>
      </header>

      <section
        aria-labelledby="relationship-balance-title"
        className="mb-8 rounded-card bg-nova-midnight p-6 text-white shadow-elevated sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-lime">
              Total relationship balance
            </p>
            <h2
              id="relationship-balance-title"
              className="mt-3 text-4xl font-bold sm:text-5xl"
            >
              {summary.totalBalanceDisplay}
            </h2>
            <p className="mt-3 text-sm text-nova-sky">
              Available balance:{' '}
              <span className="font-semibold text-white">
                {summary.totalAvailableBalanceDisplay}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:min-w-64">
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-nova-sky">Accounts</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {summary.accountCount}
              </p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-nova-sky">Pending activity</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {summary.pendingTransactionCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="accounts-title" className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2
              id="accounts-title"
              className="text-2xl font-bold text-nova-midnight"
            >
              Your accounts
            </h2>
            <p className="mt-1 text-sm text-nova-slate">
              Review balances and account details.
            </p>
          </div>

          <NavLink
            to={ROUTES.accounts}
            className="text-sm font-semibold text-nova-blue underline-offset-2 hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            View all
          </NavLink>
        </div>

        {accounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <NavLink
                key={account.id}
                to={getAccountRoute(account.id)}
                className="surface-card block p-5 transition hover:-translate-y-0.5 hover:border-nova-blue/40 focus:outline-none focus:ring-4 focus:ring-nova-blue/20 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-nova-slate">
                      {safeDisplay(account.type, 'Account')}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-nova-midnight">
                      {account.name}
                    </h3>
                    <p className="mt-1 text-sm text-nova-slate">
                      {safeDisplay(account.displayAccountNumber)}
                    </p>
                  </div>

                  <StatusBadge status={account.status} />
                </div>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-nova-slate">
                      Balance
                    </p>
                    <p className="mt-1 text-2xl font-bold text-nova-midnight">
                      {account.displayBalance}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-xl text-nova-blue"
                  >
                    →
                  </span>
                </div>

                <p className="mt-4 border-t border-nova-slate/15 pt-3 text-sm text-nova-slate">
                  Available:{' '}
                  <span className="font-semibold text-nova-ink">
                    {account.displayAvailableBalance}
                  </span>
                </p>
              </NavLink>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No accounts available"
            description="This demo persona does not have any accounts to display."
            compact
          />
        )}
      </section>

      <section aria-labelledby="quick-links-title" className="mb-8">
        <h2
          id="quick-links-title"
          className="text-2xl font-bold text-nova-midnight"
        >
          Quick links
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Transfer money',
              description: 'Move funds between accounts.',
              route: ROUTES.transfers,
              icon: '↔',
            },
            {
              label: 'Make a payment',
              description: 'Review your simulated payments.',
              route: ROUTES.payments,
              icon: '$',
            },
            {
              label: 'View transactions',
              description: 'See recent account activity.',
              route: ROUTES.transactions,
              icon: '▤',
            },
            {
              label: 'Manage accounts',
              description: 'Explore account details.',
              route: ROUTES.accounts,
              icon: '▣',
            },
          ].map((link) => (
            <NavLink
              key={link.route}
              to={link.route}
              className="surface-card flex items-start gap-3 p-4 transition hover:border-nova-blue/40 hover:bg-nova-sky/30 focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-nova-sky text-lg font-bold text-nova-blue"
              >
                {link.icon}
              </span>
              <span>
                <span className="block font-semibold text-nova-midnight">
                  {link.label}
                </span>
                <span className="mt-1 block text-sm text-nova-slate">
                  {link.description}
                </span>
              </span>
            </NavLink>
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="recommendations-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2
                id="recommendations-title"
                className="text-2xl font-bold text-nova-midnight"
              >
                Recommended for you
              </h2>
              <p className="mt-1 text-sm text-nova-slate">
                Explore products that may complement your portfolio.
              </p>
            </div>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((product) => (
                <div
                  key={product.id}
                  className="surface-card flex items-start gap-4 p-5"
                >
                  <div
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-nova-mint text-lg font-bold text-nova-teal"
                  >
                    +
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-nova-midnight">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm text-nova-slate">
                      {product.reason || product.description}
                    </p>
                    <NavLink
                      to={ROUTES.accounts}
                      className="mt-3 inline-block text-sm font-semibold text-nova-blue underline-offset-2 hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                    >
                      Learn more
                    </NavLink>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="You are all set"
              description="There are no additional product recommendations right now."
              compact
            />
          )}
        </section>

        <section aria-labelledby="offers-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2
                id="offers-title"
                className="text-2xl font-bold text-nova-midnight"
              >
                Offers for you
              </h2>
              <p className="mt-1 text-sm text-nova-slate">
                Discover current synthetic offers from Nova Bank Demo.
              </p>
            </div>
          </div>

          {offers.length > 0 ? (
            <div className="space-y-3">
              {offers.map((offer) => {
                const offerValue = getOfferValue(offer);

                return (
                  <article
                    key={offer.id}
                    className="surface-card border-l-4 border-l-nova-gold p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-nova-blue">
                          {safeDisplay(offer.category, 'Offer')}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-nova-midnight">
                          {offer.title}
                        </h3>
                      </div>
                      {offerValue && (
                        <span className="shrink-0 rounded-full bg-nova-gold/30 px-3 py-1 text-sm font-bold text-nova-ink">
                          {offerValue}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-nova-slate">
                      {offer.description}
                    </p>
                    <button
                      type="button"
                      className="mt-3 text-sm font-semibold text-nova-blue underline-offset-2 hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
                    >
                      Explore offer
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No current offers"
              description="There are no available offers for this demo persona right now."
              compact
            />
          )}
        </section>
      </div>

      <section
        aria-labelledby="recent-activity-title"
        className="mt-8 surface-card overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-nova-slate/20 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="recent-activity-title"
              className="text-xl font-bold text-nova-midnight"
            >
              Recent activity
            </h2>
            <p className="mt-1 text-sm text-nova-slate">
              Your latest simulated transactions.
            </p>
          </div>
          <NavLink
            to={ROUTES.transactions}
            className="text-sm font-semibold text-nova-blue underline-offset-2 hover:text-nova-midnight hover:underline focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            See all activity
          </NavLink>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-nova-slate/15">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-nova-midnight">
                    {transaction.description}
                  </p>
                  <p className="mt-1 text-sm text-nova-slate">
                    {transaction.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={transaction.status} />
                  <span
                    className={[
                      'whitespace-nowrap font-bold',
                      transaction.direction === 'credit'
                        ? 'text-nova-teal'
                        : 'text-nova-midnight',
                    ].join(' ')}
                  >
                    {transaction.displayAmount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-nova-slate sm:px-6">
            No recent activity is available.
          </p>
        )}
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-nova-sky/60 px-4 py-3 text-sm text-nova-slate">
        <p>
          Last login:{' '}
          <span className="font-semibold text-nova-ink">
            {lastLogin ? formatDateTime(lastLogin) : 'Not available'}
          </span>
        </p>
        <p className="text-xs">
          All balances and activity shown are synthetic demo data.
        </p>
      </div>
    </div>
  );
}

PortfolioPage.propTypes = {
  personaId: PropTypes.string,
  className: PropTypes.string,
};

PortfolioPage.defaultProps = {
  personaId: '',
  className: '',
};

export { PortfolioPage };
export default PortfolioPage;