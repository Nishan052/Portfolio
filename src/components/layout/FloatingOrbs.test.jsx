/**
 * FloatingOrbs.test.jsx
 * 
 * Tests for FloatingOrbs visual component
 * 
 * References:
 * https://testing-library.com/docs/react-testing-library/api/#render
 */

import { render } from '../../../__tests__/test-utils';
import FloatingOrbs from './FloatingOrbs';

describe('FloatingOrbs', () => {
  test('renders two orbs', () => {
    const { container } = render(<FloatingOrbs isDark={false} />);
    
    const orbs = container.querySelectorAll('.orb');
    expect(orbs).toHaveLength(2);
  });

  test('applies dark mode background colors when isDark is true', () => {
    const { container } = render(<FloatingOrbs isDark={true} />);
    
    const orbs = container.querySelectorAll('.orb');
    
    // First orb should have dark cyan
    expect(orbs[0]).toHaveStyle('background: rgba(0,229,255,0.025)');
    
    // Second orb should have dark purple
    expect(orbs[1]).toHaveStyle('background: rgba(168,85,247,0.03)');
  });

  test('applies light mode background colors when isDark is false', () => {
    const { container } = render(<FloatingOrbs isDark={false} />);
    
    const orbs = container.querySelectorAll('.orb');
    
    // First orb should have light blue
    expect(orbs[0]).toHaveStyle('background: rgba(37,99,235,0.04)');
    
    // Second orb should have light purple
    expect(orbs[1]).toHaveStyle('background: rgba(124,58,237,0.04)');
  });

  test('sets correct dimensions', () => {
    const { container } = render(<FloatingOrbs isDark={false} />);
    
    const orbs = container.querySelectorAll('.orb');
    
    // First orb: 460x460
    expect(orbs[0]).toHaveStyle('width: 460px');
    expect(orbs[0]).toHaveStyle('height: 460px');
    
    // Second orb: 360x360
    expect(orbs[1]).toHaveStyle('width: 360px');
    expect(orbs[1]).toHaveStyle('height: 360px');
  });
});
