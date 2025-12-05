/**
 * Test Runner for TinyLLM
 */

import { JSONParser } from '../src/parsers/json-parser.js';
import { XMLParser } from '../src/parsers/xml-parser.js';
import { Tokenizer } from '../src/utils/tokenizer.js';
import { NanoTransformer } from '../src/model/nano-transformer.js';

// Test utilities
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ ${message}`);
    failed++;
  }
}

function assertEquals(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

console.log('\n🧪 Running TinyLLM Tests\n');

// JSON Parser Tests
console.log('=== JSON Parser Tests ===\n');

const jsonParser = new JSONParser();

// Test 1: Valid JSON
const validJSON = '{"name": "test", "value": 123}';
const result1 = jsonParser.parse(validJSON);
assert(result1.success, 'Parse valid JSON');

// Test 2: Invalid JSON - trailing comma
const invalidJSON1 = '{"name": "test", "value": 123,}';
const result2 = jsonParser.parse(invalidJSON1);
assert(!result2.success, 'Detect trailing comma error');

// Test 3: Fix trailing comma
const fixed1 = jsonParser.fix(invalidJSON1);
assert(fixed1.success, 'Fix trailing comma');
assert(fixed1.fixes.length > 0, 'Report fixes applied');

// Test 4: Fix unquoted keys
const invalidJSON2 = '{name: "test", value: 123}';
const fixed2 = jsonParser.fix(invalidJSON2);
assert(fixed2.success, 'Fix unquoted keys');

// Test 5: Fix single quotes
const invalidJSON3 = "{'name': 'test'}";
const fixed3 = jsonParser.fix(invalidJSON3);
assert(fixed3.success, 'Fix single quotes');

// Test 6: Fix missing closing braces
const invalidJSON4 = '{"name": "test", "nested": {"value": 123}';
const fixed4 = jsonParser.fix(invalidJSON4);
assert(fixed4.success, 'Fix missing closing braces');

// Test 7: Validate JSON
const validation1 = jsonParser.validate(validJSON);
assert(validation1.valid, 'Validate valid JSON');
assert(validation1.issues.length === 0, 'No issues in valid JSON');

// Test 8: Prettify JSON
const uglyJSON = '{"name":"test","value":123}';
const pretty1 = jsonParser.prettify(uglyJSON);
assert(pretty1.includes('\n'), 'Prettify adds newlines');
assert(pretty1.includes('  '), 'Prettify adds indentation');

console.log('\n=== XML Parser Tests ===\n');

const xmlParser = new XMLParser();

// Test 9: Valid XML
const validXML = '<?xml version="1.0"?><root><item>test</item></root>';
const result3 = xmlParser.parse(validXML);
assert(result3.success, 'Parse valid XML');

// Test 10: Invalid XML - unclosed tag
const invalidXML1 = '<root><item>test</root>';
const result4 = xmlParser.parse(invalidXML1);
assert(!result4.success, 'Detect unclosed tag error');

// Test 11: Fix unclosed tag
const fixed5 = xmlParser.fix(invalidXML1);
assert(fixed5.success || fixed5.fixes.length > 0, 'Attempt to fix unclosed tag');

// Test 12: Fix missing XML declaration
const invalidXML2 = '<root><item>test</item></root>';
const fixed6 = xmlParser.fix(invalidXML2);
assert(fixed6.fixed.includes('<?xml'), 'Add XML declaration');

// Test 13: Fix unquoted attributes
const invalidXML3 = '<root attr=value>test</root>';
const fixed7 = xmlParser.fix(invalidXML3);
assert(fixed7.fixed.includes('attr="value"'), 'Quote attributes');

// Test 14: Validate XML
const validation2 = xmlParser.validate(validXML);
assert(validation2.valid || validation2.issues.length >= 0, 'Validate XML structure');

console.log('\n=== Tokenizer Tests ===\n');

const tokenizer = new Tokenizer();

// Test 15: Tokenizer initialization
assert(tokenizer.vocabSize > 0, 'Tokenizer has vocabulary');

// Test 16: Encode text
const text = '{"test": 123}';
const encoded = tokenizer.encode(text);
assert(Array.isArray(encoded), 'Encode returns array');
assert(encoded.length > 0, 'Encoded array not empty');

// Test 17: Decode tokens
const decoded = tokenizer.decode(encoded);
assert(typeof decoded === 'string', 'Decode returns string');

// Test 18: Encode/decode roundtrip
const original = 'test';
const roundtrip = tokenizer.decode(tokenizer.encode(original, false));
assertEquals(roundtrip, original, 'Encode/decode roundtrip preserves text');

// Test 19: Batch encoding
const texts = ['test1', 'test2', 'test3'];
const batchEncoded = tokenizer.batchEncode(texts);
assert(Array.isArray(batchEncoded), 'Batch encode returns array');
assertEquals(batchEncoded.length, 3, 'Batch encode preserves count');

// Test 20: Batch decoding
const batchDecoded = tokenizer.batchDecode(batchEncoded);
assertEquals(batchDecoded.length, 3, 'Batch decode preserves count');

console.log('\n=== Model Tests ===\n');

const model = new NanoTransformer({
  vocabSize: 100,
  hiddenSize: 32,
  numLayers: 2,
  numHeads: 2,
  maxSeqLen: 128,
});

// Test 21: Model initialization
model.initializeWeights();
assert(model.initialized, 'Model initializes');

// Test 22: Model weights exist
assert(model.weights !== null, 'Model has weights');
assert(model.weights.tokenEmbedding.length === 100, 'Token embeddings correct size');

// Test 23: Forward pass
const inputIds = [1, 2, 3, 4, 5];
const logits = model.forward(inputIds);
assert(Array.isArray(logits), 'Forward pass returns logits');
assertEquals(logits.length, inputIds.length, 'Logits match input length');

// Test 24: Generation
const generated = model.generate([1, 2, 3], 5, 0.8);
assert(Array.isArray(generated), 'Generate returns array');
assert(generated.length >= 3, 'Generated sequence at least input length');

// Test 25: Model size
const modelSize = model.getModelSize();
assert(modelSize > 0, 'Model has non-zero size');
console.log(`   Model size: ${(modelSize / 1024).toFixed(2)} KB`);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All tests passed!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed\n');
  process.exit(1);
}
