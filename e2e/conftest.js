import { test as base, expect } from '@playwright/test';

const DESKTOP_VIEWPORT = Object.freeze({
  width: 1440,
  height: 900,
});

const SYNTHETIC_CREDENTIALS = Object.freeze({
  userId: 'user-miguel-santos',
  password: 'NovaDemo123!',
});

function getRequestOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

function isSameOriginRequest(requestUrl, baseURL) {
  const requestOrigin = getRequestOrigin(requestUrl);

  if (!requestOrigin) {
    return true;
  }

  if (!baseURL) {
    return requestOrigin === 'http://127.0.0.1:4173' ||
      requestOrigin === 'http://localhost:4173';
  }

  return requestOrigin === getRequestOrigin(baseURL);
}

const test = base.extend({
  viewport: [DESKTOP_VIEWPORT, { option: true }],

  syntheticCredentials: async ({}, use) => {
    await use(SYNTHETIC_CREDENTIALS);
  },

  credentials: async ({ syntheticCredentials }, use) => {
    await use(syntheticCredentials);
  },

  networkRequests: async ({}, use) => {
    const requests = [];
    await use(requests);
  },

  assertNoNetworkRequests: async ({ networkRequests }, use, testInfo) => {
    await use(() => {
      if (networkRequests.length === 0) {
        return;
      }

      const requestList = networkRequests
        .map((request) => `${request.method} ${request.url}`)
        .join('\n');

      throw new Error(
        `Unexpected external network requests were made during "${testInfo.title}":\n${requestList}`,
      );
    });
  },

  context: async ({ browser, baseURL, viewport, networkRequests }, use) => {
    const context = await browser.newContext({
      baseURL,
      viewport,
    });

    await context.addInitScript(() => {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {
        // Storage may be unavailable before the page origin is established.
      }
    });

    await context.route('**/*', async (route) => {
      const request = route.request();

      if (isSameOriginRequest(request.url(), baseURL)) {
        await route.continue();
        return;
      }

      networkRequests.push({
        method: request.method(),
        resourceType: request.resourceType(),
        url: request.url(),
      });

      await route.abort('blockedbyclient');
    });

    await use(context);
    await context.close();
  },

  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {
        // Storage may be unavailable before the page origin is established.
      }
    });

    await use(page);
  },
});

export {
  DESKTOP_VIEWPORT,
  SYNTHETIC_CREDENTIALS,
  test,
  expect,
};

export default test;