/**
 * functions/api/lib/__tests__/structured-logger.test.js
 * 
 * Unit tests for structured logging system
 * Tests: RequestLogger class, Timer, token calculation, cost calculation
 */

import {
  RequestLogger,
  generateRequestId,
  Timer,
  calculateCost,
  estimateTokens,
  extractGroqUsage,
} from '../structured-logger.js';

describe('Structured Logger Module', () => {
  
  describe('generateRequestId()', () => {
    test('generates unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    test('request ID starts with req_', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^req_/);
    });

    test('request ID is at least 20 characters long', () => {
      const id = generateRequestId();
      expect(id.length).toBeGreaterThan(20);
    });
  });

  describe('RequestLogger class', () => {
    let logger;

    beforeEach(() => {
      logger = new RequestLogger('test-request-id', '192.168.1.1');
    });

    test('creates logger with requestId and IP', () => {
      expect(logger.requestId).toBe('test-request-id');
      expect(logger.ip).toBe('192.168.1.1');
    });

    test('initializes with default values', () => {
      expect(logger.status).toBe('processing');
      expect(logger.cacheHit).toBe(false);
      expect(logger.quality.hallucination.detected).toBe(false);
      expect(logger.quality.refusal.detected).toBe(false);
    });

    test('setQuestion() updates question and language', () => {
      logger.setQuestion('What is this?', 'de');
      expect(logger.question).toBe('What is this?');
      expect(logger.language).toBe('de');
    });

    test('setCache() tracks cache hits and misses', () => {
      logger.setCache('test-key', true);
      expect(logger.cacheKey).toBe('test-key');
      expect(logger.cacheHit).toBe(true);

      const logger2 = new RequestLogger('id2', '1.1.1.1');
      logger2.setCache('key2', false);
      expect(logger2.cacheHit).toBe(false);
    });

    test('setLatency() updates stage latencies', () => {
      logger.setLatency('query-expansion', 100);
      logger.setLatency('embedding', 200);
      logger.setLatency('search', 50);
      logger.setLatency('generation', 1000);

      expect(logger.latency.queryExpansionMs).toBe(100);
      expect(logger.latency.embeddingMs).toBe(200);
      expect(logger.latency.searchMs).toBe(50);
      expect(logger.latency.generationMs).toBe(1000);
      expect(logger.latency.totalMs).toBe(1350);
    });

    test('setTokens() calculates costs correctly', () => {
      // Query expansion: 100 input, 50 output
      logger.setTokens('query-expansion', 100, 50, 0.0075);
      expect(logger.generation.queryExpansionTokens.input).toBe(100);
      expect(logger.generation.queryExpansionTokens.output).toBe(50);

      // Answer generation: 500 input, 200 output
      logger.setTokens('answer-generation', 500, 200, 0.0155);
      expect(logger.generation.answerGenerationTokens.input).toBe(500);
      expect(logger.generation.answerGenerationTokens.output).toBe(200);
      
      // Should aggregate totals
      expect(logger.generation.totalTokens.input).toBe(600);
      expect(logger.generation.totalTokens.output).toBe(250);
    });

    test('setHallucination() tracks hallucination detection', () => {
      logger.setHallucination(true, 0.85);
      expect(logger.quality.hallucination.detected).toBe(true);
      expect(logger.quality.hallucination.confidence).toBe(0.85);

      const logger2 = new RequestLogger('id2', '1.1.1.1');
      logger2.setHallucination(false, 0);
      expect(logger2.quality.hallucination.detected).toBe(false);
    });

    test('setRefusal() tracks refusal detection', () => {
      logger.setRefusal(true, 0.92);
      expect(logger.quality.refusal.detected).toBe(true);
      expect(logger.quality.refusal.confidence).toBe(0.92);
    });

    test('setStatus() updates request status', () => {
      logger.setStatus('success');
      expect(logger.status).toBe('success');
      expect(logger.error).toBeNull();

      logger.setStatus('error', 'Groq API failed');
      expect(logger.status).toBe('error');
      expect(logger.error).toBe('Groq API failed');
    });

    test('toJSON() returns structured log object', () => {
      logger.setQuestion('Test question', 'en');
      logger.setStatus('success');
      logger.setLatency('query-expansion', 100);

      const json = logger.toJSON();
      expect(json.request_id).toBe('test-request-id');
      expect(json.user_ip).toBe('192.168.1.1');
      expect(json.question).toBe('Test question');
      expect(json.language).toBe('en');
      expect(json.status).toBe('success');
      expect(json.latency.query_expansion_ms).toBe(100);
    });

    test('log() outputs JSON and returns object', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.setStatus('success');

      const result = logger.log();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toHaveProperty('request_id');
      expect(result).toHaveProperty('status');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Timer class', () => {
    test('measures elapsed time', async () => {
      const timer = new Timer('test-stage');
      await new Promise(resolve => setTimeout(resolve, 50));
      const { stage, durationMs } = timer.end();

      expect(stage).toBe('test-stage');
      expect(durationMs).toBeGreaterThanOrEqual(50);
      expect(durationMs).toBeLessThan(100);
    });

    test('endAndLog() updates logger', () => {
      const timer = new Timer('embedding');
      const logger = new RequestLogger('id', '1.1.1.1');

      timer.endAndLog(logger);
      expect(logger.latency.embeddingMs).toBeGreaterThan(0);
    });
  });

  describe('calculateCost()', () => {
    test('calculates Groq API cost correctly', () => {
      // Input: 1000 tokens @ $0.05/1M = $0.00005
      // Output: 500 tokens @ $0.15/1M = $0.000075
      const { input, output, total } = calculateCost(1000, 500);
      
      expect(input).toBeCloseTo(0.00005, 8);
      expect(output).toBeCloseTo(0.000075, 8);
      expect(total).toBeCloseTo(0.000125, 8);
    });

    test('handles zero tokens', () => {
      const { input, output, total } = calculateCost(0, 0);
      expect(input).toBe(0);
      expect(output).toBe(0);
      expect(total).toBe(0);
    });

    test('handles large token counts', () => {
      const { total } = calculateCost(1_000_000, 500_000);
      // 1M input @ 0.05 + 500k output @ 0.15 = 0.05 + 0.075 = 0.125
      expect(total).toBeCloseTo(0.125, 3);
    });
  });

  describe('estimateTokens()', () => {
    test('estimates tokens from text length', () => {
      const text = 'This is a test.'; // 15 chars
      const tokens = estimateTokens(text);
      expect(tokens).toBeCloseTo(4, 1); // 15 / 4 ≈ 4
    });

    test('handles empty text', () => {
      const tokens = estimateTokens('');
      expect(tokens).toBe(0);
    });

    test('handles long text', () => {
      const text = 'a'.repeat(400);
      const tokens = estimateTokens(text);
      expect(tokens).toBeCloseTo(100, 5);
    });

    test('handles null/undefined', () => {
      expect(estimateTokens(null)).toBe(0);
      expect(estimateTokens(undefined)).toBe(0);
    });
  });

  describe('extractGroqUsage()', () => {
    test('extracts usage from Groq response', () => {
      const response = {
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      const usage = extractGroqUsage(response);
      expect(usage.input).toBe(100);
      expect(usage.output).toBe(50);
      expect(usage.total).toBe(150);
    });

    test('handles missing usage field', () => {
      const response = {};
      const usage = extractGroqUsage(response);
      expect(usage.input).toBe(0);
      expect(usage.output).toBe(0);
      expect(usage.total).toBe(0);
    });

    test('handles null response', () => {
      const usage = extractGroqUsage(null);
      expect(usage.input).toBe(0);
      expect(usage.output).toBe(0);
      expect(usage.total).toBe(0);
    });
  });

  describe('Integration: Complete logging flow', () => {
    test('full request lifecycle logging', () => {
      const logger = new RequestLogger('full-test', '10.0.0.1');
      
      logger.setQuestion('Complex question', 'en');
      logger.setColdStart(false, 0);
      logger.setCache('key', false);
      logger.setLatency('query-expansion', 150);
      logger.setLatency('embedding', 250);
      logger.setLatency('search', 75);
      logger.setLatency('generation', 1500);
      logger.setTokens('query-expansion', 100, 50, 0.0075);
      logger.setTokens('answer-generation', 500, 200, 0.0155);
      logger.setHallucination(false, 0);
      logger.setRefusal(false, 0);
      logger.setStatus('success');
      
      const json = logger.log();
      
      // Verify complete structure
      expect(json.request_id).toBeDefined();
      expect(json.status).toBe('success');
      expect(json.latency.total_ms).toBe(1975);
      expect(json.generation.cost_usd).toBeGreaterThan(0);
      expect(json.quality.hallucination.detected).toBe(false);
    });
  });

});
