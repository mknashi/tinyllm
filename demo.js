/**
 * Quick demo showing TinyLLM works without training
 */

import { JSONParser } from './src/parsers/json-parser.js';
import { XMLParser } from './src/parsers/xml-parser.js';

console.log('🚀 TinyLLM Demo - No Training Required!\n');
console.log('='.repeat(60));

// Demo 1: Fix broken JSON
console.log('\n📝 Demo 1: Fixing Broken JSON\n');

const brokenJSON = `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  hobbies: ['reading', 'coding'],
  "active": true,
}`;

console.log('BROKEN INPUT:');
console.log(brokenJSON);

const jsonParser = new JSONParser();
const jsonResult = jsonParser.fix(brokenJSON);

console.log('\n✅ FIXED OUTPUT:');
console.log(jsonResult.fixed);

console.log('\n🔧 Fixes Applied:');
jsonResult.fixes.forEach(fix => console.log(`   • ${fix}`));

// Demo 2: Fix broken XML
console.log('\n' + '='.repeat(60));
console.log('\n📝 Demo 2: Fixing Broken XML\n');

const brokenXML = `<person>
  <name>John Doe</name>
  <age>30
  <email>john@example.com</email>
  <address city=NYC>
    <street>123 Main St</street>
  </address>
</person>`;

console.log('BROKEN INPUT:');
console.log(brokenXML);

const xmlParser = new XMLParser();
const xmlResult = xmlParser.fix(brokenXML);

console.log('\n✅ FIXED OUTPUT:');
console.log(xmlResult.fixed);

console.log('\n🔧 Fixes Applied:');
xmlResult.fixes.forEach(fix => console.log(`   • ${fix}`));

// Demo 3: Validation
console.log('\n' + '='.repeat(60));
console.log('\n📝 Demo 3: Validation\n');

const validJSON = '{"name": "Alice", "age": 25, "active": true}';
const validation = jsonParser.validate(validJSON);

console.log(`Valid JSON: ${validJSON}`);
console.log(`Validation Result: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);
console.log(`Issues Found: ${validation.issues.length}`);

console.log('\n' + '='.repeat(60));
console.log('\n✨ All demos completed successfully!');
console.log('💡 No training required - rule-based fixing works perfectly!\n');
