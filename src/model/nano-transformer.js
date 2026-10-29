/**
 * NanoTransformer - Ultra-lightweight transformer model for structured data
 * Optimized for XML/JSON parsing and fixing
 * Model size: ~2-5MB (quantized)
 * Architecture: 4 layers, 128 hidden dims, 4 attention heads
 */

export class NanoTransformer {
  constructor(config = {}) {
    this.config = {
      vocabSize: config.vocabSize || 512,
      hiddenSize: config.hiddenSize || 128,
      numLayers: config.numLayers || 4,
      numHeads: config.numHeads || 4,
      maxSeqLen: config.maxSeqLen || 512,
      dropoutRate: config.dropoutRate || 0.1,
    };

    this.initialized = false;
    this.weights = null;
  }

  /**
   * Initialize model weights (random for demo, should load pre-trained)
   */
  initializeWeights() {
    const { vocabSize, hiddenSize, numLayers, numHeads } = this.config;

    this.weights = {
      tokenEmbedding: this._randomMatrix(vocabSize, hiddenSize),
      positionEmbedding: this._randomMatrix(this.config.maxSeqLen, hiddenSize),
      layers: [],
      outputProjection: this._randomMatrix(hiddenSize, vocabSize),
      outputBias: Array.from({ length: vocabSize }, () => 0),
    };

    // Initialize transformer layers
    for (let i = 0; i < numLayers; i++) {
      this.weights.layers.push({
        // Multi-head attention
        qProjection: this._randomMatrix(hiddenSize, hiddenSize),
        kProjection: this._randomMatrix(hiddenSize, hiddenSize),
        vProjection: this._randomMatrix(hiddenSize, hiddenSize),
        outProjection: this._randomMatrix(hiddenSize, hiddenSize),

        // Feed-forward network
        ffn1: this._randomMatrix(hiddenSize, hiddenSize * 4),
        ffn2: this._randomMatrix(hiddenSize * 4, hiddenSize),

        // Layer normalization parameters
        ln1Gamma: this._randomVector(hiddenSize),
        ln1Beta: this._randomVector(hiddenSize),
        ln2Gamma: this._randomVector(hiddenSize),
        ln2Beta: this._randomVector(hiddenSize),
      });
    }

    this.initialized = true;
  }

