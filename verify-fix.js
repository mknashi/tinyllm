#!/usr/bin/env node
/**
 * Verification test for the missing comma bug
 * Run this to verify you have the latest fixes
 */

import { JSONParser } from './src/parsers/json-parser.js';

const testInput = `[
  {
    "direcry": "Users/sunchipnacho/Source/distrt/build",
    "command": "/usr/bin/c++ -I/Users/sunchipnacho/Source/distrt/. -isystem /opt/homebrew/include -std=gnu++2b -arch arm64 -Wall -Wextra -Wpedantic -Werror -ggdb3 -Xclang -fopenmp -o CMakeFiles/distrt.dir/main.cpp.o -c /Users/sunchipnacho/Source/distrt/main.cpp",

    "file: "/Users/sunchipnacho/Source/distrt/main.cpp"
    output: "/Users/sunchipnacho/Source/distrt/build/CMakeFiles/distrt.dir/main.cpp.o"
  }
]`;

console.log('\nInput:');
console.log(testInput);

const parser = new JSONParser();
const result = parser.fix(testInput);

console.log('Testing JSON parser fix...\n');

// Check for the specific bug the user reported
const hasBug = result.fixed.includes('"file:') || result.fixed.includes('file:') || result.fixed.includes('main.cpp,",",');

if (hasBug) {
  console.log('❌ BUG DETECTED - You have the OLD buggy version!');
  console.log('\nCorrupted output:');
  console.log(result.fixed);
  console.log('\nPlease pull the latest changes from the repository.');
  process.exit(1);
} else {
  console.log('✅ CORRECT - You have the latest fixes!');
  console.log('\nFixed output:');
  console.log(result.fixed);

  // Verify it's actually valid JSON
  try {
    JSON.parse(result.fixed);
    console.log('\n✅ Output is valid JSON');
  } catch (e) {
    console.log('\n❌ Output is NOT valid JSON:', e.message);
    process.exit(1);
  }
}
