/**
 * Trace insertions to debug duplicate tags
 */

import { XMLParser } from './src/parsers/xml-parser.js';

// Override _fixUnclosedTags to add logging
const originalMethod = XMLParser.prototype._fixUnclosedTags;
XMLParser.prototype._fixUnclosedTags = function(xmlString) {
  const insertions = [];
  const tagStack = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:_-]*)[^>]*>/g;
  const tags = [];
  let match;

  while ((match = tagRegex.exec(xmlString)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    const position = match.index;

    if (tagName.match(/^[?!]/)) continue;

    tags.push({
      name: tagName,
      fullTag: fullTag,
      position: position,
      endPosition: match.index + fullTag.length,
      isClosing: fullTag.startsWith('</'),
      isSelfClosing: fullTag.endsWith('/>')
    });
  }

  console.log('Tags found:', tags.map(t => `${t.isClosing ? '</' : '<'}${t.name}${t.isSelfClosing ? '/>' : '>'}`).join(' '));

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    console.log(`\nProcessing: ${tag.isClosing ? '</':''}<${tag.name}>`);
    console.log(`  Stack before: [${tagStack.map(t => t.name).join(', ')}]`);

    if (tag.isClosing) {
      if (tagStack.length > 0) {
        const topTag = tagStack[tagStack.length - 1];

        if (topTag.name === tag.name) {
          console.log(`  ✓ Matches top of stack`);
          tagStack.pop();
        } else {
          const indexInStack = tagStack.map(t => t.name).lastIndexOf(tag.name);
          console.log(`  ✗ Mismatch! Looking for '${tag.name}' in stack... found at index ${indexInStack}`);

          if (indexInStack >= 0) {
            while (tagStack.length > indexInStack) {
              const unclosed = tagStack.pop();
              console.log(`    → Insert </${unclosed.name}> before </${tag.name}>`);
              insertions.push({
                position: tag.position,
                tag: `</${unclosed.name}>`,
                priority: 1
              });
            }
            console.log(`    → Pop matching parent '${tag.name}'`);
            tagStack.pop();
          }
        }
      }
    } else if (!tag.isSelfClosing) {
      console.log(`  → Push '${tag.name}' to stack`);
      tagStack.push({ name: tag.name, position: tag.position });
    }

    console.log(`  Stack after: [${tagStack.map(t => t.name).join(', ')}]`);
  }

  console.log(`\n\nFinal stack: [${tagStack.map(t => t.name).join(', ')}]`);
  console.log(`Insertions: ${insertions.length}`);
  insertions.forEach(ins => console.log(`  - ${ins.tag} at position ${ins.position}`));

  // Continue with original logic...
  return originalMethod.call(this, xmlString);
};

const simpleTest = `<?xml version="1.0" encoding="UTF-8"?>
<features>
  <feature>Intel Core i7</feature>
  <feature>512GB SSD
</features>`;

const parser = new XMLParser();
const result = parser._fixUnclosedTags(simpleTest);

console.log('\n\n=== RESULT ===');
console.log(result.fixedXml);
