import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../config/constants.js';
import authService from '../services/authService.js';
import { useSession } from '../hooks/useSession.js';

function getRedirectLocation(location) {
  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  };
}

function hasValidSession(isAuthenticated, isExpired) {
  if (!isAuthenticated || isExpired) {
    return false;
  }

  try {
    return authService.isAuthenticated();
  } catch {
    return false;
  }
}

/**
 * Protects authenticated routes and redirects stale or signed-out sessions to
 * the login route.
 *
 * @param {{
 *   children?: React.ReactNode,
 *   element?: React.ReactNode,
 *   redirectTo?: string
 * }} props
 * @returns {JSX.Element}
 */
function ProtectedRoute({ children, element, redirectTo }) {
  const location = useLocation();
  const { isAuthenticated, isExpired } = useSession();

  if (!hasValidSession(isAuthenticated, isExpired)) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: getRedirectLocation(location),
        }}
      />
    );
  }

  return children ?? element ?? <Outlet />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  element: PropTypes.node,
  redirectTo: PropTypes.string,
};

ProtectedRoute.defaultProps = {
  children: undefined,
  element: undefined,
  redirectTo: ROUTES.login,
};

export { ProtectedRoute };
export default ProtectedRoute;