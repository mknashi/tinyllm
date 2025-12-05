/**
 * Node.js Usage Example
 * Demonstrates using TinyLLM in a Node.js environment
 */

import { InferenceEngine } from '../src/inference/engine.js';
import { readFile, writeFile } from 'fs/promises';

async function main() {
  console.log('🔧 TinyLLM Node.js Example\n');

  // Initialize engine
  const engine = new InferenceEngine({ useAI: false });
  await engine.initialize();

  // Example: Fix a broken config file
  const brokenConfig = `{
    "server": {
      "port": 3000,
      "host": "localhost",
    },
    "database": {
      "url": "mongodb://localhost:27017",
      name: "myapp",
    },
  }`;

  console.log('Fixing broken config.json...');
  const fixedConfig = await engine.fixJSON(brokenConfig);

  if (fixedConfig.success) {
    console.log('✓ Config fixed!');
    console.log('\nFixes applied:');
    fixedConfig.fixes.forEach(fix => console.log(`  - ${fix}`));

    // Save fixed config
    await writeFile('config.json', fixedConfig.fixed);
    console.log('\n✓ Saved to config.json');
  }

  // Example: Validate XML from file
  const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <settings>
    <setting name="theme" value="dark" />
    <setting name="language" value="en" />
  </settings>
</configuration>`;

  console.log('\n\nValidating XML...');
  const validation = engine.validateXML(sampleXML);

  if (validation.valid) {
    console.log('✓ XML is valid!');
  } else {
    console.log('✗ XML has issues:');
    validation.issues.forEach(issue => {
      console.log(`  Line ${issue.line}: ${issue.message}`);
    });
  }

  console.log('\n✅ Done!\n');
}

main().catch(console.error);
