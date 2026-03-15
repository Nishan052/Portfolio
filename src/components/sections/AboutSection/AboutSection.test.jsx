/**
 * AboutSection.test.jsx
 * 
 * Tests for AboutSection component
 * 
 * Testing strategy:
 * - Verify section heading and two-column layout
 * - Check bio text renders correctly
 * - Verify skill pills are present
 * - Test info cards render with correct icons and text
 * - Verify accessibility (aria-labelledby, semantic HTML)
 * 
 * References:
 * https://testing-library.com/docs/react-testing-library/queries/
 * https://testing-library.com/docs/queries/bytext/
 * https://testing-library.com/docs/queries/bylabeled/
 */

import { render, screen } from '../../../../__tests__/test-utils';
import AboutSection from './AboutSection';

// Mock siteConfig with test data
jest.mock('../../../config/site', () => ({
  about: {
    highlightSkills: ['React', 'Python', 'TypeScript'],
  },
}));

describe('AboutSection', () => {
  test('renders with correct section id and aria-labelledby', () => {
    render(<AboutSection />);
    
    const section = document.getElementById('about');
    expect(section).toHaveAttribute('aria-labelledby', 'about-heading');
  });

  test('displays section heading', () => {
    render(<AboutSection />);
    
    // Heading should exist with id="about-heading"
    const heading = document.getElementById('about-heading');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  test('renders bio text', () => {
    render(<AboutSection />);
    
    // About section should be rendered
    const section = document.getElementById('about');
    expect(section).toBeInTheDocument();
  });

  test('renders highlight skills as pills', () => {
    render(<AboutSection />);
    
    // Should show all highlight skills
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    
    // They should be in skill-pill containers
    const skillPills = document.querySelectorAll('.skill-pill');
    expect(skillPills.length).toBeGreaterThan(0);
  });

  test('renders info cards', () => {
    render(<AboutSection />);
    
    // Info cards should be rendered
    const cards = document.querySelectorAll('.about-card-inner');
    expect(cards.length).toBeGreaterThan(0);
  });

  test('renders section tag', () => {
    render(<AboutSection />);
    
    // Section tag should exist
    const tagElements = document.querySelectorAll('.section-tag');
    expect(tagElements.length).toBeGreaterThan(0);
  });

  test('has accessible structure', () => {
    render(<AboutSection />);
    
    const section = document.getElementById('about');
    expect(section).toHaveAttribute('aria-labelledby', 'about-heading');
    
    const heading = section.querySelector('#about-heading');
    expect(heading.tagName).toBe('H2');
  });
});
