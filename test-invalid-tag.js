import { XMLParser } from './src/parsers/xml-parser.js';

const parser = new XMLParser();

const xml = '<1root>value</1root>';
console.log('Testing invalid tag name:', xml);

const result = parser.fix(xml);
console.log('\nSuccess:', result.success);
console.log('Fixes:', result.fixes);
console.log('Errors:', result.errors);
console.log('\nFixed XML:', result.fixed);
