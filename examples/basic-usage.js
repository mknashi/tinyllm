/**
 * Basic Usage Examples for TinyLLM
 */

import TinyLLM from '../src/index.js';

console.log('🚀 TinyLLM Basic Usage Examples\n');

// Example 1: Quick Fix JSON
console.log('=== Example 1: Quick Fix JSON ===\n');

const brokenJSON = `{
  "name": "John Doe",
  "age": 30,
  "hobbies": ['reading', 'coding'],
  active: true,
}`;

console.log('Broken JSON:');
console.log(brokenJSON);

const result1 = await TinyLLM.fixJSON(brokenJSON);
console.log('\nFixed JSON:');
console.log(result1.fixed);
console.log('\nFixes applied:');
result1.fixes.forEach(fix => console.log(`  - ${fix}`));

// Example 2: Quick Fix XML
console.log('\n\n=== Example 2: Quick Fix XML ===\n');

const brokenXML = `<?xml version="1.0"?>
<person>
  <name>John Doe</name>
  <age>30
  <email>john@example.com</email>
</person>`;

console.log('Broken XML:');
console.log(brokenXML);

const result2 = await TinyLLM.fixXML(brokenXML);
console.log('\nFixed XML:');
console.log(result2.fixed);
console.log('\nFixes applied:');
result2.fixes.forEach(fix => console.log(`  - ${fix}`));

// Example 3: Auto-detect and fix
console.log('\n\n=== Example 3: Auto-detect Format ===\n');

const unknownFormat = `{"test": "value", "number": 123,}`;

console.log('Unknown format input:');
console.log(unknownFormat);

const result3 = await TinyLLM.autoFix(unknownFormat);
console.log(`\nDetected format: ${result3.format}`);
console.log('Fixed output:');
console.log(result3.result.fixed);

// Example 4: Using the engine directly
console.log('\n\n=== Example 4: Using Engine Directly ===\n');

const engine = TinyLLM.create();
await engine.initialize();

const status = engine.getStatus();
console.log('Engine Status:');
console.log(`  - Initialized: ${status.initialized}`);
console.log(`  - AI Enabled: ${status.aiEnabled}`);
console.log(`  - Vocabulary: ${status.vocabSize} tokens`);
console.log(`  - Model Size: ${(status.modelSize / 1024).toFixed(2)} KB`);

// Validate JSON
const jsonToValidate = '{"valid": true, "test": 123}';
const validation = engine.validateJSON(jsonToValidate);
console.log(`\nValidation result: ${validation.valid ? '✓ Valid' : '✗ Invalid'}`);

// Prettify
const ugly = '{"a":1,"b":2,"c":3}';
const pretty = engine.prettifyJSON(ugly);
console.log('\nPrettified JSON:');
console.log(pretty);

// Example 5: Batch processing
console.log('\n\n=== Example 5: Batch Processing ===\n');

const inputs = [
  '{"name": "Alice", "age": 25,}',
  '{"name": "Bob", "age": 30,}',
  '<person><name>Charlie</person>',
];

const batchResults = await engine.batchFix(inputs, 'auto');

batchResults.forEach((result, i) => {
  console.log(`\nInput ${i + 1} (${result.format}):`);
  console.log(`  Success: ${result.result.success ? '✓' : '✗'}`);
  if (result.result.success) {
    console.log(`  Fixes: ${result.result.fixes.join(', ')}`);
  }
});

console.log('\n✅ Examples completed!\n');
