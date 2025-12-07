# Local LLM Server Options for AI Mode

If you want to use AI mode with a faster backend, here are the best local LLM server options to integrate with TinyLLM:

## 1. Ollama ⭐ (Recommended for Beginners)

**Best for**: Ease of use, macOS/Linux/Windows

### Features
- Simple installation and setup
- Automatic model management
- Built-in API server
- Supports many popular models (Llama 3, Mistral, CodeLlama, etc.)

### Installation
```bash
# macOS/Linux
curl https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

### Usage
```bash
# Pull a model
ollama pull llama3.2:1b  # Small, fast model

# Start server (runs on http://localhost:11434)
ollama serve

# Test
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "Fix this XML: <root><item>test</root>"
}'
```

### Integration with TinyLLM
```javascript
async fixWithAI(xmlString) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2:1b',
      prompt: `Fix this broken XML:\n${xmlString}\n\nFixed XML:`,
      stream: false
    })
  });

  const data = await response.json();
  return this._extractXML(data.response);
}
```

**Pros**: Dead simple, great UX, actively maintained
**Cons**: Slightly higher memory usage than llama.cpp

---

## 2. llama.cpp ⭐ (Recommended for Performance)

**Best for**: Maximum performance, minimal RAM, control

### Features
- Fastest CPU inference
- Extremely memory efficient
- Supports quantized models (2-8 bit)
- Built-in HTTP server

### Installation
```bash
# Clone and build
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Or use pre-built binaries
# Download from https://github.com/ggerganov/llama.cpp/releases
```

### Usage
```bash
# Download a GGUF model (quantized format)
# From https://huggingface.co/models?search=gguf

# Start server
./llama-server \
  -m models/llama-3.2-1b-instruct.Q4_K_M.gguf \
  -c 2048 \
  --port 8080

# Test
curl http://localhost:8080/completion -d '{
  "prompt": "Fix this XML: <root><item>test</root>",
  "n_predict": 128
}'
```

### Integration with TinyLLM
```javascript
async fixWithAI(xmlString) {
  const response = await fetch('http://localhost:8080/completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Fix this broken XML:\n${xmlString}\n\nFixed XML:`,
      n_predict: 200,
      temperature: 0.7,
      stop: ['</catalog>', '</root>']
    })
  });

  const data = await response.json();
  return this._extractXML(data.content);
}
```

**Pros**: Fastest, lowest memory, highly optimized
**Cons**: More manual setup, need to find GGUF models

---

## 3. LM Studio

**Best for**: GUI lovers, non-technical users

### Features
- Beautiful GUI for model management
- One-click model downloads
- Built-in API server (OpenAI compatible)
- Cross-platform (Mac, Windows, Linux)

### Installation
- Download from https://lmstudio.ai/
- Install and launch
- Download models via GUI (search for "llama", "mistral", etc.)
- Start local server from GUI (port 1234 by default)

### Integration with TinyLLM
```javascript
async fixWithAI(xmlString) {
  const response = await fetch('http://localhost:1234/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "local-model",
      messages: [{
        role: "user",
        content: `Fix this broken XML:\n${xmlString}`
      }],
      temperature: 0.7,
      max_tokens: 200
    })
  });

  const data = await response.json();
  return this._extractXML(data.choices[0].message.content);
}
```

**Pros**: Easiest GUI, OpenAI-compatible API
**Cons**: Uses more system resources

---

## 4. LocalAI

**Best for**: Docker users, multiple model support

### Features
- Docker-based deployment
- OpenAI API compatible
- Supports multiple model types
- GPU acceleration support

### Installation
```bash
# Using Docker
docker run -p 8080:8080 -v $PWD/models:/models \
  localai/localai:latest --models-path /models

