/**
 * Comprehensive gap analysis for XML parser
 * Tests edge cases and scenarios that might not be covered
 */

import { XMLParser } from './src/parsers/xml-parser.js';

const parser = new XMLParser();
const testCases = [
  {
    name: 'Missing closing tag',
    input: '<root><item>value</root>',
    shouldFix: true,
    description: 'Should close unclosed <item> tag'
  },
  {
    name: 'Mismatched tag names',
    input: '<root><item>value</items></root>',
    shouldFix: true,
    description: 'Should fix tag name mismatch'
  },
  {
    name: 'Unescaped ampersand in text',
    input: '<root>5 &amp; 6</root>',
    shouldFix: true,
    description: 'Already escaped - should pass'
  },
  {
    name: 'Unescaped ampersand without entity',
    input: '<root>5 & 6</root>',
    shouldFix: true,
    description: 'Should escape bare ampersand'
  },
  {
    name: 'Unescaped less-than in text',
    input: '<root>5 < 6</root>',
    shouldFix: true,
    description: 'Should escape less-than sign'
  },
  {
    name: 'Unescaped greater-than in text',
    input: '<root>5 > 6</root>',
    shouldFix: true,
    description: 'Should escape greater-than sign'
  },
  {
    name: 'Missing XML declaration',
    input: '<root>value</root>',
    shouldFix: true,
    description: 'Should add XML declaration'
  },
  {
    name: 'Unquoted attribute',
    input: '<root attr=value>content</root>',
    shouldFix: true,
    description: 'Should add quotes to attribute'
  },
  {
    name: 'Invalid tag name (starts with number)',
    input: '<1root>value</1root>',
    shouldFix: true,
    description: 'Should fix invalid tag name'
  },
  {
    name: 'Self-closing tag',
    input: '<root><item/></root>',
    shouldFix: true,
    description: 'Valid - should pass'
  },
  {
    name: 'CDATA section',
    input: '<root><![CDATA[<data>]]></root>',
    shouldFix: true,
    description: 'Valid CDATA - should pass'
  },
  {
    name: 'XML comment',
    input: '<root><!-- comment --><item>value</item></root>',
    shouldFix: true,
    description: 'Valid comment - should pass'
  },
  {
    name: 'Nested tags',
    input: '<root><parent><child>value</child></parent></root>',
    shouldFix: true,
    description: 'Valid nesting - should pass'
  },
  {
    name: 'Empty tag',
    input: '<root><empty></empty></root>',
    shouldFix: true,
    description: 'Valid empty tag - should pass'
  },
  {
    name: 'Multiple root elements',
    input: '<root1>value1</root1><root2>value2</root2>',
    shouldFix: false,
    description: 'Multiple roots invalid'
  },
  {
    name: 'Text before root element',
    input: 'text before<root>value</root>',
    shouldFix: false,
    description: 'Text outside root invalid'
  },
  {
    name: 'Duplicate attributes',
    input: '<root attr="1" attr="2">value</root>',
    shouldFix: true,
    description: 'Last attribute wins'
  },
  {
    name: 'Attribute with special chars',
    input: '<root attr="value&test">content</root>',
    shouldFix: true,
    description: 'Should pass or escape in attribute'
  },
  {
    name: 'Missing opening tag',
    input: 'value</root>',
    shouldFix: false,
    description: 'Cannot fix missing opening'
  },
  {
    name: 'Extra closing tag',
    input: '<root>value</root></extra>',
    shouldFix: true,
    description: 'Should remove unmatched closing tag'
  },
  {
    name: 'Tag with space in name',
    input: '<root tag>value</root tag>',
    shouldFix: false,
    description: 'Spaces in tag names invalid'
  },
  {
    name: 'Mixed quotes in attributes',
    input: '<root attr1="value1" attr2=\'value2\'>content</root>',
    shouldFix: true,
    description: 'Both quote types valid'
  },
  {
    name: 'Processing instruction',
    input: '<?xml-stylesheet type="text/xsl" href="style.xsl"?><root>value</root>',
    shouldFix: true,
    description: 'Valid processing instruction'
  },
  {
    name: 'Namespace with colon',
    input: '<ns:root xmlns:ns="http://example.com"><ns:item>value</ns:item></ns:root>',
    shouldFix: true,
    description: 'Valid namespace usage'
  },
  {
    name: 'Unclosed attribute quote',
    input: '<root attr="value>content</root>',
    shouldFix: false,
    description: 'Malformed attribute'
  },
  {
    name: 'Empty attribute value',
    input: '<root attr="">content</root>',
    shouldFix: true,
    description: 'Valid empty attribute'
  },
  {
    name: 'Multiple unclosed tags',
    input: '<root><item1><item2>value',
    shouldFix: true,
    description: 'Should close all unclosed tags'
  },
  {
    name: 'Tag with hyphen and underscore',
    input: '<root-tag_name>value</root-tag_name>',
    shouldFix: true,
    description: 'Valid tag name characters'
  },
  {
    name: 'Whitespace in tags',
    input: '<root>  \n  value  \n  </root>',
    shouldFix: true,
    description: 'Valid whitespace handling'
  },
  {
    name: 'Attribute without equals',
    input: '<root attr "value">content</root>',
    shouldFix: false,
    description: 'Missing equals sign'
  }
];

console.log('📊 XML Parser Gap Analysis\n');
console.log('='.repeat(80));

let covered = 0;
let gaps = 0;
const gapsList = [];

testCases.forEach((test, i) => {
  const result = parser.fix(test.input);
  const success = result.success;
  const expected = test.shouldFix;

  const status = success === expected ? '✅' : '⚠️ GAP';

  if (success !== expected) {
    gaps++;
    gapsList.push({
      name: test.name,
      input: test.input,
      expected: expected ? 'Should fix' : 'Should fail',
      actual: success ? 'Fixed' : 'Failed',
      description: test.description
    });
  } else {
    covered++;
  }

  console.log(`\n${i + 1}. ${test.name}`);
  console.log(`   ${status} ${success ? 'FIXED' : 'FAILED'} (expected: ${expected ? 'FIX' : 'FAIL'})`);
  if (success) {
    console.log(`   Fixes: ${result.fixes.join(', ')}`);
  } else {
    console.log(`   Error: ${result.errors[0]?.message || 'Parse failed'}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📈 Coverage: ${covered}/${testCases.length} scenarios handled correctly`);
console.log(`⚠️  Gaps found: ${gaps}`);

if (gapsList.length > 0) {
  console.log('\n🔍 GAPS REQUIRING ATTENTION:\n');
  gapsList.forEach((gap, i) => {
    console.log(`${i + 1}. ${gap.name}`);
    console.log(`   Expected: ${gap.expected}`);
    console.log(`   Actual: ${gap.actual}`);
    console.log(`   Description: ${gap.description}`);
    console.log(`   Input: ${gap.input}`);
    console.log('');
  });
}
