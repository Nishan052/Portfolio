/**
 * Jest config for the Node-side ingestion/sync scripts.
 *
 * Separate from the root config on purpose: these are plain Node CLI modules,
 * so they run in the `node` environment and must not pull in the root config's
 * jsdom setup (__tests__/setup.js mocks three.js and other browser-only deps
 * that are irrelevant here).
 *
 * Run with: npm run test:kb
 */
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/scripts/**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['<rootDir>/scripts/lib/**/*.js', '!**/__tests__/**'],
  verbose: true,
};
