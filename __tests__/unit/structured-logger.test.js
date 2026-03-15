/**
 * __tests__/unit/structured-logger.test.js
 * 
 * Unit tests for structured logging system
 * Tests: request logging, timing, metrics, cost calculations
 */

import {
  RequestLogger,
  generateRequestId,
  Timer,
  calculateCost,
} from '../../functions/api/lib/structured-logger.js';

describe('Structured Logger', () => {

  describe('RequestLogger initialization', () => {
    test('creates logger with request ID and IP', () => {
      const requestId = 'test-123';
      const ip = '192.168.1.1';
      const logger = new RequestLogger(requestId, ip);

      expect(logger.requestId).toBe(requestId);
      expect(logger.ip).toBe(ip);
    });

    test('auto-generates request ID if not provided', () => {
      const logger = new RequestLogger(null, '1.1.1.1');
      expect(logger.requestId).toBeDefined();
      expect(typeof logger.requestId).toBe('string');
      expect(logger.requestId.length).toBeGreaterThan(0);
    });

    test('sets timestamp on initialization', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      expect(logger.timestamp).toBeDefined();
      expect(logger.timestamp).toBeCloseTo(new Date().getTime(), -3); // Within 1000ms
    });
  });

  describe('Question setting', () => {
    test('stores question and language', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setQuestion('What is your background?', 'en');

      const json = logger.log();
      expect(json.question).toBe('What is your background?');
      expect(json.language).toBe('en');
    });

    test('handles different languages', () => {
      const languages = ['en', 'de', 'fr', 'es'];
      
      languages.forEach(lang => {
        const logger = new RequestLogger('test', '1.1.1.1');
        logger.setQuestion('Question', lang);
        
        const json = logger.log();
        expect(json.language).toBe(lang);
      });
    });
  });

  describe('Latency tracking', () => {
    test('stores latency for single stage', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setLatency('query-expansion', 150);

      const json = logger.log();
      expect(json.latency.query_expansion_ms).toBe(150);
    });

    test('aggregates latencies from multiple stages', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setLatency('query-expansion', 100);
      logger.setLatency('embedding', 200);
      logger.setLatency('search', 150);
      logger.setLatency('generation', 500);

      const json = logger.log();
      expect(json.latency.total_ms).toBe(950);
    });

    test('correctly maps stage names to output keys', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      
      const stageMappings = {
        'query-expansion': 'query_expansion_ms',
        'embedding': 'embedding_ms',
        'search': 'search_ms',
        'generation': 'generation_ms',
      };

      Object.entries(stageMappings).forEach(([stage, key]) => {
        const testLogger = new RequestLogger('test', '1.1.1.1');
        testLogger.setLatency(stage, 100);
        const json = testLogger.log();
        expect(json.latency[key]).toBe(100);
      });
    });

    test('handles zero latency', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setLatency('query-expansion', 0);

      const json = logger.log();
      expect(json.latency.query_expansion_ms).toBe(0);
      expect(json.latency.total_ms).toBe(0);
    });
  });

  describe('Token tracking and cost calculation', () => {
    test('stores tokens and calculates cost', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      
      // GPT pricing: ~0.0005 per 1K input, ~0.0015 per 1K output
      logger.setTokens('query-expansion', 1000, 500, 0.001); // 1 USD per 1K

      const json = logger.log();
      expect(json.generation.tokens.input).toBe(1000);
      expect(json.generation.tokens.output).toBe(500);
      expect(json.generation.cost_usd).toBeGreaterThan(0);
    });

    test('accumulates costs from multiple stages', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      
      logger.setTokens('query-expansion', 100, 50, 0.001); // 0.150 USD
      logger.setTokens('answer-generation', 200, 100, 0.001); // 0.300 USD

      const json = logger.log();
      const expectedCost = (150 * 0.001) + (300 * 0.001); // 0.45
      expect(json.generation.cost_usd).toBeCloseTo(expectedCost / 1000, 6);
    });

    test('handles zero pricing (free models)', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setTokens('generation', 1000, 500, 0); // Free

      const json = logger.log();
      expect(json.generation.tokens.input).toBe(1000);
      expect(json.generation.cost_usd).toBe(0);
    });
  });

  describe('Hallucination tracking', () => {
    test('stores hallucination detection result', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setHallucination(false, 0.05);

      const json = logger.log();
      expect(json.quality.hallucination.detected).toBe(false);
      expect(json.quality.hallucination.confidence).toBe(0.05);
    });

    test('handles positive hallucination', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setHallucination(true, 0.95);

      const json = logger.log();
      expect(json.quality.hallucination.detected).toBe(true);
      expect(json.quality.hallucination.confidence).toBe(0.95);
    });

    test('default hallucination is false', () => {
      const logger = new RequestLogger('test', '1.1.1.1');

      const json = logger.log();
      expect(json.quality.hallucination.detected).toBe(false);
      expect(json.quality.hallucination.confidence).toBe(0);
    });
  });

  describe('Refusal tracking', () => {
    test('stores refusal detection result', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setRefusal(true, 0.9);

      const json = logger.log();
      expect(json.quality.refusal.detected).toBe(true);
      expect(json.quality.refusal.confidence).toBe(0.9);
    });

    test('default refusal is false', () => {
      const logger = new RequestLogger('test', '1.1.1.1');

      const json = logger.log();
      expect(json.quality.refusal.detected).toBe(false);
      expect(json.quality.refusal.confidence).toBe(0);
    });
  });

  describe('Retrieval metadata', () => {
    test('stores retrieval information', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setRetrieval({
        subQueriesGenerated: 5,
        chunksRetrieved: 10,
        vectorSearchDurationMs: 250,
      });

      const json = logger.log();
      expect(json.retrieval.subqueries_generated).toBe(5);
      expect(json.retrieval.chunks_retrieved).toBe(10);
      expect(json.retrieval.vector_search_duration_ms).toBe(250);
    });

    test('handles optional retrieval fields', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setRetrieval({ chunksRetrieved: 5 });

      const json = logger.log();
      expect(json.retrieval.chunks_retrieved).toBe(5);
    });
  });

  describe('Cache tracking', () => {
    test('stores cache hit info', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      const key = 'en:What is your background?';
      logger.setCache(key, true);

      const json = logger.log();
      expect(json.cache.hit).toBe(true);
      expect(json.cache.key).toBe(key);
    });

    test('stores cache miss info', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      const key = 'new-question';
      logger.setCache(key, false);

      const json = logger.log();
      expect(json.cache.hit).toBe(false);
      expect(json.cache.key).toBe(key);
    });
  });

  describe('Cold start handling', () => {
    test('records cold start with duration', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setColdStart(true, 523);

      const json = logger.log();
      expect(json.cold_start).toBe(true);
      expect(json.cold_start_duration_ms).toBe(523);
    });

    test('records warm request', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setColdStart(false, 0);

      const json = logger.log();
      expect(json.cold_start).toBe(false);
      expect(json.cold_start_duration_ms).toBe(0);
    });
  });

  describe('Status and error handling', () => {
    test('sets success status', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setStatus('success');

      const json = logger.log();
      expect(json.status).toBe('success');
      expect(json.error).toBeUndefined();
    });

    test('sets error status with message', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setStatus('error', 'API timeout');

      const json = logger.log();
      expect(json.status).toBe('error');
      expect(json.error).toBe('API timeout');
    });

    test('default status is pending', () => {
      const logger = new RequestLogger('test', '1.1.1.1');

      const json = logger.log();
      expect(json.status).toBe('pending');
    });
  });

  describe('JSON output format', () => {
    test('produces valid JSON structure', () => {
      const logger = new RequestLogger('test-123', '192.168.1.1');
      logger.setQuestion('Test question', 'en');
      logger.setLatency('query-expansion', 100);
      logger.setStatus('success');

      const json = logger.log();

      // Check structure
      expect(json.request_id).toBe('test-123');
      expect(json.ip_address).toBe('192.168.1.1');
      expect(json.timestamp).toBeDefined();
      expect(json.question).toBe('Test question');
      expect(json.language).toBe('en');
      expect(json.latency).toBeDefined();
      expect(json.generation).toBeDefined();
      expect(json.quality).toBeDefined();
      expect(json.retrieval).toBeDefined();
      expect(json.cache).toBeDefined();
    });

    test('is JSON serializable', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setQuestion('Test', 'en');
      logger.setStatus('success');

      const json = logger.log();
      const jsonString = JSON.stringify(json);
      
      expect(typeof jsonString).toBe('string');
      expect(JSON.parse(jsonString)).toBeDefined();
    });
  });

});

