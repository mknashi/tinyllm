/**
 * JSON Parser and Fixer
 * Combines rule-based validation with AI-powered fixing
 */

export class JSONParser {
  constructor() {
    this.errors = [];
  }

  /**
   * Parse and validate JSON, return errors if any
   */
  parse(jsonString) {
    this.errors = [];

    try {
      const parsed = JSON.parse(jsonString);
      return { success: true, data: parsed, errors: [] };
    } catch (error) {
      this.errors.push({
        type: 'parse_error',
        message: error.message,
        position: this._extractPosition(error.message),
      });

      return { success: false, data: null, errors: this.errors };
    }
  }

  /**
   * Attempt to fix common JSON errors
   */
  fix(jsonString) {
    let fixed = jsonString;
    const fixes = [];

    // Fix 1: Fix single quotes to double quotes (do this first)
    const singleQuoteRegex = /'([^']*)'/g;
    const beforeQuoteFix = fixed;
    fixed = fixed.replace(singleQuoteRegex, '"$1"');
    if (fixed !== beforeQuoteFix) {
      fixes.push('Converted single quotes to double quotes');
    }

    // Fix 2: Fix unclosed strings (missing closing quotes)
    // IMPORTANT: Must run BEFORE comment removal to avoid treating // in URLs as comments
    const beforeStringFix = fixed;
    fixed = this._fixUnclosedStrings(fixed);
    if (fixed !== beforeStringFix) {
      fixes.push('Fixed unclosed strings');
    }

    // Fix 3: Remove comments (// and /* */) - but not in strings!
    const beforeCommentFix = fixed;
    fixed = this._removeComments(fixed);
    if (fixed !== beforeCommentFix) {
      fixes.push('Removed comments');
    }

    // Fix 4: Remove trailing commas
    const trailingCommaRegex = /,(\s*[}\]])/g;
    if (trailingCommaRegex.test(fixed)) {
      fixed = fixed.replace(trailingCommaRegex, '$1');
      fixes.push('Removed trailing commas');
    }

    // Fix 5: Fix unquoted keys
    const unquotedKeyRegex = /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g;
    const beforeKeyFix = fixed;
    fixed = fixed.replace(unquotedKeyRegex, '$1"$2"$3');
    if (fixed !== beforeKeyFix) {
      fixes.push('Quoted unquoted keys');
    }

    // Fix 6: Add missing commas between properties (improved algorithm)
    const beforeCommaFix = fixed;
    fixed = this._addMissingCommas(fixed);
    if (fixed !== beforeCommaFix) {
      fixes.push('Added missing commas between properties');
    }

    // Fix 7: Fix missing closing braces/brackets
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;

    if (openBraces > closeBraces) {
      fixed += '}'.repeat(openBraces - closeBraces);
      fixes.push(`Added ${openBraces - closeBraces} missing closing brace(s)`);
    }

    if (openBrackets > closeBrackets) {
      fixed += ']'.repeat(openBrackets - closeBrackets);
      fixes.push(`Added ${openBrackets - closeBrackets} missing closing bracket(s)`);
    }

    // Fix 8: Fix missing opening brace
    // Detect if JSON starts with a key-value pair but missing opening brace
    const trimmed = fixed.trim();
    if (trimmed.match(/^"[^"]+"\s*:\s*.+}$/s)) {
      fixed = '{' + fixed;
      fixes.push('Added missing opening brace');
    }

    // Fix 9: Fix numbers with leading zeros
    // Invalid: {"value": 01} -> Valid: {"value": 1}
    const leadingZeroRegex = /:\s*0([0-9]+)/g;
    const beforeLeadingZeroFix = fixed;
    fixed = fixed.replace(leadingZeroRegex, ': $1');
    if (fixed !== beforeLeadingZeroFix) {
      fixes.push('Fixed numbers with leading zeros');
    }

    // Fix 10: Fix unescaped backslashes in strings
    // Only fix obvious cases like paths: C:\Users -> C:\\Users
    // This regex looks for backslashes followed by common path characters
    const unescapedBackslashRegex = /"([^"]*\\(?!["\\/bfnrtu]))/g;
    const beforeBackslashFix = fixed;
    fixed = fixed.replace(unescapedBackslashRegex, (match, content) => {
      // Escape single backslashes that aren't already part of escape sequences
      const escaped = '"' + content.replace(/\\/g, '\\\\');
      return escaped;
    });
    if (fixed !== beforeBackslashFix) {
      fixes.push('Fixed unescaped backslashes');
    }

    // Fix 11: Fix NaN, Infinity, undefined
    fixed = fixed.replace(/:\s*NaN/g, ': null');
    fixed = fixed.replace(/:\s*Infinity/g, ': null');
    fixed = fixed.replace(/:\s*undefined/g, ': null');

    // Validate the fix
    const parseResult = this.parse(fixed);

    return {
      success: parseResult.success,
      fixed: fixed,
      original: jsonString,
      fixes: fixes,
      data: parseResult.data,
      errors: parseResult.errors,
    };
  }

  /**
   * Intelligently add missing commas between properties
   * Uses a state machine to avoid corrupting string values
   */
  _addMissingCommas(jsonString) {
    let result = '';
    let inString = false;
    let escapeNext = false;
    let pendingWhitespace = '';
    let lastToken = '';  // Last significant token (, { [ } ] : etc)

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];

      // Handle escape sequences
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        result += char;
        continue;
      }

      // Track string boundaries
      if (char === '"') {
        if (!inString) {
          // Starting a string
          // Check if we need a comma before this string
          if (lastToken === '}' || lastToken === ']' || lastToken === '"') {
            result += ',';
          }
          result += pendingWhitespace;
          pendingWhitespace = '';
          inString = true;
          result += char;
        } else {
          // Ending a string
          inString = false;
          result += char;
          lastToken = '"';
        }
        continue;
      }

      // Don't process inside strings
      if (inString) {
        result += char;
        continue;
      }

      // Handle whitespace
      if (/\s/.test(char)) {
        pendingWhitespace += char;
        continue;
      }

      // Check for opening braces/brackets
      if (char === '{' || char === '[') {
        // Check if we need a comma before this
        if (lastToken === '}' || lastToken === ']' || lastToken === '"') {
          result += ',';
        }
        result += pendingWhitespace;
        pendingWhitespace = '';
        result += char;
        lastToken = char;
        continue;
      }

      // Handle closing braces/brackets
      if (char === '}' || char === ']') {
        result += pendingWhitespace;
        pendingWhitespace = '';
        result += char;
        lastToken = char;
        continue;
      }

      // Handle other significant characters
      if (char === ':' || char === ',') {
        result += pendingWhitespace;
        pendingWhitespace = '';
        result += char;
        lastToken = char;
        continue;
      }

      // Handle other characters (numbers, true, false, null)
      result += pendingWhitespace;
      pendingWhitespace = '';
      result += char;
    }

    result += pendingWhitespace;
    return result;
  }

  /**
   * Fix unclosed strings by adding missing closing quotes
   */
  _fixUnclosedStrings(jsonString) {
    let result = '';
    let inString = false;
    let escapeNext = false;
    let stringStart = -1;

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];

      // Handle escape sequences
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        result += char;
        continue;
      }

      // Track string boundaries
      if (char === '"') {
        if (!inString) {
          // Starting a string
          inString = true;
          stringStart = i;
          result += char;
        } else {
          // Ending a string
          inString = false;
          stringStart = -1;
          result += char;
        }
        continue;
      }

      // If we're in a string and hit a newline or structural character, close the string
      if (inString && (char === '\n' || char === '\r')) {
        // Unclosed string detected - add closing quote before newline
        result += '"';
        inString = false;
        stringStart = -1;
        result += char;
        continue;
      }

      // If we hit a comma or closing brace/bracket while in a string, close it
      if (inString && (char === ',' || char === '}' || char === ']')) {
        // Check if this looks like it should end the string
        // (i.e., we've gone past where a string should reasonably end)
        const currentStringLength = i - stringStart;
        if (currentStringLength > 200 || char === '\n') {
          // Likely an unclosed string - close it before this character
          result += '"';
          inString = false;
          stringStart = -1;
        }
      }

      result += char;
    }

    // If still in string at end, close it
    if (inString) {
      result += '"';
    }

    return result;
  }

  /**
   * Remove comments but preserve // in strings (like URLs)
   */
  _removeComments(jsonString) {
    let result = '';
    let inString = false;
    let escapeNext = false;
    let i = 0;

    while (i < jsonString.length) {
      const char = jsonString[i];
      const nextChar = i < jsonString.length - 1 ? jsonString[i + 1] : '';

      // Handle escape sequences
      if (escapeNext) {
        result += char;
        escapeNext = false;
        i++;
        continue;
      }

      if (char === '\\' && inString) {
        escapeNext = true;
        result += char;
        i++;
        continue;
      }

      // Track string boundaries
      if (char === '"') {
        inString = !inString;
        result += char;
        i++;
        continue;
      }

      // Inside strings, keep everything including //
      if (inString) {
        result += char;
        i++;
        continue;
      }

      // Outside strings, check for comments
      if (char === '/' && nextChar === '/') {
        // Skip until end of line
        i += 2;
        while (i < jsonString.length && jsonString[i] !== '\n') {
          i++;
        }
        continue;
      }

      if (char === '/' && nextChar === '*') {
        // Skip until */
        i += 2;
        while (i < jsonString.length - 1) {
          if (jsonString[i] === '*' && jsonString[i + 1] === '/') {
            i += 2;
            break;
          }
          i++;
        }
        continue;
      }

      result += char;
      i++;
    }

    return result;
  }

  /**
   * AI-powered fixing using the model
   */
  async fixWithAI(jsonString, model, tokenizer) {
    // First try rule-based fixing
    const ruleFix = this.fix(jsonString);
    if (ruleFix.success) {
      return ruleFix;
    }

    // If rule-based fails, use AI
    const prompt = `Fix this broken JSON:\n${jsonString}\n\nFixed JSON:`;
    const inputIds = tokenizer.encode(prompt);

    try {
      const outputIds = model.generate(inputIds, 200, 0.7);
      const generated = tokenizer.decode(outputIds);

      // Extract JSON from generated text
      const jsonMatch = generated.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        const aiFixed = jsonMatch[0];
        const parseResult = this.parse(aiFixed);

        if (parseResult.success) {
          return {
            success: true,
            fixed: aiFixed,
            original: jsonString,
            fixes: ['AI-powered fix applied', ...ruleFix.fixes],
            data: parseResult.data,
            errors: [],
            method: 'ai',
          };
        }
      }
    } catch (error) {
      console.error('AI fixing failed:', error);
    }

    // Return best attempt
    return {
      ...ruleFix,
      method: 'rules',
    };
  }

  /**
   * Validate JSON structure and report detailed errors
   */
  validate(jsonString) {
    const issues = [];

    // Check for common issues before parsing
    const lines = jsonString.split('\n');

    lines.forEach((line, index) => {
      // Check for trailing commas
      if (/,\s*[}\]]/.test(line)) {
        issues.push({
          line: index + 1,
          type: 'trailing_comma',
          message: 'Trailing comma detected',
          severity: 'error',
        });
      }

      // Check for unquoted keys
      if (/[{,]\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/.test(line)) {
        issues.push({
          line: index + 1,
          type: 'unquoted_key',
          message: 'Unquoted key detected',
          severity: 'error',
        });
      }

      // Check for single quotes
      if (/'[^']*'/.test(line)) {
        issues.push({
          line: index + 1,
          type: 'single_quotes',
          message: 'Single quotes detected (use double quotes)',
          severity: 'warning',
        });
      }

      // Check for comments
      if (/\/\/|\/\*/.test(line)) {
        issues.push({
          line: index + 1,
          type: 'comment',
          message: 'Comment detected (not allowed in JSON)',
          severity: 'error',
        });
      }
    });

    // Try parsing
    const parseResult = this.parse(jsonString);

    return {
      valid: parseResult.success,
      issues: [...issues, ...parseResult.errors],
      data: parseResult.data,
    };
  }

  /**
   * Pretty print JSON
   */
  prettify(jsonString, indent = 2) {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, indent);
    } catch (error) {
      // Try fixing first
      const fixed = this.fix(jsonString);
      if (fixed.success) {
        return JSON.stringify(fixed.data, null, indent);
      }
      throw error;
    }
  }

  /**
   * Extract position from error message
   */
  _extractPosition(message) {
    const match = message.match(/position (\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Get error context (surrounding code)
   */
  getErrorContext(jsonString, position, contextSize = 50) {
    if (!position) return null;

    const start = Math.max(0, position - contextSize);
    const end = Math.min(jsonString.length, position + contextSize);

    return {
      before: jsonString.substring(start, position),
      error: jsonString[position],
      after: jsonString.substring(position + 1, end),
      position: position,
    };
  }
}
