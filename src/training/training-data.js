/**
 * Training Data Generator
 * Generates pairs of broken and fixed XML/JSON for model training
 */

export class TrainingDataGenerator {
  constructor() {
    this.xmlExamples = [];
    this.jsonExamples = [];
  }

  /**
   * Generate comprehensive XML training dataset
   */
  generateXMLTrainingData() {
    const examples = [];

    // 1. Unclosed tags
    examples.push({
      broken: '<root><item>value</root>',
      fixed: '<root><item>value</item></root>',
      description: 'Unclosed tag'
    });

    examples.push({
      broken: '<catalog><product><name>Test</product></catalog>',
      fixed: '<catalog><product><name>Test</name></product></catalog>',
      description: 'Unclosed nested tag'
    });

    // 2. Unclosed nested tags (complex scenario)
    examples.push({
      broken: `<features>
  <feature>Intel Core i7</feature>
  <feature>512GB SSD
</features>`,
      fixed: `<features>
  <feature>Intel Core i7</feature>
  <feature>512GB SSD</feature>
</features>`,
      description: 'Unclosed tag before parent closes'
    });

    examples.push({
      broken: `<items>
  <item>
    <name>Product
    <price>99</price>
  </item>
</items>`,
      fixed: `<items>
  <item>
    <name>Product</name>
    <price>99</price>
  </item>
</items>`,
      description: 'Unclosed tag with sibling'
    });

    // 3. Mismatched closing tags
    examples.push({
      broken: '<product>value</product1>',
      fixed: '<product>value</product>',
      description: 'Mismatched closing tag name'
    });

    examples.push({
      broken: '<item>data</itme>',
      fixed: '<item>data</item>',
      description: 'Typo in closing tag'
    });

    // 4. Missing XML declaration
    examples.push({
      broken: '<root>data</root>',
      fixed: '<?xml version="1.0" encoding="UTF-8"?>\n<root>data</root>',
      description: 'Missing XML declaration'
    });

    // 5. Unquoted attributes
    examples.push({
      broken: '<item id=123>value</item>',
      fixed: '<item id="123">value</item>',
      description: 'Unquoted attribute'
    });

    examples.push({
      broken: '<product name=test price=99>',
      fixed: '<product name="test" price="99">',
      description: 'Multiple unquoted attributes'
    });

    // 6. Unclosed attribute quotes
    examples.push({
      broken: '<item id="123>value</item>',
      fixed: '<item id="123">value</item>',
      description: 'Unclosed attribute quote'
    });

    // 7. Missing equals in attributes
    examples.push({
      broken: '<item id "123">value</item>',
      fixed: '<item id="123">value</item>',
      description: 'Missing equals sign'
    });

    // 8. Unescaped special characters
    examples.push({
      broken: '<text>5 < 10 & 20 > 15</text>',
      fixed: '<text>5 &lt; 10 &amp; 20 &gt; 15</text>',
      description: 'Unescaped special characters'
    });

    // 9. Invalid tag names
    examples.push({
      broken: '<1root>value</1root>',
      fixed: '<tag1root>value</tag1root>',
      description: 'Tag starting with number'
    });

    // 10. Mixed errors
    examples.push({
      broken: '<catalog><product id=P001><name>Laptop<price>1200</price></product></catalog>',
      fixed: '<?xml version="1.0" encoding="UTF-8"?>\n<catalog><product id="P001"><name>Laptop</name><price>1200</price></product></catalog>',
      description: 'Multiple errors combined'
    });

    // 11. Complex nested structure with errors
    examples.push({
      broken: `<library>
  <books>
    <book>
      <title>The Great Gatsby
      <author>F. Scott Fitzgerald</author>
    </book>
  </books>
</library>`,
      fixed: `<?xml version="1.0" encoding="UTF-8"?>
<library>
  <books>
    <book>
      <title>The Great Gatsby</title>
      <author>F. Scott Fitzgerald</author>
    </book>
  </books>
</library>`,
      description: 'Complex nested structure'
    });

    // 12. Self-closing tag errors
    examples.push({
      broken: '<item />value<',
      fixed: '<item>value</item>',
      description: 'Broken self-closing tag'
    });

    // 13. Multiple root elements
    examples.push({
      broken: '<item>1</item><item>2</item>',
      fixed: '<?xml version="1.0" encoding="UTF-8"?>\n<root><item>1</item><item>2</item></root>',
      description: 'Multiple root elements'
    });

    return examples;
  }

