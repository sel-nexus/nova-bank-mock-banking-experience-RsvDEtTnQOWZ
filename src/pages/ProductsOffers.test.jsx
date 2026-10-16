import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AppProvider } from '../state/AppProvider.jsx';
import { FacilitatorProvider } from '../state/FacilitatorContext.jsx';
import { initialState } from '../state/appReducer.js';
import { FIXTURES } from '../fixtures/fixtures.js';
import { ROUTES } from '../config/constants.js';
import { FacilitatorPanel } from '../components/shell/FacilitatorPanel.jsx';
import { OffersPage } from './OffersPage.jsx';
import { OfferDetailPage } from './OfferDetailPage.jsx';
import { ProductDetailPage } from './ProductDetailPage.jsx';
import { ProductsPage } from './ProductsPage.jsx';
import offerService from '../domain/offerService.js';
import sessionManager from '../services/sessionManager.js';
import storageService from '../services/storageService.js';

const MIGUEL_ID = 'user-miguel-santos';
const ROSA_ID = 'user-rosa-delacruz';
const PRODUCT_ID = 'product-nova-credit';
const ACTIVE_OFFER_ID = 'offer-savings-bonus';
const CLAIMED_OFFER_ID = 'offer-welcome-bonus';

function createAuthenticatedState(personaId = MIGUEL_ID) {
  const persona = FIXTURES.personas.find((item) => item.id === personaId);

  return {
    ...initialState,
    session: {
      ...initialState.session,
      isAuthenticated: true,
      status: 'active',
      token: 'nova-demo-token',
      userId: personaId,
    },
    persona,
  };
}

function renderWithApp(ui, personaId = MIGUEL_ID) {
  return render(
    <AppProvider initialState={createAuthenticatedState(personaId)}>
      {ui}
    </AppProvider>,
  );
}

function renderProducts(personaId = MIGUEL_ID) {
  return renderWithApp(
    <MemoryRouter>
      <ProductsPage />
    </MemoryRouter>,
    personaId,
  );
}

function renderOffers(personaId = MIGUEL_ID) {
  return renderWithApp(
    <MemoryRouter>
      <OffersPage />
    </MemoryRouter>,
    personaId,
  );
}

function renderProductDetail(productId = PRODUCT_ID, props = {}) {
  return renderWithApp(
    <MemoryRouter initialEntries={[`/products/${productId}`]}>
      <Routes>
        <Route
          path="/products/:productId"
          element={<ProductDetailPage {...props} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function renderOfferDetail(offerId = ACTIVE_OFFER_ID, props = {}) {
  return renderWithApp(
    <MemoryRouter initialEntries={[`/offers/${offerId}`]}>
      <Routes>
        <Route
          path="/offers/:offerId"
          element={<OfferDetailPage {...props} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function LocationProbe() {
  const location = useLocation();

  return (
    <output data-testid="catalogue-location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function PersonaSwitchingCatalogue() {
  return (
    <FacilitatorProvider>
      <FacilitatorPanel compact />
      <OffersPage />
    </FacilitatorProvider>
  );
}

describe('ProductsOffers catalogue journey', () => {
  beforeEach(() => {
    storageService.resetStorage();
    sessionManager.clear();
    offerService.clearOfferInterests();
  });

  afterEach(() => {
    cleanup();
    storageService.resetStorage();
    sessionManager.clear();
    offerService.clearOfferInterests();
    vi.restoreAllMocks();
  });

  it('filters the product catalogue by category and shows only matching products', async () => {
    const user = userEvent.setup();

    renderProducts();

    expect(
      screen.getByRole('heading', { name: 'All products' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Nova Rewards Card' }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText('Category'),
      'Cards',
    );

    expect(
      screen.getByRole('heading', { name: 'Nova Rewards Card' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Ipon Goal Saver' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Home Loan' }),
    ).not.toBeInTheDocument();
  });

  it('filters active offers by category and excludes claimed offers from the catalogue', async () => {
    const user = userEvent.setup();

    renderOffers();

    expect(
      screen.getByRole('heading', { name: 'Payday Ipon Boost' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Cashback Week' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Welcome to Nova Bank'),
    ).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText('Category'),
      'savings',
    );

    expect(
      screen.getByRole('heading', { name: 'Payday Ipon Boost' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Cashback Week',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Welcome to Nova Bank'),
    ).not.toBeInTheDocument();
  });

  it('renders product details and records a local product question without starting an application', async () => {
    const user = userEvent.setup();
    const onContact = vi.fn();

    renderProductDetail(PRODUCT_ID, { onContact });

    expect(
      screen.getAllByRole('heading', { name: 'Nova Rewards Card' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: 'Benefits and features' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('No annual fee').length).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: 'Ask about this product' }),
    );

    expect(onContact).toHaveBeenCalledWith(
      expect.objectContaining({
        id: PRODUCT_ID,
        name: 'Nova Rewards Card',
      }),
    );
    expect(
      screen.getByText(
        'Your product question was noted locally. No application was submitted.',
      ),
    ).toBeInTheDocument();
  });

  it('shows an error state when a requested product does not exist', () => {
    renderProductDetail('missing-product');

    expect(
      screen.getByRole('heading', { name: 'Product not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The requested synthetic product could not be found in the Nova Bank catalogue.',
      ),
    ).toBeInTheDocument();
  });

  it('renders active offer details and records simulated interest locally', async () => {
    const user = userEvent.setup();

    renderOfferDetail(ACTIVE_OFFER_ID);

    expect(
      screen.getAllByRole('heading', { name: 'Payday Ipon Boost' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: 'Eligibility' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Offer validity' }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Express interest' }),
    );

    expect(
      screen.getByText(
        'Your interest was recorded locally. No application was submitted and no real financial action was started.',
      ),
    ).toBeInTheDocument();
    expect(
      offerService.hasOfferInterest(MIGUEL_ID, ACTIVE_OFFER_ID),
    ).toBe(true);
  });

  it('does not expose claimed offers through the offer detail journey', () => {
    renderOfferDetail(CLAIMED_OFFER_ID);

    expect(
      screen.getByRole('heading', { name: 'Offer not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The requested synthetic offer could not be found or is no longer available.',
      ),
    ).toBeInTheDocument();
  });

  it('switches the active demo persona while the catalogue remains available', async () => {
    const user = userEvent.setup();

    renderWithApp(
      <MemoryRouter>
        <PersonaSwitchingCatalogue />
      </MemoryRouter>,
    );

    const personaSelect = screen.getByLabelText('Demo persona');

    expect(personaSelect).toHaveValue(MIGUEL_ID);
    expect(
      screen.getByRole('heading', { name: 'Payday Ipon Boost' }),
    ).toBeInTheDocument();

    await user.selectOptions(personaSelect, ROSA_ID);

    expect(personaSelect).toHaveValue(ROSA_ID);
    expect(
      screen.getByRole('heading', { name: 'Term Deposit Promo' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Payday Ipon Boost' }),
    ).not.toBeInTheDocument();
  });

  it('navigates from a product catalogue card to its configured detail route', async () => {
    const user = userEvent.setup();

    renderWithApp(
      <MemoryRouter initialEntries={[ROUTES.accounts]}>
        <ProductsPage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(
      screen.getAllByRole('link', { name: 'Learn more' })[0],
    );

    expect(screen.getByTestId('catalogue-location')).toHaveTextContent(
      `${ROUTES.accounts}?product=product-everyday-checking`,
    );
  });
});