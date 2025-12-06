/**
 * Comprehensive gap analysis for JSON parser
 * Tests edge cases and scenarios that might not be covered
 */

import { JSONParser } from './src/parsers/json-parser.js';

const parser = new JSONParser();
const testCases = [
  {
    name: 'Missing colon between key and value',
    input: '{"name" "value"}',
    shouldFix: false,
    description: 'Should detect missing colon'
  },
  {
    name: 'Multiple commas in a row',
    input: '{"a": 1,, "b": 2}',
    shouldFix: false,
    description: 'Multiple commas should be detected'
  },
  {
    name: 'Comma before first element',
    input: '{, "a": 1}',
    shouldFix: false,
    description: 'Leading comma should be detected'
  },
  {
    name: 'Mixed quotes (open " close \')',
    input: '{"name": "value\'}',
    shouldFix: false,
    description: 'Mismatched quote types'
  },
  {
    name: 'Number with leading zero',
    input: '{"value": 01}',
    shouldFix: true,
    description: 'Leading zeros in numbers are invalid but might parse'
  },
  {
    name: 'Unescaped tab in string',
    input: '{"name": "hello\tworld"}',
    shouldFix: true,
    description: 'Unescaped control characters'
  },
  {
    name: 'Unescaped newline in string',
    input: '{"name": "hello\nworld"}',
    shouldFix: false,
    description: 'Unescaped newline should break string'
  },
  {
    name: 'Missing value after colon',
    input: '{"name": }',
    shouldFix: false,
    description: 'No value provided'
  },
  {
    name: 'Missing key before colon',
    input: '{: "value"}',
    shouldFix: false,
    description: 'No key provided'
  },
  {
    name: 'Bare value without object',
    input: '"just a string"',
    shouldFix: true,
    description: 'Valid JSON but not an object/array'
  },
  {
    name: 'Array with only commas',
    input: '[,,,]',
    shouldFix: false,
    description: 'Empty elements'
  },
  {
    name: 'Duplicate keys',
    input: '{"name": "first", "name": "second"}',
    shouldFix: true,
    description: 'Valid JSON, last value wins'
  },
  {
    name: 'Unescaped backslash',
    input: '{"path": "C:\\Users\\test"}',
    shouldFix: true,
    description: 'Backslashes need escaping'
  },
  {
    name: 'Missing comma after nested object',
    input: '{"obj": {"a": 1} "b": 2}',
    shouldFix: true,
    description: 'Missing comma between properties'
  },
  {
    name: 'Plus sign in number',
    input: '{"value": +5}',
    shouldFix: false,
    description: 'Plus prefix not allowed'
  },
  {
    name: 'Hexadecimal number',
    input: '{"value": 0xFF}',
    shouldFix: false,
    description: 'Hex notation not allowed'
  },
  {
    name: 'Missing opening brace',
    input: '"name": "value"}',
    shouldFix: true,
    description: 'Should add opening brace'
  },
  {
    name: 'Extra closing brace',
    input: '{"name": "value"}}',
    shouldFix: false,
    description: 'Too many closing braces'
  },
  {
    name: 'Function call in value',
    input: '{"date": new Date()}',
    shouldFix: false,
    description: 'JavaScript code not allowed'
  },
  {
    name: 'Trailing comma in array',
    input: '["a", "b",]',
    shouldFix: true,
    description: 'Already covered - should fix'
  }
];

console.log('📊 JSON Parser Gap Analysis\n');
console.log('='.repeat(80));

let covered = 0;
let gaps = 0;
const gapsList = [];

testCases.forEach((test, i) => {
  const result = parser.fix(test.input);
  const success = result.success;
  const expected = test.shouldFix;

  const status = success === expected ? '✅' : '⚠️ GAP';

  if (success !== expected) {
    gaps++;
    gapsList.push({
      name: test.name,
      input: test.input,
      expected: expected ? 'Should fix' : 'Should fail',
      actual: success ? 'Fixed' : 'Failed',
      description: test.description
    });
  } else {
    covered++;
  }

  console.log(`\n${i + 1}. ${test.name}`);
  console.log(`   ${status} ${success ? 'FIXED' : 'FAILED'} (expected: ${expected ? 'FIX' : 'FAIL'})`);
  if (success) {
    console.log(`   Fixes: ${result.fixes.join(', ')}`);
  } else {
    console.log(`   Error: ${result.errors[0]?.message || 'Parse failed'}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📈 Coverage: ${covered}/${testCases.length} scenarios handled correctly`);
console.log(`⚠️  Gaps found: ${gaps}`);

if (gapsList.length > 0) {
  console.log('\n🔍 GAPS REQUIRING ATTENTION:\n');
  gapsList.forEach((gap, i) => {
    console.log(`${i + 1}. ${gap.name}`);
    console.log(`   Expected: ${gap.expected}`);
    console.log(`   Actual: ${gap.actual}`);
    console.log(`   Description: ${gap.description}`);
    console.log(`   Input: ${gap.input}`);
    console.log('');
  });
}
