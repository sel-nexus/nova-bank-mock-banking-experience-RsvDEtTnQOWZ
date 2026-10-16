# Changelog

All notable changes to Nova Bank Demo are documented in this file.

## [1.0.0] - 2026-10-16

### Added

- Initial release of the Nova Bank Demo synthetic banking experience.
- Local-only authentication using synthetic demo credentials for Miguel Santos and Rosa Delacruz.
- Required-field validation, invalid-credential handling, temporary lockout after five failed attempts, User ID remembering, recovery guidance, logout, protected routes, and inactivity session warnings.
- Persona-scoped dashboard and portfolio views with:
  - Relationship and available balances.
  - Account summaries.
  - Recent synthetic activity.
  - Product recommendations.
  - Active offers.
  - Quick links to account and activity areas.
- Persona-scoped account journeys with:
  - Account lists and detail pages.
  - Ownership validation and unavailable-account handling.
  - Current, available, and pending balances.
  - Masked account identifiers.
  - Account type, status, routing number, and opening date details.
  - Searchable and status-filtered transaction activity.
  - Local masked statement downloads.
  - Local account and transaction enquiries.
- Synthetic transaction catalogue with:
  - Persona-scoped activity.
  - Search, date, type, category, direction, status, amount, and sorting selectors.
  - Expandable transaction details.
  - Future-date filtering based on the fixed reference date.
- Product catalogue with:
  - Category filtering.
  - Product recommendations.
  - Product detail pages.
  - Benefits, features, availability, and eligibility messaging.
  - Synthetic support navigation for product questions.
- Active offer catalogue with:
  - Fixed-date validity filtering.
  - Category filtering.
  - Exclusion of claimed and expired offers.
  - Offer detail modals and detail pages.
  - Eligibility and validity information.
  - Local simulated interest recording without applications or financial actions.
- Public support centre with:
  - Searchable and expandable FAQs.
  - Fictional branch directory entries.
  - Sample branch hours and services.
  - Sample support hotlines.
  - Synthetic privacy and security guidance.
- Local contact enquiry flow with:
  - Topic, subject, and message validation.
  - Local-only enquiry storage.
  - Synthetic confirmation references.
- Authenticated Nova Support chat with:
  - Topic shortcuts for accounts, transfers, transactions, payments, and security.
  - Local free-text intent matching.
  - Persona-sensitive scripted responses.
  - Conversation persistence while navigating.
  - Minimize, restore, close, and simulated escalation actions.
  - Privacy reminders for sensitive information.
- Application shell with:
  - Responsive header and primary navigation.
  - Global local search across accounts, products, and offers.
  - Notifications and profile controls.
  - Privacy and synthetic-data notices.
  - Toast notifications.
  - Session warning and expiry handling.
  - Error boundary recovery interface.
- Facilitator controls for:
  - Switching between synthetic personas.
  - Configuring disabled, transient, and persistent local error modes.
  - Triggering an instant session timeout.
  - Resetting the demonstration.
- Local domain and service architecture backed by deeply frozen fixtures.
- Persona isolation for accounts, transactions, offers, notifications, and chat conversations.
- Fixed reference clock set to `2026-10-16` for deterministic dates, offers, transactions, service timestamps, and session behavior.
- Local mock API facade with asynchronous response envelopes and resilience controls.
- Allowlisted, sanitized browser storage with password and passcode removal before persistence.
- Privacy-safe logging and in-memory analytics sanitization.
- Masked account identifiers in all user-facing displays and downloaded statements.
- Accessible UI patterns including:
  - Semantic landmarks.
  - Labelled controls.
  - Structured headings.
  - Keyboard-operable interactions.
  - Focus management for modals and drawers.
  - Focus trapping and focus restoration.
  - Live regions for dynamic status and chat content.
  - Responsive layouts for narrow viewports and high zoom.
- Vite production build and static hosting configuration.
- Vercel-compatible rewrite configuration for client-side routes.

### Documentation

- Added project setup and usage instructions to `README.md`.
- Documented route map, demo credentials, fixture behavior, privacy boundaries, architecture, testing guidance, and deployment notes.
- Added `.env.example` for optional non-secret build metadata:
  - `VITE_APP_VERSION`
  - `VITE_BUILD_ID`
  - `VITE_BUILD_COMMIT`
  - `VITE_BUILD_TIMESTAMP`
- Added release documentation for SCRUM-2034.

### Testing

- Added Vitest unit and component coverage for:
  - Authentication and lockout behavior.
  - Storage sanitization and migration.
  - Session lifecycle and inactivity handling.
  - Domain selectors and services.
  - Portfolio and persona isolation.
  - Product and offer journeys.
  - Statement formatting and downloads.
  - Support FAQs, branches, and contact enquiries.
  - Chat behavior and escalation.
  - Accessibility patterns.
  - Mock API response envelopes and resilience behavior.
  - Privacy boundaries and prohibited network usage.
- Added Playwright acceptance coverage for:
  - Login and session journeys.
  - Portfolio and account journeys.
  - Product and offer catalogue journeys.
  - Support and contact journeys.
  - Support chat journeys.
  - Privacy, accessibility, keyboard operation, and narrow viewport behavior.
- Configured Playwright to use a local Vite preview server at `http://127.0.0.1:4173`.
- Configured the test suite to run without external network access.

### Deployment Scope

- This release is intended for controlled demonstrations, acceptance testing, and product walkthroughs.
- The application is a static, browser-only experience using fixture data and local in-memory or browser storage.
- No real financial accounts, banks, payment networks, support teams, analytics providers, or third-party services are contacted.
- No transfers, payments, applications, account openings, or other real financial actions are submitted.
- No production banking, compliance, security, privacy, or infrastructure readiness is implied.
- Static output is generated in `dist/` by `npm run build`.
- Client-side routes require a host configuration that rewrites application paths to `index.html`.
- No secrets, API keys, service endpoints, or real customer data are supported.

### Setup

```bash
npm install
npm run dev
```

### Validation

```bash
npm run build
npm test
npm run test:e2e
```

[1.0.0]: https://github.com/novabank-demo/novabank-demo/releases/tag/v1.0.0