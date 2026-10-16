# Nova Bank Demo Deployment Runbook

This runbook documents deployment of Nova Bank Demo to Vercel-compatible static hosting.

Nova Bank Demo is a fictional, browser-only banking experience intended for demonstrations, acceptance testing, and product walkthroughs. It does not connect to real financial accounts, banking networks, support teams, analytics providers, or third-party services.

## Deployment scope

The deployment produces a static Vite application:

- Build output: `dist/`
- Hosting model: static files with client-side routing
- Backend: none
- Database: none
- External API: none
- Required secrets: none
- Required runtime services: none
- Required environment variables: none for local development or standard deployment

The deployed application uses:

- Deeply frozen synthetic fixtures.
- Local browser memory and allowlisted browser storage.
- Local mock services and asynchronous response envelopes.
- A fixed reference date of `2026-10-16`.
- Synthetic credentials included in the fixture contract.

The application must not be configured with real banking credentials, customer data, API keys, service endpoints, or production financial integrations.

## Prerequisites

Install the following locally or in the CI environment:

- Node.js 18 or newer.
- npm 9 or newer.
- Access to the target Vercel project or compatible static host.
- Repository access.

Verify the installed versions:

```bash
node --version
npm --version
```

Install dependencies from the lockfile when available:

```bash
npm ci
```

For local development where no lockfile is available:

```bash
npm install
```

## Repository configuration

The deployment-relevant files are:

| File | Purpose |
| --- | --- |
| `package.json` | Build, test, preview, and end-to-end commands. |
| `vite.config.js` | Vite and React build configuration. |
| `index.html` | Static application entry point and metadata. |
| `src/main.jsx` | React application entry point. |
| `src/App.jsx` | Browser router and provider composition. |
| `vercel.json` | SPA rewrite configuration. |
| `.env.example` | Documentation for optional non-secret build metadata. |
| `tailwind.config.js` | Tailwind content scanning and theme configuration. |
| `postcss.config.js` | Tailwind and Autoprefixer processing. |

The browser router is owned by `src/App.jsx`. Do not add a second router in `src/main.jsx` or in a hosting configuration.

## Production build

Run the production build locally:

```bash
npm run build
```

Vite writes the compiled application to:

```text
dist/
```

A successful build should:

- Resolve all JavaScript and JSX imports.
- Compile the React application.
- Process Tailwind CSS.
- Generate the static Vite bundle.
- Exit with status code `0`.

Inspect the generated output:

```bash
find dist -maxdepth 2 -type f
```

The `dist/` directory is generated output and must not be committed. It is excluded by `.gitignore`.

## Local production preview

Preview the production build using Vite:

```bash
npm run preview
```

To use the same host and port expected by the Playwright configuration:

```bash
npm run preview -- --host 127.0.0.1
```

The configured preview URL is:

```text
http://127.0.0.1:4173
```

Verify the following routes manually or with browser tests:

- `/login`
- `/help`
- `/contact`
- `/dashboard`
- `/accounts`
- `/products`
- `/offers`

Client-side routes should render through the application rather than returning a host-level 404.

## Validation commands

Run the full local validation sequence before deployment:

```bash
npm ci
npm run build
npm test
npm run test:e2e
```

For a faster build-only verification:

```bash
npm run build
```

For unit and component tests:

```bash
npm test
```

For interactive unit test development:

```bash
npm run test:watch
```

For Playwright acceptance tests:

```bash
npm run test:e2e
```

The validation suite is expected to operate without external network access.

Important acceptance areas include:

- Authentication and temporary lockout.
- Protected routes and logout behavior.
- Session inactivity warning and expiry.
- Persona isolation.
- Masked account identifiers.
- Product and offer journeys.
- Support FAQs and local contact enquiries.
- Support chat persistence and escalation simulation.
- Accessibility and keyboard operation.
- Absence of external network requests.
- Absence of credentials and full account identifiers in browser storage and rendered content.

## Vercel deployment

### Create or select a project

1. Sign in to Vercel.
2. Create a new project or select the existing Nova Bank Demo project.
3. Import the repository.
4. Select the repository branch used for deployment.
5. Confirm the framework is detected as Vite, or configure it manually.

Recommended Vercel project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | Repository root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Development command | `npm run dev` |
| Node.js version | 18 or newer |

