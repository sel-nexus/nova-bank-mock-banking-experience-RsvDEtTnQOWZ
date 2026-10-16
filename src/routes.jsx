import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './config/constants.js';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { AccountDetailPage } from './pages/AccountDetailPage.jsx';
import { AccountsPage } from './pages/AccountsPage.jsx';
import { ContactPage } from './pages/ContactPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { OfferDetailPage } from './pages/OfferDetailPage.jsx';
import { OffersPage } from './pages/OffersPage.jsx';
import { PortfolioPage } from './pages/PortfolioPage.jsx';
import { ProductDetailPage } from './pages/ProductDetailPage.jsx';
import { ProductsPage } from './pages/ProductsPage.jsx';
import { SupportPage } from './pages/SupportPage.jsx';

function RouteUnavailable({ title }) {
  return (
    <main className="page-container">
      <section className="surface-card px-6 py-12 text-center sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-nova-blue">
          Nova Bank Demo
        </p>
        <h1 className="mt-2 text-3xl font-bold text-nova-midnight">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-nova-slate sm:text-base">
          This area is available as part of the synthetic banking experience.
        </p>
      </section>
    </main>
  );
}

function ProtectedPlaceholder({ title }) {
  return (
    <ProtectedRoute>
      <RouteUnavailable title={title} />
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.home}
        element={<Navigate to={ROUTES.login} replace />}
      />

      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.help} element={<SupportPage />} />
      <Route path="/contact" element={<ContactPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.dashboard} element={<PortfolioPage />} />
        <Route path={ROUTES.accounts} element={<AccountsPage />} />
        <Route
          path={ROUTES.accountDetails}
          element={<AccountDetailPage />}
        />
        <Route path="/products" element={<ProductsPage />} />
        <Route
          path="/products/:productId"
          element={<ProductDetailPage />}
        />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/offers/:offerId" element={<OfferDetailPage />} />
      </Route>

      <Route
        path={ROUTES.transfers}
        element={<ProtectedPlaceholder title="Transfers" />}
      />
      <Route
        path={ROUTES.payments}
        element={<ProtectedPlaceholder title="Payments" />}
      />
      <Route
        path={ROUTES.transactions}
        element={<ProtectedPlaceholder title="Transactions" />}
      />
      <Route
        path={ROUTES.profile}
        element={<ProtectedPlaceholder title="Profile" />}
      />
      <Route
        path={ROUTES.settings}
        element={<ProtectedPlaceholder title="Settings" />}
      />

      <Route
        path={ROUTES.notFound}
        element={<Navigate to={ROUTES.home} replace />}
      />
    </Routes>
  );
}

export { AppRoutes, RouteUnavailable, ProtectedPlaceholder };
export default AppRoutes;