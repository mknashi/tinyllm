/**
 * TinyLLM - Lightweight LLM for XML/JSON parsing and fixing
 * Main entry point
 */

export { NanoTransformer } from './model/nano-transformer.js';
export { Tokenizer } from './utils/tokenizer.js';
export { XMLParser } from './parsers/xml-parser.js';
export { JSONParser } from './parsers/json-parser.js';
export { InferenceEngine } from './inference/engine.js';

// Default export for convenience
import { InferenceEngine } from './inference/engine.js';

/**
 * Create a new TinyLLM instance
 */
export function createTinyLLM(config = {}) {
  return new InferenceEngine(config);
}

/**
 * Quick API for fixing JSON/XML
 */
export const TinyLLM = {
  /**
   * Create a new engine instance
   */
  create(config) {
    return createTinyLLM(config);
  },

  /**
   * Quick fix JSON
   */
  async fixJSON(jsonString, config = {}) {
    const engine = new InferenceEngine(config);
    await engine.initialize();
    return await engine.fixJSON(jsonString);
  },

  /**
   * Quick fix XML
   */
  async fixXML(xmlString, config = {}) {
    const engine = new InferenceEngine(config);
    await engine.initialize();
    return await engine.fixXML(xmlString);
  },

  /**
   * Auto-detect and fix
   */
  async autoFix(input, config = {}) {
    const engine = new InferenceEngine(config);
    await engine.initialize();
    return await engine.autoFix(input);
  },
};

export default TinyLLM;
