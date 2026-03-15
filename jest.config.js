/**
 * jest.config.js - Jest configuration for unit and integration tests
 * 
 * Configuration includes:
 * - Test environment setup
 * - Coverage thresholds
 * - Module name mapping
 * - Test file patterns
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/*.test.js',
    '**/*.spec.js',
  ],
  
  // Coverage thresholds
  collectCoverageFrom: [
    'src/**/*.js',
    'functions/**/*.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/__tests__/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Critical backend modules must have higher coverage
    './functions/api/lib/structured-logger.js': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './functions/api/lib/quality-detectors.js': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@lib/(.*)$': '<rootDir>/functions/api/lib/$1',
    '^@tests/(.*)$': '<rootDir>/__tests__/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  
  // Transform files
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
};
