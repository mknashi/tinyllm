import { XMLParser } from './src/parsers/xml-parser.js';

const parser = new XMLParser();

// Simple test
const xml = '<root>value</root>';
console.log('Input:', xml);

const result = parser.fix(xml);
console.log('\nOutput:', result.fixed);
console.log('\nSuccess:', result.success);
console.log('Fixes:', result.fixes);
console.log('Errors:', result.errors);
