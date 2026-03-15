/**
 * __tests__/integration/api-endpoints.integration.test.js
 * 
 * Integration tests for API endpoints
 * Tests: request handling, response format, error cases
 */

import {
  RequestLogger,
  generateRequestId,
} from '../../functions/api/lib/structured-logger.js';

import {
  detectHallucination,
  detectRefusal,
} from '../../functions/api/lib/quality-detectors.js';

describe('API Endpoint Integration Tests', () => {

  describe('Chat endpoint request/response cycle', () => {
    test('handles valid chat request', async () => {
      // Simulate a chat request
      const requestId = generateRequestId();
      const logger = new RequestLogger(requestId, '192.168.1.1');

      logger.setQuestion('What is your experience?', 'en');
      logger.setColdStart(false, 0);
      
      // Simulate pipeline stages
      logger.setLatency('query-expansion', 75);
      logger.setTokens('query-expansion', 100, 50, 0.001);

      logger.setLatency('embedding', 200);
      logger.setLatency('search', 125);

      logger.setRetrieval({
        subQueriesGenerated: 3,
        chunksRetrieved: 5,
        vectorSearchDurationMs: 125,
      });

      const answer = 'I have 5+ years of experience with Python and JavaScript.';
      const context = 'Experience: Python, JavaScript, React, Node.js development.';

      logger.setLatency('generation', 800);
      logger.setTokens('answer-generation', 200, 45, 0.001);

      const qualityCheck = detectHallucination(answer, context);
      logger.setHallucination(qualityCheck.isHallucinating, qualityCheck.confidence);
      logger.setStatus('success');

      const response = logger.log();

      // Verify response structure
      expect(response).toHaveProperty('request_id');
      expect(response).toHaveProperty('question');
      expect(response).toHaveProperty('status');
      expect(response.status).toBe('success');
    });

    test('formats response with correct content types', () => {
      const logger = new RequestLogger('test', '1.1.1.1');
      logger.setQuestion('Test question', 'en');
      logger.setStatus('success');

      const json = logger.log();

      // All fields should be JSON serializable
      const serialized = JSON.stringify(json);
      expect(serialized).toMatch(/{.*}/);

      // Verify types
      expect(typeof json.request_id).toBe('string');
      expect(typeof json.timestamp).toBe('number');
      expect(typeof json.question).toBe('string');
      expect(typeof json.status).toBe('string');
    });
  });

  describe('Error handling in API', () => {
    test('handles timeout error gracefully', () => {
      const logger = new RequestLogger('timeout-test', '1.1.1.1');
      logger.setQuestion('Test question', 'en');
      logger.setStatus('error', 'Request timeout after 30s');

      const response = logger.log();

      expect(response.status).toBe('error');
      expect(response.error).toContain('timeout');
    });

    test('handles API error from Groq', () => {
      const logger = new RequestLogger('api-error-test', '1.1.1.1');
      logger.setQuestion('Test question', 'en');
      logger.setStatus('error', 'Groq API rate limit exceeded');

      const response = logger.log();

      expect(response.status).toBe('error');
      expect(response.error).toContain('rate limit');
    });

    test('handles retrieval error', () => {
      const logger = new RequestLogger('retrieval-error-test', '1.1.1.1');
      logger.setQuestion('Test question', 'en');
      logger.setStatus('error', 'Failed to retrieve documents from vector database');

      const response = logger.log();

      expect(response.status).toBe('error');
    });

    test('response structure consistent even on error', () => {
      const logger = new RequestLogger('error-test', '1.1.1.1');
      logger.setQuestion('Test question', 'en');
      logger.setStatus('error', 'Internal server error');

      const response = logger.log();

      // Error responses should still have essential fields
      expect(response.request_id).toBeDefined();
      expect(response.question).toBeDefined();
      expect(response.status).toBe('error');
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('Quality checks in response', () => {
    test('detects and reports hallucination in response', () => {
      const logger = new RequestLogger('hallucination-test', '1.1.1.1');
      const answer = 'I have 20 years as an astronaut.';
      const context = 'Python developer with 5 years experience.';

      logger.setQuestion('What is your background?', 'en');
      
      const quality = detectHallucination(answer, context);
      logger.setHallucination(quality.isHallucinating, quality.confidence);
      logger.setStatus('success');

      const response = logger.log();

      expect(response.quality.hallucination.detected).toBe(true);
      expect(response.quality.hallucination.confidence).toBeGreaterThan(0.5);
    });

    test('detects and reports refusal in response', () => {
      const logger = new RequestLogger('refusal-test', '1.1.1.1');
      const refusalAnswer = 'I cannot help with that request.';

      logger.setQuestion('Inappropriate question', 'en');

      const quality = detectRefusal(refusalAnswer);
      logger.setRefusal(quality.isRefusal, quality.confidence);
      logger.setStatus('success');

      const response = logger.log();

      expect(response.quality.refusal.detected).toBe(true);
    });
  });

  describe('Request metadata handling', () => {
    test('preserves user IP address', () => {
      const userIp = '203.0.113.42';
      const logger = new RequestLogger('ip-test', userIp);

      const response = logger.log();
      expect(response.ip_address).toBe(userIp);
    });

    test('handles different language requests', () => {
      const languages = ['en', 'de', 'fr', 'es'];

      languages.forEach(lang => {
        const logger = new RequestLogger('lang-test', '1.1.1.1');
        logger.setQuestion(`Question in ${lang}`, lang);
        logger.setStatus('success');

        const response = logger.log();
        expect(response.language).toBe(lang);
      });
    });
  });

  describe('Performance metrics in response', () => {
    test('includes comprehensive timing information', () => {
      const logger = new RequestLogger('perf-test', '1.1.1.1');
      
      const timings = {
        'query-expansion': 50,
        'embedding': 150,
        'search': 100,
        'generation': 800,
      };

      Object.entries(timings).forEach(([stage, ms]) => {
        logger.setLatency(stage, ms);
      });

      logger.setStatus('success');
      const response = logger.log();

      expect(response.latency.total_ms).toBe(1100);
      expect(response.latency.query_expansion_ms).toBe(50);
      expect(response.latency.generation_ms).toBe(800);
    });

    test('includes cost information', () => {
      const logger = new RequestLogger('cost-test', '1.1.1.1');

      logger.setTokens('query-expansion', 100, 50, 0.001);
      logger.setTokens('answer-generation', 200, 100, 0.001);
      logger.setStatus('success');

      const response = logger.log();

      expect(response.generation.cost_usd).toBeGreaterThan(0);
      expect(response.generation.tokens.input).toBe(300);
      expect(response.generation.tokens.output).toBe(150);
    });
  });

  describe('Cache integration', () => {
    test('response includes cache status for hit', () => {
      const logger = new RequestLogger('cache-hit-test', '1.1.1.1');
      const cacheKey = 'en:What is your background?';

      logger.setCache(cacheKey, true);
      logger.setLatency('cache-retrieval', 5);
      logger.setStatus('success');

      const response = logger.log();

      expect(response.cache.hit).toBe(true);
      expect(response.cache.key).toBe(cacheKey);
    });

    test('response includes cache status for miss', () => {
      const logger = new RequestLogger('cache-miss-test', '1.1.1.1');

      logger.setCache('unique-question-key', false);
      logger.setLatency('generation', 1000);
      logger.setStatus('success');

      const response = logger.log();

      expect(response.cache.hit).toBe(false);
    });
  });

  describe('Retrieval information', () => {
    test('includes detailed retrieval metadata', () => {
      const logger = new RequestLogger('retrieval-test', '1.1.1.1');

      logger.setRetrieval({
        subQueriesGenerated: 4,
        chunksRetrieved: 8,
        vectorSearchDurationMs: 200,
      });

      logger.setStatus('success');
      const response = logger.log();

      expect(response.retrieval.subqueries_generated).toBe(4);
      expect(response.retrieval.chunks_retrieved).toBe(8);
      expect(response.retrieval.vector_search_duration_ms).toBe(200);
    });
  });

  describe('Cold start impact', () => {
    test('cold start request has higher latency', () => {
      const coldLogger = new RequestLogger('cold-test', '1.1.1.1');
      coldLogger.setColdStart(true, 500);
      coldLogger.setLatency('generation', 1200);

      const warmLogger = new RequestLogger('warm-test', '1.1.1.1');
      warmLogger.setColdStart(false, 0);
      warmLogger.setLatency('generation', 800);

      const coldResponse = coldLogger.log();
      const warmResponse = warmLogger.log();

      expect(coldResponse.latency.generation_ms).toBeGreaterThan(
        warmResponse.latency.generation_ms
      );
    });
  });

});
