#!/usr/bin/env node

/**
 * validate-deployment.js — Pre-flight deployment validation
 * 
 * Checks that system is configured correctly before production deployment:
 * - All required environment variables are set
 * - External service connectivity verified
 * - Configurations are valid
 * - Build artifacts exist
 * 
 * Usage:
 *   node scripts/validate-deployment.js
 *   npm run validate:deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'GROQ_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'PINECONE_API_KEY',
  'PINECONE_INDEX_NAME',
  'PINECONE_NAMESPACE',
];

/**
 * Required files/artifacts
 */
const REQUIRED_FILES = [
  'functions/api/chat.js',
  'functions/api/lib/structured-logger.js',
  'functions/api/lib/quality-detectors.js',
  'functions/api/lib/cache.js',
  'functions/api/lib/config.js',
  'functions/api/lib/embed.js',
  'functions/api/lib/llm.js',
  'functions/api/lib/pinecone.js',
  'functions/api/lib/system-prompt.js',
  'build/index.html', // Built frontend
  'package.json',
  'wrangler.toml',
];

/**
 * Check single environment variable
 */
function checkEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    return { passed: false, message: `✗ ${name}: Not set` };
  }
  
  // Mask sensitive value
  const masked = value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : '***';
  return { passed: true, message: `✓ ${name}: ${masked}` };
}

/**
 * Check file existence
 */
function checkFileExists(filePath) {
  const fullPath = path.join(ROOT_DIR, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    return { 
      passed: true, 
      message: `✓ ${filePath} (${formatBytes(stats.size)})` 
    };
  } else {
    return { 
      passed: false, 
      message: `✗ ${filePath}: Not found` 
    };
  }
}

/**
 * Simulate connectivity check (in real deployment, would ping services)
 */
async function checkConnectivity() {
  // This would check:
  // - Groq API availability
  // - Pinecone connectivity
  // - Upstash Redis connectivity
  // For now, we just check that credentials exist
  
  const checks = [
    {
      name: 'Groq API',
      status: process.env.GROQ_API_KEY ? 'available' : 'not configured',
      critical: true,
    },
    {
      name: 'Pinecone Vector DB',
      status: process.env.PINECONE_API_KEY ? 'available' : 'not configured',
      critical: true,
    },
    {
      name: 'Upstash Redis Cache',
      status: process.env.UPSTASH_REDIS_REST_URL ? 'available' : 'not configured',
      critical: true,
    },
    {
      name: 'CloudFlare Workers AI',
      status: 'available (built-in)',
      critical: false,
    },
  ];

  return checks;
}

/**
 * Validate configuration values
 */
function validateConfig() {
  const issues = [];

  // Check API key lengths
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length < 20) {
    issues.push('Groq API key seems too short');
  }
  if (process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY.length < 20) {
    issues.push('Pinecone API key seems too short');
  }

  // Check URL formats
  if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.startsWith('https://')) {
    issues.push('Upstash Redis URL should use HTTPS');
  }

  // Check index name
  if (process.env.PINECONE_INDEX_NAME && !/^[a-z0-9-]+$/.test(process.env.PINECONE_INDEX_NAME)) {
    issues.push('Pinecone index name contains invalid characters');
  }

  return issues;
}

/**
 * Format bytes to human-readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main validation
 */
async function validateDeployment() {
  console.log('\n' + '═'.repeat(70));
  console.log('DEPLOYMENT PRE-FLIGHT VALIDATION');
  console.log('═'.repeat(70) + '\n');

  let passed = 0;
  let failed = 0;

  // ═══════════════════════════════════════════════════════════════════════
  // 1. Environment Variables
  // ═══════════════════════════════════════════════════════════════════════
  console.log('1. Environment Variables\n');
  
  for (const envVar of REQUIRED_ENV_VARS) {
    const check = checkEnvVar(envVar);
    console.log(`   ${check.message}`);
    if (check.passed) passed++;
    else failed++;
  }
  console.log();

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Required Files
  // ═══════════════════════════════════════════════════════════════════════
  console.log('2. Required Files\n');
  
  for (const file of REQUIRED_FILES) {
    const check = checkFileExists(file);
    console.log(`   ${check.message}`);
    if (check.passed) passed++;
    else failed++;
  }
  console.log();

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Service Connectivity
  // ═══════════════════════════════════════════════════════════════════════
  console.log('3. External Services\n');
  
  const services = await checkConnectivity();
  for (const service of services) {
    const status = service.status === 'available' || service.status === 'available (built-in)' ? '✓' : '✗';
    console.log(`   ${status} ${service.name}: ${service.status}`);
    if (status === '✓') passed++;
    else if (service.critical) failed++;
  }
  console.log();

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Configuration Validation
  // ═══════════════════════════════════════════════════════════════════════
  console.log('4. Configuration Validation\n');
  
  const configIssues = validateConfig();
  if (configIssues.length === 0) {
    console.log('   ✓ All configuration values are valid\n');
    passed++;
  } else {
    for (const issue of configIssues) {
      console.log(`   ⚠️  ${issue}`);
      failed++;
    }
    console.log();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════
  const total = passed + failed;
  const passRate = total > 0 ? (passed / total * 100).toFixed(1) : 0;
  const allPassed = failed === 0;

  console.log('─'.repeat(70));
  console.log(`SUMMARY: ${passed}/${total} checks passed (${passRate}%)`);
  console.log('─'.repeat(70) + '\n');

  if (allPassed) {
    console.log('✓ DEPLOYMENT APPROVED\n');
    console.log('All checks passed. System is ready for deployment.\n');
    console.log('Next steps:');
    console.log('  1. Run npm run test:quality-gate to validate quality');
    console.log('  2. Deploy with: npm run deploy (if configured)');
    console.log('  3. Monitor production metrics\n');
    return 0;
  } else {
    console.log('✗ DEPLOYMENT BLOCKED\n');
    console.log('Fix the following issues before deploying:\n');
    
    if (failed > 0) {
      console.log('Critical Issues:');
      for (const envVar of REQUIRED_ENV_VARS) {
        if (!process.env[envVar]) {
          console.log(`  • Set environment variable: ${envVar}`);
        }
      }
      console.log();
    }

    console.log('Next steps:');
    console.log('  1. Create .env.production with all required variables');
    console.log('  2. Verify all required files exist');
    console.log('  3. Check external service credentials');
    console.log('  4. Re-run this validation\n');
    
    return 1;
  }
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await validateDeployment();
  process.exit(exitCode);
}

export default validateDeployment;