describe('Timer utility', () => {
  test('measures elapsed time', (done) => {
    const timer = new Timer('test');
    
    setTimeout(() => {
      const elapsed = timer.getElapsed();
      expect(elapsed).toBeGreaterThanOrEqual(50);
      expect(elapsed).toBeLessThan(200); // Allow some margin
      done();
    }, 50);
  });

  test('supports multiple measurements', () => {
    const timer1 = new Timer('operation1');
    const timer2 = new Timer('operation2');

    const elapsed1 = timer1.getElapsed();
    const elapsed2 = timer2.getElapsed();

    expect(typeof elapsed1).toBe('number');
    expect(typeof elapsed2).toBe('number');
  });
});

describe('generateRequestId', () => {
  test('generates unique IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).not.toBe(id2);
  });

  test('generates consistent format', () => {
    const id = generateRequestId();
    
    // Should be a string with some structure (UUID or similar)
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(8);
  });
});

describe('calculateCost', () => {
  test('calculates cost correctly', () => {
    const inputTokens = 500;
    const outputTokens = 250;
    const pricePerToken = 0.000001; // $1 per 1M tokens

    const cost = calculateCost(inputTokens, outputTokens, pricePerToken);
    
    const expected = (inputTokens + outputTokens) * pricePerToken;
    expect(cost).toBeCloseTo(expected, 9);
  });

  test('handles zero price', () => {
    const cost = calculateCost(1000, 500, 0);
    expect(cost).toBe(0);
  });

  test('handles zero tokens', () => {
    const cost = calculateCost(0, 0, 0.000001);
    expect(cost).toBe(0);
  });
});