The output directory must be `dist`. Do not configure the project to publish `src`, the repository root, or another generated directory.

### Configure the deployment branch

Use the repository's protected release branch for production deployments. Feature branches and pull requests should use Vercel preview deployments.

Recommended branch behavior:

- Pull request branch: preview deployment.
- Integration or staging branch: preview or staging deployment.
- Production branch: production deployment.

Do not deploy unreviewed feature branches to the production environment.

### Deploy through Vercel

After importing the project:

1. Review the detected project settings.
2. Confirm the install command is `npm ci`.
3. Confirm the build command is `npm run build`.
4. Confirm the output directory is `dist`.
5. Confirm no secrets or external service variables are configured.
6. Start the deployment.
7. Wait for the build to complete.
8. Open the generated deployment URL.
9. Complete the smoke checks listed below.
10. Promote or assign the deployment to the production domain only after validation passes.

## SPA rewrite behavior

The application uses React Router with client-side routes. Direct requests to routes such as `/dashboard` or `/accounts/account-miguel-checking` must serve the application entry point instead of returning a static 404.

The repository includes `vercel.json` with the following rewrite behavior:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This rewrite sends route requests to `index.html`, where React Router selects the appropriate page.

The rewrite is required for:

- Browser refreshes on authenticated routes.
- Direct links to account details.
- Direct links to product details.
- Direct links to offer details.
- Deep links containing query strings.
- Browser history navigation after logout or route changes.

Do not replace the rewrite with redirects. A redirect would change the browser URL and can prevent client-side route handling from working as intended.

After deployment, verify direct navigation in a new browser context:

```text
/login
/help
/contact
/dashboard
/accounts/account-miguel-checking
/products/product-nova-credit
/offers/offer-savings-bonus
```

Authenticated routes should still be protected. When no valid local session exists, protected routes should redirect to `/login` while preserving the requested destination where applicable.

## Environment guidance

### Required environment variables

None are required for the standard application.

The application is designed to run without:

- Database connection strings.
- API base URLs.
- Authentication provider credentials.
- Banking service credentials.
- Payment service credentials.
- Analytics service credentials.
- Support platform credentials.
- Encryption keys.

### Optional build metadata

The following variables may be configured for display or diagnostics:

```text
VITE_APP_VERSION=
VITE_BUILD_ID=
VITE_BUILD_COMMIT=
VITE_BUILD_TIMESTAMP=
```

These values are documented in `.env.example`.

Suggested production values:

```text
VITE_APP_VERSION=1.0.0
VITE_BUILD_ID=<deployment-or-build-identifier>
VITE_BUILD_COMMIT=<source-commit-sha>
VITE_BUILD_TIMESTAMP=<utc-build-timestamp>
```

Suggested preview values should identify the preview build without containing secrets:

```text
VITE_APP_VERSION=1.0.0-preview
VITE_BUILD_ID=<preview-build-identifier>
VITE_BUILD_COMMIT=<source-commit-sha>
VITE_BUILD_TIMESTAMP=<utc-build-timestamp>
```

Use the Vercel environment scope appropriate to the value:

- Preview: values used by pull request and preview deployments.
- Production: values used by the production deployment.
- Development: local-only values, if needed.

### Prohibited environment values

Do not add any of the following to Vercel or local environment files:

- Real passwords.
- User credentials.
- API keys.
- Access tokens.
- Refresh tokens.
- Private keys.
- Database URLs.
- Banking endpoints.
- Payment endpoints.
- External support endpoints.
- Real customer identifiers.
- Real account numbers.
- Personal information.

Environment variables prefixed with `VITE_` are exposed to browser code during the build. Treat every `VITE_*` value as public.

## Preview deployment workflow

Use preview deployments for every pull request that changes application behavior, styling, routing, fixtures, services, or deployment configuration.

Recommended workflow:

1. Create a feature branch from the current integration or production branch.
2. Make the change locally.
3. Run the local validation commands.
4. Push the branch and open a pull request.
5. Allow Vercel to create a preview deployment.
6. Verify the preview URL.
7. Run the smoke checklist against the preview.
8. Review the build logs for warnings or unexpected assets.
9. Review the accessibility and privacy-sensitive journeys.
10. Obtain the required code review and acceptance approval.
11. Merge the pull request.
12. Verify the resulting production deployment.

