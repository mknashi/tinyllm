import { XMLParser } from './src/parsers/xml-parser.js';

const parser = new XMLParser();

const xml = '<root><![CDATA[<data>]]></root>';
console.log('Testing CDATA section:', xml);

const result = parser.fix(xml);
console.log('\nSuccess:', result.success);
console.log('Fixes:', result.fixes);
console.log('Errors:', result.errors);
console.log('\nFixed XML:', result.fixed);
