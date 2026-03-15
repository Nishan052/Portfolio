/**
 * __tests__/test-utils.js - Testing utilities for React component testing
 * 
 * Provides helper functions to render components with necessary providers
 * (i18n, Router, etc.)
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Mock scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = jest.fn();

// Lazy load BrowserRouter to avoid import issues in certain test environments
let BrowserRouter;
try {
  const RouterModule = require('react-router-dom');
  BrowserRouter = RouterModule.BrowserRouter;
} catch (e) {
  // Fallback if BrowserRouter is not available
  BrowserRouter = ({ children }) => children;
}

// Ensure i18n is initialized for tests
if (!i18n.isInitialized) {
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
          header: {
            home: 'Home',
            about: 'About',
            projects: 'Projects',
            skills: 'Skills',
            experience: 'Experience',
            contact: 'Contact',
          },
          footer: {
            built: 'Built with',
            by: 'by Nishan Poojary',
          },
          email: 'Email',
          location: 'Location',
          languages: 'Languages',
          education: 'Education',
          background: 'Background',
          hero: {
            title: 'Full Stack Developer',
            description: 'Building intelligent solutions',
          },
          chat: {
            header: 'AI Assistant',
            headerSub: 'Ask me anything',
            welcome: 'Welcome! How can I help you today?',
            faqLabel: 'Suggested questions:',
            faq: [
              'What is your experience?',
              'What projects have you built?',
              'What are your skills?',
            ],
            retry: 'Retry',
            errorDefault: 'Something went wrong. Please try again.',
            errorConnection: 'Connection error. Please check your internet.',
          },
          a11y: {
            closeChat: 'Close chat',
            chatMessages: 'Chat messages',
            chatFAQ: 'Frequently asked questions',
          },
          about: {
            title: ['The Person', 'Behind the Code'],
            cards: [
              { icon: 'graduation', title: 'Education', desc: 'MEng Business Intelligence' },
              { icon: 'background', title: 'Background', desc: '4+ years experience' },
              { icon: 'languages', title: 'Languages', desc: 'English, German, Kannada' },
              { icon: 'focus', title: 'Focus Areas', desc: 'ML/AI, Data Analytics' }
            ],
          },
          skills: {
            tag: '// technical skills',
            title: 'My Toolkit',
            certifications: 'Certifications',
            categoryNames: ['Data & ML', 'Frontend & Backend', 'Tools & DevOps'],
          },
        },
      },
      de: {
        translation: {},
      },
    },
    react: {
      useSuspense: false,
    },
  });
}

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  component,
  {
    route = '/',
    ...renderOptions
  } = {}
) {
  // Set the initial route
  if (typeof window !== 'undefined') {
    window.history.pushState({}, 'Test page', route);
  }

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );

  return render(component, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Re-export everything from @testing-library/react
 */
export * from '@testing-library/react';

/**
 * Override render with our custom render
 */
export { renderWithProviders as render };
