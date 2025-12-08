import { JSONParser } from './src/parsers/json-parser.js';

const brokenJSON = `[
  {
    "direcry": Users/sunchipnacho/Source/distrt/build",
    "command": "/usr/bin/c++ -I/Users/sunchipnacho/Source/distrt/. -isystem /opt/homebrew/include -std=gnu++2b -arch arm64 -Wall -Wextra -Wpedantic -Werror -ggdb3 -Xclang -fopenmp -o CMakeFiles/distrt.dir/main.cpp.o -c /Users/sunchipnacho/Source/distrt/main.cpp",
    "file": "/Users/sunchipnacho/Source/distrt/main.cpp",
    "output": "/Users/sunchipnacho/Source/distrt/build/CMakeFiles/distrt.dir/main.cpp.o"
  }
]`;

console.log('Testing JSON parser with missing opening quote\n');
console.log('Input JSON:');
console.log(brokenJSON);
console.log('\n' + '='.repeat(60) + '\n');

const parser = new JSONParser();
const result = parser.fix(brokenJSON);

console.log('Result:');
console.log('Success:', result.success ? '✅' : '❌');
console.log('Fixes applied:', result.fixes);
console.log('\nFixed JSON:');
console.log(result.fixed);

if (!result.success) {
  console.log('\nErrors:');
  result.errors.forEach(err => console.log('  -', err.message));
}
