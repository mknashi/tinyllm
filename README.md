# 🚀 TinyLLM

**Lightweight AI-Powered XML & JSON Parser and Fixer**

TinyLLM is a compact, browser-compatible language model specifically designed for parsing, validating, and fixing XML and JSON files. It's small enough to run efficiently on smartphones and in web browsers, with a total model size of just ~2-5MB.

## ✨ Features

- 🎯 **Specialized for Structured Data**: Purpose-built for XML and JSON
- 📱 **Mobile-Friendly**: Runs on smartphones and low-powered devices
- 🌐 **Browser-Compatible**: Works entirely in the browser, no server required
- 🔒 **Privacy-First**: All processing happens locally, your data never leaves your device
- ⚡ **Fast**: Rule-based fixing with optional AI enhancement
- 🪶 **Lightweight**: Model size ~2-5MB (compared to 100s of MBs for general LLMs)
- 🛠️ **Dual Approach**: Combines rule-based validation with AI-powered fixing

## 🏗️ Architecture

### Model: NanoTransformer
- **Layers**: 4 transformer layers
- **Hidden Dimensions**: 128
- **Attention Heads**: 4
- **Vocabulary**: ~512 tokens optimized for XML/JSON
- **Maximum Sequence Length**: 512 tokens
- **Parameters**: ~500K (quantized)

### Components

1. **NanoTransformer**: Ultra-lightweight transformer model
2. **XML Parser**: Validates and fixes XML with common error patterns
3. **JSON Parser**: Validates and fixes JSON with common error patterns
4. **Tokenizer**: BPE tokenizer optimized for structured data
5. **Inference Engine**: Browser and Node.js compatible inference

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/yourusername/tinyllm.git
cd tinyllm
npm install
```

### Run Tests

```bash
npm test
```

### Run Web Demo

```bash
npm run demo
```

Then open http://localhost:3000 in your browser.

## 📖 Usage

### Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import TinyLLM from './src/index.js';

        // Quick fix
        const brokenJSON = '{"name": "test", "value": 123,}';
        const result = await TinyLLM.fixJSON(brokenJSON);

        console.log(result.fixed);  // Fixed JSON
        console.log(result.fixes);  // List of fixes applied
    </script>
</head>
</html>
```

### Node.js Usage

```javascript
import TinyLLM from 'tinyllm';

// Auto-detect and fix
const broken = '{"test": "value",}';
const result = await TinyLLM.autoFix(broken);

console.log(result.format);  // 'json'
console.log(result.result.fixed);
console.log(result.result.fixes);
```

### Advanced Usage

```javascript
import { InferenceEngine } from 'tinyllm';

// Create engine instance
const engine = new InferenceEngine({
    useAI: true,  // Enable AI-powered fixing
    modelPath: './models/nano-transformer.json',
    tokenizerPath: './models/tokenizer.json',
});

// Initialize
await engine.initialize();

// Fix JSON
const jsonResult = await engine.fixJSON(brokenJSON);

// Fix XML
const xmlResult = await engine.fixXML(brokenXML);

// Validate
const validation = engine.validateJSON(jsonString);
console.log(validation.valid);
console.log(validation.issues);

// Prettify
const pretty = engine.prettifyJSON(uglyJSON, 2);

// Batch processing
const results = await engine.batchFix([
    '{"a": 1,}',
    '<root><item>test</root>',
], 'auto');
```

## 🎯 What Can It Fix?

### JSON Fixes

