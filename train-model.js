#!/usr/bin/env node

/**
 * Training Script for TinyLLM Model
 * Trains the NanoTransformer on XML/JSON fixing tasks
 */

import { ModelTrainer } from './src/training/trainer.js';
import * as fs from 'fs';
import * as path from 'path';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║          TinyLLM Model Training Script                    ║');
console.log('║          XML/JSON Parser & Fixer                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function main() {
  // Configuration
  const config = {
    learningRate: 0.01,
    batchSize: 8,
    numEpochs: 20,
    maxSeqLen: 256,
  };

  console.log('Configuration:');
  console.log(`  Learning rate: ${config.learningRate}`);
  console.log(`  Batch size: ${config.batchSize}`);
  console.log(`  Epochs: ${config.numEpochs}`);
  console.log(`  Max sequence length: ${config.maxSeqLen}`);
  console.log('');

  // Initialize trainer
  const trainer = new ModelTrainer(config);
  trainer.initialize();

  // Prepare training data
  trainer.prepareTrainingData();

  // Train the model
  const trainingResults = await trainer.trainSimple();

  console.log('\n=== Training Results ===');
  console.log(`Final Loss: ${trainingResults.finalLoss.toFixed(4)}`);
  console.log(`Duration: ${trainingResults.duration}s`);

  // Test the model
  await trainer.test();

  // Ensure models directory exists
  const modelsDir = './models';
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
    console.log(`Created directory: ${modelsDir}`);
  }

  // Save the trained model
  const saveResults = await trainer.save(
    './models/nano-transformer.json',
    './models/tokenizer.json'
  );

  console.log('\n=== Summary ===');
  console.log(`✅ Training completed successfully`);
  console.log(`✅ Model saved to: ${saveResults.modelPath}`);
  console.log(`✅ Tokenizer saved to: ${saveResults.tokenizerPath}`);
  console.log(`✅ Model size: ${saveResults.modelSize} MB`);
  console.log('\nYou can now use the trained model for AI-powered XML/JSON fixing!');
  console.log('\nUsage:');
  console.log('  import { InferenceEngine } from "./src/inference/engine.js";');
  console.log('  const engine = new InferenceEngine({ useAI: true });');
  console.log('  await engine.initialize();');
  console.log('  const result = await engine.fixXML(brokenXML);');
}

// Run training
main().catch(error => {
  console.error('\n❌ Training failed:', error);
  process.exit(1);
});
