/**
 * Inference Engine
 * Manages model loading and inference for XML/JSON fixing
 */

import { NanoTransformer } from '../model/nano-transformer.js';
import { Tokenizer } from '../utils/tokenizer.js';
import { XMLParser } from '../parsers/xml-parser.js';
import { JSONParser } from '../parsers/json-parser.js';

export class InferenceEngine {
  constructor(config = {}) {
    this.config = {
      modelPath: config.modelPath || './models/nano-transformer.json',
      tokenizerPath: config.tokenizerPath || './models/tokenizer.json',
      useAI: config.useAI !== false,
      maxRetries: config.maxRetries || 3,
    };

    this.model = null;
    this.tokenizer = null;
    this.xmlParser = new XMLParser();
    this.jsonParser = new JSONParser();
    this.initialized = false;
  }

  /**
   * Initialize the engine
   */
  async initialize() {
    console.log('Initializing TinyLLM engine...');

    // Initialize tokenizer
    try {
      const tokenizerData = await this._loadJSON(this.config.tokenizerPath);
      this.tokenizer = Tokenizer.fromJSON(tokenizerData);
      console.log(`Tokenizer loaded: ${this.tokenizer.vocabSize} tokens`);
    } catch (error) {
      console.warn('Failed to load tokenizer, using default:', error.message);
      this.tokenizer = new Tokenizer();
    }

    // Initialize model
    if (this.config.useAI) {
      try {
        this.model = new NanoTransformer({
          vocabSize: this.tokenizer.vocabSize,
          hiddenSize: 128,
          numLayers: 4,
          numHeads: 4,
          maxSeqLen: 512,
        });

        await this.model.loadWeights(this.config.modelPath);
        const modelSize = (this.model.getModelSize() / 1024 / 1024).toFixed(2);
        console.log(`Model loaded: ${modelSize} MB`);
      } catch (error) {
        console.warn('Failed to load model, AI features disabled:', error.message);
        this.config.useAI = false;
      }
    }

    this.initialized = true;
    console.log('TinyLLM engine ready!');

    return {
      initialized: true,
      aiEnabled: this.config.useAI,
      vocabSize: this.tokenizer.vocabSize,
      modelSize: this.model ? this.model.getModelSize() : 0,
    };
  }

  /**
   * Parse and fix JSON with auto-fallback to AI
   */
  async fixJSON(jsonString, useAI = this.config.useAI) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Use new options parameter for auto-fallback
    if (useAI && this.model) {
      return await this.jsonParser.fix(jsonString, {
        useAI: true,
        model: this.model,
        tokenizer: this.tokenizer
      });
    }

    return this.jsonParser.fix(jsonString);
  }

  /**
   * Parse and fix XML with auto-fallback to AI
   */
  async fixXML(xmlString, useAI = this.config.useAI) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Use new options parameter for auto-fallback
    if (useAI && this.model) {
      return await this.xmlParser.fix(xmlString, {
        useAI: true,
        model: this.model,
        tokenizer: this.tokenizer
      });
    }

    return this.xmlParser.fix(xmlString);
  }

  /**
   * Validate JSON
   */
  validateJSON(jsonString) {
    return this.jsonParser.validate(jsonString);
  }

  /**
   * Validate XML
   */
  validateXML(xmlString) {
    return this.xmlParser.validate(xmlString);
  }

  /**
   * Pretty print JSON
   */
  prettifyJSON(jsonString, indent = 2) {
    return this.jsonParser.prettify(jsonString, indent);
  }

  /**
   * Pretty print XML
   */
  prettifyXML(xmlString, indent = 2) {
    return this.xmlParser.prettify(xmlString, indent);
  }

  /**
   * Auto-detect format and fix
   */
  async autoFix(input, useAI = this.config.useAI) {
    if (!this.initialized) {
      await this.initialize();
    }

    const trimmed = input.trim();

    // Detect format
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return {
        format: 'json',
        result: await this.fixJSON(input, useAI),
      };
    } else if (trimmed.startsWith('<')) {
      return {
        format: 'xml',
        result: await this.fixXML(input, useAI),
      };
    }

    return {
      format: 'unknown',
      result: {
        success: false,
        error: 'Unable to detect format (expected JSON or XML)',
      },
    };
  }

  /**
   * Batch processing
   */
  async batchFix(inputs, format = 'auto', useAI = this.config.useAI) {
    if (!this.initialized) {
      await this.initialize();
    }

    const results = [];

    for (const input of inputs) {
      if (format === 'auto') {
        results.push(await this.autoFix(input, useAI));
      } else if (format === 'json') {
        results.push({
          format: 'json',
          result: await this.fixJSON(input, useAI),
        });
      } else if (format === 'xml') {
        results.push({
          format: 'xml',
          result: await this.fixXML(input, useAI),
        });
      }
    }

    return results;
  }

  /**
   * Get engine status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      aiEnabled: this.config.useAI,
      modelLoaded: this.model !== null,
      tokenizerLoaded: this.tokenizer !== null,
      vocabSize: this.tokenizer ? this.tokenizer.vocabSize : 0,
      modelSize: this.model ? this.model.getModelSize() : 0,
    };
  }

  /**
   * Load JSON file (browser and Node.js compatible)
   */
  async _loadJSON(path) {
    // Check for Node.js environment first
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node.js environment
      const fs = await import('fs');
      const data = await fs.promises.readFile(path, 'utf-8');
      return JSON.parse(data);
    } else if (typeof fetch !== 'undefined') {
      // Browser environment
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.statusText}`);
      }
      return await response.json();
    } else {
      throw new Error('Neither fs nor fetch available');
    }
  }
}
