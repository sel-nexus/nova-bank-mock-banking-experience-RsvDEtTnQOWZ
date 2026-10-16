import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/constants.js';
import { useGlobalSearch } from '../../hooks/useGlobalSearch.js';
import { useSession } from '../../hooks/useSession.js';
import { useAppContext } from '../../state/AppProvider.jsx';
import { ProfileMenu } from './ProfileMenu.jsx';

const NAVIGATION_ITEMS = Object.freeze([
  { label: 'Home', route: ROUTES.dashboard },
  { label: 'Accounts', route: ROUTES.accounts },
  { label: 'Products', route: '/products' },
  { label: 'Promotions & Offers', route: '/offers' },
  { label: 'Help & Support', route: '/support' },
  { label: 'Contact', route: '/contact' },
]);

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
  notificationCount = 0,
  unreadNotificationCount,
  userName = '',
  onLogout,
  onOpenChat,
  onNotifications,
  className = '',
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
        'sticky top-0 z-40 border-b border-[#E9E9E9] bg-white shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div aria-hidden="true" className="h-1 bg-nova-navy" />
      <div className="header-bar mx-auto w-full max-w-[1280px] px-4 py-3 sm:px-6 lg:px-8">
        <NavLink
          to={ROUTES.dashboard}
          aria-label="Nova Bank dashboard"
          className="header-logo flex shrink-0 items-center gap-2 text-nova-navy transition hover:text-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-nova-navy text-lg font-extrabold text-[#DCB91C]"
          >
            N
          </span>
          <span className="hidden shrink-0 whitespace-nowrap pr-[0.2em] text-sm font-extrabold tracking-[0.14em] min-[420px]:inline sm:tracking-[0.16em]">
            NOVA BANK
          </span>
        </NavLink>

        <nav
          aria-label="Primary navigation"
          className="header-nav"
        >
          {NAVIGATION_ITEMS.map((item) => {
            const isActive =
              location.pathname === item.route ||
              (item.route !== ROUTES.dashboard &&
                item.route !== '/' &&
                location.pathname.startsWith(`${item.route}/`)) ||
              (item.route === ROUTES.accounts &&
                location.pathname.startsWith('/accounts'));

            return (
              <NavLink
                key={item.route}
                to={item.route}
                className={[
                  'whitespace-nowrap rounded-md px-2 py-2 text-xs font-semibold transition focus:outline-none focus:ring-4 focus:ring-nova-blue/20 sm:px-3 sm:text-sm',
                  isActive
                    ? 'bg-nova-sky text-nova-navy shadow-[inset_0_-2px_0_0_#B11116]'
                    : 'text-nova-slate hover:bg-nova-sky hover:text-nova-navy',
                ].join(' ')}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div ref={searchRef} className="header-search relative">
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
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-card border border-[#E9E9E9] bg-white shadow-elevated sm:left-auto sm:right-0 sm:w-80">
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

        <div className="header-actions flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleChatClick}
            aria-label="Open support chat"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-nova-navy px-3 text-sm font-semibold text-white transition hover:bg-nova-blue focus:outline-none focus:ring-4 focus:ring-nova-blue/20"
          >
            <span aria-hidden="true" className="text-lg">
              ◌
            </span>
            <span className="hidden sm:inline">Chat</span>
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
                className="absolute right-1 top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-nova-navy px-1 text-[10px] font-bold text-white"
              >
                {activeNotificationCount > 99 ? '99+' : activeNotificationCount}
              </span>
            )}
          </button>

          <ProfileMenu
            persona={persona}
            userName={displayName}
            onLogout={handleLogout}
          />
        </div>
      </div>
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

export { Header };
export default Header;
