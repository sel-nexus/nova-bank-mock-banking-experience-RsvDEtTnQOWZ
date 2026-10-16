# Nova Bank Demo

Nova Bank Demo is a fictional, synthetic banking experience built for demonstrations, acceptance testing, and product walkthroughs. It provides local-only journeys for authentication, portfolio review, account activity, product and offer discovery, support, and simulated chat.

The application does not connect to real financial accounts, banks, payment networks, external support teams, or third-party services. All data is fixture-based or stored locally in the browser.

## Technology

- React 18
- JavaScript and JSX
- Vite
- React Router DOM
- Tailwind CSS
- Vitest
- React Testing Library
- Playwright
- Node.js and npm

## Requirements

- Node.js 18 or newer
- npm 9 or newer

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

Build the production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The application does not require environment variables for local development. Optional build metadata variables are documented in `.env.example`:

- `VITE_APP_VERSION`
- `VITE_BUILD_ID`
- `VITE_BUILD_COMMIT`
- `VITE_BUILD_TIMESTAMP`

No secrets, API keys, or service endpoints should be placed in environment files.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Builds the production application into `dist/`. |
| `npm run preview` | Serves the production build locally. |
| `npm test` | Runs the Vitest test suite once. |
| `npm run test:watch` | Runs Vitest in watch mode. |
| `npm run test:ui` | Opens the Vitest UI. |
| `npm run test:e2e` | Runs the configured Playwright browser tests. |

## Demo credentials

The application uses synthetic fixture credentials only.

### Miguel Santos

- User ID: `user-miguel-santos`
- Password: `NovaDemo123!`

### Rosa Delacruz

- User ID: `user-rosa-delacruz`
- Password: `NovaDemo123!`

These credentials are intentionally included in the fixture contract for demonstration and automated testing. They are not production credentials.

## Route map

