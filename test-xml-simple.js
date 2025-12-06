import { XMLParser } from './src/parsers/xml-parser.js';

const parser = new XMLParser();

// Simple test
const xml = '<root>value</root>';
console.log('Testing:', xml);

const result = parser.fix(xml);
console.log('Success:', result.success);
console.log('Fixes:', result.fixes);
console.log('Errors:', result.errors);

if (result.success) {
  console.log('\n✅ Fixed XML:');
  console.log(result.fixed);
} else {
  console.log('\n❌ Failed');
}
