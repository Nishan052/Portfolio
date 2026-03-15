/**
 * ContactSection.test.jsx
 * 
 * Tests for ContactSection component
 * 
 * Testing strategy:
 * - Verify section heading and title
 * - Check that contact links are present and correctly configured
 * - Verify external links have proper attributes
 * - Test accessibility (aria-labels, roles)
 * 
 * References:
 * https://testing-library.com/docs/react-testing-library/queries/
 * https://testing-library.com/docs/queries/bytext/
 * https://testing-library.com/docs/queries/bylabeled/
 */

import { render, screen } from '../../../../__tests__/test-utils';
import ContactSection from './ContactSection';

// Mock siteConfig with test data
jest.mock('../../../config/site', () => ({
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    location: 'Berlin, Germany',
  },
  contact: {
    email: 'john@example.com',
    phone: '+49 123 456789',
    phoneHref: 'tel:+49123456789',
    github: 'github.com/johndoe',
    githubUrl: 'https://github.com/johndoe',
    linkedin: 'linkedin.com/in/johndoe',
    linkedinUrl: 'https://www.linkedin.com/in/johndoe/',
  },
}));

describe('ContactSection', () => {
  test('renders with correct section id and aria-labelledby', () => {
    render(<ContactSection />);
    
    const section = document.getElementById('contact');
    expect(section).toHaveAttribute('aria-labelledby', 'contact-heading');
  });

  test('renders section heading', () => {
    render(<ContactSection />);
    
    // Main section heading should exist
    const heading = document.getElementById('contact-heading');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  test('renders email contact link', () => {
    render(<ContactSection />);
    
    // Email should be a link
    const emailLink = screen.getByRole('link', { name: /john@example.com/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:john@example.com');
    expect(emailLink).not.toHaveAttribute('target'); // not external
  });

  test('renders phone contact link', () => {
    render(<ContactSection />);
    
    // Phone should be a link
    const phoneLink = screen.getByRole('link', { name: /\+49 123 456789/i });
    expect(phoneLink).toHaveAttribute('href', 'tel:+49123456789');
  });

  test('renders GitHub external link with proper attributes', () => {
    render(<ContactSection />);
    
    // GitHub link should open in new tab
    const githubLink = screen.getByRole('link', { name: /github\.com\/johndoe/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/johndoe');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noreferrer');
  });

  test('renders LinkedIn external link with proper attributes', () => {
    render(<ContactSection />);
    
    // LinkedIn link should open in new tab
    const linkedinLink = screen.getByRole('link', { name: /linkedin\.com\/in\/johndoe/i });
    expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/johndoe/');
    expect(linkedinLink).toHaveAttribute('target', '_blank');
    expect(linkedinLink).toHaveAttribute('rel', 'noreferrer');
  });

  test('renders location as non-interactive text', () => {
    render(<ContactSection />);
    
    // Location should be visible but not a link
    expect(screen.getByText(/Berlin, Germany/i)).toBeInTheDocument();
    
    // Should not be a link
    const links = screen.getAllByRole('link');
    const locationLink = links.find(link => 
      link.textContent.includes('Berlin, Germany')
    );
    expect(locationLink).toBeUndefined();
  });

  test('has proper heading structure', () => {
    render(<ContactSection />);
    
    const heading = screen.getByRole('heading', { level: 2 });
    const headingId = heading.getAttribute('id');
    
    // Section should reference the heading with aria-labelledby
    const section = document.getElementById('contact');
    expect(section).toHaveAttribute('aria-labelledby', 'contact-heading');
  });
});
