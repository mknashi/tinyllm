/**
 * Regression test for Fix #11 bug
 * Ensures that valid JSON strings are not corrupted with \b escape sequences
 */

import { JSONParser } from '../src/parsers/json-parser.js';

const parser = new JSONParser();

// Test case from the bug report
const testInput = `{
  "name": "Salesforce CMS to Data Cloud 20250613190655",
  "nodes": [
    {
      "parameters": {
        "requestMethod": "POST",
        "url": "https://login.salesforce.com/services/oauth2/token"
      }
      "name": "Get Token",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}`;

console.log('Running regression test for Fix #11 bug...\n');

const result = parser.fix(testInput);

console.log('Test input (malformed JSON with missing comma):');
console.log(testInput);
console.log('\n---\n');

console.log('Fixed output:');
console.log(result.fixed);
console.log('\n---\n');

console.log('Fixes applied:', result.fixes);
console.log('Success:', result.success);

// Verify the fix doesn't contain \b corruption
const hasBackspaceCorruption = result.fixed.includes('\\bname\\b') ||
                                result.fixed.includes('\\bSalesforce\\b');

if (hasBackspaceCorruption) {
  console.error('\n❌ FAIL: Output contains \\b corruption!');
  console.error('The fix for JSON still corrupts strings with \\b escape sequences.');
  process.exit(1);
} else {
  console.log('\n✅ PASS: No \\b corruption detected.');
}

// Verify the fixed JSON is valid
try {
  const parsed = JSON.parse(result.fixed);
  console.log('✅ PASS: Fixed JSON is valid and parseable.');

  // Verify specific values are correct (no \b corruption)
  if (parsed.name === 'Salesforce CMS to Data Cloud 20250613190655') {
    console.log('✅ PASS: String values are preserved correctly.');
  } else {
    console.error('❌ FAIL: String value corrupted:', parsed.name);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ FAIL: Fixed JSON is not valid:', error.message);
  process.exit(1);
}

console.log('\n🎉 All regression tests passed!');
