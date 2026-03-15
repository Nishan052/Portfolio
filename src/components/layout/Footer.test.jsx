/**
 * Footer.test.jsx
 * 
 * Tests for Footer component
 * 
 * Following React Testing Library best practices:
 * - Test user behavior, not implementation
 * - Use semantic queries (getByRole, getByText)
 * - Avoid testing internal state
 * 
 * References:
 * https://testing-library.com/docs/react-testing-library/intro/
 * https://testing-library.com/docs/queries/about/
 */

import { render, screen } from '../../../__tests__/test-utils';
import Footer from './Footer';

describe('Footer', () => {
  test('renders copyright text with year', () => {
    render(<Footer />);
    
    // Footer contains copyright with the current year
    // Using getByText to find content visible to users
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  test('renders location information', () => {
    render(<Footer />);
    
    // Footer should display location (from siteConfig)
    expect(screen.getByText(/Berlin, Germany/i)).toBeInTheDocument();
  });

  test('renders with contentinfo role for accessibility', () => {
    render(<Footer />);
    
    // Footer should be semantically marked as contentinfo
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  test('renders translated text', () => {
    render(<Footer />);
    
    // Footer uses i18n for "Built with" and "by" text
    expect(screen.getByText(/Built with/i)).toBeInTheDocument();
  });
});