Preview deployments must use synthetic data and must not be used to test real financial integrations.

## Production deployment workflow

Before promoting a release to production:

1. Confirm the target commit is reviewed and approved.
2. Confirm `npm ci` completes successfully.
3. Confirm `npm run build` completes successfully.
4. Confirm `npm test` passes.
5. Confirm `npm run test:e2e` passes.
6. Confirm no prohibited network usage was introduced.
7. Confirm no secrets or real data were added.
8. Confirm `vercel.json` still contains the SPA rewrite.
9. Confirm the production output directory is `dist`.
10. Deploy or promote the approved commit.
11. Open the production URL.
12. Complete the post-deployment smoke checks.
13. Record the deployment identifier and commit in the release notes or deployment record.

## Post-deployment smoke checks

Complete these checks against the deployed URL.

### Public routes

- Open `/login`.
- Confirm the page title and login heading render.
- Confirm the page has a `main` landmark.
- Open `/help`.
- Search for `real bank`.
- Expand the matching FAQ.
- Confirm synthetic privacy guidance is visible.
- Open `/contact`.
- Submit a valid synthetic enquiry.
- Confirm the local confirmation is displayed.
- Confirm no external request is made.

### Authentication

Use only the documented synthetic credentials:

```text
Miguel Santos
User ID: user-miguel-santos
Password: NovaDemo123!
```

Verify:

- Valid sign-in navigates to `/dashboard`.
- The dashboard displays the expected synthetic persona.
- The relationship balance is displayed.
- The privacy notice is displayed.
- The support chat button is available.
- Invalid credentials remain on `/login`.
- Logout returns to `/login`.
- Browser history does not expose the authenticated dashboard after logout.

### Account and privacy checks

Verify:

- `/accounts` shows only the active persona's accounts.
- Account identifiers are masked.
- `/accounts/account-miguel-checking` loads for Miguel.
- A different persona's account is reported as unavailable.
- No full account number appears in rendered content.
- Statement download uses a masked account identifier.
- Browser storage contains no password or full account number.

### Catalogue checks

Verify:

- `/products` loads the product catalogue.
- Product category filtering works.
- `/products/product-nova-credit` loads product details.
- The product support action routes to synthetic support.
- `/offers` shows active offers only.
- Claimed offers are excluded.
- Offer category filtering works.
- `/offers/offer-savings-bonus` loads offer details.
- Expressing interest displays local-only confirmation.
- No application or financial action is initiated.

### Session checks

Verify:

- The inactivity warning is displayed after the configured warning interval when tested with controlled timers.
- Continuing the session dismisses the warning.
- An expired session returns the user to login.
- No real session or server-side authentication is involved.

### Routing checks

Open each deep link directly in a new browser tab or context:

```text
/dashboard
/accounts
/accounts/account-miguel-checking
/products
/products/product-nova-credit
/offers
/offers/offer-savings-bonus
/transfers
/payments
/transactions
/profile
/settings
```

Confirm that:

- The host serves `index.html`.
- React Router resolves the route.
- Protected routes redirect unauthenticated visitors to `/login`.
- No host-level 404 page is shown for a valid application route.

## CI/CD checks

A CI pipeline or Vercel deployment check should run the following commands from a clean checkout:

```bash
npm ci
npm run build
npm test
npm run test:e2e
```

The pipeline should fail when any command exits with a non-zero status.

Recommended CI checks:

- Use Node.js 18 or newer.
- Use `npm ci` rather than an unpinned dependency installation.
- Do not provide production secrets.
- Do not allow external network access for tests unless a separate review explicitly changes that requirement.
- Preserve deterministic fixture behavior.
- Upload test reports only as CI artifacts.
- Keep build output out of source control.
- Verify the generated `dist/` directory exists after the build.
- Verify `dist/index.html` exists.
- Verify `vercel.json` remains present and valid.
- Verify the production build contains no unexpected external service configuration.

The existing test suite includes privacy and network checks that should remain part of the release gate.

## Build troubleshooting

### Build fails because dependencies are missing

Run:

```bash
rm -rf node_modules
npm ci
npm run build
```

Do not add dependencies directly to a deployment environment. Update `package.json` and the lockfile through the normal reviewed change process.

### Direct route returns 404

Check:

