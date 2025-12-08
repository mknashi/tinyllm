/**
 * Character-by-character analysis
 */

import { JSONParser } from './src/parsers/json-parser.js';

const input = `{
  "path": "C:\\\\Users\\\\Documents"
}`;

console.log('Input string:');
console.log(input);
console.log('\nCharacter breakdown of the value part:');

// Find the value part
const valueStart = input.indexOf('"C:\\\\');
const valueEnd = input.indexOf('"', valueStart + 1);
const value = input.substring(valueStart, valueEnd + 1);

console.log('Value extracted:', value);
console.log('\nCharacters:');
for (let i = 0; i < value.length; i++) {
  const char = value[i];
  const code = char.charCodeAt(0);
  console.log(`  [${i}] '${char}' (code: ${code}) ${char === '\\' ? '← BACKSLASH' : char === '"' ? '← QUOTE' : ''}`);
}

console.log('\n' + '='.repeat(70));
console.log('Now running through _fixUnclosedStrings...\n');

// Manually trace through _fixUnclosedStrings
const parser = new JSONParser();
const originalMethod = parser._fixUnclosedStrings.bind(parser);

parser._fixUnclosedStrings = function(jsonString) {
  console.log('Input to _fixUnclosedStrings:');
  console.log(jsonString);
  console.log();

  // First pass
  const fixed = jsonString.replace(/:\s*([^"\s{[\]},][^"]*)"(?=\s*[,}\]])/g, (match, value) => {
    console.log('REGEX MATCH:', match);
    console.log('  Captured value:', value);
    if (!value.includes('{') && !value.includes('[')) {
      const replacement = `: "${value}"`;
      console.log('  Replacement:', replacement);
      return replacement;
    }
    return match;
  });

  if (fixed !== jsonString) {
    console.log('After first pass:');
    console.log(fixed);
    console.log();
  } else {
    console.log('First pass: no changes\n');
  }

  return originalMethod(jsonString);
};

const result = parser.fix(input);

console.log('='.repeat(70));
console.log('Final result:');
console.log(result.fixed);
console.log(`Success: ${result.success ? '✅' : '❌'}`);
