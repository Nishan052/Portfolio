/**
 * quality-detectors.js — Hallucination and refusal detection
 * Analyzes generated answers against retrieved context.
 */

/**
 * Detect if an answer is likely hallucinating (contradicting source material).
 * Uses simple but effective heuristics:
 * 1. Check if answer contains entities NOT in context (potential fabrication)
 * 2. Check for date/number mismatches
 * 3. Look for confident statements about missing context
 *
 * @param {string} answer - Generated LLM response
 * @param {string} context - Retrieved document chunks
 * @returns {{ detected: boolean, confidence: number, reason?: string }}
 */
export function detectHallucination(answer, context) {
  if (!answer || answer.length < 10) {
    return { detected: false, confidence: 0 };
  }

  if (!context) {
    // If no context, any confident answer is suspicious
    const confident = answer.match(/\b(definitely|certainly|always|never|must|guaranteed)\b/i);
    return confident 
      ? { detected: true, confidence: 0.6, reason: 'confident_answer_without_context' }
      : { detected: false, confidence: 0 };
  }

  const detectedFlags = [];

  // Flag 1: Check for definitive statements about things not in context
  const definitivePattern = /\b(they are|they have|they've|it is|it's|that is|that's)\s+[^.]{5,30}(is|was|are|were|be)\b/gi;
  const definitiveMatches = answer.match(definitivePattern) || [];
  
  for (const match of definitiveMatches) {
    // Check if this statement is actually grounded in context
    const cleanMatch = match.toLowerCase().replace(/\b(they are|they have|it is|that is)\s+/, '');
    if (!context.toLowerCase().includes(cleanMatch.slice(0, 50))) {
      detectedFlags.push('ungrounded_definitive_statement');
    }
  }

  // Flag 2: Date/number mismatches
  const answerDates = answer.match(/\b(19|20)\d{2}\b/g) || [];
  const contextDates = context.match(/\b(19|20)\d{2}\b/g) || [];
  
  if (answerDates.length > 0 && contextDates.length > 0) {
    const answerYears = new Set(answerDates);
    const contextYears = new Set(contextDates);
    const mismatchedYears = [...answerYears].filter(y => !contextYears.has(y));
    
    if (mismatchedYears.length > 0) {
      detectedFlags.push('date_mismatch');
    }
  }

  // Flag 3: Claims about specific projects/technologies not mentioned
  const projectPattern = /\b(built|created|developed|worked with|used|implemented)\s+(?<project>[A-Za-z0-9\-_\.]+)/gi;
  const answerProjects = [...answer.matchAll(projectPattern)].map(m => m.groups.project.toLowerCase());
  
  for (const project of answerProjects) {
    if (project.length > 2 && !context.toLowerCase().includes(project)) {
      detectedFlags.push('unknown_project_invented');
    }
  }

  // Calculate confidence score
  let confidence = 0;
  if (detectedFlags.length === 0) {
    confidence = 0; // No hallucination signals
  } else if (detectedFlags.length === 1) {
    confidence = 0.4;
  } else if (detectedFlags.length === 2) {
    confidence = 0.7;
  } else {
    confidence = 0.95;
  }

  return {
    detected: confidence > 0.5,
    confidence: Math.min(confidence, 0.99),
    reason: detectedFlags.length > 0 ? detectedFlags[0] : undefined,
  };
}

/**
 * Detect if LLM refused to answer (claimed lack of knowledge).
 * These refusal patterns indicate the model won't provide an answer.
 *
 * @param {string} answer - Generated LLM response
 * @returns {{ detected: boolean, confidence: number, pattern?: string }}
 */
export function detectRefusal(answer) {
  if (!answer || answer.length < 3) {
    return { detected: false, confidence: 0 };
  }

  const refusalPatterns = [
    // Direct knowledge claims
    { pattern: /\bI don'?t (have|know|possess|contain)\b/i, weight: 0.8 },
    { pattern: /\b(I can'?t|I'm unable to|I cannot)\s+(answer|provide|say|help)/i, weight: 0.8 },
    { pattern: /\b(I don'?t have )(information|details|knowledge|data)\b/i, weight: 0.8 },
    
    // Document limitations
    { pattern: /\b(no information|not mentioned|not included|not available)\b/i, weight: 0.6 },
    { pattern: /\b(not (described|documented|covered|stated))\b/i, weight: 0.6 },
    
    // Uncertainty phrases
    { pattern: /\b(I'm not sure|I'm uncertain|I can't confirm)\b/i, weight: 0.5 },
    { pattern: /\b(I couldn'?t find|I didn'?t find)\b/i, weight: 0.6 },
  ];

  const answerLower = answer.toLowerCase();
  let maxConfidence = 0;
  let matchedPattern = null;

  for (const { pattern, weight } of refusalPatterns) {
    if (pattern.test(answerLower)) {
      maxConfidence = Math.max(maxConfidence, weight);
      if (!matchedPattern) matchedPattern = pattern.source;
    }
  }

  return {
    detected: maxConfidence > 0.5,
    confidence: maxConfidence,
    pattern: matchedPattern,
  };
}

/**
 * Compute retrieval precision@k: what % of top-k results are relevant?
 * This requires ground truth labels.
 *
 * @param {Array} retrievedChunks - Retrieved chunks from vector DB
 * @param {Array} expectedRelevantSources - Array of { source, text } that should be relevant
 * @returns {{ precision: number, relevant: number, total: number }}
 */
export function computePrecision(retrievedChunks, expectedRelevantSources) {
  if (!retrievedChunks || retrievedChunks.length === 0) {
    return { precision: 0, relevant: 0, total: 0 };
  }

  if (!expectedRelevantSources || expectedRelevantSources.length === 0) {
    // If no ground truth provided, we can't compute precision
    return { precision: null, relevant: 0, total: retrievedChunks.length };
  }

  let relevant = 0;

  for (const chunk of retrievedChunks) {
    const isRelevant = expectedRelevantSources.some(expected =>
      (expected.source && chunk.source.includes(expected.source)) ||
      (expected.text && chunk.text.includes(expected.text))
    );

    if (isRelevant) relevant++;
  }

  return {
    precision: relevant / retrievedChunks.length,
    relevant,
    total: retrievedChunks.length,
  };
}

/**
 * Compute ROUGE-L score: similarity between generated answer and reference answer.
 * ROUGE-L = longest common subsequence overlap.
 * Simple implementation using LCS algorithm.
 *
 * @param {string} generated - LLM-generated answer
 * @param {string} reference - Ground truth / expected answer
 * @returns {{ score: number, lcs_length: number }}
 */
export function computeRougeL(generated, reference) {
  if (!generated || !reference) {
    return { score: 0, lcs_length: 0 };
  }

  // Normalize: split into tokens
  const genTokens = generated.toLowerCase().split(/\s+/);
  const refTokens = reference.toLowerCase().split(/\s+/);

  const lcsLength = longestCommonSubsequence(genTokens, refTokens);

  // ROUGE-L recall & precision
  const recall = lcsLength / refTokens.length;
  const precision = lcsLength / genTokens.length;

  // F-score (harmonic mean of recall and precision)
  const fScore = recall === 0 || precision === 0 
    ? 0 
    : 2 * (recall * precision) / (recall + precision);

  return {
    score: Math.round(fScore * 100) / 100, // Round to 2 decimals
    lcs_length: lcsLength,
  };
}

/**
 * Compute longest common subsequence length (dynamic programming).
 * @private
 */
function longestCommonSubsequence(arr1, arr2) {
  const m = arr1.length;
  const n = arr2.length;

  // DP table
  const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Simple BLEU-like score (1-gram precision with brevity penalty).
 * Not a true BLEU (which uses n-grams), but useful for quick quality checks.
 *
 * @param {string} generated - LLM-generated answer
 * @param {string} reference - Ground truth answer
 * @returns {{ score: number, matched_tokens: number }}
 */
export function computeSimpleBLEU(generated, reference) {
  if (!generated || !reference) {
    return { score: 0, matched_tokens: 0 };
  }

  const genTokens = generated.toLowerCase().split(/\s+/);
  const refTokens = reference.toLowerCase().split(/\s+/).slice(0, 50); // Cap at 50 tokens

  const refSet = new Set(refTokens);
  let matched = 0;

  for (const token of genTokens) {
    if (refSet.has(token)) matched++;
  }

  // Simple precision: matched / generated
  const precision = genTokens.length > 0 ? matched / genTokens.length : 0;

  // Brevity penalty: if generated too short, penalize
  const brevityRatio = genTokens.length / refTokens.length;
  const brevityPenalty = brevityRatio < 0.5 ? 0.5 : 1; // Heavy penalty if < 50% length

  const score = precision * brevityPenalty;

  return {
    score: Math.round(score * 100) / 100,
    matched_tokens: matched,
  };
}