  /**
   * Generate comprehensive JSON training dataset
   */
  generateJSONTrainingData() {
    const examples = [];

    // 1. Trailing commas
    examples.push({
      broken: '{"name": "John", "age": 30,}',
      fixed: '{"name": "John", "age": 30}',
      description: 'Trailing comma in object'
    });

    examples.push({
      broken: '{"items": [1, 2, 3,]}',
      fixed: '{"items": [1, 2, 3]}',
      description: 'Trailing comma in array'
    });

    // 2. Single quotes
    examples.push({
      broken: "{'name': 'John'}",
      fixed: '{"name": "John"}',
      description: 'Single quotes instead of double'
    });

    // 3. Unquoted keys
    examples.push({
      broken: '{name: "John", age: 30}',
      fixed: '{"name": "John", "age": 30}',
      description: 'Unquoted object keys'
    });

    // 4. Missing commas
    examples.push({
      broken: '{"name": "John" "age": 30}',
      fixed: '{"name": "John", "age": 30}',
      description: 'Missing comma between properties'
    });

    examples.push({
      broken: '{"users": [{"id": 1} {"id": 2}]}',
      fixed: '{"users": [{"id": 1}, {"id": 2}]}',
      description: 'Missing comma in array'
    });

    // 5. Unclosed strings
    examples.push({
      broken: '{"name": "John}',
      fixed: '{"name": "John"}',
      description: 'Unclosed string value'
    });

    examples.push({
      broken: '{"name": "John", "email": "test@example.com}',
      fixed: '{"name": "John", "email": "test@example.com"}',
      description: 'Unclosed string with multiple properties'
    });

    // 6. Missing closing braces
    examples.push({
      broken: '{"name": "John", "age": 30',
      fixed: '{"name": "John", "age": 30}',
      description: 'Missing closing brace'
    });

    examples.push({
      broken: '{"users": [{"id": 1',
      fixed: '{"users": [{"id": 1}]}',
      description: 'Missing multiple closing brackets'
    });

    // 7. Missing opening brace
    examples.push({
      broken: '"name": "John", "age": 30}',
      fixed: '{"name": "John", "age": 30}',
      description: 'Missing opening brace'
    });

    // 8. Comments
    examples.push({
      broken: '{"name": "John", // comment\n"age": 30}',
      fixed: '{"name": "John", "age": 30}',
      description: 'Single-line comment'
    });

    examples.push({
      broken: '{"name": "John", /* comment */ "age": 30}',
      fixed: '{"name": "John", "age": 30}',
      description: 'Multi-line comment'
    });

    // 9. Numbers with leading zeros
    examples.push({
      broken: '{"value": 01234}',
      fixed: '{"value": 1234}',
      description: 'Number with leading zero'
    });

    // 10. Unescaped backslashes
    examples.push({
      broken: '{"path": "C:\\Users\\test"}',
      fixed: '{"path": "C:\\\\Users\\\\test"}',
      description: 'Unescaped backslashes'
    });

    // 11. Control characters
    examples.push({
      broken: '{"text": "Line 1\nLine 2"}',
      fixed: '{"text": "Line 1\\nLine 2"}',
      description: 'Literal newline character'
    });

    // 12. NaN, Infinity, undefined
    examples.push({
      broken: '{"value": NaN}',
      fixed: '{"value": null}',
      description: 'NaN value'
    });

    examples.push({
      broken: '{"value": Infinity}',
      fixed: '{"value": null}',
      description: 'Infinity value'
    });

    examples.push({
      broken: '{"value": undefined}',
      fixed: '{"value": null}',
      description: 'undefined value'
    });

    // 13. Complex nested errors
    examples.push({
      broken: `{
  "users": [
    {
      "id": 1,
      "name": "John Doe"
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "active": true
    }
  ]
}`,
      fixed: `{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "active": true
    }
  ]
}`,
      description: 'Missing comma in nested structure'
    });

    // 14. Mixed errors
    examples.push({
      broken: "{name: 'John', age: 30, 'city': \"New York\",}",
      fixed: '{"name": "John", "age": 30, "city": "New York"}',
      description: 'Multiple error types'
    });

    // 15. URL in string (should preserve //)
    examples.push({
      broken: '{"url": "https://example.com"}',
      fixed: '{"url": "https://example.com"}',
      description: 'URL with // should be preserved'
    });

    return examples;
  }

  /**
   * Create formatted prompt-completion pairs for training
   */
  createTrainingPairs(format = 'xml') {
    const examples = format === 'xml'
      ? this.generateXMLTrainingData()
      : this.generateJSONTrainingData();

    const pairs = examples.map(ex => ({
      prompt: `Fix this broken ${format.toUpperCase()}:\n${ex.broken}\n\nFixed ${format.toUpperCase()}:`,
      completion: ex.fixed,
      description: ex.description
    }));

    return pairs;
  }

  /**
   * Generate augmented training data with variations
   */
  generateAugmentedData() {
    const xmlPairs = this.createTrainingPairs('xml');
    const jsonPairs = this.createTrainingPairs('json');

    // Add variations with different whitespace
    const augmented = [];

    [...xmlPairs, ...jsonPairs].forEach(pair => {
      // Original
      augmented.push(pair);

      // Variation with extra whitespace
      augmented.push({
        ...pair,
        prompt: pair.prompt.replace(/\n/g, '\n  '),
        description: pair.description + ' (whitespace variation)'
      });

      // Variation with minimal whitespace
      augmented.push({
        ...pair,
        prompt: pair.prompt.replace(/\s+/g, ' '),
        completion: pair.completion.replace(/\s+/g, ' '),
        description: pair.description + ' (compact variation)'
      });
    });

    return augmented;
  }

  /**
   * Get all training examples
   */
  getAllExamples() {
    return {
      xml: this.generateXMLTrainingData(),
      json: this.generateJSONTrainingData(),
      pairs: {
        xml: this.createTrainingPairs('xml'),
        json: this.createTrainingPairs('json')
      },
      augmented: this.generateAugmentedData()
    };
  }

  /**
   * Save training data to file
   */
  toJSON() {
    return {
      version: '1.0.0',
      created: new Date().toISOString(),
      examples: this.getAllExamples()
    };
  }
}
