import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './tests/results',
  snapshotDir: './tests/snapshots',
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    {
      name: 'visual',
      testMatch: /visual\/.*\.spec\.js/,
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: 'npm run preview:solo',
    port: 4173,
    reuseExistingServer: true,
  },
});
