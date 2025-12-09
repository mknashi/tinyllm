/**
 * Test malformed key - missing closing quote on key name
 */

import { JSONParser } from './src/parsers/json-parser.js';

const input = `[
  {
    "direcry": "Users/sunchipnacho/Source/distrt/build",
    "command": "/usr/bin/c++ -I/Users/sunchipnacho/Source/distrt/. -isystem /opt/homebrew/include -std=gnu++2b -arch arm64 -Wall -Wextra -Wpedantic -Werror -ggdb3 -Xclang -fopenmp -o CMakeFiles/distrt.dir/main.cpp.o -c /Users/sunchipnacho/Source/distrt/main.cpp",

    "file: "/Users/sunchipnacho/Source/distrt/main.cpp",
    "output": "/Users/sunchipnacho/Source/distrt/build/CMakeFiles/distrt.dir/main.cpp.o"
  }
]`;

console.log('Input JSON (note: "file: has missing closing quote on key):');
console.log(input);
console.log('\n' + '='.repeat(70) + '\n');

const parser = new JSONParser();
const result = parser.fix(input);

console.log('Fixed output:');
console.log(result.fixed);
console.log('\n' + '='.repeat(70) + '\n');

console.log(`Success: ${result.success ? '✅' : '❌'}`);
console.log('Fixes applied:', result.fixes);

if (!result.success) {
  console.log('\nErrors:');
  result.errors.forEach(err => console.log(`  - ${err.message}`));
}

// Verify the specific issue
try {
  const parsed = JSON.parse(result.fixed);
  console.log('\n✅ Fixed JSON is valid');
  console.log('file value:', parsed[0].file);
} catch (e) {
  console.log('\n❌ Fixed JSON is still invalid:', e.message);
}