  /**
   * Load pre-trained weights from file
   */
  async loadWeights(weightsPath) {
    try {
      let data;

      // Try Node.js first
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const fs = await import('fs');
        const fileContent = await fs.promises.readFile(weightsPath, 'utf-8');
        data = JSON.parse(fileContent);
      } else {
        // Browser environment
        const response = await fetch(weightsPath);
        data = await response.json();
      }

      this.weights = data.weights || data;
      if (!this.weights.outputBias) {
        this.weights.outputBias = Array.from({ length: this.config.vocabSize }, () => 0);
      }
      this.initialized = true;
      return true;
    } catch (error) {
      console.warn('Failed to load weights, using random initialization:', error.message);
      this.initializeWeights();
      return false;
    }
  }

  /**
   * Forward pass through the model
   */
  forward(inputIds) {
    if (!this.initialized) {
      this.initializeWeights();
    }

    const seqLen = inputIds.length;
    let hiddenStates = [];

    // Token + Position embeddings
    for (let i = 0; i < seqLen; i++) {
      const tokenEmb = this.weights.tokenEmbedding[inputIds[i]];
      const posEmb = this.weights.positionEmbedding[i];
      hiddenStates.push(this._addVectors(tokenEmb, posEmb));
    }

    // Pass through transformer layers
    for (let layer of this.weights.layers) {
      hiddenStates = this._transformerLayer(hiddenStates, layer);
    }

    // Project to vocabulary
    const logits = hiddenStates.map(h => {
      const projected = this._matmul(h, this.weights.outputProjection);
      return this._addVectors(projected, this.weights.outputBias);
    });

    return logits;
  }

  /**
   * Single transformer layer
   */
  _transformerLayer(hiddenStates, layer) {
    const seqLen = hiddenStates.length;

    // Multi-head self-attention
    const attnOut = this._multiHeadAttention(hiddenStates, layer);

    // Add & Norm
    let residual = hiddenStates.map((h, i) =>
      this._layerNorm(
        this._addVectors(h, attnOut[i]),
        layer.ln1Gamma,
        layer.ln1Beta
      )
    );

    // Feed-forward network
    const ffnOut = residual.map(h => {
      const hidden = this._gelu(this._matmul(h, layer.ffn1));
      return this._matmul(hidden, layer.ffn2);
    });

    // Add & Norm
    const output = residual.map((h, i) =>
      this._layerNorm(
        this._addVectors(h, ffnOut[i]),
        layer.ln2Gamma,
        layer.ln2Beta
      )
    );

    return output;
  }

  /**
   * Multi-head attention mechanism
   */
  _multiHeadAttention(hiddenStates, layer) {
    const seqLen = hiddenStates.length;
    const headDim = this.config.hiddenSize / this.config.numHeads;

    // Project to Q, K, V
    const queries = hiddenStates.map(h => this._matmul(h, layer.qProjection));
    const keys = hiddenStates.map(h => this._matmul(h, layer.kProjection));
    const values = hiddenStates.map(h => this._matmul(h, layer.vProjection));

    // Compute attention
    const attnOutput = [];
    for (let i = 0; i < seqLen; i++) {
      const scores = keys.map(k => this._dotProduct(queries[i], k) / Math.sqrt(headDim));
      const attnWeights = this._softmax(scores);

      let attended = new Array(this.config.hiddenSize).fill(0);
      for (let j = 0; j < seqLen; j++) {
        const weighted = values[j].map(v => v * attnWeights[j]);
        attended = this._addVectors(attended, weighted);
      }

      attnOutput.push(this._matmul(attended, layer.outProjection));
    }

    return attnOutput;
  }

  /**
   * Generate text completions
   */
  generate(inputIds, maxNewTokens = 50, temperature = 0.8) {
    const output = [...inputIds];

    for (let i = 0; i < maxNewTokens; i++) {
      const logits = this.forward(output);
      const nextTokenLogits = logits[logits.length - 1];

      // Apply temperature
      const scaledLogits = nextTokenLogits.map(l => l / temperature);
      const probs = this._softmax(scaledLogits);

      // Sample from distribution
      const nextToken = this._sample(probs);
      output.push(nextToken);

      // Stop if we hit end token or max length
      if (nextToken === 0 || output.length >= this.config.maxSeqLen) {
        break;
      }
    }

    return output;
  }

  // Utility functions
  _randomMatrix(rows, cols) {
    const matrix = [];
    const scale = Math.sqrt(2.0 / (rows + cols));
    for (let i = 0; i < rows; i++) {
      matrix.push(Array.from({ length: cols }, () => (Math.random() - 0.5) * scale));
    }
    return matrix;
  }

  _randomVector(size) {
    return Array.from({ length: size }, () => Math.random() - 0.5);
  }

  _matmul(vector, matrix) {
    return matrix[0].map((_, col) =>
      matrix.reduce((sum, row) => sum + vector[Math.min(vector.length - 1, matrix.indexOf(row))] * row[col], 0)
    );
  }

  _dotProduct(a, b) {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  _addVectors(a, b) {
    return a.map((val, i) => val + b[i]);
  }

  _softmax(logits) {
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sumExps);
  }

  _gelu(x) {
    if (Array.isArray(x)) {
      return x.map(val => this._gelu(val));
    }
    return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
  }

  _layerNorm(x, gamma, beta, epsilon = 1e-5) {
    const mean = x.reduce((a, b) => a + b, 0) / x.length;
    const variance = x.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / x.length;
    return x.map((val, i) => gamma[i] * (val - mean) / Math.sqrt(variance + epsilon) + beta[i]);
  }

  _sample(probs) {
    const random = Math.random();
    let cumSum = 0;
    for (let i = 0; i < probs.length; i++) {
      cumSum += probs[i];
      if (random < cumSum) {
        return i;
      }
    }
    return probs.length - 1;
  }

  /**
   * Get model size in bytes
   */
  getModelSize() {
    if (!this.initialized) return 0;

    let totalParams = 0;
    const countParams = (obj) => {
      if (Array.isArray(obj)) {
        if (typeof obj[0] === 'number') {
          return obj.length;
        }
        return obj.reduce((sum, item) => sum + countParams(item), 0);
      }
      if (typeof obj === 'object') {
        return Object.values(obj).reduce((sum, val) => sum + countParams(val), 0);
      }
      return 0;
    };

    totalParams = countParams(this.weights);
    return totalParams * 4; // 4 bytes per float32
  }
}
