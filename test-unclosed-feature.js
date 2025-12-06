import { XMLParser } from './src/parsers/xml-parser.js';

const parser = new XMLParser();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
        <product id="P001">
          <name>Laptop Pro</name>
          <category>Electronics</category>
          <price currency="USD">1200.00</price>
          <description>High-performance laptop with a powerful processor and ample storage.</description>
          <features>
            <feature>Intel Core i7</feature>
            <feature>16GB RAM</feature>
            <feature>512GB SSD
          </features>
</product>`;

console.log('Input issue: Line 11 has unclosed <feature> tag\n');

const result = parser.fix(xml);
console.log('Success:', result.success);
console.log('Fixes:', result.fixes);
console.log('\nFixed XML:');
console.log(result.fixed);

if (!result.success) {
  console.log('\nErrors:', result.errors);
}
