import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', timeout: 30_000, workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173', viewport: { width: 440, height: 956 },
    launchOptions: process.env.LINK_ON_CHROME ? { executablePath: process.env.LINK_ON_CHROME } : {},
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173', reuseExistingServer: true,
  },
});
