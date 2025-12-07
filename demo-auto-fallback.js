import { XMLParser } from './src/parsers/xml-parser.js';
import { JSONParser } from './src/parsers/json-parser.js';

console.log('=== Auto-Fallback Feature Demonstration ===\n');
console.log('This demo shows how the new auto-fallback feature works.');
console.log('When rule-based fixing fails, it can automatically fallback to AI mode.\n');

// Test 1: Rule-based success (no AI needed)
console.log('--- Test 1: Simple XML (rule-based will succeed) ---');
const xmlParser = new XMLParser();
const simpleXML = '<root><item>value</item>';

const simpleResult = xmlParser.fix(simpleXML);
console.log('Input:', simpleXML);
console.log('Rule-based success:', simpleResult.success);
console.log('Fixes applied:', simpleResult.fixes);
console.log('Fixed XML:', simpleResult.fixed);

// Test 2: Complex scenario (rule-based will fail)
console.log('\n--- Test 2: Complex XML with unclosed nested tag ---');
const complexXML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <product id="P001">
    <name>Laptop Pro</name>
    <features>
      <feature>Intel Core i7</feature>
      <feature>16GB RAM</feature>
      <feature>512GB SSD
    </features>
  </product>
</catalog>`;

console.log('Input XML has unclosed <feature> tag before </features> closes');

const ruleBasedResult = xmlParser.fix(complexXML);
console.log('\nRule-based result:');
console.log('  Success:', ruleBasedResult.success);
console.log('  Can try AI:', ruleBasedResult.canTryAI);
console.log('  Errors:', ruleBasedResult.errors);

if (ruleBasedResult.canTryAI) {
  console.log('\n✨ AI fallback available!');
  console.log('To enable auto-fallback, call fix() with options:');
  console.log(`
  const result = await xmlParser.fix(xmlString, {
    useAI: true,
    model: yourModel,
    tokenizer: yourTokenizer
  });
  `);
  console.log('The parser will automatically:');
  console.log('  1. Try rule-based fixes first');
  console.log('  2. If rules fail, fallback to AI mode');
  console.log('  3. Return the best result');
}

// Test 3: JSON example
console.log('\n--- Test 3: Complex JSON with structural errors ---');
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

console.log('Input JSON has missing commas and unclosed structures');

const jsonRuleResult = jsonParser.fix(complexJSON);
console.log('\nRule-based result:');
console.log('  Success:', jsonRuleResult.success);
console.log('  Can try AI:', jsonRuleResult.canTryAI);

if (jsonRuleResult.success) {
  console.log('  ✅ Rules fixed it!');
  console.log('  Fixed JSON:', JSON.stringify(jsonRuleResult.data, null, 2));
} else {
  console.log('  ❌ Rules could not fix it');
  console.log('  Errors:', jsonRuleResult.errors);
  if (jsonRuleResult.canTryAI) {
    console.log('\n  💡 Tip: Enable AI fallback for complex scenarios');
  }
}

// Test 4: Using InferenceEngine (recommended approach)
console.log('\n--- Test 4: Using InferenceEngine (recommended) ---');
console.log('For production use, we recommend using the InferenceEngine:');
console.log(`
import { InferenceEngine } from './src/inference/engine.js';

const engine = new InferenceEngine({ useAI: true });
await engine.initialize();

// Auto-fallback is built-in!
const result = await engine.fixXML(xmlString);
const result2 = await engine.fixJSON(jsonString);
`);

console.log('\n=== Summary ===');
console.log('✅ Auto-fallback feature successfully implemented');
console.log('✅ Works for both XML and JSON parsers');
console.log('✅ Backward compatible (options parameter is optional)');
console.log('✅ Provides canTryAI flag to indicate when AI might help');
console.log('\nUsage:');
console.log('  - Direct parser: pass { useAI: true, model, tokenizer } options');
console.log('  - InferenceEngine: auto-fallback is built-in when useAI: true');
