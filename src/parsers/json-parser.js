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

    // Fix 1: Remove trailing commas
    const trailingCommaRegex = /,(\s*[}\]])/g;
    if (trailingCommaRegex.test(fixed)) {
      fixed = fixed.replace(trailingCommaRegex, '$1');
      fixes.push('Removed trailing commas');
    }

    // Fix 2: Add missing commas between properties
    const missingCommaRegex = /("\s*:\s*(?:"[^"]*"|[^,}\]]+))(\s+")(?=[^:]*:)/g;
    const beforeCommaFix = fixed;
    fixed = fixed.replace(missingCommaRegex, '$1,$2');
    if (fixed !== beforeCommaFix) {
      fixes.push('Added missing commas between properties');
    }

    // Fix 3: Fix unquoted keys
    const unquotedKeyRegex = /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g;
    const beforeKeyFix = fixed;
    fixed = fixed.replace(unquotedKeyRegex, '$1"$2"$3');
    if (fixed !== beforeKeyFix) {
      fixes.push('Quoted unquoted keys');
    }

    // Fix 4: Fix single quotes to double quotes
    const singleQuoteRegex = /'([^']*)'/g;
    const beforeQuoteFix = fixed;
    fixed = fixed.replace(singleQuoteRegex, '"$1"');
    if (fixed !== beforeQuoteFix) {
      fixes.push('Converted single quotes to double quotes');
    }

    // Fix 5: Remove comments (// and /* */)
    const beforeCommentFix = fixed;
    fixed = fixed.replace(/\/\/.*$/gm, ''); // Remove single-line comments
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    if (fixed !== beforeCommentFix) {
      fixes.push('Removed comments');
    }

    // Fix 6: Fix missing closing braces/brackets
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

    // Fix 7: Escape unescaped quotes in strings
    // This is complex and might need AI assistance

    // Fix 8: Fix NaN, Infinity, undefined
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
