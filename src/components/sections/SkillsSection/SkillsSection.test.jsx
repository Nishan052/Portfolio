/**
 * SkillsSection.test.jsx
 * 
 * Tests for SkillsSection component
 * 
 * Testing strategy:
 * - Verify section heading and aria-labelledby
 * - Check skill categories render
 * - Verify skills are displayed with icons
 * - Test certifications are shown
 * - Verify accessibility (semantic HTML)
 * 
 * References:
 * https://testing-library.com/docs/react-testing-library/queries/
 * https://testing-library.com/docs/queries/bylabeled/
 */

import { render, screen } from '../../../../__tests__/test-utils';
import SkillsSection from './SkillsSection';

// Mock the skills data
jest.mock('../../../data/skills.json', () => ({
  categories: [
    {
      skills: [
        { name: 'Python' },
        { name: 'SQL' },
        { name: 'TensorFlow' },
      ],
    },
    {
      skills: [
        { name: 'React' },
        { name: 'TypeScript' },
        { name: 'Node.js' },
      ],
    },
  ],
  certifications: [
    {
      title: 'AWS Solutions Architect',
      org: 'Amazon Web Services',
    },
    {
      title: 'Google Cloud Certificate',
      org: 'Google Cloud',
    },
  ],
}));

describe('SkillsSection', () => {
  test('renders with correct section id and aria-labelledby', () => {
    render(<SkillsSection />);
    
    const section = document.getElementById('skills');
    expect(section).toHaveAttribute('aria-labelledby', 'skills-heading');
  });

  test('displays section heading', () => {
    render(<SkillsSection />);
    
    const heading = document.getElementById('skills-heading');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  test('renders skill categories', () => {
    render(<SkillsSection />);
    
    // Category labels should be visible
    const categoryLabels = document.querySelectorAll('.skills-category-label');
    expect(categoryLabels.length).toBeGreaterThan(0);
  });

  test('renders individual skills', () => {
    render(<SkillsSection />);
    
    // All skills should be visible
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  test('renders skill items as list', () => {
    render(<SkillsSection />);
    
    // Skill items should be in lists
    const skillItems = document.querySelectorAll('.skill-item');
    expect(skillItems.length).toBeGreaterThan(0);
  });

  test('renders certifications', () => {
    render(<SkillsSection />);
    
    // Certification titles should be visible
    expect(screen.getByText('AWS Solutions Architect')).toBeInTheDocument();
    expect(screen.getByText('Google Cloud Certificate')).toBeInTheDocument();
  });

  test('renders certification organizations', () => {
    render(<SkillsSection />);
    
    // Organizations should be visible
    expect(screen.getByText('Amazon Web Services')).toBeInTheDocument();
    expect(screen.getByText('Google Cloud')).toBeInTheDocument();
  });

  test('renders certification cards', () => {
    render(<SkillsSection />);
    
    const certCards = document.querySelectorAll('.cert-card');
    expect(certCards.length).toBe(2);
  });

  test('renders section tag', () => {
    render(<SkillsSection />);
    
    // Section tag should be visible or element should exist
    const tagElements = document.querySelectorAll('.section-tag');
    expect(tagElements.length).toBeGreaterThan(0);
  });

  test('has accessible structure', () => {
    render(<SkillsSection />);
    
    const section = document.getElementById('skills');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'skills-heading');
  });
});
