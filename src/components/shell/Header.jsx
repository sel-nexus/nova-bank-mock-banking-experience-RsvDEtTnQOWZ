import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/constants.js';
import { useGlobalSearch } from '../../hooks/useGlobalSearch.js';
import { useSession } from '../../hooks/useSession.js';
import { useAppContext } from '../../state/AppProvider.jsx';

const NAVIGATION_ITEMS = Object.freeze([
  { label: 'Dashboard', route: ROUTES.dashboard },
  { label: 'Accounts', route: ROUTES.accounts },
  { label: 'Transfers', route: ROUTES.transfers },
  { label: 'Payments', route: ROUTES.payments },
  { label: 'Transactions', route: ROUTES.transactions },
]);

function getInitials(persona, fallbackName = '') {
  const name =
    persona?.name ||
    fallbackName ||
    `${persona?.firstName || ''} ${persona?.lastName || ''}`.trim();

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'NB';
}

function getDisplayName(persona, fallbackName = '') {
  return (
    persona?.firstName ||
    persona?.name ||
    fallbackName ||
    'Customer'
  );
}

function getResultRoute(result) {
  return result?.route || ROUTES.dashboard;
}

function Header({
  notificationCount,
  unreadNotificationCount,
  userName,
  onLogout,
  onOpenChat,
  onNotifications,
  className,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useSession();
  const { persona, actions } = useAppContext();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const activeNotificationCount =
    Number.isFinite(unreadNotificationCount)
      ? unreadNotificationCount
      : Number.isFinite(notificationCount)
        ? notificationCount
        : 0;

  const displayName = getDisplayName(persona, userName);
  const initials = getInitials(persona, userName);
  const search = useGlobalSearch({
    personaId: persona?.id,
  });

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  const handleSearchChange = (event) => {
    search.setQuery(event.target.value);
    setIsSearchOpen(true);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (search.query.trim()) {
      setIsSearchOpen(true);
    }
  };

  const handleSearchResultClick = (result) => {
    setIsSearchOpen(false);
    search.setQuery('');
    navigate(getResultRoute(result));
  };

  const handleLogout = () => {
    const result =
      typeof onLogout === 'function' ? onLogout() : logout();

    if (result?.success !== false) {
      navigate(ROUTES.login);
    }
  };

  const handleChatClick = () => {
    if (typeof onOpenChat === 'function') {
      onOpenChat();
      return;
    }

    if (typeof actions?.openChat === 'function') {
      actions.openChat();
    }
  };

  const handleNotificationsClick = () => {
    if (typeof onNotifications === 'function') {
      onNotifications();
      return;
    }

    navigate(ROUTES.dashboard);
  };

  return (
    <header
      className={[
        'sticky top-0 z-40 border-b border-nova-slate/20 bg-white/95 shadow-sm backdrop-blur',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <NavLink
          to={ROUTES.dashboard}
          aria-label="Nova Bank dashboard"
          className="flex shrink-0 items-center gap-2 text-nova-midnight transition hover:text-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-nova-midnight text-lg font-extrabold text-nova-lime"
          >
            N
          </span>
          <span className="hidden text-sm font-extrabold tracking-[0.16em] sm:inline">
            NOVA BANK
          </span>
        </NavLink>

        <nav
          aria-label="Primary navigation"
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex"
        >
          {NAVIGATION_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.route ||
              (item.route === ROUTES.accounts &&
                location.pathname.startsWith('/accounts/'));

            return (
              <NavLink
                key={item.route}
                to={item.route}
                className={[
                  'rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-nova-blue/20',
                  isActive
                    ? 'bg-nova-sky text-nova-midnight'
                    : 'text-nova-slate hover:bg-nova-sky/70 hover:text-nova-midnight',
                ].join(' ')}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div ref={searchRef} className="relative hidden w-full max-w-xs xl:block">
          <form
            aria-label="Global search"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <label htmlFor="global-search" className="sr-only">
              Search accounts, products, and offers
            </label>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-nova-slate"
            >
              ⌕
            </span>
            <input
              id="global-search"
              type="search"
              value={search.query}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search"
              autoComplete="off"
              className="min-h-11 w-full rounded-lg border border-nova-slate/30 bg-nova-cream/60 pl-9 pr-3 text-sm text-nova-ink outline-none transition focus:border-nova-blue focus:bg-white focus:ring-4 focus:ring-nova-blue/20"
            />
          </form>

          {isSearchOpen && search.query.trim() && (
            <div className="absolute right-0 top-full mt-2 w-full min-w-80 overflow-hidden rounded-card border border-nova-slate/20 bg-white shadow-elevated">
              {search.hasResults ? (
                <ul
                  aria-label="Search results"
                  className="max-h-96 overflow-y-auto py-2"
                >
                  {search.results.slice(0, 6).map((result) => (
                    <li key={`${result.domain}-${result.id}`}>
                      <button
                        type="button"
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full px-4 py-3 text-left transition hover:bg-nova-sky/60 focus:bg-nova-sky/60 focus:outline-none"
                      >
                        <span className="block truncate text-sm font-semibold text-nova-midnight">
                          {result.title}
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
                  No matching results found.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleChatClick}
            aria-label="Open support chat"
            className="hidden h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20 md:inline-flex"
          >
            <span aria-hidden="true" className="text-lg">
              ◌
            </span>
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={handleNotificationsClick}
            aria-label={
              activeNotificationCount > 0
                ? `${activeNotificationCount} unread notifications`
                : 'Notifications'
            }
            className="relative flex h-11 w-11 items-center justify-center rounded-lg text-xl text-nova-navy transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            <span aria-hidden="true">♧</span>
            {activeNotificationCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1 top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-nova-coral px-1 text-[10px] font-bold text-nova-midnight"
              >
                {activeNotificationCount > 99 ? '99+' : activeNotificationCount}
              </span>
            )}
          </button>

          <NavLink
            to={ROUTES.profile}
            aria-label={`Open profile for ${displayName}`}
            className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-nova-sky focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-nova-navy text-xs font-bold text-white"
            >
              {initials}
            </span>
            <span className="hidden max-w-28 truncate text-sm font-semibold text-nova-midnight xl:block">
              {displayName}
            </span>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden min-h-11 rounded-lg px-3 text-sm font-semibold text-nova-slate transition hover:bg-nova-coral/10 hover:text-nova-midnight focus:outline-none focus:ring-4 focus:ring-nova-blue/20 sm:inline-flex sm:items-center"
          >
            Log out
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile primary navigation"
        className="flex gap-1 overflow-x-auto border-t border-nova-slate/10 px-4 py-2 lg:hidden sm:px-6"
      >
        {NAVIGATION_ITEMS.map((item) => (
          <NavLink
            key={`mobile-${item.route}`}
            to={item.route}
            className={({ isActive }) =>
              [
                'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-nova-blue/20',
                isActive
                  ? 'bg-nova-sky text-nova-midnight'
                  : 'text-nova-slate hover:bg-nova-sky/70 hover:text-nova-midnight',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

Header.propTypes = {
  notificationCount: PropTypes.number,
  unreadNotificationCount: PropTypes.number,
  userName: PropTypes.string,
  onLogout: PropTypes.func,
  onOpenChat: PropTypes.func,
  onNotifications: PropTypes.func,
  className: PropTypes.string,
};

Header.defaultProps = {
  notificationCount: 0,
  unreadNotificationCount: undefined,
  userName: '',
  onLogout: undefined,
  onOpenChat: undefined,
  onNotifications: undefined,
  className: '',
};

export { Header };
export default Header;