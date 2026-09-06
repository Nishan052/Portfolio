/**
 * structured-logger.js — Structured JSON logging for monitoring and observability
 * All logs follow a consistent format for easy aggregation and dashboarding.
 */

/**
 * Generate a unique request ID (UUID v4-like).
 * Used to trace a request through entire system.
 */
export function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Comprehensive request logging object builder.
 * Accumulates metrics and logs them as structured JSON at the end.
 */
export class RequestLogger {
  constructor(requestId, ip) {
    this.requestId = requestId;
    this.ip = ip;
    this.timestamp = new Date().toISOString();
    this.question = null;
    this.language = null;
    this.status = 'processing';
    this.error = null;

    // Cold start tracking
    this.containerStartTime = null;
    this.requestStartTime = Date.now();
    this.isColdStart = null;
    this.coldStartDurationMs = 0;

    // Cache metrics
    this.cacheKey = null;
    this.cacheHit = false;

    // Retrieval metrics
    this.retrieval = {
      queryExpansionDurationMs: 0,
      subQueriesGenerated: 0,
      embeddingDurationMs: 0,
      vectorSearchDurationMs: 0,
      chunksRetrieved: 0,
      retrievalPrecision: null,
    };

    // LLM/Cost metrics
    this.generation = {
      queryExpansionTokens: { input: 0, output: 0, cost: 0 },
      answerGenerationTokens: { input: 0, output: 0, cost: 0 },
      totalTokens: { input: 0, output: 0 },
      totalCostUsd: 0,
      durationMs: 0,
    };

    // Quality metrics
    this.quality = {
      hallucination: { detected: false, confidence: 0 },
      refusal: { detected: false, confidence: 0 },
    };

    // Timing
    this.latency = {
      queryExpansionMs: 0,
      embeddingMs: 0,
      searchMs: 0,
      generationMs: 0,
      totalMs: 0,
    };
  }

  // ─── Cold Start Detection ──────────────────────────────────────────────────
  setColdStart(isColdStart, duration) {
    this.isColdStart = isColdStart;
    this.coldStartDurationMs = duration;
  }

  // ─── Cache Metrics ────────────────────────────────────────────────────────
  setCache(cacheKey, hit) {
    this.cacheKey = cacheKey;
    this.cacheHit = hit;
  }

  // ─── Retrieval Metrics ─────────────────────────────────────────────────────
  setRetrieval(metrics) {
    Object.assign(this.retrieval, metrics);
  }

  // ─── Token & Cost Metrics ──────────────────────────────────────────────────
  setTokens(stage, inputTokens, outputTokens, costUsd) {
    /*
      stage: 'query-expansion' | 'answer-generation'
    */
    if (stage === 'query-expansion') {
      this.generation.queryExpansionTokens = { input: inputTokens, output: outputTokens, cost: costUsd };
    } else if (stage === 'answer-generation') {
      this.generation.answerGenerationTokens = { input: inputTokens, output: outputTokens, cost: costUsd };
    }

    // Aggregate totals
    this.generation.totalTokens.input = this.generation.queryExpansionTokens.input + this.generation.answerGenerationTokens.input;
    this.generation.totalTokens.output = this.generation.queryExpansionTokens.output + this.generation.answerGenerationTokens.output;
    this.generation.totalCostUsd = this.generation.queryExpansionTokens.cost + this.generation.answerGenerationTokens.cost;
  }

  // ─── Latency Tracking ──────────────────────────────────────────────────────
  setLatency(stageName, durationMs) {
    /*
      stageName: 'query-expansion' | 'embedding' | 'search' | 'generation'
    */
    if (stageName === 'query-expansion') {
      this.latency.queryExpansionMs = durationMs;
    } else if (stageName === 'embedding') {
      this.latency.embeddingMs = durationMs;
    } else if (stageName === 'search') {
      this.latency.searchMs = durationMs;
    } else if (stageName === 'generation') {
      this.latency.generationMs = durationMs;
    }
    this.updateTotalLatency();
  }

  updateTotalLatency() {
    this.latency.totalMs = 
      this.latency.queryExpansionMs + 
      this.latency.embeddingMs + 
      this.latency.searchMs + 
      this.latency.generationMs;
  }

  // ─── Quality Metrics ──────────────────────────────────────────────────────
  setHallucination(detected, confidence = 0) {
    this.quality.hallucination = { detected, confidence };
  }

  setRefusal(detected, confidence = 0) {
    this.quality.refusal = { detected, confidence };
  }

