/**
 * Debug backslash handling step-by-step
 */

import { JSONParser } from './src/parsers/json-parser.js';

const input = `{
  "path": "C:\\\\Users\\\\Documents"
}`;

console.log('Input:');
console.log(input);
console.log('\n' + '='.repeat(70) + '\n');

const parser = new JSONParser();

// Monkey-patch to see what each fix does
const originalFix = parser.fix.bind(parser);
parser.fix = function(jsonString, options = {}) {
  let fixed = jsonString;
  console.log('Starting fixes...\n');

  // Fix 1: Single quotes
  const beforeQuoteFix = fixed;
  fixed = fixed.replace(/'([^']*)'/g, '"$1"');
  if (fixed !== beforeQuoteFix) {
    console.log('After Fix 1 (single quotes):');
    console.log(fixed);
    console.log();
  }

  // Fix 2: Unclosed strings
  const beforeStringFix = fixed;
  fixed = this._fixUnclosedStrings(fixed);
  if (fixed !== beforeStringFix) {
    console.log('After Fix 2 (unclosed strings):');
    console.log(fixed);
    console.log();
  }

  // Fix 10: Unescaped backslashes
  const beforeBackslashFix = fixed;
  const unescapedBackslashRegex = /"([^"]*\\(?!["\\\/bfnrtu]))/g;
  fixed = fixed.replace(unescapedBackslashRegex, (match, content) => {
    const escaped = '"' + content.replace(/\\/g, '\\\\');
    return escaped;
  });
  if (fixed !== beforeBackslashFix) {
    console.log('After Fix 10 (unescaped backslashes):');
    console.log(fixed);
    console.log();
  }

  return originalFix(jsonString, options);
};

const result = parser.fix(input);

console.log('='.repeat(70));
console.log('Final result:');
console.log(result.fixed);
console.log(`\nSuccess: ${result.success ? '✅' : '❌'}`);
