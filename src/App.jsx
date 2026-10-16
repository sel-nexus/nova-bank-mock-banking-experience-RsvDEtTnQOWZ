import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ROUTES } from './config/constants.js';
import { AppRoutes } from './routes.jsx';
import { useSession } from './hooks/useSession.js';
import { AppProvider } from './state/AppProvider.jsx';
import { ChatProvider } from './state/ChatProvider.jsx';
import { FacilitatorProvider } from './state/FacilitatorContext.jsx';
import { AppShell } from './components/shell/AppShell.jsx';
import { ErrorBoundary } from './components/shared/ErrorBoundary.jsx';

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-nova-cream">
      {children}
    </div>
  );
}

function AuthenticatedLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated, isExpired } = useSession();

  const isPublicRoute =
    location.pathname === ROUTES.login ||
    !isAuthenticated ||
    isExpired;

  return isPublicRoute ? (
    <PublicLayout>
      {children}
    </PublicLayout>
  ) : (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  );
}

function ApplicationContent() {
  const location = useLocation();
  const { isAuthenticated, isExpired } = useSession();

  const isPublicRoute =
    location.pathname === ROUTES.login ||
    !isAuthenticated ||
    isExpired;

  return isPublicRoute ? (
    <PublicLayout>
      <AppRoutes />
    </PublicLayout>
  ) : (
    <AuthenticatedLayout>
      <AppRoutes />
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ChatProvider>
          <FacilitatorProvider>
            <BrowserRouter>
              <ApplicationContent />
            </BrowserRouter>
          </FacilitatorProvider>
        </ChatProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export { App, PublicLayout, AuthenticatedLayout };
export default App;