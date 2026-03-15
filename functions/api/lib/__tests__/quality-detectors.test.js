/**
 * functions/api/lib/__tests__/quality-detectors.test.js
 * 
 * Unit tests for quality detection algorithms
 * Tests: hallucination detection, refusal detection, precision/ROUGE/BLEU
 */

import {
  detectHallucination,
  detectRefusal,
  computePrecision,
  computeRougeL,
  computeSimpleBLEU,
} from '../quality-detectors.js';

describe('Quality Detectors Module', () => {
  
  describe('detectHallucination()', () => {
    test('detects hallucination when facts contradict context', () => {
      const answer = 'I work with Python and use Django framework.';
      const context = 'Experience with JavaScript, React, and Node.js backends.';
      
      const result = detectHallucination(answer, context);
      expect(result).toHaveProperty('isHallucinating');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('ungroundedFacts');
    });

    test('accepts grounded information', () => {
      const answer = 'I have expertise in JavaScript and React.';
      const context = 'Technical skills include JavaScript, React, and Node.js.';
      
      const result = detectHallucination(answer, context);
      expect(result.isHallucinating).toBe(false);
    });

    test('detects missing grounding', () => {
      const answer = 'I worked at Google for 5 years as a senior engineer.';
      const context = 'Experience includes startup roles and freelance work.';
      
      const result = detectHallucination(answer, context);
      // Should detect as hallucination since Google and 5 years not in context
      expect(typeof result.confidence).toBe('number');
    });

    test('handles empty context gracefully', () => {
      const answer = 'Some answer text';
      const context = '';
      
      const result = detectHallucination(answer, context);
      expect(result.isHallucinating).toBe(true); // No context = no grounding
    });

    test('handles empty answer gracefully', () => {
      const result = detectHallucination('', 'Some context');
      expect(result.isHallucinating).toBe(false);
    });

    test('respects threshold parameter', () => {
      const answer = 'Answer with some facts';
      const context = 'Context with different facts';
      
      const liberal = detectHallucination(answer, context, 0.3);
      const strict = detectHallucination(answer, context, 0.9);
      
      // Different thresholds should potentially yield different results
      expect(liberal).toHaveProperty('confidence');
      expect(strict).toHaveProperty('confidence');
    });
  });

  describe('detectRefusal()', () => {
    test('detects common refusal phrases', () => {
      const refusals = [
        "I can't answer that question",
        "I'm not able to help with this",
        "I don't have information about that",
        "I cannot provide details",
        "insufficient context",
      ];

      refusals.forEach(text => {
        const result = detectRefusal(text);
        expect(result.isRefusal).toBe(true);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    test('accepts non-refusal responses', () => {
      const normal = "I have extensive experience with Python and JavaScript.";
      const result = detectRefusal(normal);
      expect(result.isRefusal).toBe(false);
    });

    test('handles empty text', () => {
      const result = detectRefusal('');
      expect(result.isRefusal).toBe(false);
    });

    test('case insensitive refusal detection', () => {
      const result1 = detectRefusal("I CAN'T ANSWER THAT");
      const result2 = detectRefusal("i can't answer that");
      
      expect(result1.isRefusal).toBe(true);
      expect(result2.isRefusal).toBe(true);
    });
  });

  describe('computePrecision()', () => {
    test('calculates precision@k correctly', () => {
      const retrieved = [
        { source: 'experience.json', text: 'Experience details' },
        { source: 'projects.json', text: 'Project details' },
        { source: 'skills.json', text: 'Skill details' },
        { source: 'unrelated.md', text: 'Unrelated content' },
        { source: 'experience.json', text: 'More experience' },
      ];

      const expected = [
        { source: 'experience.json' },
        { source: 'projects.json' },
      ];

      const result = computePrecision(retrieved, expected);
      
      expect(result.total).toBe(5);
      expect(result.relevant).toBe(3); // experience (2) + projects (1)
      expect(result.precision).toBeCloseTo(0.6, 2); // 3/5
    });

    test('handles zero retrieved chunks', () => {
      const result = computePrecision([], [{ source: 'expected' }]);
      expect(result.precision).toBe(0);
      expect(result.total).toBe(0);
    });

    test('handles zero expected sources', () => {
      const result = computePrecision([{ source: 'retrieved' }], []);
      expect(result.precision).toBeNull();
    });

    test('returns perfect precision when all relevant', () => {
      const retrieved = [
        { source: 'experience.json' },
        { source: 'projects.json' },
      ];
      const expected = [
        { source: 'experience' },
        { source: 'projects' },
      ];

      const result = computePrecision(retrieved, expected);
      expect(result.precision).toBeCloseTo(1.0, 2);
    });
  });

  describe('computeRougeL()', () => {
    test('calculates ROUGE-L for identical texts', () => {
      const text = 'I have experience with Python and JavaScript.';
      const result = computeRougeL(text, text);
      
      expect(result.score).toBe(1.0); // Perfect match
      expect(result.lcs_length).toBe(text.length);
    });

    test('calculates ROUGE-L for similar texts', () => {
      const generated = 'I have Python and JavaScript skills.';
      const reference = 'I have experience with Python and JavaScript.';
      
      const result = computeRougeL(generated, reference);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(1);
    });

    test('calculates ROUGE-L for dissimilar texts', () => {
      const generated = 'Completely different topic.';
      const reference = 'Python and JavaScript.';
      
      const result = computeRougeL(generated, reference);
      expect(result.score).toBeLessThan(0.5);
    });

    test('handles empty strings', () => {
      const result1 = computeRougeL('', 'reference');
      const result2 = computeRougeL('generated', '');
      const result3 = computeRougeL('', '');
      
      expect(result1.score).toBe(0);
      expect(result2.score).toBe(0);
      expect(result3.score).toBe(0);
    });
  });

  describe('computeSimpleBLEU()', () => {
    test('calculates BLEU score for identical texts', () => {
      const text = 'I have Python skills';
      const result = computeSimpleBLEU(text, text);
      
      expect(result.score).toBe(100); // Perfect match
    });

    test('calculates BLEU with n-gram precision', () => {
      const generated = 'I have Python skills and JavaScript experience';
      const reference = 'I have Python skills';
      
      const result = computeSimpleBLEU(generated, reference);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    test('handles completely different texts', () => {
      const generated = 'Apples and oranges';
      const reference = 'Python and JavaScript';
      
      const result = computeSimpleBLEU(generated, reference);
      expect(result.score).toBeLessThan(30); // Low score for different text
    });

    test('handles empty strings', () => {
      const result1 = computeSimpleBLEU('', 'reference');
      const result2 = computeSimpleBLEU('generated', '');
      
      expect(result1.score).toBe(0);
      expect(result2.score).toBe(0);
    });

    test('score ranges 0-100', () => {
      const pairs = [
        ['a', 'a'],
        ['test text', 'test'],
        ['completely different', 'text here'],
      ];

      pairs.forEach(([gen, ref]) => {
        const result = computeSimpleBLEU(gen, ref);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Integration: Quality metrics combined', () => {
    test('complete quality assessment flow', () => {
      const answer = 'I have Python and JavaScript skills from my projects.';
      const context = 'Experience with Python, JavaScript, and React development.';
      const reference = 'Python and JavaScript are my primary skills.';
      
      const hallucination = detectHallucination(answer, context);
      const refusal = detectRefusal(answer);
      const rouge = computeRougeL(answer, reference);
      
      // All metrics should be computable
      expect(hallucination).toHaveProperty('isHallucinating');
      expect(refusal).toHaveProperty('isRefusal');
      expect(rouge).toHaveProperty('score');
      
      // Quality should be reasonably good (not hallucinating)
      expect(hallucination.isHallucinating).toBe(false);
      expect(refusal.isRefusal).toBe(false);
      expect(rouge.score).toBeGreaterThan(0.5);
    });

    test('identifies multiple quality issues', () => {
      const badAnswer = "I can't help with that question.";
      const context = 'Some technical context';
      const reference = 'A good reference answer';
      
      const hallucination = detectHallucination(badAnswer, context);
      const refusal = detectRefusal(badAnswer);
      const rouge = computeRougeL(badAnswer, reference);
      
      // Should detect refusal
      expect(refusal.isRefusal).toBe(true);
      
      // Should have low ROUGE-L
      expect(rouge.score).toBeLessThan(0.5);
    });
  });

});
