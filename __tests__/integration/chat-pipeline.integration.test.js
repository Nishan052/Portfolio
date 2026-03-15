/**
 * __tests__/integration/chat-pipeline.integration.test.js
 * 
 * Integration tests for the complete chat/RAG pipeline
 * Tests: monitoring + quality detection + retrieval flow
 */

import {
  RequestLogger,
  generateRequestId,
  Timer,
  calculateCost,
} from '../../functions/api/lib/structured-logger.js';

import {
  detectHallucination,
  detectRefusal,
  computePrecision,
  computeRougeL,
} from '../../functions/api/lib/quality-detectors.js';

describe('Chat Pipeline Integration Tests', () => {
  
  describe('Request logging with quality detection', () => {
    test('logs complete request with quality metrics', () => {
      // Simulate a complete request flow
      const requestId = generateRequestId();
      const logger = new RequestLogger(requestId, '192.168.1.1');
      const queryExpansionTimer = new Timer('query-expansion');
      const embeddingTimer = new Timer('embedding');
      const searchTimer = new Timer('search');
      const generationTimer = new Timer('generation');

      // Simulate pipeline stages
      logger.setQuestion('What is your experience?', 'en');
      logger.setColdStart(false, 0);
      
      // Query expansion
      setTimeout(() => {}, 50);
      logger.setLatency('query-expansion', 50);
      logger.setTokens('query-expansion', 100, 50, 0.0075);
      
      // Embedding
      logger.setLatency('embedding', 150);
      
      // Search
      logger.setLatency('search', 100);
      const mockChunks = [
        { source: 'experience.json', text: 'Python, JavaScript, React' },
        { source: 'projects.json', text: 'Full-stack applications' },
      ];
      logger.setRetrieval({
        subQueriesGenerated: 5,
        chunksRetrieved: 2,
        vectorSearchDurationMs: 100,
      });

      // Generation
      const answer = 'I have experience with Python, JavaScript, and React development.';
      logger.setLatency('generation', 800);
      logger.setTokens('answer-generation', 500, 200, 0.0155);

      // Quality checks
      const context = 'Technical skills: Python, JavaScript, React, Node.js';
      const hallucination = detectHallucination(answer, context);
      const refusal = detectRefusal(answer);

      logger.setHallucination(hallucination.isHallucinating, hallucination.confidence);
      logger.setRefusal(refusal.isRefusal, refusal.confidence);
      logger.setStatus('success');

      // Verify complete flow
      const json = logger.log();
      expect(json.request_id).toBeDefined();
      expect(json.status).toBe('success');
      expect(json.latency.total_ms).toBeGreaterThan(1000);
      expect(json.generation.cost_usd).toBeGreaterThan(0);
      expect(json.quality.hallucination.detected).toBe(false);
      expect(json.quality.refusal.detected).toBe(false);
    });
  });

  describe('Retrieval quality assessment', () => {
    test('measures precision of retrieved chunks', () => {
      const retrievedChunks = [
        { source: 'experience.json', text: 'Backend: Node.js, Python' },
        { source: 'projects.json', text: 'Full-stack application' },
        { source: 'skills.json', text: 'Languages: Python, JS' },
        { source: 'random.md', text: 'Unrelated content' },
        { source: 'experience.json', text: 'Frontend: React, Vue' },
      ];

      const expectedSources = [
        { source: 'experience.json' },
        { source: 'projects.json' },
        { source: 'skills.json' },
      ];

      const precision = computePrecision(retrievedChunks, expectedSources);

      expect(precision.total).toBe(5);
      expect(precision.relevant).toBeGreaterThan(0);
      expect(precision.precision).toBeGreaterThan(0);
    });
  });

  describe('Answer quality validation', () => {
    test('validates generated answer quality', () => {
      const generatedAnswer = 'I have 5+ years of experience with Python and JavaScript. ' +
        'I built several full-stack applications using React and Node.js. ' +
        'I work with databases like PostgreSQL and MongoDB.';

      const referenceAnswer = 'Experience includes Python, JavaScript, React, Node.js, ' +
        'and database management with PostgreSQL and MongoDB across multiple projects.';

      const rouge = computeRougeL(generatedAnswer, referenceAnswer);
      
      // Generated answer covers reference points
      expect(rouge.score).toBeGreaterThan(0.3);
      expect(rouge.lcs_length).toBeGreaterThan(20);
    });
  });

  describe('Error handling in pipeline', () => {
    test('handles query expansion failure gracefully', () => {
      const logger = new RequestLogger('error-test-1', '1.1.1.1');
      logger.setQuestion('Test question', 'en');
      
      // Simulate expansion failure
      logger.setLatency('query-expansion', 0);
      logger.setRetrieval({ subQueriesGenerated: 0 });
      
      // Should still be able to continue
      logger.setLatency('embedding', 100);
      logger.setStatus('success'); // Can still succeed with fewer queries
      
      const json = logger.log();
      expect(json.status).toBe('success');
    });

    test('handles API failures with status tracking', () => {
      const logger = new RequestLogger('error-test-2', '1.1.1.1');
      logger.setQuestion('Test question', 'en');
      logger.setStatus('error', 'Groq API timeout');
      
      const json = logger.log();
      expect(json.status).toBe('error');
      expect(json.error).toBe('Groq API timeout');
    });
  });

  describe('Cold start detection with monitoring', () => {
    test('detects and logs cold start', () => {
      const logger = new RequestLogger('cold-start-test', '1.1.1.1');
      
      logger.setColdStart(true, 250); // Cold start took 250ms
      logger.setQuestion('First request', 'en');
      logger.setLatency('query-expansion', 100);
      
      const json = logger.log();
      expect(json.cold_start).toBe(true);
      expect(json.cold_start_duration_ms).toBe(250);
    });

    test('subsequent requests are not cold start', () => {
      const logger = new RequestLogger('warm-request-test', '1.1.1.1');
      
      logger.setColdStart(false, 0);
      logger.setQuestion('Subsequent request', 'en');
      
      const json = logger.log();
      expect(json.cold_start).toBe(false);
    });
  });

  describe('Cache effectiveness tracking', () => {
    test('logs cache hit', () => {
      const logger = new RequestLogger('cache-hit-test', '1.1.1.1');
      const cacheKey = 'en:What is your background?';
      
      logger.setCache(cacheKey, true);
      logger.setQuestion('Question about background', 'en');
      logger.setStatus('success');
      
      const json = logger.log();
      expect(json.cache.hit).toBe(true);
      expect(json.cache.key).toBe(cacheKey);
    });

    test('logs cache miss', () => {
      const logger = new RequestLogger('cache-miss-test', '1.1.1.1');
      
      logger.setCache('new-question-key', false);
      logger.setLatency('query-expansion', 50);
      logger.setLatency('generation', 500);
      logger.setStatus('success');
      
      const json = logger.log();
      expect(json.cache.hit).toBe(false);
    });
  });

  describe('Cost tracking across request', () => {
    test('accumulated cost reflects both stages', () => {
      const logger = new RequestLogger('cost-test', '1.1.1.1');
      
      // Query expansion cost
      logger.setTokens('query-expansion', 150, 75, 0.0112);
      
      // Answer generation cost
      logger.setTokens('answer-generation', 600, 250, 0.0200);
      
      const json = logger.log();
      
      // Total cost should be sum of both stages
      expect(json.generation.cost_usd).toBeCloseTo(0.0312, 4);
      expect(json.generation.tokens.input).toBe(750);
      expect(json.generation.tokens.output).toBe(325);
    });
  });

  describe('Multi-stage latency aggregation', () => {
    test('correctly aggregates latencies from all stages', () => {
      const logger = new RequestLogger('latency-test', '1.1.1.1');
      
      const stages = {
        'query-expansion': 75,
        'embedding': 200,
        'search': 125,
        'generation': 1200,
      };

      for (const [stage, ms] of Object.entries(stages)) {
        logger.setLatency(stage, ms);
      }

      const json = logger.log();
      expect(json.latency.total_ms).toBe(1600);
      expect(json.latency.query_expansion_ms).toBe(75);
      expect(json.latency.embedding_ms).toBe(200);
      expect(json.latency.search_ms).toBe(125);
      expect(json.latency.generation_ms).toBe(1200);
    });
  });

  describe('Quality metric correlation', () => {
    test('hallucination and refusal are independent', () => {
      const logger1 = new RequestLogger('qual1', '1.1.1.1');
      logger1.setHallucination(true, 0.9);
      logger1.setRefusal(false, 0);
      
      const logger2 = new RequestLogger('qual2', '1.1.1.1');
      logger2.setHallucination(false, 0);
      logger2.setRefusal(true, 0.95);
      
      const json1 = logger1.log();
      const json2 = logger2.log();
      
      expect(json1.quality.hallucination.detected).toBe(true);
      expect(json1.quality.refusal.detected).toBe(false);
      
      expect(json2.quality.hallucination.detected).toBe(false);
      expect(json2.quality.refusal.detected).toBe(true);
    });
  });

});
