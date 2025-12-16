# Fix #11 Corrupts Valid JSON Strings with \b Escape Sequences

## Bug Description

The control character escaping fix (Fix #11) in `src/parsers/json-parser.js` corrupts valid JSON strings by inserting `\b` escape sequences around every word boundary. This makes the fixed JSON invalid and unusable.

## Affected Version
- **Package**: tinyllm v1.0.0
- **File**: `src/parsers/json-parser.js`
- **Lines**: 135-150

## Root Cause

**Problem**: The regex pattern `/"([^"]*)"/g` matches ALL quoted strings in JSON, not just strings containing actual control characters. Combined with the `.replace(/\b/g, '\\b')` operation, this causes massive corruption.

**Technical Issue**: The `\b` in the regex replacement is interpreted as a **word boundary** pattern (zero-width assertion), not the backspace character (`\x08`). This causes the replacement to insert `\b` at every word boundary within quoted strings.

## Example

### Input JSON (with missing comma):
```json
{
  "name": "Salesforce CMS to Data Cloud 20250613190655",
  "nodes": [
    {
      "requestMethod": "POST"
    }
  ]
}
```

### Current Output (corrupted):
```json
{
  "\bname\b": "\bSalesforce\b \bCMS\b \bto\b \bData\b \bCloud\b \b20250613190655\b",
  "\bnodes\b": [
    {
      "\brequestMethod\b": "\bPOST\b"
    }
  ]
}
```

## Current Buggy Code

```javascript
// Fix 11: Escape control characters in strings
const beforeControlFix = fixed;
fixed = fixed.replace(/"([^"]*)"/g, (match, content) => {
  const escaped = content
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\f/g, '\\f')
    .replace(/\b/g, '\\b');  // BUG: \b is word boundary, not backspace!
  return `"${escaped}"`;
});
if (fixed !== beforeControlFix) {
  fixes.push('Escaped control characters in strings');
}
```

## Reproduction Steps

1. Install tinyllm: `npm install tinyllm`
2. Create a test file:

```javascript
import { InferenceEngine } from 'tinyllm';

const engine = new InferenceEngine({ useAI: false });
await engine.initialize();

const malformedJSON = '{"name": "test" "value": 123}'; // Missing comma
const result = await engine.fixJSON(malformedJSON);

console.log(result.fixed);
// Expected: {"name": "test", "value": 123}
// Actual: {"\bname\b": "\btest\b", "\bvalue\b": 123}
```

3. Observe that all property names and string values are corrupted with `\b`

## Impact

- **Severity**: Critical 🔴
- **Scope**: Affects all JSON files processed by TinyLLM's rule-based fixer
- **User Impact**: Fixed JSON is more broken than the original input
- **Discovered in**: NeoNotePad text editor (https://github.com/mknashi/neonotepad)

## Solution

**Recommended**: Remove Fix #11 entirely. The regex is too broad and dangerous.

**Rationale**:
- Control characters in JSON strings are rare
- JSON.parse() will catch them anyway
- The risk of corruption outweighs the benefit

## Alternative Solutions (if control character escaping is needed in the future)

1. **Only process strings with actual control characters**:
   ```javascript
   fixed = fixed.replace(/"([^"]*)"/g, (match, content) => {
     // Check if content has any control characters
     if (!/[\x00-\x1F]/.test(content)) {
       return match; // No control chars, return unchanged
     }
     const escaped = content
       .replace(/\t/g, '\\t')
       .replace(/\n/g, '\\n')
       .replace(/\r/g, '\\r')
       .replace(/\f/g, '\\f')
       .replace(/\x08/g, '\\b');  // Use \x08 for backspace
     return `"${escaped}"`;
   });
   ```

2. **Use a proper JSON validator/formatter** instead of regex

## Fix PR

A pull request with the fix, regression test, and detailed documentation has been submitted.

## Environment
- **Integration**: Web application using dynamic imports via Vite
- **Browser**: Chrome/Firefox
- **TinyLLM version**: 1.0.0

## Related Files
- Primary bug: `src/parsers/json-parser.js` lines 135-150
- XML parser verified: No similar bug exists in `src/parsers/xml-parser.js`
