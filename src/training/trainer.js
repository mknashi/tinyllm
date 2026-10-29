/**
 * Lightweight Model Trainer
 * Implements simplified training for XML/JSON fixing task
 */

import { NanoTransformer } from '../model/nano-transformer.js';
import { Tokenizer } from '../utils/tokenizer.js';
import { TrainingDataGenerator } from './training-data.js';

export class ModelTrainer {
  constructor(config = {}) {
    this.config = {
      learningRate: config.learningRate || 0.001,
      batchSize: config.batchSize || 4,
      numEpochs: config.numEpochs || 10,
      maxSeqLen: config.maxSeqLen || 256,
      trainSplit: config.trainSplit || 0.8,
      ...config
    };

    this.model = null;
    this.tokenizer = null;
    this.trainingData = [];
    this.evalData = [];
    this.losses = [];
  }

  /**
   * Initialize model and tokenizer
   */
  initialize() {
    console.log('Initializing trainer...');

    // Initialize tokenizer
    this.tokenizer = new Tokenizer();
    console.log(`Tokenizer initialized: ${this.tokenizer.vocabSize} tokens`);

    // Initialize model
    this.model = new NanoTransformer({
      vocabSize: this.tokenizer.vocabSize,
      hiddenSize: 128,
      numLayers: 4,
      numHeads: 4,
      maxSeqLen: this.config.maxSeqLen,
      dropoutRate: 0.1
    });

    this.model.initializeWeights();
    console.log(`Model initialized: ${(this.model.getModelSize() / 1024 / 1024).toFixed(2)} MB`);

    return {
      tokenizer: this.tokenizer,
      model: this.model,
      vocabSize: this.tokenizer.vocabSize
    };
  }

  /**
   * Prepare training data
   */
  prepareTrainingData(useAugmented = true) {
    console.log('Generating training data...');

    const generator = new TrainingDataGenerator();
    const allExamples = generator.getAllExamples();

    // Prefer augmented pairs for coverage, but allow falling back
    const pairs = useAugmented ? allExamples.augmented : [...allExamples.pairs.xml, ...allExamples.pairs.json];
    const shuffled = this._shuffle(pairs);
    const splitIndex = Math.max(1, Math.floor(shuffled.length * this.config.trainSplit));

    this.trainingData = shuffled.slice(0, splitIndex);
    this.evalData = shuffled.slice(splitIndex);

    console.log(`Generated ${pairs.length} examples (${this.trainingData.length} train / ${this.evalData.length} eval)`);

    // Tokenize all examples with teacher-forcing targets (next-token prediction)
    this.tokenizedData = this.trainingData.map((pair, idx) => {
      const fullText = `${pair.prompt}\n${pair.completion}`;
      const inputIds = this.tokenizer.encode(fullText);

      const maxLen = this.config.maxSeqLen;
      const truncatedInput = inputIds.slice(0, maxLen);

      // Shifted targets for next-token prediction
      const targetIds = truncatedInput.slice(1);
      const modelInput = truncatedInput.slice(0, targetIds.length);

      return {
        inputIds: modelInput,
        targetIds,
        description: pair.description,
        errorType: pair.errorType || 'unknown',
        index: idx
      };
    });

    this.tokenizedEval = this.evalData.map((pair, idx) => {
      const fullText = `${pair.prompt}\n${pair.completion}`;
      const inputIds = this.tokenizer.encode(fullText).slice(0, this.config.maxSeqLen);
      const targetIds = inputIds.slice(1);
      const modelInput = inputIds.slice(0, targetIds.length);
      return {
        inputIds: modelInput,
        targetIds,
        description: pair.description,
        errorType: pair.errorType || 'unknown',
        index: idx
      };
    });

    console.log('Training and eval data prepared and tokenized');
    return { train: this.tokenizedData, eval: this.tokenizedEval };
  }

  /**
   * Calculate cross-entropy loss
   */
  calculateLoss(predictions, targets) {
    let totalLoss = 0;
    let count = 0;

    for (let i = 0; i < Math.min(predictions.length, targets.length); i++) {
      const pred = predictions[i];
      const target = targets[i];

      if (target >= 0 && target < pred.length) {
        // Cross-entropy: -log(p(target))
        const prob = Math.max(pred[target], 1e-10); // Avoid log(0)
        totalLoss += -Math.log(prob);
        count++;
      }
    }

    return count > 0 ? totalLoss / count : 0;
  }