1. `vercel.json` exists at the repository root.
2. The rewrite destination is `/index.html`.
3. The Vercel output directory is `dist`.
4. The deployment uses the current commit.
5. The request is reaching the Vercel project rather than another proxy or domain.
6. The route is a client-side application route.

Redeploy after correcting the project configuration.

### Vercel cannot find the output directory

Confirm:

```text
Build command: npm run build
Output directory: dist
Root directory: repository root
```

Run locally:

```bash
npm run build
test -f dist/index.html
```

### Preview works but production does not

Compare:

- The deployed commit.
- Vercel project settings.
- Environment variable scopes.
- Root directory.
- Build command.
- Output directory.
- Rewrite configuration.
- Custom domain routing.
- Browser cache.

The application does not require production-only service variables. Environment differences should not be needed for standard functionality.

### Tests fail because of external network access

The application must remain local-only. Investigate any new use of:

- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `EventSource`
- `navigator.sendBeacon`
- External analytics clients
- External banking or support endpoints

Remove the network dependency or replace it with an existing local fixture-backed service.

### Sensitive data appears in the build or browser

Stop deployment and inspect:

- Fixture changes.
- Rendered account display values.
- Browser storage serialization.
- Analytics event properties.
- Diagnostic logging.
- Downloaded statement content.
- Environment variables beginning with `VITE_`.

Passwords, passcodes, full account identifiers, and real personal information must not be included in the application.

## Rollback procedure

If a production deployment fails smoke checks or introduces an unacceptable regression:

1. Stop further promotion.
2. Record the failing deployment URL, commit, and observed behavior.
3. Open the Vercel project deployment history.
4. Identify the most recent known-good deployment.
5. Confirm that the known-good deployment does not contain the failing change.
6. Promote or redeploy the known-good deployment to production.
7. Re-run the post-deployment smoke checks.
8. Confirm deep links and SPA rewrites still work.
9. Confirm login, logout, protected routes, and privacy checks pass.
10. Notify the release owner and record the rollback.
11. Create a follow-up issue for the failed deployment.
12. Do not re-promote the failed commit until the issue is fixed and validated in preview.

A rollback changes the static deployment only. It does not affect real accounts, transactions, banking services, databases, or support systems because none are connected.

## Incident handling

For a deployment incident, capture:

- Production URL.
- Preview or production deployment identifier.
- Source commit.
- Build timestamp.
- Vercel build log URL.
- Browser and viewport used.
- Route where the issue occurred.
- Whether the issue reproduces in a clean browser context.
- Whether the issue reproduces in the local production preview.
- Whether a privacy or network boundary was affected.

Do not include passwords, full account identifiers, personal information, or sensitive browser storage contents in incident tickets.

## No-backend constraints

This application must remain a static, browser-only demonstration unless a separate architecture, security, privacy, compliance, and infrastructure review approves a change.

The application currently does not provide:

- Server-side authentication.
- Server-side sessions.
- Database persistence.
- Real account connectivity.
- Real balance retrieval.
- Real transaction retrieval.
- Transfers.
- Payments.
- Account opening.
- Product applications.
- Offer applications.
- Real support escalation.
- Real notification delivery.
- Third-party analytics transmission.
- Server-side statement generation.
- Server-side file storage.

The following behaviors are intentionally local simulations:

- Authentication against synthetic fixture credentials.
- Session creation and inactivity handling.
- Persona switching.
- Error-mode configuration.
- Account and transaction retrieval.
- Product and offer catalogue access.
- Offer interest recording.
- Support enquiries.
- Chat conversations and escalation.
- Notification read state.
- Statement downloads.
- Analytics event collection.

Do not add a backend endpoint or external integration as a shortcut for deployment configuration. Any future backend proposal requires a separate review of:

- Authentication and authorization.
- Secret management.
- Data classification.
- Encryption.
- Audit logging.
- Threat modeling.
- Privacy and retention.
- Financial and regulatory obligations.
- Availability and disaster recovery.
- Network security.
- Monitoring and alerting.

## Release record

For each production deployment, record:

```text
Application: Nova Bank Demo
Version:
Deployment ID:
Source commit:
Branch:
Build timestamp:
Vercel deployment URL:
Production URL:
Validation result:
Smoke checks:
Approver:
Rollback required: No
```

The production deployment is considered complete only when the build, automated tests, SPA routing, privacy boundaries, accessibility checks, and post-deployment smoke checks all pass.