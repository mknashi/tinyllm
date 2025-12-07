import { XMLParser } from './src/parsers/xml-parser.js';
import { JSONParser } from './src/parsers/json-parser.js';
import { NanoTransformer } from './src/model/nano-transformer.js';
import { Tokenizer } from './src/utils/tokenizer.js';

console.log('=== Testing Auto-Fallback to AI Mode ===\n');

// Initialize AI model and tokenizer
console.log('Loading AI model...');
const model = new NanoTransformer();
const tokenizer = new Tokenizer();

// Test 1: Complex XML scenario - unclosed nested tag
console.log('\n--- Test 1: Complex XML with unclosed nested tag ---');
const xmlParser = new XMLParser();

const complexXML = `<?xml version="1.0" encoding="UTF-8"?>
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

console.log('Input XML has unclosed <feature> tag before </features> closes\n');

// First try without AI (rule-based only)
console.log('Attempting rule-based fix...');
const ruleBasedResult = xmlParser.fix(complexXML);
console.log('Rule-based success:', ruleBasedResult.success);
console.log('Can try AI:', ruleBasedResult.canTryAI);

if (!ruleBasedResult.success) {
  console.log('\nRule-based fixing failed. Trying with AI auto-fallback...');

  // Try with AI auto-fallback
  const aiResult = await xmlParser.fix(complexXML, {
    useAI: true,
    model: model,
    tokenizer: tokenizer
  });

  console.log('\nAI mode success:', aiResult.success);
  console.log('Method used:', aiResult.method);
  console.log('Fixes applied:', aiResult.fixes);

  if (aiResult.success) {
    console.log('\n✅ Fixed XML:');
    console.log(aiResult.fixed);
  } else {
    console.log('\n❌ AI mode also failed');
    console.log('Errors:', aiResult.errors);
  }
}

// Test 2: Complex JSON scenario
console.log('\n\n--- Test 2: Complex JSON with structural errors ---');
const jsonParser = new JSONParser();

const complexJSON = `{
  "users": [
    {
      "id": 1,
      "name": "John Doe"
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "active": true
`;

console.log('Input JSON has missing commas and unclosed structures\n');

// Try with AI auto-fallback
console.log('Attempting fix with AI auto-fallback...');
const jsonResult = await jsonParser.fix(complexJSON, {
  useAI: true,
  model: model,
  tokenizer: tokenizer
});

console.log('\nSuccess:', jsonResult.success);
console.log('Method used:', jsonResult.method);
console.log('Fixes applied:', jsonResult.fixes);

if (jsonResult.success) {
  console.log('\n✅ Fixed JSON:');
  console.log(JSON.stringify(jsonResult.data, null, 2));
} else {
  console.log('\n❌ Fixing failed');
  console.log('Errors:', jsonResult.errors);
}

// Test 3: Simple scenario - should use rules only
console.log('\n\n--- Test 3: Simple XML - should use rules only ---');
const simpleXML = '<root><item>value</item>';

const simpleResult = await xmlParser.fix(simpleXML, {
  useAI: true,
  model: model,
  tokenizer: tokenizer
});

console.log('Success:', simpleResult.success);
console.log('Method used:', simpleResult.method);
console.log('Fixes applied:', simpleResult.fixes);

console.log('\n=== Tests Complete ===');
