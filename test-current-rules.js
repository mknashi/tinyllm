/**
 * Test Enhanced Rule-Based Fixing
 * Test the current implementation with user's XML
 */

import { XMLParser } from './src/parsers/xml-parser.js';

const brokenXML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
      <product id="P001">
      <name>Laptop Pro</name>
      <category>Electronics</category>
      <price currency="USD">1200.00</price>
      <description>High-performance laptop with a powerful processor and ample storage.</description>
      <features>
        <feature>Intel Core i7</feature>
        <feature>16GB RAM</feature>
        <feature>512GB SSD
      </features>
      </product>
</catalog>`;

console.log('Testing Current Rule-Based Implementation\n');
console.log('Input XML:');
console.log('─'.repeat(60));
console.log(brokenXML);
console.log('─'.repeat(60));

const parser = new XMLParser();
const result = parser.fix(brokenXML);

console.log('\nResult:');
console.log(`Success: ${result.success ? '✅' : '❌'}`);
console.log(`Fixes applied (${result.fixes.length}):`);
result.fixes.forEach((fix, i) => {
  console.log(`  ${i + 1}. ${fix}`);
});

if (result.success) {
  console.log('\n✅ Fixed XML:');
  console.log('─'.repeat(60));
  console.log(result.fixed);
  console.log('─'.repeat(60));
} else {
  console.log('\n❌ Errors:');
  result.errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err.message}`);
  });

  console.log('\nPartially fixed XML:');
  console.log('─'.repeat(60));
  console.log(result.fixed);
  console.log('─'.repeat(60));
}

// Try to parse the result
const parseResult = parser.parse(result.fixed);
console.log(`\nParsing result: ${parseResult.success ? '✅ Valid' : '❌ Invalid'}`);
if (!parseResult.success) {
  console.log('Parse errors:');
  parseResult.errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err.message}`);
  });
}
