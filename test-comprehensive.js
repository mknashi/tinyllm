/**
 * Comprehensive test of all parser enhancements
 */

import { XMLParser } from './src/parsers/xml-parser.js';
import { JSONParser } from './src/parsers/json-parser.js';

console.log('='.repeat(70));
console.log('COMPREHENSIVE PARSER TEST');
console.log('='.repeat(70));

// Test 1: XML - Unclosed nested tag (user's original issue)
console.log('\n📋 Test 1: XML Unclosed Nested Tag');
console.log('-'.repeat(70));

const xmlTest1 = `<?xml version="1.0" encoding="UTF-8"?>
<features>
  <feature>Intel Core i7</feature>
  <feature>512GB SSD
</features>`;

const xmlParser = new XMLParser();
const xmlResult1 = xmlParser.fix(xmlTest1);

console.log('Input:');
console.log(xmlTest1);
console.log('\nFixed:');
console.log(xmlResult1.fixed);
console.log(`\nResult: ${xmlResult1.success ? '✅ SUCCESS' : '❌ FAILED'}`);
console.log(`Fixes applied: ${xmlResult1.fixes.join(', ')}`);

// Test 2: JSON - Missing opening quote (user's bug report)
console.log('\n\n📋 Test 2: JSON Missing Opening Quote');
console.log('-'.repeat(70));

const jsonTest1 = `{
  "direcry": Users/sunchipnacho/Source/distrt/build",
  "command": "/usr/bin/c++ -I/Users/sunchipnacho/Source/distrt/. -isystem /opt/homebrew/include",
  "file": "/Users/sunchipnacho/Source/distrt/main.cpp"
}`;

const jsonParser = new JSONParser();
const jsonResult1 = jsonParser.fix(jsonTest1);

console.log('Input:');
console.log(jsonTest1);
console.log('\nFixed:');
console.log(jsonResult1.fixed);
console.log(`\nResult: ${jsonResult1.success ? '✅ SUCCESS' : '❌ FAILED'}`);
console.log(`Fixes applied: ${jsonResult1.fixes.join(', ')}`);

// Test 3: XML - Complex nested structure
console.log('\n\n📋 Test 3: XML Complex Nested Structure');
console.log('-'.repeat(70));

const xmlTest2 = `<catalog>
  <product>
    <name>Laptop</name>
    <specs>
      <cpu>Intel i7
      <ram>16GB</ram>
    </specs>
  </product>
</catalog>`;

const xmlResult2 = xmlParser.fix(xmlTest2);
console.log('Input:');
console.log(xmlTest2);
console.log('\nFixed:');
console.log(xmlResult2.fixed);
console.log(`\nResult: ${xmlResult2.success ? '✅ SUCCESS' : '❌ FAILED'}`);
console.log(`Fixes applied: ${xmlResult2.fixes.join(', ')}`);

// Test 4: JSON - Multiple issues
console.log('\n\n📋 Test 4: JSON Multiple Issues');
console.log('-'.repeat(70));

const jsonTest2 = `{
  name: 'Product',
  'price': 99.99,
  features: ['fast', 'reliable',],
  path: "C:\\Users\\Documents"
}`;

const jsonResult2 = jsonParser.fix(jsonTest2);
console.log('Input:');
console.log(jsonTest2);
console.log('\nFixed:');
console.log(jsonResult2.fixed);
console.log(`\nResult: ${jsonResult2.success ? '✅ SUCCESS' : '❌ FAILED'}`);
console.log(`Fixes applied: ${jsonResult2.fixes.join(', ')}`);

// Summary
console.log('\n\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

const allPassed = xmlResult1.success && xmlResult2.success &&
                  jsonResult1.success && jsonResult2.success;

console.log(`XML Parser: ${xmlResult1.success && xmlResult2.success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
console.log(`JSON Parser: ${jsonResult1.success && jsonResult2.success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
console.log(`\nOverall: ${allPassed ? '✅ ALL ENHANCEMENTS WORKING' : '❌ ISSUES DETECTED'}`);
