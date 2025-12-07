/**
 * Debug test for unclosed tag fixing
 */

import { XMLParser } from './src/parsers/xml-parser.js';

const simpleTest = `<?xml version="1.0" encoding="UTF-8"?>
<features>
  <feature>Intel Core i7</feature>
  <feature>512GB SSD
</features>`;

console.log('Simple test case:');
console.log('Input:');
console.log(simpleTest);
console.log('\n');

const parser = new XMLParser();

// Just test _fixUnclosedTags directly
const result = parser._fixUnclosedTags(simpleTest);

console.log('Unclosed tags found:', result.unclosedTags);
console.log('\nFixed XML:');
console.log(result.fixedXml);
console.log('\n');

const parseResult = parser.parse(result.fixedXml);
console.log(`Parsing result: ${parseResult.success ? '✅ Valid' : '❌ Invalid'}`);
if (!parseResult.success) {
  console.log('Errors:');
  parseResult.errors.forEach(err => console.log(`  - ${err.message}`));
}
