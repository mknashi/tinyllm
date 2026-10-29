/**
 * Table-driven JSON fix cases
 *
 * Each case checks the parsed data, not just that a fix "succeeded".
 * Cases in KNOWN_FAILING are gaps the rule-based fixer doesn't handle yet:
 * they must still fail safely (no wrong data), and must be removed from the
 * list once they pass, so the list stays accurate.
 */

import { JSONParser } from '../src/parsers/json-parser.js';

// [name, input, expected data]
const cases = [
  // Missing commas
  ['missing comma: strings', '{"a": "x" "b": "y"}', { a: 'x', b: 'y' }],
  ['missing comma: numbers', '{"a": 1 "b": 2}', { a: 1, b: 2 }],
  ['missing comma: after literal', '{"a": true "b": null}', { a: true, b: null }],
  ['missing comma: newline', '{"a": 1\n"b": 2}', { a: 1, b: 2 }],
  ['missing comma: array numbers', '[1 2 3]', [1, 2, 3]],
  ['missing comma: array strings', '["a" "b"]', ['a', 'b']],
  ['missing comma: array objects', '[{"a":1} {"a":2}]', [{ a: 1 }, { a: 2 }]],
  ['missing comma: array literals', '[true false null]', [true, false, null]],
  ['missing comma: negative numbers', '[-1 -2.5 3e2]', [-1, -2.5, 300]],
  ['missing comma: before nested object', '{"a": 1 "b": {"c": 2}}', { a: 1, b: { c: 2 } }],

  // Colons
  ['missing colon: string', '{"a" "x"}', { a: 'x' }],
  ['missing colon: number', '{"a" 1}', { a: 1 }],
  ['comma for colon', '{"a", 1}', { a: 1 }],
  ['equals for colon', '{"a" = 1}', { a: 1 }],
  ['double colon', '{"a":: 1}', { a: 1 }],

  // Commas
  ['double comma: object', '{"a": 1,, "b": 2}', { a: 1, b: 2 }],
  ['double comma: array', '[1,, 2]', [1, 2]],
  ['leading comma', '{, "a": 1}', { a: 1 }],
  ['trailing comma: object', '{"a": 1,}', { a: 1 }],
  ['trailing comma: array', '[1, 2,]', [1, 2]],

  // Keys and quotes
  ['unquoted key', '{a: 1}', { a: 1 }],
  ['unquoted key with dash', '{user-id: 1}', { 'user-id': 1 }],
  ['unquoted string value', '{"a": hello}', { a: 'hello' }],
  ['single quotes', "{'a': 'x'}", { a: 'x' }],
  ['single quote with apostrophe', '{\'a\': "it\'s"}', { a: "it's" }],
  ['unclosed string value', '{"a": "x}', { a: 'x' }],
  ['unclosed key', '{"a: 1}', { a: 1 }],
  ['unescaped inner quotes', '{"a": "say "hi" now"}', { a: 'say "hi" now' }],
  ['smart quotes', '{\u201ca\u201d: \u201cx\u201d}', { a: 'x' }],

  // Braces and brackets
  ['missing closing brace', '{"a": 1', { a: 1 }],
  ['missing closing bracket', '{"a": [1, 2}', { a: [1, 2] }],
  ['missing opening brace', '"a": 1}', { a: 1 }],
  ['extra closing brace', '{"a": 1}}', { a: 1 }],
  ['mismatched closer', '{"a": [1, 2}}', { a: [1, 2] }],

  // Comments
  ['line comment', '{"a": 1 // c\n}', { a: 1 }],
  ['block comment', '{/* c */ "a": 1}', { a: 1 }],
  ['url in string is not a comment', '{"u": "http://x.com"}', { u: 'http://x.com' }],

  // Non-JSON literals and numbers
  ['leading zero', '{"a": 007}', { a: 7 }],
  ['leading zero in array', '[01, -002, 0, 0.5]', [1, -2, 0, 0.5]],
  ['time in string keeps leading zero', '{"time": "10:05", "a": 1,}', { time: '10:05', a: 1 }],
  ['unclosed key: string value', '{"a: "x"}', { a: 'x' }],
  ['unclosed key: nested value', '{"a: {"b": 1}}', { a: { b: 1 } }],
  ['NaN', '{"a": NaN}', { a: null }],
  ['undefined', '{"a": undefined}', { a: null }],
  ['Python literals', '{"a": True, "b": None}', { a: true, b: null }],
  ['hex number', '{"a": 0x1F}', { a: 31 }],
  ['plus sign number', '{"a": +1}', { a: 1 }],
  ['trailing decimal point', '{"a": 1.}', { a: 1 }],

  // Strings
  ['windows path', '{"p": "C:\\Users\\x"}', { p: 'C:\\Users\\x' }],
  ['literal tab in string', '{"a": "x\ty"}', { a: 'x\ty' }],
  ['literal newline in string', '{"a": "x\ny"}', { a: 'x\ny' }],

  // Pasted input
  ['BOM prefix', '\uFEFF{"a": 1}', { a: 1 }],
  ['markdown fence', '```json\n{"a": 1}\n```', { a: 1 }],
  ['trailing text', '{"a": 1} done', { a: 1 }],

  // Combined and reported cases
  ['nested missing comma and colon', '{"o": {"a" 1 "b": 2}}', { o: { a: 1, b: 2 } }],
  ['reported: comma for colon', '{"name": "Johsn",\n"address", "12345 Main St"}', { name: 'Johsn', address: '12345 Main St' }],
  ['reported: missing colon before number', '{\n  "name": "Johsn",\n  "phone" 123455,\n  "email": "abc@example.com"\n}', { name: 'Johsn', phone: 123455, email: 'abc@example.com' }],
];

// Remove a name once its case passes
const KNOWN_FAILING = new Set([
  'equals for colon',
  'double colon',
  'double comma: object',
  'double comma: array',
  'leading comma',
  'unquoted key with dash',
  'unquoted string value',
  'unclosed string value',
  'unescaped inner quotes',
  'smart quotes',
  'missing closing bracket',
  'extra closing brace',
  'mismatched closer',
  'Python literals',
  'hex number',
  'plus sign number',
  'trailing decimal point',
  'literal newline in string',
  'BOM prefix',
  'markdown fence',
  'trailing text',
]);

const parser = new JSONParser();
let passed = 0;
let failed = 0;
let knownFailing = 0;

console.log('\n🧪 JSON Fix Cases\n');

for (const [name, input, expected] of cases) {
  let result;
  try {
    result = parser.fix(input);
  } catch (error) {
    result = { success: false, crash: error.message };
  }

  const correct = result.success && JSON.stringify(result.data) === JSON.stringify(expected);
  const wrongData = result.success && !correct;

  if (KNOWN_FAILING.has(name)) {
    if (correct) {
      console.error(`✗ ${name} now passes - remove it from KNOWN_FAILING`);
      failed++;
    } else if (wrongData || result.crash) {
      console.error(`✗ ${name} (known gap) must fail safely, got: ${result.crash || JSON.stringify(result.data)}`);
      failed++;
    } else {
      knownFailing++;
    }
  } else if (correct) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    const got = result.crash ? `crash: ${result.crash}` : result.success ? JSON.stringify(result.data) : 'not fixed';
    console.error(`✗ ${name} (expected: ${JSON.stringify(expected)}, got: ${got})`);
    failed++;
  }
}

console.log(`\n📊 JSON Fix Cases: ${passed} passed, ${failed} failed, ${knownFailing} known failing\n`);
process.exit(failed === 0 ? 0 : 1);
