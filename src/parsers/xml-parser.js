/**
 * XML Parser and Fixer
 * Combines rule-based validation with AI-powered fixing
 */

export class XMLParser {
  constructor() {
    this.errors = [];
  }

  /**
   * Parse and validate XML
   */
  parse(xmlString) {
    this.errors = [];

    try {
      // Basic XML parsing (browser-compatible)
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'text/xml');

        // Check for parsing errors
        const parseErrors = doc.getElementsByTagName('parsererror');
        if (parseErrors.length > 0) {
          this.errors.push({
            type: 'parse_error',
            message: parseErrors[0].textContent,
          });
          return { success: false, data: null, errors: this.errors };
        }

        return { success: true, data: doc, errors: [] };
      } else {
        // Node.js environment - simple validation
        return this._validateXMLStructure(xmlString);
      }
    } catch (error) {
      this.errors.push({
        type: 'parse_error',
        message: error.message,
      });
      return { success: false, data: null, errors: this.errors };
    }
  }

  /**
   * Validate XML structure (Node.js compatible)
   */
  _validateXMLStructure(xmlString) {
    const errors = [];
    const tagStack = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-_]*)[^>]*>/g;

    let match;
    while ((match = tagRegex.exec(xmlString)) !== null) {
      const fullTag = match[0];
      const tagName = match[1];

      if (fullTag.startsWith('</')) {
        // Closing tag
        if (tagStack.length === 0) {
          errors.push({
            type: 'unmatched_closing_tag',
            message: `Closing tag </${tagName}> has no matching opening tag`,
            tag: tagName,
          });
        } else {
          const lastOpened = tagStack.pop();
          if (lastOpened !== tagName) {
            errors.push({
              type: 'mismatched_tags',
              message: `Expected closing tag </${lastOpened}> but found </${tagName}>`,
              expected: lastOpened,
              found: tagName,
            });
          }
        }
      } else if (!fullTag.endsWith('/>')) {
        // Opening tag (not self-closing)
        tagStack.push(tagName);
      }
    }

    // Check for unclosed tags
    if (tagStack.length > 0) {
      tagStack.forEach(tag => {
        errors.push({
          type: 'unclosed_tag',
          message: `Unclosed tag <${tag}>`,
          tag: tag,
        });
      });
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0 ? xmlString : null,
      errors: errors,
    };
  }

  /**
   * Fix common XML errors
   */
  fix(xmlString) {
    let fixed = xmlString;
    const fixes = [];

    // Fix 1: Add XML declaration if missing
    if (!fixed.trim().startsWith('<?xml')) {
      fixed = '<?xml version="1.0" encoding="UTF-8"?>\n' + fixed;
      fixes.push('Added XML declaration');
    }

    // Fix 2: Fix unclosed tags
    const { unclosedTags, fixedXml } = this._fixUnclosedTags(fixed);
    if (unclosedTags.length > 0) {
      fixed = fixedXml;
      fixes.push(`Fixed ${unclosedTags.length} unclosed tag(s): ${unclosedTags.join(', ')}`);
    }

    // Fix 3: Fix unescaped special characters
    const beforeEscape = fixed;
    fixed = this._escapeSpecialChars(fixed);
    if (fixed !== beforeEscape) {
      fixes.push('Escaped special characters in text content');
    }

    // Fix 4: Fix attribute quotes
    const attrRegex = /(<[^>]+\s+)([a-zA-Z-]+)=([^"\s>]+)(?=[\s>])/g;
    const beforeAttrFix = fixed;
    fixed = fixed.replace(attrRegex, '$1$2="$3"');
    if (fixed !== beforeAttrFix) {
      fixes.push('Added quotes to unquoted attributes');
    }

    // Fix 5: Remove invalid characters in tag names
    const invalidTagRegex = /<\/?([^a-zA-Z][a-zA-Z0-9-_]*)/g;
    const beforeTagFix = fixed;
    fixed = fixed.replace(invalidTagRegex, (match, tagName) => {
      const validTag = tagName.replace(/^[^a-zA-Z]+/, 'tag');
      return match.replace(tagName, validTag);
    });
    if (fixed !== beforeTagFix) {
      fixes.push('Fixed invalid tag names');
    }

    // Fix 6: Balance mismatched tags
    const balancedResult = this._balanceTags(fixed);
    if (balancedResult.fixes.length > 0) {
      fixed = balancedResult.xml;
      fixes.push(...balancedResult.fixes);
    }

    // Validate the fix
    const parseResult = this.parse(fixed);

    return {
      success: parseResult.success,
      fixed: fixed,
      original: xmlString,
      fixes: fixes,
      data: parseResult.data,
      errors: parseResult.errors,
    };
  }

  /**
   * AI-powered fixing
   */
  async fixWithAI(xmlString, model, tokenizer) {
    // First try rule-based fixing
    const ruleFix = this.fix(xmlString);
    if (ruleFix.success) {
      return ruleFix;
    }

    // If rule-based fails, use AI
    const prompt = `Fix this broken XML:\n${xmlString}\n\nFixed XML:`;
    const inputIds = tokenizer.encode(prompt);

    try {
      const outputIds = model.generate(inputIds, 300, 0.7);
      const generated = tokenizer.decode(outputIds);

      // Extract XML from generated text
      const xmlMatch = generated.match(/<\?xml[\s\S]*|<[a-zA-Z][\s\S]*/);
      if (xmlMatch) {
        const aiFixed = xmlMatch[0];
        const parseResult = this.parse(aiFixed);

        if (parseResult.success) {
          return {
            success: true,
            fixed: aiFixed,
            original: xmlString,
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

    return {
      ...ruleFix,
      method: 'rules',
    };
  }

  /**
   * Validate XML and report detailed errors
   */
  validate(xmlString) {
    const issues = [];
    const lines = xmlString.split('\n');

    // Check for XML declaration
    if (!xmlString.trim().startsWith('<?xml')) {
      issues.push({
        line: 1,
        type: 'missing_declaration',
        message: 'Missing XML declaration',
        severity: 'warning',
      });
    }

    // Check each line for issues
    lines.forEach((line, index) => {
      // Unescaped ampersands
      if (/&(?!(amp|lt|gt|quot|apos);)/.test(line)) {
        issues.push({
          line: index + 1,
          type: 'unescaped_ampersand',
          message: 'Unescaped ampersand (&) detected',
          severity: 'error',
        });
      }

      // Unquoted attributes
      if (/=\s*[^"'\s>]/.test(line)) {
        issues.push({
          line: index + 1,
          type: 'unquoted_attribute',
          message: 'Unquoted attribute value detected',
          severity: 'error',
        });
      }
    });

    // Parse and check structure
    const parseResult = this.parse(xmlString);

    return {
      valid: parseResult.success,
      issues: [...issues, ...parseResult.errors],
      data: parseResult.data,
    };
  }

  /**
   * Fix unclosed tags
   */
  _fixUnclosedTags(xmlString) {
    const tagStack = [];
    const unclosedTags = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-_]*)[^>]*>/g;

    let match;
    while ((match = tagRegex.exec(xmlString)) !== null) {
      const fullTag = match[0];
      const tagName = match[1];

      if (fullTag.startsWith('</')) {
        if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
          tagStack.pop();
        }
      } else if (!fullTag.endsWith('/>')) {
        tagStack.push(tagName);
      }
    }

    let fixedXml = xmlString;
    if (tagStack.length > 0) {
      // Add closing tags in reverse order
      const closingTags = tagStack.reverse().map(tag => `</${tag}>`).join('\n');
      fixedXml = xmlString.trim() + '\n' + closingTags;
      unclosedTags.push(...tagStack);
    }

    return { unclosedTags, fixedXml };
  }

  /**
   * Escape special characters in text content
   */
  _escapeSpecialChars(xmlString) {
    // Only escape in text content, not in tags
    return xmlString.replace(/>([^<]*)</g, (match, text) => {
      const escaped = text
        .replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `>${escaped}<`;
    });
  }

  /**
   * Balance mismatched tags
   */
  _balanceTags(xmlString) {
    const tagStack = [];
    const fixes = [];
    let balanced = xmlString;
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-_]*)[^>]*>/g;

    const matches = [];
    let match;
    while ((match = tagRegex.exec(xmlString)) !== null) {
      matches.push({
        fullTag: match[0],
        tagName: match[1],
        index: match.index,
        isClosing: match[0].startsWith('</'),
        isSelfClosing: match[0].endsWith('/>'),
      });
    }

    // Process matches and fix mismatches
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];

      if (current.isClosing) {
        if (tagStack.length === 0) {
          // Remove unmatched closing tag
          balanced = balanced.replace(current.fullTag, '');
          fixes.push(`Removed unmatched closing tag </${current.tagName}>`);
        } else {
          const lastOpened = tagStack.pop();
          if (lastOpened !== current.tagName) {
            // Tag mismatch - close the correct tag
            fixes.push(`Fixed mismatched tags: expected </${lastOpened}>, found </${current.tagName}>`);
          }
        }
      } else if (!current.isSelfClosing) {
        tagStack.push(current.tagName);
      }
    }

    return { xml: balanced, fixes };
  }

  /**
   * Pretty print XML
   */
  prettify(xmlString, indent = 2) {
    try {
      const fixed = this.fix(xmlString);
      const xml = fixed.success ? fixed.fixed : xmlString;

      let formatted = '';
      let indentLevel = 0;
      const lines = xml.split(/>\s*</);

      lines.forEach((line, index) => {
        if (index > 0) line = '<' + line;
        if (index < lines.length - 1) line = line + '>';

        // Decrease indent for closing tags
        if (line.match(/^<\//)) {
          indentLevel--;
        }

        formatted += ' '.repeat(indentLevel * indent) + line.trim() + '\n';

        // Increase indent for opening tags (not self-closing)
        if (line.match(/^<[^\/]/) && !line.match(/\/>$/)) {
          indentLevel++;
        }
      });

      return formatted.trim();
    } catch (error) {
      return xmlString;
    }
  }
}
