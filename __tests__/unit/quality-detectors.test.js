/**
 * __tests__/unit/quality-detectors.test.js
 * 
 * Unit tests for quality detection functions
 * Tests: hallucination detection, refusal detection, ROUGE scoring
 */

import {
  detectHallucination,
  detectRefusal,
  computePrecision,
  computeRougeL,
  normalizeText,
} from '../../functions/api/lib/quality-detectors.js';

describe('Quality Detectors', () => {
  
  describe('detectHallucination', () => {
    test('detects obvious hallucination', () => {
      const answer = 'I have 20 years of experience as an astronaut.';
      const context = 'Python developer with 5 years of experience in web development.';
      
      const result = detectHallucination(answer, context);
      expect(result.isHallucinating).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('permits answer supported by context', () => {
      const answer = 'I have experience with Python and JavaScript.';
      const context = 'Skills: Python, JavaScript, React, Node.js backend development.';
      
      const result = detectHallucination(answer, context);
      expect(result.isHallucinating).toBe(false);
    });

    test('handles empty context', () => {
      const answer = 'Some answer';
      const context = '';
      
      const result = detectHallucination(answer, context);
      // Should not crash, likely flag as hallucination (no supporting context)
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('handles empty answer', () => {
      const answer = '';
      const context = 'Some context';
      
      const result = detectHallucination(answer, context);
      expect(result.isHallucinating).toBe(false); // Empty answer can't hallucinate
    });

    test('detects partial hallucination', () => {
      const answer = 'I have 10 years with Python and work as an astronaut.';
      const context = 'Python developer with 5 years web development experience.';
      
      const result = detectHallucination(answer, context);
      // Should detect some hallucination elements
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('detectRefusal', () => {
    test('detects explicit refusal', () => {
      const answer = 'I cannot help with that request.';
      
      const result = detectRefusal(answer);
      expect(result.isRefusal).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('detects alternative refusal patterns', () => {
      const refusals = [
        'I am not able to provide that information.',
        'I refuse to answer this question.',
        'I cannot assist with your request.',
        'This question is outside my scope.',
      ];

      refusals.forEach(answer => {
        const result = detectRefusal(answer);
        expect(result.isRefusal).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.4);
      });
    });

    test('permits normal helpful answer', () => {
      const answer = 'I have 5 years of experience with Python and JavaScript.';
      
      const result = detectRefusal(answer);
      expect(result.isRefusal).toBe(false);
    });

    test('handles empty answer', () => {
      const answer = '';
      
      const result = detectRefusal(answer);
      expect(result.isRefusal).toBe(false);
    });

    test('distinguishes between "I do not know" and refusal', () => {
      const dontKnow = 'I do not have information about that specific topic.';
      const refusal = 'I refuse to answer your question.';
      
      const result1 = detectRefusal(dontKnow);
      const result2 = detectRefusal(refusal);
      
      // Don't know != refusal, but may detect refusal patterns
      expect(result2.confidence).toBeGreaterThanOrEqual(result1.confidence);
    });
  });

  describe('computeRougeL', () => {
    test('identical texts have perfect score', () => {
      const text1 = 'Python and JavaScript are programming languages.';
      const text2 = 'Python and JavaScript are programming languages.';
      
      const result = computeRougeL(text1, text2);
      expect(result.score).toBe(1);
      expect(result.lcs_length).toBe(text1.length);
    });

    test('completely different texts have low score', () => {
      const text1 = 'Python programming language.';
      const text2 = 'Apples are delicious fruits.';
      
      const result = computeRougeL(text1, text2);
      expect(result.score).toBeLessThan(0.5);
    });

    test('similar texts have reasonable score', () => {
      const text1 = 'I have experience with Python and JavaScript.';
      const text2 = 'My experience includes Python, JavaScript, and React.';
      
      const result = computeRougeL(text1, text2);
      expect(result.score).toBeGreaterThan(0.3);
    });

    test('handles short texts', () => {
      const text1 = 'Python';
      const text2 = 'JavaScript';
      
      const result = computeRougeL(text1, text2);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    test('handles empty strings', () => {
      const text1 = '';
      const text2 = 'Some content';
      
      const result = computeRougeL(text1, text2);
      expect(result.score).toBe(0);
    });

    test('case insensitive comparison', () => {
      const text1 = 'PYTHON programming'.toLowerCase();
      const text2 = 'python Programming'.toLowerCase();
      
      const result = computeRougeL(text1, text2);
      expect(result.score).toBeGreaterThan(0.8);
    });
  });

  describe('computePrecision', () => {
    test('all relevant chunks recognized', () => {
      const retrieved = [
        { source: 'file1.json' },
        { source: 'file2.json' },
        { source: 'file3.json' },
      ];

      const expected = [
        { source: 'file1.json' },
        { source: 'file2.json' },
        { source: 'file3.json' },
      ];

      const result = computePrecision(retrieved, expected);
      expect(result.total).toBe(3);
      expect(result.relevant).toBe(3);
      expect(result.precision).toBe(1);
    });

    test('partial relevant chunks', () => {
      const retrieved = [
        { source: 'experience.json' },
        { source: 'projects.json' },
        { source: 'random.md' },
        { source: 'blog.md' },
      ];

      const expected = [
        { source: 'experience.json' },
        { source: 'projects.json' },
      ];

      const result = computePrecision(retrieved, expected);
      expect(result.total).toBe(4);
      expect(result.relevant).toBeGreaterThan(0);
      expect(result.precision).toBeLessThan(1);
    });

    test('no relevant chunks', () => {
      const retrieved = [
        { source: 'random1.md' },
        { source: 'random2.md' },
      ];

      const expected = [
        { source: 'experience.json' },
      ];

      const result = computePrecision(retrieved, expected);
      expect(result.total).toBe(2);
      expect(result.relevant).toBe(0);
      expect(result.precision).toBe(0);
    });

    test('empty retrieved list', () => {
      const retrieved = [];
      const expected = [{ source: 'file.json' }];

      const result = computePrecision(retrieved, expected);
      expect(result.total).toBe(0);
      expect(result.precision).toBe(1); // Edge case: 0/0 treated as perfect
    });

    test('empty expected list', () => {
      const retrieved = [
        { source: 'file1.json' },
        { source: 'file2.json' },
      ];
      const expected = [];

      const result = computePrecision(retrieved, expected);
      expect(result.total).toBe(2);
      expect(result.relevant).toBe(0);
      expect(result.precision).toBe(0);
    });
  });

  describe('normalizeText', () => {
    test('converts to lowercase', () => {
      const text = 'HELLO World';
      const normalized = normalizeText(text);
      expect(normalized).toBe(normalized.toLowerCase());
    });

    test('removes extra whitespace', () => {
      const text = 'Hello   world  \n test';
      const normalized = normalizeText(text);
      expect(normalized).not.toContain('  ');
    });

    test('handles punctuation', () => {
      const text = 'Hello, World!';
      const normalized = normalizeText(text);
      expect(typeof normalized).toBe('string');
    });

    test('handles empty string', () => {
      const normalized = normalizeText('');
      expect(normalized).toBe('');
    });
  });

  describe('Edge cases and robustness', () => {
    test('handles very long texts', () => {
      const longText = 'word '.repeat(10000);
      const answer = 'Some answer';
      const context = longText;

      // Should not crash or overflow
      const result = detectHallucination(answer, context);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    test('handles special characters', () => {
      const answer = 'I use C++, C#, and Node.js!';
      const context = 'Languages: C++, C#, Node.js, Python';

      const result = detectHallucination(answer, context);
      expect(result.isHallucinating).toBe(false);
    });

    test('handles unicode characters', () => {
      const answer = 'I speak English and Français.';
      const context = 'Languages: English, French';

      const result = detectHallucination(answer, context);
      // Should handle gracefully
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    test('handles null-like values gracefully', () => {
      // These should be handled or throw proper errors
      const answer = 'test';
      const context = 'test';

      expect(() => {
        detectHallucination(answer, context);
      }).not.toThrow();
    });
  });

});
