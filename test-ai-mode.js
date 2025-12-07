/**
 * Test AI Mode on User's Complex XML
 * Demonstrate AI fixing capability for unclosed nested tag
 */

import { InferenceEngine } from './src/inference/engine.js';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     Testing AI Mode on Complex XML Scenario              ║');
console.log('║     Unclosed <feature> tag before </features> closes      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

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

async function main() {
  console.log('Input XML:');
  console.log('─'.repeat(60));
  console.log(brokenXML);
  console.log('─'.repeat(60));
  console.log('\n📝 Issue: <feature>512GB SSD is not closed before </features>\n');

  // Initialize engine with AI enabled
  const engine = new InferenceEngine({ useAI: true });
  console.log('Initializing AI engine...');
  await engine.initialize();
  console.log('✅ Engine ready\n');

  // Test 1: Rule-based only (will fail)
  console.log('=== Test 1: Rule-Based Mode ===\n');
  const ruleResult = await engine.fixXML(brokenXML, false);

  console.log(`Result: ${ruleResult.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Method: ${ruleResult.method}`);
  console.log(`Fixes applied: ${ruleResult.fixes.length}`);

  if (!ruleResult.success) {
    console.log('Errors found:');
    ruleResult.errors.slice(0, 3).forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.message}`);
    });
    if (ruleResult.errors.length > 3) {
      console.log(`  ... and ${ruleResult.errors.length - 3} more errors`);
    }
  }

  // Test 2: AI mode with auto-fallback (should succeed)
  console.log('\n=== Test 2: AI Mode with Auto-Fallback ===\n');
  const aiResult = await engine.fixXML(brokenXML, true);

  console.log(`Result: ${aiResult.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Method: ${aiResult.method}`);
  console.log(`Fixes applied: ${aiResult.fixes.slice(0, 5).join(', ')}`);

  if (aiResult.success) {
    console.log('\n✅ Fixed XML:');
    console.log('─'.repeat(60));
    console.log(aiResult.fixed);
    console.log('─'.repeat(60));
  } else {
    console.log('\n⚠️  AI mode result:');
    if (aiResult.fixed !== brokenXML) {
      console.log('Attempted fix:');
      console.log(aiResult.fixed.substring(0, 300) + '...');
    }
    console.log('\nNote: AI generation may need more training data for this pattern');
  }

  // Show comparison
  console.log('\n=== Comparison ===');
  console.log(`Rule-based: ${ruleResult.success ? '✅' : '❌'}`);
  console.log(`AI mode:    ${aiResult.success ? '✅' : '❌'}`);

  if (aiResult.success && !ruleResult.success) {
    console.log('\n🎯 AI mode successfully fixed what rule-based could not!');
  } else if (ruleResult.success) {
    console.log('\n✅ Rule-based was sufficient (AI not needed)');
  } else {
    console.log('\n📊 Current model performance:');
    console.log('   The lightweight model may need additional training for');
    console.log('   this specific pattern. The auto-fallback framework is');
    console.log('   ready - we can enhance the model with more training data.');
  }
}

main().catch(error => {
  console.error('\n❌ Test failed:', error);
  console.error(error.stack);
  process.exit(1);
});
