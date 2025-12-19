#!/usr/bin/env node

/**
 * Validation script for environment configuration
 * Ensures production files don't contain localhost URLs
 */

const fs = require('fs');
const path = require('path');

const ENV_FILES = [
  'src/environments/environment.ts',
  'src/environments/environment.prod.ts'
];

const REQUIRED_PROD_URLS = [
  'https://api.xdealhub.com',
  'wss://api.xdealhub.com/ws'
];

const FORBIDDEN_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /http:\/\/[^s]/  // http without https (except comments)
];

let hasErrors = false;

console.log('🔍 Validating environment configuration...\n');

ENV_FILES.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${filePath}`);
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Check for forbidden patterns in production files
  if (filePath.includes('environment.ts') || filePath.includes('environment.prod.ts')) {
    FORBIDDEN_PATTERNS.forEach(pattern => {
      if (pattern.test(content)) {
        console.error(`❌ ERROR in ${filePath}:`);
        console.error(`   Contains forbidden pattern: ${pattern}`);
        console.error(`   Production files must not contain localhost or http URLs!\n`);
        hasErrors = true;
      }
    });
    
    // Verify production URLs are present
    REQUIRED_PROD_URLS.forEach(url => {
      if (!content.includes(url)) {
        console.error(`❌ ERROR in ${filePath}:`);
        console.error(`   Missing required production URL: ${url}\n`);
        hasErrors = true;
      }
    });
  }
  
  if (!hasErrors) {
    console.log(`✅ ${filePath} - OK`);
  }
});

if (hasErrors) {
  console.error('\n❌ Environment validation FAILED!');
  console.error('Fix the errors above before deploying to production.\n');
  process.exit(1);
} else {
  console.log('\n✅ All environment files are valid for production!\n');
  process.exit(0);
}
