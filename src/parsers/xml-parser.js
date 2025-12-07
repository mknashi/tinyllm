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

    // Remove processing instructions, comments, and CDATA sections before parsing
    // This prevents them from being mistaken for tags
    let cleanXml = xmlString
      .replace(/<\?[^?]*\?>/g, '') // Remove processing instructions (<?xml ...?>)
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, ''); // Remove CDATA sections

    // Updated regex to support namespaces (colons in tag names)
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:_-]*)[^>]*>/g;

    let match;
    while ((match = tagRegex.exec(cleanXml)) !== null) {
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
   * Fix common XML errors with optional AI fallback
   * @param {string} xmlString - The XML to fix
   * @param {Object} options - Optional configuration
   * @param {boolean} options.useAI - Enable AI fallback if rule-based fails
   * @param {Object} options.model - AI model instance (required if useAI is true)
   * @param {Object} options.tokenizer - Tokenizer instance (required if useAI is true)
   */
  fix(xmlString, options = {}) {
    let fixed = xmlString;
    const fixes = [];

    // Pre-validation: Check for critical unfixable errors
    const criticalErrors = this._detectCriticalErrors(xmlString);
    if (criticalErrors.length > 0) {
      // If AI mode is enabled, skip critical error rejection and let AI try
      if (options.useAI && options.model && options.tokenizer) {
        return this.fixWithAI(xmlString, options.model, options.tokenizer);
      }

      return {
        success: false,
        fixed: xmlString,
        original: xmlString,
        fixes: [],
        data: null,
        errors: criticalErrors,
        canTryAI: true, // Signal that AI might help
      };
    }

    // Fix 1: Add XML declaration if missing
    if (!fixed.trim().startsWith('<?xml')) {
      fixed = '<?xml version="1.0" encoding="UTF-8"?>\n' + fixed;
      fixes.push('Added XML declaration');
    }

    // Fix 2: Fix mismatched closing tag names (do this BEFORE fixing unclosed tags)
    const mismatchResultEarly = this._fixMismatchedTags(fixed);
    if (mismatchResultEarly.fixes.length > 0) {
      fixed = mismatchResultEarly.xml;
      fixes.push(...mismatchResultEarly.fixes);
    }

    // Fix 3: Fix unclosed tags (after mismatched tags are corrected)
    const { unclosedTags, fixedXml } = this._fixUnclosedTags(fixed);
    if (unclosedTags.length > 0) {
      fixed = fixedXml;
      fixes.push(`Fixed ${unclosedTags.length} unclosed tag(s): ${unclosedTags.join(', ')}`);
    }

    // Fix 4: Fix unclosed attribute quotes
    // Pattern: id="value> should become id="value">
    // Look for = followed by " then characters that include > before another "
    const beforeUnclosedQuote = fixed;
    fixed = fixed.replace(/(\s[a-zA-Z-]+)="([^"]*>)/g, (match, attrName, value) => {
      // If the value contains >, it's likely an unclosed quote
      if (value.includes('>')) {
        // Insert the closing quote before the >
        return attrName + '="' + value.replace('>', '">');
      }
      return match;
    });
    if (fixed !== beforeUnclosedQuote) {
      fixes.push('Fixed unclosed attribute quotes');
    }

    // Fix 5: Fix missing equals in attributes
    // Pattern: id "value" should become id="value"
    const missingEqualsRegex = /(<[^>]*\s+)([a-zA-Z-]+)\s+"([^"]*)"/g;
    const beforeMissingEquals = fixed;
    fixed = fixed.replace(missingEqualsRegex, '$1$2="$3"');
    if (fixed !== beforeMissingEquals) {
      fixes.push('Fixed missing equals in attributes');
    }

    // Fix 6: Fix unescaped special characters
    const beforeEscape = fixed;
    fixed = this._escapeSpecialChars(fixed);
    if (fixed !== beforeEscape) {
      fixes.push('Escaped special characters in text content');
    }

    // Fix 7: Fix attribute quotes
    const attrRegex = /(<[^>]+\s+)([a-zA-Z-]+)=([^"\s>]+)(?=[\s>])/g;
    const beforeAttrFix = fixed;
    fixed = fixed.replace(attrRegex, '$1$2="$3"');
    if (fixed !== beforeAttrFix) {
      fixes.push('Added quotes to unquoted attributes');
    }

    // Fix 8: Fix invalid tag names (starting with numbers or special chars)
    // Match both opening and closing tags that start with numbers
    const invalidOpenTagRegex = /<([0-9][a-zA-Z0-9-_]*)/g;
    const invalidCloseTagRegex = /<\/([0-9][a-zA-Z0-9-_]*)/g;
    const beforeTagFix = fixed;

    // Fix opening tags: <1root> → <tag1root>
    fixed = fixed.replace(invalidOpenTagRegex, (match, tagName) => {
      return `<tag${tagName}`;
    });

    // Fix closing tags: </1root> → </tag1root>
    fixed = fixed.replace(invalidCloseTagRegex, (match, tagName) => {
      return `</tag${tagName}`;
    });

    if (fixed !== beforeTagFix) {
      fixes.push('Fixed invalid tag names');
    }

    // Fix 9: Balance mismatched tags
    const balancedResult = this._balanceTags(fixed);
    if (balancedResult.fixes.length > 0) {
      fixed = balancedResult.xml;
      fixes.push(...balancedResult.fixes);
    }

    // Validate the fix
    const parseResult = this.parse(fixed);

    // Auto-fallback to AI if rule-based failed and AI mode is enabled
    if (!parseResult.success && options.useAI && options.model && options.tokenizer) {
      return this.fixWithAI(xmlString, options.model, options.tokenizer);
    }

    return {
      success: parseResult.success,
      fixed: fixed,
      original: xmlString,
      fixes: fixes,
      data: parseResult.data,
      errors: parseResult.errors,
      method: 'rules',
      canTryAI: !parseResult.success, // Signal if AI might help
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
   * Detect critical errors that cannot be auto-fixed
   */
  _detectCriticalErrors(xmlString) {
    const errors = [];
    const trimmed = xmlString.trim();

    // Remove XML declaration for analysis
    const withoutDecl = trimmed.replace(/^<\?xml[^?]*\?>\s*/, '');

    // 1. Check for tags with spaces in names (invalid syntax) - but allow attributes
    const tagWithSpaceMatch = withoutDecl.match(/<([a-zA-Z][a-zA-Z0-9-_]*)\s+([a-zA-Z][a-zA-Z0-9-_]*)[^=]/);
    if (tagWithSpaceMatch && !/<[^>]+=/.test(withoutDecl)) {
      // Only error if there's a space in tag name AND no attributes
      errors.push({
        type: 'invalid_tag_name',
        message: 'Tag names cannot contain spaces',
      });
    }

    // 2. Check for text before root element
    const firstTagMatch = withoutDecl.match(/<([a-zA-Z][a-zA-Z0-9:_-]*)/);
    if (firstTagMatch) {
      const beforeFirstTag = withoutDecl.substring(0, firstTagMatch.index).trim();
      // Allow processing instructions and comments, but not regular text
      const withoutAllowed = beforeFirstTag
        .replace(/<\?[^?]*\?>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim();
      if (withoutAllowed.length > 0) {
        errors.push({
          type: 'text_before_root',
          message: 'Text content before root element',
        });
      }
    }

    // 3. Check for multiple root elements
    const cleaned = withoutDecl
      .replace(/<\?[^?]*\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');

    const rootMatches = [];
    let depth = 0;
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:_-]*)[^>]*>/g;
    let match;

    while ((match = tagRegex.exec(cleaned)) !== null) {
      const fullTag = match[0];
      const isClosing = fullTag.startsWith('</');
      const isSelfClosing = fullTag.endsWith('/>');

      if (!isClosing && !isSelfClosing) {
        if (depth === 0) {
          rootMatches.push(match[1]);
        }
        depth++;
      } else if (isClosing) {
        depth--;
      }
    }

    if (rootMatches.length > 1) {
      errors.push({
        type: 'multiple_roots',
        message: `Multiple root elements detected: ${rootMatches.join(', ')}`,
      });
    }

    // 4. Check for missing opening tag (starts with closing tag or just value)
    const startsWithClosing = /^\s*<\//.test(withoutDecl);
    // Allow tags starting with numbers (will be fixed later)
    const hasNoOpeningTag = !/<[a-zA-Z0-9]/.test(withoutDecl) && /<\//.test(withoutDecl);

    if (startsWithClosing || hasNoOpeningTag) {
      errors.push({
        type: 'missing_opening_tag',
        message: 'Missing opening tag',
      });
    }

    return errors;
  }

  /**
   * Fix unclosed tags with position-aware insertion
   */
  _fixUnclosedTags(xmlString) {
    const tagStack = [];
    const insertions = []; // Track where to insert closing tags

    // Track tag positions in original XML
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:_-]*)[^>]*>/g;
    const tags = [];
    let match;

    while ((match = tagRegex.exec(xmlString)) !== null) {
      const fullTag = match[0];
      const tagName = match[1];
      const position = match.index;

      // Skip processing instructions, comments, CDATA
      if (tagName.match(/^[?!]/)) continue;

      tags.push({
        name: tagName,
        fullTag: fullTag,
        position: position,
        isClosing: fullTag.startsWith('</'),
        isSelfClosing: fullTag.endsWith('/>')
      });
    }

    // Process tags to find unclosed ones and where to insert closings
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];

      if (tag.isClosing) {
        if (tagStack.length > 0) {
          const topTag = tagStack[tagStack.length - 1];

          if (topTag.name === tag.name) {
            // Matching closing tag
            tagStack.pop();
          } else {
            // Mismatched - need to close all open tags up to this one
            const indexInStack = tagStack.map(t => t.name).lastIndexOf(tag.name);

            if (indexInStack >= 0) {
              // Close all tags from top of stack down to the matching tag
              while (tagStack.length > indexInStack) {
                const unclosed = tagStack.pop();
                insertions.push({
                  position: tag.position,
                  tag: `</${unclosed.name}>`
                });
              }
              tagStack.pop(); // Remove the matching tag
            }
          }
        }
      } else if (!tag.isSelfClosing) {
        tagStack.push({ name: tag.name, position: tag.position });
      }
    }

    // Add any remaining unclosed tags at the end
    if (tagStack.length > 0) {
      const endPosition = xmlString.length;
      tagStack.reverse().forEach(tag => {
        insertions.push({
          position: endPosition,
          tag: `</${tag.name}>`
        });
      });
    }

    // Apply insertions in reverse order to maintain positions
    let fixedXml = xmlString;
    insertions.sort((a, b) => b.position - a.position);
    insertions.forEach(insertion => {
      fixedXml = fixedXml.substring(0, insertion.position) +
                 insertion.tag + '\n' +
                 fixedXml.substring(insertion.position);
    });

    const unclosedTags = insertions.map(ins => ins.tag.match(/<\/(.*)>/)[1]);
    return { unclosedTags, fixedXml };
  }

  /**
   * Escape special characters in text content
   */
  _escapeSpecialChars(xmlString) {
    // Preserve CDATA sections
    const cdataRegex = /<!\[CDATA\[([\s\S]*?)\]\]>/g;
    const cdataSections = [];
    let cdataIndex = 0;

    // Temporarily replace CDATA sections with placeholders
    let withoutCdata = xmlString.replace(cdataRegex, (match) => {
      cdataSections.push(match);
      return `__CDATA_PLACEHOLDER_${cdataIndex++}__`;
    });

    // Only escape in text content, not in tags or CDATA
    withoutCdata = withoutCdata.replace(/>([^<]*)</g, (match, text) => {
      // Skip if this is a CDATA placeholder
      if (text.includes('__CDATA_PLACEHOLDER_')) {
        return match;
      }

      const escaped = text
        .replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `>${escaped}<`;
    });

    // Restore CDATA sections
    cdataSections.forEach((cdata, index) => {
      withoutCdata = withoutCdata.replace(`__CDATA_PLACEHOLDER_${index}__`, cdata);
    });

    return withoutCdata;
  }

  /**
   * Fix mismatched closing tag names
   * For example: <product>...</product1> becomes <product>...</product>
   */
  _fixMismatchedTags(xmlString) {
    const tagStack = [];
    const fixes = [];
    const replacements = [];

    // Find positions of CDATA sections, comments, and processing instructions to skip them
    const skipRanges = [];
    const cdataRegex = /<!\[CDATA\[[\s\S]*?\]\]>/g;
    const commentRegex = /<!--[\s\S]*?-->/g;
    const piRegex = /<\?[^?]*\?>/g;

    [cdataRegex, commentRegex, piRegex].forEach(regex => {
      let match;
      while ((match = regex.exec(xmlString)) !== null) {
        skipRanges.push({ start: match.index, end: match.index + match[0].length });
      }
    });

    // Helper to check if a position is inside a skip range
    const shouldSkip = (pos) => {
      return skipRanges.some(range => pos >= range.start && pos < range.end);
    };

    // Track all tags with their positions
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:_-]*)[^>]*>/g;
    let match;
    while ((match = tagRegex.exec(xmlString)) !== null) {
      const fullTag = match[0];
      const tagName = match[1];
      const position = match.index;
      const isClosing = fullTag.startsWith('</');
      const isSelfClosing = fullTag.endsWith('/>');

      // Skip if this tag is inside CDATA, comment, or PI
      if (shouldSkip(position)) {
        continue;
      }

      // Skip processing instructions and CDATA declarations
      if (tagName.startsWith('?') || tagName.startsWith('!')) {
        continue;
      }

      if (isClosing) {
        if (tagStack.length > 0) {
          const expected = tagStack[tagStack.length - 1];

          // Check if closing tag doesn't match expected tag
          if (expected.name !== tagName) {
            // Check if it's a similar tag (common typos)
            if (this._isSimilarTag(expected.name, tagName)) {
              // Auto-correct the closing tag
              replacements.push({
                position: position,
                oldTag: fullTag,
                newTag: `</${expected.name}>`,
                original: tagName,
                corrected: expected.name
              });
              tagStack.pop();
              fixes.push(`Fixed mismatched tag: </${tagName}> → </${expected.name}>`);
            }
          } else {
            tagStack.pop();
          }
        }
      } else if (!isSelfClosing) {
        tagStack.push({ name: tagName, position: position });
      }
    }

    // Apply replacements in reverse order to maintain positions
    let result = xmlString;
    for (let i = replacements.length - 1; i >= 0; i--) {
      const rep = replacements[i];
      result = result.substring(0, rep.position) +
               rep.newTag +
               result.substring(rep.position + rep.oldTag.length);
    }

    return { xml: result, fixes };
  }

  /**
   * Check if two tag names are similar (likely typos)
   * Examples: product/product1, item/item1, div/dvi
   * NOT similar: feature/features (plural), item/items (different semantics)
   */
  _isSimilarTag(expected, actual) {
    // Exact match (shouldn't happen, but just in case)
    if (expected === actual) return true;

    // Don't auto-fix plural vs singular (feature vs features)
    // This is likely a structural error, not a typo
    if (expected + 's' === actual || expected === actual + 's') {
      return false;
    }

    // Check if one is a prefix with numbers/special chars appended (product vs product1)
    const prefixPattern = new RegExp(`^${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[0-9]+$`);
    if (prefixPattern.test(actual)) {
      return true;
    }

    const reversePrefixPattern = new RegExp(`^${actual.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[0-9]+$`);
    if (reversePrefixPattern.test(expected)) {
      return true;
    }

    // Check edit distance for single character typos only (Levenshtein distance <= 1)
    const distance = this._levenshteinDistance(expected, actual);
    return distance <= 1;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  _levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,    // deletion
            dp[i][j - 1] + 1,    // insertion
            dp[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Balance mismatched tags
   */
  _balanceTags(xmlString) {
    const tagStack = [];
    const fixes = [];
    let balanced = xmlString;

    // Remove processing instructions, comments, and CDATA sections before parsing
    let cleanXml = xmlString
      .replace(/<\?[^?]*\?>/g, '') // Remove processing instructions
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, ''); // Remove CDATA sections

    // Updated regex to support namespaces (colons in tag names)
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:_-]*)[^>]*>/g;

    const matches = [];
    let match;
    while ((match = tagRegex.exec(cleanXml)) !== null) {
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
