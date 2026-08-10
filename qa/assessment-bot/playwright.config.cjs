const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'assessment-bot.spec.cjs',
  timeout: 180000,
  expect: { timeout: 20000 },
  retries: 0,
  workers: 1,
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.ASSESSMENT_URL || 'https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026/evaluacion-conteo-permutaciones/',
    headless: false,
    viewport: { width: 1440, height: 1000 },
    actionTimeout: 20000,
    navigationTimeout: 30000,
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure'
  }
});
