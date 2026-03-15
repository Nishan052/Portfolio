/**
 * ExperienceSection.test.jsx
 * 
 * Tests for ExperienceSection component
 * 
 * Testing strategy:
 * - Verify section heading and aria-labelledby
 * - Check experience cards are rendered
 * - Test sub-roles display (if present)
 * - Verify skill pills are shown
 * - Test accessibility (semantic HTML with section, article roles)
 * 
 * References:
 * https://testing-library.com/docs/react-testing-library/queries/
 * https://testing-library.com/docs/queries/bylabeled/
 */

import { render, screen } from '../../../../__tests__/test-utils';
import ExperienceSection from './ExperienceSection';

// Mock the experience data
jest.mock('../../../data/experience.json', () => [
  {
    company: 'Tech Corp',
    role: 'Senior Developer',
    period: 'Jan 2022',
    end: 'Present',
    duration: '2+ years',
    location: 'Berlin, Germany',
    skills: ['React', 'Node.js', 'Python'],
    subRoles: [
      { title: 'Lead Developer', period: 'Jan 2023 - Present' },
    ],
  },
  {
    company: 'Startup Inc',
    role: 'Full Stack Developer',
    period: 'Jun 2020',
    end: 'Dec 2021',
    duration: '1.5+ years',
    location: 'Remote',
    skills: ['JavaScript', 'MongoDB'],
  },
]);

describe('ExperienceSection', () => {
  test('renders with correct section id and aria-labelledby', () => {
    render(<ExperienceSection />);
    
    const section = document.getElementById('experience');
    expect(section).toHaveAttribute('aria-labelledby', 'experience-heading');
  });

  test('displays section heading', () => {
    render(<ExperienceSection />);
    
    const heading = document.getElementById('experience-heading');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  test('renders experience cards for each item', () => {
    render(<ExperienceSection />);
    
    // Both companies should be visible
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Startup Inc')).toBeInTheDocument();
    
    // Both roles should be visible
    expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
  });

  test('renders location information', () => {
    render(<ExperienceSection />);
    
    expect(screen.getByText(/Berlin, Germany/i)).toBeInTheDocument();
    expect(screen.getByText(/Remote/i)).toBeInTheDocument();
  });

  test('renders skill pills', () => {
    render(<ExperienceSection />);
    
    // Skills should be visible
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    
    const skillPills = document.querySelectorAll('.skill-pill');
    expect(skillPills.length).toBeGreaterThan(0);
  });

  test('renders section tag', () => {
    render(<ExperienceSection />);
    
    // Section tag should exist
    const tagElements = document.querySelectorAll('.section-tag');
    expect(tagElements.length).toBeGreaterThan(0);
  });

  test('renders experience as list', () => {
    render(<ExperienceSection />);
    
    // Experience list should have multiple articles
    const expCards = document.querySelectorAll('.exp-card');
    expect(expCards.length).toBe(2);
  });

  test('has accessible structure with article elements', () => {
    render(<ExperienceSection />);
    
    const section = document.getElementById('experience');
    expect(section).toBeInTheDocument();
    
    const articles = section.querySelectorAll('article');
    expect(articles.length).toBe(2);
  });
});