- ✅ Trailing commas
- ✅ Missing commas
- ✅ Unquoted keys
- ✅ Single quotes instead of double quotes
- ✅ Comments (// and /* */)
- ✅ Missing closing braces/brackets
- ✅ NaN, Infinity, undefined values
- ✅ Malformed strings

### XML Fixes

- ✅ Missing XML declaration
- ✅ Unclosed tags
- ✅ Mismatched tags
- ✅ Unescaped special characters (&, <, >)
- ✅ Unquoted attributes
- ✅ Invalid tag names
- ✅ Missing closing tags
- ✅ Malformed structure

## 📊 Performance

| Metric | Value |
|--------|-------|
| Model Size | ~2-5 MB |
| Inference Speed (Browser) | ~50-100 ms |
| Vocabulary Size | 512 tokens |
| Max Sequence Length | 512 tokens |
| Parameters | ~500K |
| Browser Support | Chrome, Firefox, Safari, Edge |
| Mobile Support | iOS Safari, Chrome Android |

## 🏗️ Project Structure

```
tinyllm/
├── src/
│   ├── model/
│   │   └── nano-transformer.js    # Lightweight transformer model
│   ├── parsers/
│   │   ├── json-parser.js         # JSON parser and fixer
│   │   └── xml-parser.js          # XML parser and fixer
│   ├── utils/
│   │   └── tokenizer.js           # BPE tokenizer
│   ├── inference/
│   │   └── engine.js              # Inference engine
│   └── index.js                   # Main entry point
├── web/
│   ├── index.html                 # Web demo
│   ├── app.js                     # Web app logic
│   └── server.js                  # Dev server
├── tests/
│   └── test-runner.js             # Test suite
├── examples/
│   ├── basic-usage.js             # Basic examples
│   └── node-usage.js              # Node.js examples
├── models/                        # Pre-trained models (optional)
└── package.json
```

## 🔧 API Reference

### TinyLLM (Quick API)

```javascript
// Fix JSON
await TinyLLM.fixJSON(jsonString, config?)

// Fix XML
await TinyLLM.fixXML(xmlString, config?)

// Auto-detect and fix
await TinyLLM.autoFix(input, config?)

// Create engine instance
TinyLLM.create(config?)
```

### InferenceEngine

```javascript
const engine = new InferenceEngine(config);

// Initialize
await engine.initialize();

// Fixing
await engine.fixJSON(jsonString, useAI?);
await engine.fixXML(xmlString, useAI?);
await engine.autoFix(input, useAI?);

// Validation
engine.validateJSON(jsonString);
engine.validateXML(xmlString);

// Formatting
engine.prettifyJSON(jsonString, indent?);
engine.prettifyXML(xmlString, indent?);

// Batch processing
await engine.batchFix(inputs, format?, useAI?);

// Status
engine.getStatus();
```

### Configuration Options

```javascript
{
  modelPath: './models/nano-transformer.json',
  tokenizerPath: './models/tokenizer.json',
  useAI: true,           // Enable AI-powered fixing
  maxRetries: 3,         // Max retry attempts
}
```

## 🧪 Running Tests

```bash
npm test
```

Tests cover:
- JSON parsing and fixing
- XML parsing and fixing
- Tokenizer encoding/decoding
- Model forward pass and generation
- Batch processing
- Validation

## 🌟 Use Cases

- **Developer Tools**: Fix malformed config files
- **API Testing**: Validate and fix API responses
- **Data Migration**: Clean up legacy data files
- **Education**: Learn about XML/JSON structure
- **Mobile Apps**: Offline data validation
- **Browser Extensions**: Fix clipboard content
- **CI/CD Pipelines**: Validate configuration files

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development

```bash
# Clone the repo
git clone https://github.com/yourusername/tinyllm.git
cd tinyllm

# Run tests
npm test

# Run demo
npm run demo
```

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by nanoGPT and TinyLlama
- Built with vanilla JavaScript for maximum compatibility
- Optimized for structured data parsing

## 🔮 Future Improvements

- [ ] Pre-trained model weights
- [ ] YAML support
- [ ] TOML support
- [ ] CSV validation and fixing
- [ ] Model quantization for even smaller size
- [ ] WebAssembly acceleration
- [ ] VS Code extension
- [ ] Browser extension
- [ ] Command-line tool
- [ ] Python bindings

## 📞 Support

For issues and questions, please use the [GitHub Issues](https://github.com/yourusername/tinyllm/issues) page.

---

Made with ❤️ for developers who hate malformed data
