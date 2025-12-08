/**
 * Test backslash handling in JSON paths
 */

import { JSONParser } from './src/parsers/json-parser.js';

const testCases = [
  {
    name: 'Windows path with backslashes',
    input: `{
  "path": "C:\\\\Users\\\\Documents"
}`,
    description: 'Properly escaped backslashes'
  },
  {
    name: 'Windows path with single backslashes (invalid)',
    input: `{
  "path": "C:\\Users\\Documents"
}`,
    description: 'Invalid - single backslashes need escaping'
  },
  {
    name: 'Mixed issues with path',
    input: `{
  name: 'Product',
  path: "C:\\Users\\Documents"
}`,
    description: 'Unquoted key + invalid backslashes'
  }
];

const parser = new JSONParser();

testCases.forEach((test, i) => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Test ${i + 1}: ${test.name}`);
  console.log(`Description: ${test.description}`);
  console.log('='.repeat(70));

  console.log('\nInput:');
  console.log(test.input);

  const result = parser.fix(test.input);

  console.log('\nFixed:');
  console.log(result.fixed);

  console.log(`\nResult: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Fixes applied: ${result.fixes.join(', ')}`);

  if (!result.success) {
    console.log('\nErrors:');
    result.errors.forEach(err => console.log(`  - ${err.message}`));
  }
});
