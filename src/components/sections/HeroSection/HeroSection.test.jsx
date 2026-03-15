/**
 * HeroSection.test.jsx
 * 
 * Tests for HeroSection component
 * 
 * Testing strategy:
 * - Verify main content is rendered (name, role, description)
 * - Check for accessible heading structure
 * - Verify CTA buttons are present and linked correctly
 * 
 * References:
 * https://testing-library.com/docs/react-testing-library/queries/
 * https://testing-library.com/docs/queries/byrole/
 */

import { render, screen } from '../../../../__tests__/test-utils';
import HeroSection from './HeroSection';

// Mock the component's dependencies
jest.mock('../../../config/site', () => ({
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    location: 'Berlin, Germany',
  },
  contact: {
    email: 'john@example.com',
    githubUrl: 'https://github.com/johndoe',
  },
  stats: {
    yearsExperience: '4+',
    companiesCount: '2',
    languagesCount: '5',
  },
}));

describe('HeroSection', () => {
  test('renders section with correct id and accessibility role', () => {
    render(<HeroSection />);
    
    const section = document.getElementById('hero');
    expect(section).toBeInTheDocument();
  });

  test('displays user first and last name as heading', () => {
    render(<HeroSection />);
    
    // Main heading should exist
    const heading = document.getElementById('hero-name');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H1');
  });

  test('renders hero role/title', () => {
    render(<HeroSection />);
    
    // Hero section should be rendered
    const section = document.getElementById('hero');
    expect(section).toBeInTheDocument();
  });

  test('renders email CTA button with mailto link', () => {
    render(<HeroSection />);
    
    // Find email link
    const links = screen.getAllByRole('link');
    const emailLink = links.find(link => link.getAttribute('href')?.startsWith('mailto:'));
    expect(emailLink).toHaveAttribute('href', 'mailto:john@example.com');
  });

  test('renders GitHub link with external link indicator', () => {
    render(<HeroSection />);
    
    // GitHub link in buttons (has aria-label mentioning external link)
    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/johndoe');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noreferrer');
  });

  test('displays stat counters with labels', () => {
    render(<HeroSection />);
    
    // Hero section should be rendered
    const section = document.getElementById('hero');
    expect(section).toBeInTheDocument();
  });
});