### Public routes

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/login`. |
| `/login` | Synthetic sign-in experience. |
| `/help` | Public support centre with FAQs, sample hotlines, hours, and fictional branches. |
| `/contact` | Local support enquiry form. |

### Authenticated routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Persona-specific portfolio dashboard. |
| `/accounts` | Authenticated account list. |
| `/accounts/:accountId` | Persona-scoped account details and activity. |
| `/products` | Synthetic product catalogue. |
| `/products/:productId` | Synthetic product details. |
| `/offers` | Active synthetic offer catalogue. |
| `/offers/:offerId` | Synthetic offer details and local interest recording. |
| `/transfers` | Demonstration placeholder for transfers. |
| `/payments` | Demonstration placeholder for payments. |
| `/transactions` | Demonstration placeholder for transactions. |
| `/profile` | Demonstration placeholder for profile. |
| `/settings` | Demonstration placeholder for settings. |

Protected routes redirect unauthenticated users to `/login` and preserve the requested destination in router state where applicable.

## Core user journeys

### Authentication

The login flow:

- Validates required User ID and password fields.
- Authenticates against local fixture credentials.
- Creates a local synthetic session.
- Supports a temporary lockout after five unsuccessful attempts.
- Supports local User ID remembering without storing passwords.
- Provides password and User ID help links.
- Supports logout and protected-route access control.
- Displays inactivity warnings and expires inactive sessions.

The session lifecycle uses local timers and a deterministic reference clock so the behavior is repeatable in automated tests.

### Portfolio and accounts

The dashboard is scoped to the active demo persona and includes:

- Relationship balance.
- Available balance.
- Account summaries.
- Recent synthetic activity.
- Product recommendations.
- Active offers.
- Quick links to account and activity areas.

Account details include:

- Current and available balances.
- Masked account identifiers.
- Account status and type.
- Routing number and opening date from synthetic fixtures.
- Pending activity.
- Searchable account activity.
- Status filtering.
- Local statement download.
- Local account enquiry submission.

Account ownership is validated before details or transactions are displayed. An account belonging to another persona is reported as unavailable rather than exposed.

### Products

The product catalogue supports:

- Category filtering.
- Product recommendations.
- Product detail pages.
- Benefits and feature descriptions.
- Availability and eligibility messaging.
- Navigation to synthetic support for product questions.

Products do not start an application or open an account.

### Offers

The offer catalogue supports:

- Active-offer filtering using the fixed reference date.
- Category filtering.
- Exclusion of claimed or expired offers.
- Offer detail modals and detail pages.
- Validity dates.
- Eligibility messaging.
- Local recording of simulated interest.

Expressing interest does not submit an application or trigger a financial action.

### Support

Support content is synthetic and includes:

- Searchable FAQs.
- Expandable FAQ answers.
- Fictional branch directory entries.
- Sample operating hours and services.
- Sample support hotlines.
- Local contact enquiries.
- Synthetic privacy and security guidance.

Submitted enquiries are kept in memory by the support service and are not sent over the network.

### Support chat

Authenticated users can open Nova Support chat from the application shell.

The chat:

- Uses scripted local responses.
- Supports topic shortcuts for accounts, transfers, transactions, payments, and security.
- Supports free-text intent matching.
- Preserves the local conversation while navigating.
- Supports minimizing and restoring the chat drawer.
- Supports simulated escalation.
- Does not contact a real bank or support team.

## Fixture and persona behavior

The primary fixture bundle is defined in `src/fixtures/fixtures.js`. It contains:

- Personas and users.
- Credentials.
- Accounts.
- Transactions.
- Products.
- Offers.
- Support requests.
- Support articles.
- Branches.
- FAQs.
- Notifications.
- Chat conversations.

Fixtures are deeply frozen to prevent accidental mutation. Domain services return cloned values where appropriate so consumers cannot modify the source fixture data.

### Miguel Santos

Miguel owns:

- Everyday Checking.
- Growth Savings.

His relationship balance is `$40,950.00`.

His fixture data includes payroll, rent, card, transfer, interest, and pending subscription activity.

### Rosa Delacruz

Rosa owns:

- Everyday Checking.

Her relationship balance is `$8,450.72`.

Persona-scoped services prevent Rosa's data from being displayed to Miguel and vice versa.

### Reference date

Domain behavior uses the fixed reference date `2026-10-16` through `src/domain/referenceClock.js`.

The reference date controls deterministic behavior such as:

- Active and expired offers.
- Transaction future-date filtering.
- Local service timestamps.
- Session test timing.
- Repeatable test expectations.

## Architecture

The application is organized around a local domain and service layer rather than a remote API.

### Application composition

`src/main.jsx` renders the application inside `React.StrictMode`.

`src/App.jsx` owns the `BrowserRouter` and composes:

- `AppProvider`
- `ChatProvider`
- `FacilitatorProvider`
- `ErrorBoundary`
- Public and authenticated layouts
- Application routes

The authenticated shell provides:

- Header navigation.
- Privacy notice.
- Session warning handling.
- Toast notifications.
- Support chat access.

### Routing

`src/routes.jsx` defines the route tree. `src/routes/ProtectedRoute.jsx` guards authenticated routes and redirects stale sessions to the login page.

### State management

Application state is managed with:

- `src/state/appReducer.js`
- `src/state/AppProvider.jsx`
- `src/state/appSelectors.js`

State covers:

- Session state.
- Active persona.
- Facilitator controls.
- Chat state.
- Support requests.
- Toast notifications.
- Demonstration transitions.

State persistence is intentionally limited to allowlisted browser storage keys and is sanitized before serialization.

### Domain services

Domain services provide persona-scoped and fixture-backed business behavior:

- `src/domain/accountService.js`
- `src/domain/offerService.js`
- `src/domain/portfolioService.js`
- `src/domain/productService.js`
- `src/domain/transactionService.js`

Domain selectors contain reusable filtering and calculation rules:

- `src/domain/offerSelectors.js`
- `src/domain/portfolioSelectors.js`
- `src/domain/transactionSelectors.js`
- `src/domain/referenceClock.js`
- `src/domain/statementFormatter.js`
- `src/domain/fixtureValidator.js`

### Local services

Local services handle application behaviors without network access:

- `src/services/authService.js`
- `src/services/chatService.js`
- `src/services/notificationService.js`
- `src/services/resilienceService.js`
- `src/services/sessionManager.js`
- `src/services/statementDownload.js`
- `src/services/storageService.js`
- `src/services/supportService.js`
- `src/services/analyticsService.js`
- `src/services/mockApi.js`

`mockApi.js` exposes asynchronous response envelopes over the local services. It is not a remote API client.

### Hooks

Reusable hooks include:

- `useSession`
- `useDomainData`
- `useGlobalSearch`
- `useToast`

Hooks provide lifecycle handling, persona-aware access, loading and error state, and local service integration.

## Folder structure

```text
.
├── e2e/                         Playwright acceptance tests
├── public/                      Static assets
├── src/
│   ├── components/
│   │   ├── account/             Account summaries and metadata
│   │   ├── catalogue/           Product and offer display components
│   │   ├── chat/                Authenticated support chat components
│   │   ├── shared/              Reusable accessible UI components
│   │   ├── shell/               Header, shell, session, and facilitator UI
│   │   ├── support/             FAQ and branch support components
│   │   └── transactions/        Transaction filters, tables, and downloads
│   ├── config/                  Routes, constants, and JSDoc type definitions
│   ├── domain/                  Fixture-backed business rules and selectors
│   ├── fixtures/                Synthetic personas and fixture collections
│   ├── hooks/                   Reusable React hooks
│   ├── pages/                   Route-level page components
│   ├── routes/                  Route protection
│   ├── services/                Local services and mock API facade
│   ├── state/                   Reducer, providers, selectors, and contexts
│   ├── utils/                   Formatting and privacy-safe logging helpers
│   ├── App.jsx                  Application providers, router, and layouts
│   ├── routes.jsx               Route definitions
│   ├── index.css                Tailwind entry point and shared base styles
│   └── main.jsx                 Application entry point
├── index.html
├── package.json
├── playwright.config.js
├── tailwind.config.js
├── vite.config.js
├── vitest.config.js
└── vitest.setup.js
```

## Privacy boundaries

Privacy is a core acceptance requirement for this project.

### No external network access

Production code must not use:

- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `EventSource`
- `navigator.sendBeacon`
- External analytics clients
- External banking or support endpoints

The application is designed to operate entirely from local fixtures and browser memory or storage.

### Credentials

Passwords are used only for local fixture authentication. They must not be:

- Persisted in browser storage.
- Included in application state persistence.
- Included in analytics events.
- Rendered into the authenticated experience.
- Logged directly.

`storageService` removes password and passcode fields before persistence. Privacy tests verify this behavior.

### Account identifiers

Full account numbers exist only in the fixture contract for local test and domain behavior. User-facing account numbers are masked, normally in the form:

```text
•••• 5678
```

Full account identifiers must not appear in:

- Rendered application content.
- Downloaded statements.
- Browser storage.
- Analytics events.
- User-facing search results.

### Personal information

Fixture persona data uses reserved test-domain email addresses and fictional contact information. The application should not be populated with real names, email addresses, phone numbers, addresses, passwords, account numbers, or financial information.

### Logging and analytics

Use `src/utils/safeLog.js` for diagnostic logging. Direct production `console` usage is prohibited by the privacy tests.

Analytics events are sanitized in memory and exclude sensitive keys and values. Analytics are not transmitted to a third party.

### User guidance

The UI repeatedly instructs users not to enter:

- Real passwords.
- Real account numbers.
- Card numbers.
- Verification codes.
- Personal or financial information.

## Testing

Run the unit and component tests:

```bash
npm test
```

Run the tests interactively:

```bash
npm run test:watch
```

Open the Vitest UI:

```bash
npm run test:ui
```

Run the Playwright acceptance suite:

```bash
npm run test:e2e
```

The test suite covers:

- Authentication and validation.
- Lockout behavior.
- Session inactivity warnings and expiry.
- Logout and protected-route behavior.
- Persona data isolation.
- Account balances and masked identifiers.
- Transaction filtering and expansion.
- Local statement downloads.
- Product and offer catalogue behavior.
- Offer validity and simulated interest.
- Support FAQs and branch expansion.
- Contact enquiry submission.
- Support chat behavior.
- Accessibility landmarks, headings, focus management, and keyboard operation.
- Privacy boundaries and absence of external network requests.
- Fixture schema and domain selector behavior.
- Local service response envelopes and resilience behavior.

The Playwright configuration uses a local Vite preview server at:

```text
http://127.0.0.1:4173
```

No external network should be required for either unit tests or browser tests.

## Accessibility guidance

Components should preserve the accessibility patterns already established in the project:

- Use semantic landmarks such as `header`, `nav`, `main`, `section`, and `aside`.
- Provide visible or screen-reader labels for form controls.
- Use one primary `h1` per page.
- Keep heading levels sequential.
- Use keyboard-operable buttons and links.
- Manage focus when opening and closing modals and drawers.
- Use `aria-expanded`, `aria-controls`, and live regions for dynamic content.
- Maintain usable layouts at narrow viewports and high zoom levels.
- Preserve visible focus indicators.

## Development guidance

When adding a feature:

1. Keep business rules in the domain or service layer instead of embedding them in route components.
2. Scope account, transaction, offer, notification, and chat data to the active persona.
3. Return safe fallbacks for missing or malformed fixture data.
4. Add loading and error states for asynchronous hooks and service-backed UI.
5. Avoid introducing network calls.
6. Avoid exposing sensitive values in markup, state persistence, analytics, or logs.
7. Add component, service, or domain tests for happy paths and error or edge cases.
8. Use existing shared components such as `Modal`, `Drawer`, `EmptyState`, `LoadingSkeleton`, `StatusBadge`, `PrivacyBanner`, and `FilterBar`.
9. Use Tailwind utility classes for styling.
10. Preserve deterministic behavior based on the fixed reference clock.

## Build and deployment notes

The production bundle is generated by Vite in `dist/`.

The included `vercel.json` rewrites application paths to `index.html`, allowing client-side React Router routes to work when deployed to Vercel-compatible hosting.

This project is intended for controlled demonstration environments. It must not be configured as a real banking application or connected to real financial services without a separate security, compliance, privacy, and infrastructure review.

## License

This project is private and proprietary. All rights reserved.

Permission to use, copy, modify, distribute, or deploy this project is limited to explicitly authorized parties and purposes. No license is granted for commercial use, redistribution, sublicensing, or public release without written authorization from the project owner.