import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatMarkdown from './ChatMarkdown';

describe('ChatMarkdown', () => {
  test('bold renders as bold, with no asterisks left over', () => {
    const { container } = render(
      <ChatMarkdown text={'The latest post is **One layer decides**, from September.'} />);
    expect(container.querySelector('strong').textContent).toBe('One layer decides');
    expect(container.textContent).not.toContain('**');
  });

  test('a bulleted list becomes a list', () => {
    const { container } = render(<ChatMarkdown text={'- first\n- second'} />);
    expect(container.querySelectorAll('ul li')).toHaveLength(2);
  });

  test('an unfinished marker mid-stream stays plain text', () => {
    const { container } = render(<ChatMarkdown text={'The latest post is **One lay'} />);
    expect(container.querySelector('strong')).toBeNull();
    expect(container.textContent).toContain('**One lay');
  });

  test('links open safely, and a script link is not a link', () => {
    render(<ChatMarkdown text={'[post](https://nishanpoojary.com/blogs/x) and [bad](javascript:alert(1))'} />);
    const link = screen.getByText('post');
    expect(link.getAttribute('href')).toBe('https://nishanpoojary.com/blogs/x');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(screen.getByText(/bad/).closest('a')).toBeNull();
  });

  test('the email becomes a mailto link, but a dressed-up one does not', () => {
    // The prompt asks for the address as a link; before mailto was allowed it
    // rendered as plain text. A mailto carrying a subject/body or a second
    // recipient is not a plain address, so it stays text.
    const { container } = render(<ChatMarkdown text={
      'Reach him at [nishan@example.com](mailto:nishan@example.com), not ' +
      '[this](mailto:nishan@example.com?subject=Hi&body=x) or ' +
      '[that](mailto:a@example.com,b@example.com)'} />);
    const links = [...container.querySelectorAll('a')];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('mailto:nishan@example.com');
    // The rejected ones still read as text, they just are not clickable.
    expect(container.textContent).toContain('this');
    expect(container.textContent).toContain('that');
  });

  test('the shape the model really writes: heading, bullets, indented notes', () => {
    // Copied from a production answer. Every line of it used to need to be a
    // bullet for the block to count as a list, so this rendered a literal "- ".
    const answer = '**Edge AI series (most recent first)**  \n' +
      '- **“Reading a model file”** – 2026-09-29  \n' +
      '  *Reads the operator list with no dependencies.*\n' +
      '- **“One layer decides”** – 2026-09-22  \n' +
      '  *Where the compiler splits the graph.*';
    const { container } = render(<ChatMarkdown text={answer} />);
    const items = container.querySelectorAll('ul li');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('em').textContent).toBe('Reads the operator list with no dependencies.');
    expect(container.querySelector('p strong').textContent).toBe('Edge AI series (most recent first)');
    expect(container.textContent).not.toMatch(/(^|\s)- /);
  });

  test('model output cannot inject HTML', () => {
    const { container } = render(<ChatMarkdown text={'<img src=x onerror=alert(1)>'} />);
    expect(container.querySelector('img')).toBeNull();
  });
});