  // ─── Status & Errors ────────────────────────────────────────────────────────
  setStatus(status, error = null) {
    this.status = status; // 'success' | 'partial' | 'error'
    if (error) this.error = error;
  }

  setQuestion(question, language = 'en') {
    this.question = question;
    this.language = language;
  }

  // ─── Generate Final Log Object ──────────────────────────────────────────────
  toJSON() {
    const endTime = Date.now();
    const totalElapsedMs = endTime - this.requestStartTime;

    return {
      // Identifiers & Context
      request_id: this.requestId,
      timestamp: this.timestamp,
      user_ip: this.ip,
      question: this.question,
      language: this.language,

      // Status
      status: this.status,
      error: this.error,

      // Cold Start
      cold_start: this.isColdStart,
      cold_start_duration_ms: this.coldStartDurationMs,

      // Cache
      cache: {
        key: this.cacheKey,
        hit: this.cacheHit,
      },

      // Retrieval Pipeline
      retrieval: {
        sub_queries_generated: this.retrieval.subQueriesGenerated,
        chunks_retrieved: this.retrieval.chunksRetrieved,
        precision: this.retrieval.retrievalPrecision,
        latency_ms: this.retrieval.vectorSearchDurationMs,
      },

      // Generation & Cost
      generation: {
        tokens: {
          input: this.generation.totalTokens.input,
          output: this.generation.totalTokens.output,
        },
        cost_usd: this.generation.totalCostUsd,
        latency_ms: this.latency.generationMs,
      },

      // Quality Signals
      quality: {
        hallucination: this.quality.hallucination,
        refusal: this.quality.refusal,
      },

      // Latency Breakdown
      latency: {
        query_expansion_ms: this.latency.queryExpansionMs,
        embedding_ms: this.latency.embeddingMs,
        search_ms: this.latency.searchMs,
        generation_ms: this.latency.generationMs,
        total_ms: this.latency.totalMs,
        p95_target_ms: 2500,
      },

      // Overall
      total_elapsed_ms: totalElapsedMs,
    };
  }

  /**
   * Log to console as JSON (production logging platforms parse this).
   * Format: console.log(JSON.stringify(logObject))
   */
  log() {
    const logObject = this.toJSON();
    console.log(JSON.stringify(logObject));
    return logObject;
  }

  /**
   * Log with a custom level (info, warn, error).
   */
  logWithLevel(level = 'info') {
    const logObject = this.toJSON();
    const method = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    method(JSON.stringify({ ...logObject, level }));
    return logObject;
  }
}

/**
 * Helper: Calculate Groq API costs.
 * NOTE: these rates are the old llama-3.1-8b-instant rates and are now only an
 * approximation — the model is openai/gpt-oss-20b (see lib/llm.js). Reported
 * costs are indicative until these constants are checked against Groq pricing.
 * - Input: $0.05 per 1M tokens
 * - Output: $0.15 per 1M tokens
 */
export function calculateCost(inputTokens, outputTokens) {
  const INPUT_COST_PER_MILLION = 0.05;
  const OUTPUT_COST_PER_MILLION = 0.15;

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return {
    input: parseFloat(inputCost.toFixed(8)),
    output: parseFloat(outputCost.toFixed(8)),
    total: parseFloat((inputCost + outputCost).toFixed(8)),
  };
}

/**
 * Extract token usage from Groq API response.
 * Groq returns usage in the response metadata.
 */
export function extractGroqUsage(groqResponse) {
  /*
    Groq non-streaming response includes:
    {
      "usage": {
        "prompt_tokens": 100,
        "completion_tokens": 50,
        "total_tokens": 150
      }
    }
  */
  if (!groqResponse || !groqResponse.usage) {
    return { input: 0, output: 0, total: 0 };
  }

  return {
    input: groqResponse.usage.prompt_tokens || 0,
    output: groqResponse.usage.completion_tokens || 0,
    total: groqResponse.usage.total_tokens || 0,
  };
}

/**
 * Estimate tokens before API call (rough approximation).
 * Rule of thumb: ~4 characters ≈ 1 token
 * @param {string} text
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

/**
 * Simple timer for measuring stage durations.
 */
export class Timer {
  constructor(stageName) {
    this.stageName = stageName;
    this.startTime = Date.now();
  }

  end() {
    const durationMs = Date.now() - this.startTime;
    return {
      stage: this.stageName,
      durationMs,
    };
  }

  endAndLog(logger) {
    const { durationMs } = this.end();
    logger.setLatency(this.stageName, durationMs);
    return durationMs;
  }
}
