import base from './playwright.config';
import { devices } from '@playwright/test';

// The same storefront suite across engines and devices — `npm run test:e2e:browsers`.
// Local only: CI keeps to Chromium. Needs the engines once:
//   npx playwright install firefox webkit
export default {
  ...base,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
};
