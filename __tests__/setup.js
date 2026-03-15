/**
 * __tests__/setup.js - Test environment setup
 * 
 * This file is run before all tests to:
 * - Set up global test utilities
 * - Configure mocks
 * - Initialize environment
 * - Configure i18n for React component tests
 */

import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.GROQ_API_KEY = 'test-key-12345';
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.PINECONE_API_KEY = 'test-pinecone-key';

// Initialize i18n for tests
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        // Header translations
        'header.home': 'Home',
        'header.about': 'About',
        'header.projects': 'Projects',
        'header.skills': 'Skills',
        'header.experience': 'Experience',
        'header.contact': 'Contact',
        
        // Footer translations
        'footer.built': 'Built with',
        'footer.by': 'by Nishan Poojary',
        
        // Contact translations
        'email': 'Email',
        'location': 'Location',
        'languages': 'Languages',
        'education': 'Education',
        'background': 'Background',
        
        // Hero translations
        'hero.title': 'Full Stack Developer',
        'hero.description': 'Building intelligent solutions',
        
        // Chat translations
        'chat.header': 'AI Assistant',
        'chat.headerSub': 'Ask me anything',
        'chat.welcome': 'Welcome! How can I help you today?',
        'chat.faqLabel': 'Suggested questions:',
        'chat.faq': [
          'What is your experience?',
          'What projects have you built?',
          'What are your skills?',
        ],
        'chat.retry': 'Retry',
        'chat.errorDefault': 'Something went wrong. Please try again.',
        'chat.errorConnection': 'Connection error. Please check your internet.',
        
        // Accessibility translations
        'a11y.closeChat': 'Close chat',
        'a11y.chatMessages': 'Chat messages',
        'a11y.chatFAQ': 'Frequently asked questions',
      },
    },
    de: {
      translation: {
        'header.home': 'Startseite',
        'header.about': 'Über',
        'header.projects': 'Projekte',
        'header.skills': 'Fähigkeiten',
        'header.experience': 'Erfahrung',
        'header.contact': 'Kontakt',
      },
    },
  },
  react: {
    useSuspense: false,
  },
});

// Mock THREE.WebGLRenderer for tests
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    setPixelRatio: jest.fn(),
    setSize: jest.fn(),
    setClearColor: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    domElement: document.createElement('canvas'),
  })),
  PerspectiveCamera: jest.fn().mockImplementation(() => ({
    position: { z: 30 },
    updateProjectionMatrix: jest.fn(),
  })),
  Scene: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    fog: null,
  })),
  BufferGeometry: jest.fn().mockImplementation(() => ({
    setAttribute: jest.fn(),
  })),
  BufferAttribute: jest.fn().mockImplementation((array) => array),
  Points: jest.fn().mockImplementation(() => ({
    rotation: { x: 0, y: 0 },
  })),
  PointsMaterial: jest.fn().mockImplementation(() => ({})),
}));

// Mock Element.prototype.scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Global test utilities
global.testUtils = {
  /**
   * Sleep for specified milliseconds
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Create a mock fetch response
   */
  mockFetchResponse: (data, status = 200) => ({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Map(),
  }),
  
  /**
   * Create mock environment variables
   */
  mockEnv: (overrides = {}) => ({
    GROQ_API_KEY: 'test-groq-key',
    UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    PINECONE_API_KEY: 'test-pinecone',
    ...overrides,
  }),
};

// Suppress console errors during tests (but log for debugging)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  global.originalError = originalError;
  global.originalWarn = originalWarn;
  // Suppress specific warnings in tests
  console.error = jest.fn((...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOM.render') ||
        args[0].includes('useLayoutEffect') ||
        args[0].includes('Warning: useTransition'))
    ) {
      return;
    }
    originalError(...args);
  });
  console.warn = jest.fn((...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('findDOMNode'))
    ) {
      return;
    }
    originalWarn(...args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
