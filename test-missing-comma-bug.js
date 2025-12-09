/**
 * Test missing comma bug reported by user
 */

import { JSONParser } from './src/parsers/json-parser.js';

const input = `[
  {
    "direcry": "Users/sunchipnacho/Source/distrt/build",
    "command": "/usr/bin/c++ -I/Users/sunchipnacho/Source/distrt/. -isystem /opt/homebrew/include -std=gnu++2b -arch arm64 -Wall -Wextra -Wpedantic -Werror -ggdb3 -Xclang -fopenmp -o CMakeFiles/distrt.dir/main.cpp.o -c /Users/sunchipnacho/Source/distrt/main.cpp",

    "file": "/Users/sunchipnacho/Source/distrt/main.cpp"
    "output": "/Users/sunchipnacho/Source/distrt/build/CMakeFiles/distrt.dir/main.cpp.o"
  }
]`;

console.log('Input (note: missing comma after "file" line):');
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

// Check if the "file" property is corrupted
if (result.fixed.includes('"file:') || result.fixed.includes('file:')) {
  console.log('\n❌ BUG DETECTED: "file" property is corrupted!');
} else {
  console.log('\n✅ "file" property looks correct');
}
