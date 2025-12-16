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
      useSLM: config.useSLM !== false,
      maxRetries: config.maxRetries || 1,
      slmMaxTokens: config.slmMaxTokens || 64,
      temperature: config.temperature || 0.7,
      topP: config.topP || 0.85,
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

    // Prefer SLM path if enabled
    if (useAI && this.config.useSLM && this.model) {
      const slmResult = await this._slmFix(jsonString, 'json');
      if (slmResult.success || !slmResult.canFallback) {
        return slmResult;
      }
    }

    // Fallback to rule-based (optionally AI if SLM disabled)
    const canUseAI = useAI && this.model && !this.config.useSLM;
    return this.jsonParser.fix(jsonString, canUseAI ? {
      useAI: true,
      model: this.model,
      tokenizer: this.tokenizer
    } : {});
  }

  /**
   * Parse and fix XML with auto-fallback to AI
   */
  async fixXML(xmlString, useAI = this.config.useAI) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Prefer SLM path if enabled
    if (useAI && this.config.useSLM && this.model) {
      const slmResult = await this._slmFix(xmlString, 'xml');
      if (slmResult.success || !slmResult.canFallback) {
        return slmResult;
      }
    }

    const canUseAI = useAI && this.model && !this.config.useSLM;
    return this.xmlParser.fix(xmlString, canUseAI ? {
      useAI: true,
      model: this.model,
      tokenizer: this.tokenizer
    } : {});
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

  /**
   * SLM-based fixer for JSON/XML with constrained decoding and validation
   */
  async _slmFix(input, format = 'json') {
    if (!this.model || !this.tokenizer) {
      return { success: false, fixed: input, original: input, fixes: [], errors: ['Model not loaded'], canFallback: true, method: 'slm' };
    }

    const taskToken = format === 'json' ? '<json_fix>' : '<xml_fix>';
    const prompt = `${taskToken}\nBroken ${format.toUpperCase()}:\n${input}\n\nFixed ${format.toUpperCase()}:`;

    let bestError = null;

    for (let attempt = 0; attempt < Math.max(1, this.config.maxRetries); attempt++) {
      const generatedText = await this._slmGenerate(prompt, this.config.slmMaxTokens);
      const parsed = format === 'json'
        ? this._extractAndValidateJSON(generatedText)
        : this._extractAndValidateXML(generatedText);

      if (parsed.success) {
        return {
          success: true,
          fixed: parsed.fixed,
          original: input,
          fixes: ['SLM-generated fix'],
          data: parsed.data || null,
          errors: [],
          method: 'slm',
          canFallback: false
        };
      }

      bestError = parsed.errors;
    }

    return {
      success: false,
      fixed: input,
      original: input,
      fixes: [],
      errors: bestError || ['SLM could not produce a valid fix'],
      method: 'slm',
      canFallback: true
    };
  }

  /**
   * Autoregressive decoding with temperature and top-p sampling
   */
  async _slmGenerate(prompt, maxNewTokens) {
    const eosId = this.tokenizer.vocab[this.tokenizer.EOS_TOKEN];

    // Prepare prompt ids (drop trailing EOS to continue generation)
    const promptIds = this.tokenizer.encode(prompt);
    if (promptIds[promptIds.length - 1] === eosId) {
      promptIds.pop();
    }

    const outputIds = [...promptIds];

    for (let i = 0; i < maxNewTokens; i++) {
      const logits = this.model.forward(outputIds);
      const nextLogits = logits[logits.length - 1];

      const nextId = this._sampleTopP(nextLogits, this.config.topP, this.config.temperature);
      outputIds.push(nextId);

      if (nextId === eosId || outputIds.length >= this.model.config.maxSeqLen) {
        break;
      }
    }

    return this.tokenizer.decode(outputIds, true);
  }

  /**
   * Top-p sampling helper with temperature
   */
  _sampleTopP(logits, topP = 0.9, temperature = 0.7) {
    const scaled = logits.map(l => l / Math.max(temperature, 1e-6));
    const probs = this._softmax(scaled);

    // Sort indices by probability
    const indexed = probs.map((p, idx) => ({ p, idx })).sort((a, b) => b.p - a.p);

    // Keep smallest set where cumulative prob >= topP
    let cumulative = 0;
    const filtered = [];
    for (const item of indexed) {
      cumulative += item.p;
      filtered.push(item);
      if (cumulative >= topP) break;
    }

    // Renormalize
    const sum = filtered.reduce((s, item) => s + item.p, 0) || 1;
    const rnd = Math.random();
    let acc = 0;
    for (const item of filtered) {
      acc += item.p / sum;
      if (rnd <= acc) {
        return item.idx;
      }
    }
    return filtered[filtered.length - 1].idx;
  }

  /**
   * Softmax utility (duplicated here to keep engine self-contained)
   */
  _softmax(logits) {
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sumExps);
  }

  /**
   * Extract and validate JSON from generated text
   */
  _extractAndValidateJSON(text) {
    const fixedSection = text.split('Fixed JSON:').pop() || text;
    const match = fixedSection.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!match) {
      return { success: false, errors: ['No JSON object or array found'] };
    }

    const candidate = match[1];
    try {
      const data = JSON.parse(candidate);
      return { success: true, fixed: JSON.stringify(data, null, 2), data };
    } catch (error) {
      return { success: false, errors: [error.message] };
    }
  }

  /**
   * Extract and validate XML from generated text
   */
  _extractAndValidateXML(text) {
    const fixedSection = text.split('Fixed XML:').pop() || text;
    const match = fixedSection.match(/(<\?xml[\s\S]*|<[a-zA-Z][\s\S]*)/);
    if (!match) {
      return { success: false, errors: ['No XML content found'] };
    }

    const candidate = match[1];
    const parsed = this.xmlParser.parse(candidate);
    if (parsed.success) {
      return { success: true, fixed: candidate, data: parsed.data };
    }

    return { success: false, errors: parsed.errors || ['XML parse failed'] };
  }
}
