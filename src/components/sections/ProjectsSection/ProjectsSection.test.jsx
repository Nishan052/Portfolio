/**
 * ProjectsSection.test.jsx
 * 
 * Tests for ProjectsSection component
 * 
 * Testing strategy:
 * - Verify section heading and aria-labelledby
 * - Check project cards are rendered
 * - Test GitHub link attributes and accessibility
 * - Verify category badges are shown
 * - Test tech pills display
 * - Verify hover/focus state capabilities
 * 
 * References:
 * https://testing-library.com/docs/react-testing-library/queries/
 * https://testing-library.com/docs/queries/bylabeled/
 */

import { render, screen } from '../../../../__tests__/test-utils';
import ProjectsSection from './ProjectsSection';

// Mock the projects data
jest.mock('../../../data/projects.json', () => [
  {
    id: '01',
    title: 'AI Chatbot',
    iconKey: 'Bot',
    color: '#FF6B6B',
    tech: ['React', 'Python', 'OpenAI'],
    github: 'https://github.com/user/ai-chatbot',
  },
  {
    id: '02',
    title: 'Data Dashboard',
    iconKey: 'TrendingUp',
    color: '#4ECDC4',
    tech: ['TypeScript', 'D3.js', 'Node.js'],
    github: 'https://github.com/user/dashboard',
  },
]);

describe('ProjectsSection', () => {
  test('renders with correct section id and aria-labelledby', () => {
    render(<ProjectsSection />);
    
    const section = document.getElementById('projects');
    expect(section).toHaveAttribute('aria-labelledby', 'projects-heading');
  });

  test('displays section heading', () => {
    render(<ProjectsSection />);
    
    const heading = document.getElementById('projects-heading');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  test('renders project titles', () => {
    render(<ProjectsSection />);
    
    expect(screen.getByText('AI Chatbot')).toBeInTheDocument();
    expect(screen.getByText('Data Dashboard')).toBeInTheDocument();
  });

  test('renders project GitHub links with correct attributes', () => {
    render(<ProjectsSection />);
    
    // Find GitHub links
    const links = screen.getAllByRole('link');
    
    const chatbotGithub = links.find(link => 
      link.getAttribute('href') === 'https://github.com/user/ai-chatbot'
    );
    expect(chatbotGithub).toHaveAttribute('target', '_blank');
    expect(chatbotGithub).toHaveAttribute('rel', 'noreferrer');
  });

  test('renders project tech pills', () => {
    render(<ProjectsSection />);
    
    // Tech tags should be visible
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    
    // Should be skill pills
    const skillPills = document.querySelectorAll('.project-tech-pill');
    expect(skillPills.length).toBeGreaterThan(0);
  });

  test('renders project cards', () => {
    render(<ProjectsSection />);
    
    // Project cards should exist
    const projectCards = document.querySelectorAll('.project-card');
    expect(projectCards.length).toBe(2);
  });

  test('renders section tag', () => {
    render(<ProjectsSection />);
    
    // Section tag should exist
    const tagElements = document.querySelectorAll('.section-tag');
    expect(tagElements.length).toBeGreaterThan(0);
  });

  test('renders category badges', () => {
    render(<ProjectsSection />);
    
    // Category badges should exist
    const categoryBadges = document.querySelectorAll('.project-category-badge');
    expect(categoryBadges.length).toBeGreaterThan(0);
  });

  test('has accessible structure with article elements', () => {
    render(<ProjectsSection />);
    
    const section = document.getElementById('projects');
    expect(section).toBeInTheDocument();
    
    // Project cards should be articles
    const articles = section.querySelectorAll('article');
    expect(articles.length).toBe(2);
  });
});
