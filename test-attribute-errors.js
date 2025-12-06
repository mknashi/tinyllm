import { XMLParser } from './src/parsers/xml-parser.js';

const parser = new XMLParser();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
        <product id="P001>
          <name>Laptop Pro</name>
          <category>Electronics</category>
          <price currency="USD">1200.00</price>
          <description>High-performance laptop with a powerful processor and ample storage.</description>
          <features>
            <feature>Intel Core i7</feature>
            <feature>16GB RAM</feature>
            <feature>512GB SSD</feature>
          </features>
</product>
  <product id="P002">
    <name>Wireless Mouse</name>
    <category>Accessories</category>
    <price currency="USD">25.99</price>
    <description>Ergonomic wireless mouse with long battery life.</description>
    <features>
      <feature>2.4GHz Wireless</feature>
      <feature>Optical Sensor</feature>
    </features>
</product>

  <product id "P003">
    <name>External Hard Drive</name>
    <category>Storage</category>
    <price currency="USD">89.50</price>
    <description>Portable external hard drive for convenient data backup.</description>
    <features>
      <feature>1TB Capacity</feature>
      <feature>USB 3.0</feature>
    </features>
</product>
</catalog>`;

console.log('Testing XML with attribute errors:\n');
console.log('Line 3: <product id="P001>  (missing closing quote)');
console.log('Line 25: <product id "P003"> (missing equals sign)\n');

const result = parser.fix(xml);
console.log('Success:', result.success);
console.log('Fixes:', result.fixes);
console.log('Errors:', result.errors);

if (result.success) {
  console.log('\n✅ Fixed XML:');
  console.log(result.fixed);
} else {
  console.log('\n❌ Failed to fix');
}