  /**
   * Simplified training using pattern matching and weight adjustment
   * This is a lightweight alternative to full backpropagation
   */
  async trainSimple() {
    console.log('\n=== Starting Simple Training ===\n');
    console.log('Using pattern-based weight optimization');
    console.log(`Training on ${this.trainingData.length} examples`);
    console.log(`Epochs: ${this.config.numEpochs}, Batch size: ${this.config.batchSize}\n`);

    const startTime = Date.now();

    for (let epoch = 0; epoch < this.config.numEpochs; epoch++) {
      console.log(`Epoch ${epoch + 1}/${this.config.numEpochs}`);

      let epochLoss = 0;
      let correctPredictions = 0;
      let totalPredictions = 0;

      // Shuffle training data
      const shuffled = this._shuffle([...this.tokenizedData]);

      // Process in batches
      for (let i = 0; i < shuffled.length; i += this.config.batchSize) {
        const batch = shuffled.slice(i, i + this.config.batchSize);

        for (const example of batch) {
          // Forward pass
          const logits = this.model.forward(example.inputIds);

          // Calculate predictions
          const predictions = logits.map(logit => this._softmax(logit));

          // Calculate loss
          const loss = this.calculateLoss(predictions, example.targetIds);
          epochLoss += loss;

          // Count correct predictions (for monitoring)
          for (let j = 0; j < Math.min(predictions.length, example.targetIds.length); j++) {
            const predictedToken = this._argmax(predictions[j]);
            if (predictedToken === example.targetIds[j]) {
              correctPredictions++;
            }
            totalPredictions++;
          }
        }

        // Progress update
        if ((i / this.config.batchSize) % 10 === 0) {
          const progress = ((i / shuffled.length) * 100).toFixed(1);
          process.stdout.write(`\r  Progress: ${progress}%`);
        }
      }

      const avgLoss = epochLoss / shuffled.length;
      const accuracy = (correctPredictions / totalPredictions * 100).toFixed(2);

      this.losses.push(avgLoss);

      console.log(`\r  Loss: ${avgLoss.toFixed(4)}, Accuracy: ${accuracy}%`);

      // Apply weight optimization based on patterns
      if (epoch % 2 === 0) {
        this._optimizeWeights(shuffled);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nTraining completed in ${duration}s`);

    return {
      finalLoss: this.losses[this.losses.length - 1],
      losses: this.losses,
      duration: parseFloat(duration)
    };
  }

  /**
   * Lightweight teacher-forced cross-entropy training.
   * Updates only output biases to stay browser/Tauri friendly.
   */
  async trainCrossEntropy() {
    if (!this.model || !this.tokenizer) {
      this.initialize();
    }
    if (!this.tokenizedData || this.tokenizedData.length === 0) {
      this.prepareTrainingData(true);
    }

    console.log('\n=== Starting Cross-Entropy Training (bias-only updates) ===\n');
    console.log(`Training on ${this.tokenizedData.length} examples`);
    const startTime = Date.now();
    this.losses = [];

    for (let epoch = 0; epoch < this.config.numEpochs; epoch++) {
      const shuffled = this._shuffle([...this.tokenizedData]);
      let epochLoss = 0;
      let tokenCount = 0;

      for (let i = 0; i < shuffled.length; i += this.config.batchSize) {
        const batch = shuffled.slice(i, i + this.config.batchSize);

        for (const example of batch) {
          const logits = this.model.forward(example.inputIds);

          for (let t = 0; t < Math.min(logits.length, example.targetIds.length); t++) {
            const probs = this._softmax(logits[t]);
            const targetId = example.targetIds[t];

            const prob = Math.max(probs[targetId] || 1e-9, 1e-9);
            epochLoss += -Math.log(prob);
            tokenCount++;

            // Bias-only update: dL/dlogit = prob - 1 for target
            if (this.model.weights.outputBias && targetId < this.model.weights.outputBias.length) {
              const grad = probs[targetId] - 1;
              this.model.weights.outputBias[targetId] -= this.config.learningRate * grad;
            }
          }
        }

        // Lightweight progress
        if ((i / this.config.batchSize) % 10 === 0) {
          const progress = ((i / shuffled.length) * 100).toFixed(1);
          process.stdout.write(`\r  Progress: ${progress}%`);
        }
      }

      const avgLoss = tokenCount > 0 ? epochLoss / tokenCount : 0;
      this.losses.push(avgLoss);
      console.log(`\rEpoch ${epoch + 1}/${this.config.numEpochs} - Avg token loss: ${avgLoss.toFixed(4)}`);

      // Eval pass (no updates) to track overfitting
      if (this.tokenizedEval && this.tokenizedEval.length > 0) {
        const evalLoss = this._evalLoss(this.tokenizedEval);
        console.log(`  Eval loss: ${evalLoss.toFixed(4)} on ${this.tokenizedEval.length} samples`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nTraining completed in ${duration}s`);

    return {
      finalLoss: this.losses[this.losses.length - 1],
      losses: this.losses,
      duration: parseFloat(duration)
    };
  }

  /**
   * Optimize weights based on training patterns
   * This is a simplified approach that adjusts weights based on common patterns
   */
  _optimizeWeights(examples) {
    const lr = this.config.learningRate;

    // Collect pattern statistics
    const patterns = {
      tokenFrequency: {},
      transitionPairs: {},
      commonSequences: []
    };

    // Analyze patterns in training data
    examples.forEach(ex => {
      for (let i = 0; i < ex.targetIds.length; i++) {
        const token = ex.targetIds[i];
        patterns.tokenFrequency[token] = (patterns.tokenFrequency[token] || 0) + 1;

        if (i > 0) {
          const pair = `${ex.targetIds[i-1]}-${token}`;
          patterns.transitionPairs[pair] = (patterns.transitionPairs[pair] || 0) + 1;
        }
      }
    });

    // Adjust output projection weights to favor common patterns
    const totalTokens = Object.values(patterns.tokenFrequency).reduce((a, b) => a + b, 0);

    for (const [token, freq] of Object.entries(patterns.tokenFrequency)) {
      const tokenId = parseInt(token);
      if (tokenId < this.model.weights.outputProjection.length) {
        // Boost weights for frequent tokens
        const boost = (freq / totalTokens) * lr;

        for (let i = 0; i < this.model.weights.outputProjection[tokenId].length; i++) {
          this.model.weights.outputProjection[tokenId][i] += boost * (Math.random() - 0.5);
        }
      }
    }

    // Adjust embedding weights for common transitions
    for (const [pair, freq] of Object.entries(patterns.transitionPairs)) {
      const [from, to] = pair.split('-').map(Number);

      if (from < this.model.weights.tokenEmbedding.length &&
          to < this.model.weights.tokenEmbedding.length) {
        // Make embeddings more similar for common transitions
        const strength = (freq / totalTokens) * lr * 0.1;

        for (let i = 0; i < this.model.weights.tokenEmbedding[from].length; i++) {
          const diff = this.model.weights.tokenEmbedding[to][i] - this.model.weights.tokenEmbedding[from][i];
          this.model.weights.tokenEmbedding[from][i] += diff * strength;
        }
      }
    }
  }

  /**
   * Test the model on validation examples
   */
  async test(testExamples = null) {
    if (!testExamples) {
      // Use a subset of training data for testing
      testExamples = this.trainingData.slice(0, 5);
    }

    console.log('\n=== Testing Model ===\n');

    const results = [];

    for (const example of testExamples) {
      const inputIds = this.tokenizer.encode(example.prompt);
      const generated = this.model.generate(inputIds, 100, 0.7);
      const output = this.tokenizer.decode(generated);

      // Extract the fixed content
      const fixedMatch = output.match(/Fixed (?:XML|JSON):\s*(.+)/s);
      const fixed = fixedMatch ? fixedMatch[1].trim() : output;

      const success = fixed.includes(example.completion.substring(0, 20));

      results.push({
        description: example.description,
        input: example.prompt.substring(0, 50) + '...',
        expected: example.completion.substring(0, 50) + '...',
        generated: fixed.substring(0, 50) + '...',
        success: success
      });

      console.log(`Test: ${example.description}`);
      console.log(`  Success: ${success ? '✅' : '❌'}`);
      console.log('');
    }

    const successRate = (results.filter(r => r.success).length / results.length * 100).toFixed(1);
    console.log(`Success rate: ${successRate}%`);

    return results;
  }

  /**
   * Save trained model and tokenizer
   */
  async save(modelPath = './models/nano-transformer.json', tokenizerPath = './models/tokenizer.json') {
    console.log('\nSaving model and tokenizer...');

    const modelData = {
      version: '1.0.0',
      config: this.model.config,
      weights: this.model.weights,
      trained: new Date().toISOString(),
      trainingStats: {
        numEpochs: this.config.numEpochs,
        finalLoss: this.losses[this.losses.length - 1],
        losses: this.losses
      }
    };

    const tokenizerData = this.tokenizer.toJSON();

    try {
      // In Node.js environment
      const fs = await import('fs');
      await fs.promises.writeFile(modelPath, JSON.stringify(modelData, null, 2));
      await fs.promises.writeFile(tokenizerPath, JSON.stringify(tokenizerData, null, 2));

      const modelSize = (JSON.stringify(modelData).length / 1024 / 1024).toFixed(2);
      console.log(`✅ Model saved: ${modelPath} (${modelSize} MB)`);
      console.log(`✅ Tokenizer saved: ${tokenizerPath}`);

      return {
        modelPath,
        tokenizerPath,
        modelSize: parseFloat(modelSize)
      };
    } catch (error) {
      console.error('Failed to save model:', error);
      throw error;
    }
  }

  // Utility functions
  _shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  _softmax(logits) {
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sumExps);
  }

  _argmax(array) {
    return array.indexOf(Math.max(...array));
  }

  /**
   * Evaluate average token loss over a dataset (no updates)
   */
  _evalLoss(dataset) {
    let total = 0;
    let count = 0;

    dataset.forEach(example => {
      const logits = this.model.forward(example.inputIds);
      for (let t = 0; t < Math.min(logits.length, example.targetIds.length); t++) {
        const probs = this._softmax(logits[t]);
        const targetId = example.targetIds[t];
        const prob = Math.max(probs[targetId] || 1e-9, 1e-9);
        total += -Math.log(prob);
        count++;
      }
    });

    return count > 0 ? total / count : 0;
  }

  /**
   * Get training statistics
   */
  getStats() {
    return {
      numExamples: this.trainingData.length,
      vocabSize: this.tokenizer?.vocabSize || 0,
      modelSize: this.model ? this.model.getModelSize() : 0,
      losses: this.losses,
      config: this.config
    };
  }
}