# Or with docker-compose
curl -O https://raw.githubusercontent.com/mudler/LocalAI/master/docker-compose.yaml
docker-compose up
```

### Usage
```bash
# OpenAI-compatible endpoint
curl http://localhost:8080/v1/chat/completions -d '{
  "model": "gpt-3.5-turbo",
  "messages": [{"role": "user", "content": "Fix this XML"}]
}'
```

**Pros**: Containerized, OpenAI compatible, multi-model
**Cons**: Docker required, larger footprint

---

## 5. vLLM

**Best for**: Production, high throughput, GPU acceleration

### Features
- Extremely fast inference with PagedAttention
- Best for GPU acceleration
- Production-ready serving
- High throughput batching

### Installation
```bash
pip install vllm

# Start server
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3.2-1B-Instruct \
  --port 8000
```

**Pros**: Fastest for GPU, production-grade
**Cons**: Requires GPU, more complex setup

---

## 6. text-generation-webui (oobabooga)

**Best for**: Experimentation, many model types

### Features
- Web UI for chat and generation
- API mode available
- Supports many model formats
- Extensions and plugins

### Installation
```bash
git clone https://github.com/oobabooga/text-generation-webui
cd text-generation-webui
./start_linux.sh  # or start_windows.bat, start_macos.sh
```

**Pros**: Feature-rich, extensible, good for testing
**Cons**: Heavier, more complex

---

## Recommended Model Sizes

For XML/JSON fixing, you don't need large models:

| Model Size | RAM Required | Speed | Quality |
|-----------|--------------|-------|---------|
| 1B params | ~2 GB | Very Fast | Good |
| 3B params | ~4 GB | Fast | Very Good |
| 7B params | ~8 GB | Medium | Excellent |
| 13B+ params | ~16 GB+ | Slow | Overkill |

**Recommended**: Start with a 1B-3B model (e.g., Llama 3.2 1B, Phi-3 Mini)

---

## Integration Example

Here's a complete integration replacing the slow JavaScript transformer:

```javascript
// src/parsers/xml-parser.js

async fixWithAI(xmlString, options = {}) {
  const serverUrl = options.serverUrl || 'http://localhost:11434';
  const model = options.model || 'llama3.2:1b';

  // First try rule-based
  const ruleFix = this.fix(xmlString);
  if (ruleFix.success) {
    return ruleFix;
  }

  try {
    // Call local LLM server
    const response = await fetch(`${serverUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: `Fix this broken XML and return ONLY the corrected XML:\n\n${xmlString}\n\nFixed XML:`,
        stream: false,
        options: {
          temperature: 0.3,  // Low temperature for consistent fixes
          num_predict: 500
        }
      })
    });

    const data = await response.json();

    // Extract XML from response
    const xmlMatch = data.response.match(/<\?xml[\s\S]*|<[a-zA-Z][\s\S]*/);
    if (xmlMatch) {
      const aiFixed = xmlMatch[0];
      const parseResult = this.parse(aiFixed);

      if (parseResult.success) {
        return {
          success: true,
          fixed: aiFixed,
          original: xmlString,
          fixes: ['AI-powered fix applied via local LLM'],
          data: parseResult.data,
          errors: [],
          method: 'ai'
        };
      }
    }
  } catch (error) {
    console.error('Local LLM failed:', error);
  }

  // Fallback to best effort
  return {
    ...ruleFix,
    method: 'rules'
  };
}
```

---

## Performance Comparison

| Solution | Startup | Inference (1B model) | Memory |
|----------|---------|---------------------|--------|
| Pure JS Transformer | Instant | Minutes ❌ | ~30 MB |
| Ollama | ~2s | ~50-200ms ✅ | ~2 GB |
| llama.cpp | ~1s | ~30-150ms ⭐ | ~1.5 GB |
| LM Studio | ~3s | ~50-200ms ✅ | ~2.5 GB |

---

## Quick Start Recommendation

**For fastest results right now:**

1. Install Ollama: `curl https://ollama.ai/install.sh | sh`
2. Pull a small model: `ollama pull llama3.2:1b`
3. Start server: `ollama serve`
4. Update TinyLLM to use the local server (code above)

Your AI mode will go from **minutes to milliseconds**! 🚀

---

## Next Steps

See `AI-MODE-STATUS.md` for integration instructions and the current state of AI mode in TinyLLM.
