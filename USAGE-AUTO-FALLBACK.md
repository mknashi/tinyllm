# Auto-Fallback to AI Mode

## Overview

The XML and JSON parsers now support **automatic fallback to AI mode** when rule-based fixing fails. This is particularly useful for complex structural errors that regex-based rules cannot handle.

## Features

- ✅ **Automatic fallback**: Tries rule-based fixes first, then AI if needed
- ✅ **Backward compatible**: Optional parameter, existing code continues to work
- ✅ **Smart detection**: Returns `canTryAI` flag to indicate when AI might help
- ✅ **Method tracking**: Response includes `method` field ('rules' or 'ai')

## Usage

### Option 1: Direct Parser Usage

```javascript
import { XMLParser } from './src/parsers/xml-parser.js';
import { NanoTransformer } from './src/model/nano-transformer.js';
import { Tokenizer } from './src/utils/tokenizer.js';

// Initialize model and tokenizer
const model = new NanoTransformer();
const tokenizer = new Tokenizer();

// Create parser
const parser = new XMLParser();

// Fix with auto-fallback enabled
const result = await parser.fix(xmlString, {
  useAI: true,
  model: model,
  tokenizer: tokenizer
});

console.log('Success:', result.success);
console.log('Method used:', result.method); // 'rules' or 'ai'
console.log('Fixes applied:', result.fixes);
```

### Option 2: InferenceEngine (Recommended)

```javascript
import { InferenceEngine } from './src/inference/engine.js';

// Initialize engine with AI enabled
const engine = new InferenceEngine({ useAI: true });
await engine.initialize();

// Auto-fallback is built-in!
const xmlResult = await engine.fixXML(xmlString);
const jsonResult = await engine.fixJSON(jsonString);

// Check which method was used
console.log('Method:', xmlResult.method); // 'rules' or 'ai'
```

### Option 3: Rule-Based Only (Default)

```javascript
import { XMLParser } from './src/parsers/xml-parser.js';

const parser = new XMLParser();

// No options = rule-based only (backward compatible)
const result = parser.fix(xmlString);

// Check if AI might help
if (!result.success && result.canTryAI) {
  console.log('💡 Tip: Enable AI mode for better results');
}
```

## When to Use AI Mode

### Use AI mode for:
- **Complex structural errors**: Unclosed nested tags, mismatched hierarchies
- **Ambiguous fixes**: Multiple possible interpretations
- **Semantic understanding**: When context matters

### Use rule-based mode for:
- **Simple errors**: Missing quotes, trailing commas, unclosed braces
- **Performance critical**: Rule-based is synchronous and faster
- **Offline scenarios**: No model loading required

## Examples

### Example 1: Unclosed Nested Tag

```xml
<!-- Input: Unclosed <feature> before </features> closes -->
<features>
  <feature>Intel Core i7</feature>
  <feature>512GB SSD
</features>
```

**Rule-based**: ❌ Fails (creates cascading mismatches)
**AI mode**: ✅ Success (understands the structure and adds `</feature>`)

### Example 2: Missing Commas

```json
{
  "users": [
    {
      "id": 1,
      "name": "John"
      "email": "john@example.com"
    }
  ]
}
```

**Rule-based**: ✅ Success (simple pattern matching)
**AI mode**: Not needed (rule-based handles it)

## API Reference

### Parser.fix(content, options)

**Parameters:**
- `content` (string): The XML/JSON to fix
- `options` (object, optional):
  - `useAI` (boolean): Enable AI fallback
  - `model` (object): AI model instance (required if useAI is true)
  - `tokenizer` (object): Tokenizer instance (required if useAI is true)

**Returns:**
```javascript
{
  success: boolean,       // Whether fixing succeeded
  fixed: string,          // The fixed content
  original: string,       // Original input
  fixes: string[],        // List of fixes applied
  data: object,           // Parsed data (if success)
  errors: object[],       // Errors (if failed)
  method: string,         // 'rules' or 'ai'
  canTryAI: boolean       // Whether AI might help (if failed)
}
```

## Performance Considerations

| Mode | Speed | Model Load | Memory |
|------|-------|------------|--------|
| Rule-based | Fast (~1ms) | None | Low |
| AI fallback | Slow (~100-500ms) | Required | ~500KB |

**Best Practice**: Always try rule-based first (this is automatic with auto-fallback).

## Migration Guide

### Before (Manual AI Mode)
```javascript
const result = parser.fix(xml);
if (!result.success) {
  const aiResult = await parser.fixWithAI(xml, model, tokenizer);
}
```

### After (Auto-Fallback)
```javascript
const result = await parser.fix(xml, { useAI: true, model, tokenizer });
// Automatically tries rules first, then AI if needed
```

## Limitations

- AI mode requires a trained model (~500KB)
- AI generation is slower than rule-based
- AI may not always produce valid output (validated before returning)
- No infinite loops: `fixWithAI()` calls `fix()` without options to prevent recursion

## See Also

- `demo-auto-fallback.js` - Interactive demonstration
- `test-auto-fallback.js` - Integration tests
- InferenceEngine documentation
