# React Integration Guide

## 📦 Bundle Size Summary

```
Total Size (All modules):     38 KB uncompressed
                             8-12 KB gzipped
                             6-10 KB brotli

Individual modules (tree-shakeable):
- JSON Parser only:           7.1 KB (~2 KB gzipped)
- XML Parser only:           11.0 KB (~3 KB gzipped)
- Full Engine:               38 KB (~8-12 KB gzipped)
```

**Result**: TinyLLM is smaller than React itself!

---

## 🚀 Installation in React Project

### Option 1: Copy Source Files

```bash
# Copy TinyLLM source to your React project
cp -r tinyllm/src your-react-app/src/lib/tinyllm
```

### Option 2: Install as Package (Future)

```bash
npm install tinyllm
```

---

## 📝 Usage Examples

### 1. Basic Component Integration

```jsx
import React, { useState, useEffect } from 'react';
import TinyLLM from './lib/tinyllm/index.js';

function App() {
  const [engine, setEngine] = useState(null);

  useEffect(() => {
    const init = async () => {
      const e = TinyLLM.create({ useAI: false });
      await e.initialize();
      setEngine(e);
    };
    init();
  }, []);

  const handleFix = async (brokenJSON) => {
    const result = await engine.fixJSON(brokenJSON);
    return result.fixed;
  };

  return <div>Your app</div>;
}
```

### 2. Custom Hook (Recommended)

```jsx
import { useTinyLLM } from './examples/react-integration';

function MyComponent() {
  const { ready, fixJSON, validate } = useTinyLLM();

  const handleValidate = () => {
    const result = validate(inputData);
    console.log('Valid:', result.valid);
  };

  return ready ? (
    <button onClick={handleValidate}>Validate</button>
  ) : (
    <div>Loading...</div>
  );
}
```

### 3. Tree-Shaking (Smallest Bundle)

Import only what you need:

```jsx
// Only JSON parser (7.1 KB)
import { JSONParser } from './lib/tinyllm/parsers/json-parser.js';

function JsonValidator() {
  const parser = new JSONParser();
  const result = parser.fix(brokenJSON);
  return <pre>{result.fixed}</pre>;
}
```

---

## ⚡ Performance Optimization

### Code Splitting

```jsx
// Lazy load TinyLLM only when needed
const TinyLLM = React.lazy(() =>
  import('./lib/tinyllm/index.js')
);

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TinyLLM />
    </Suspense>
  );
}
```

### Dynamic Import

```jsx
function FixOnDemand() {
  const [fixed, setFixed] = useState(null);

  const handleFix = async (data) => {
    // Only load when user clicks
    const { JSONParser } = await import('./lib/tinyllm/parsers/json-parser.js');
    const parser = new JSONParser();
    const result = parser.fix(data);
    setFixed(result.fixed);
  };

  return <button onClick={handleFix}>Fix JSON</button>;
}
```

---

## 📊 Bundle Analysis

### With Webpack

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    usedExports: true, // Tree shaking
    minimize: true,
  },
};
```

Run bundle analyzer:
```bash
npm install --save-dev webpack-bundle-analyzer
npm run build -- --analyze
```

### With Vite

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'tinyllm': ['./src/lib/tinyllm/index.js']
        }
      }
    }
  }
}
```

---

## 🎯 Real-World Examples

### API Response Validator

```jsx
import { useTinyLLM } from './lib/tinyllm';

function ApiTester() {
  const { validate } = useTinyLLM();
  const [response, setResponse] = useState('');

  const testApi = async () => {
    const data = await fetch('/api/data').then(r => r.text());
    const validation = validate(data);

    if (!validation.valid) {
      console.error('API returned invalid JSON:', validation.issues);
    }
  };

  return <button onClick={testApi}>Test API</button>;
}
```

### Config Editor

```jsx
function ConfigEditor() {
  const { fixJSON, validate } = useTinyLLM();
  const [config, setConfig] = useState('');

  const handleSave = async () => {
    const validation = validate(config);

    if (!validation.valid) {
      const fixed = await fixJSON(config);
      setConfig(fixed.fixed);
      alert(`Fixed ${fixed.fixes.length} issues!`);
    }
  };

  return (
    <div>
      <textarea value={config} onChange={e => setConfig(e.target.value)} />
      <button onClick={handleSave}>Save Config</button>
    </div>
  );
}
```

---

## 📱 Mobile Considerations

TinyLLM is mobile-optimized:

- **Size**: Only 8-12 KB gzipped
- **Performance**: ~50-100ms processing time
- **Memory**: Minimal footprint (~1-2 MB runtime)
- **No Network**: Works completely offline

Perfect for:
- Progressive Web Apps (PWA)
- React Native Web
- Mobile-first applications

---

## 🔧 Build Configuration

### Create React App

No additional config needed! Just import and use.

### Next.js

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};
```

### Vite

Works out of the box with ES modules!

---

## 📈 Loading Strategy Recommendation

```jsx
// Recommended: Initialize on app mount
function App() {
  useEffect(() => {
    // Preload TinyLLM in the background
    import('./lib/tinyllm/index.js').then(module => {
      window.__tinyllm__ = module.default;
    });
  }, []);

  return <YourApp />;
}

// Then use it anywhere without re-initializing
function AnyComponent() {
  const fix = async (data) => {
    if (window.__tinyllm__) {
      return await window.__tinyllm__.fixJSON(data);
    }
  };
}
```

---

## 💡 Summary

| Metric | Value |
|--------|-------|
| **Full Bundle** | 8-12 KB gzipped |
| **JSON Only** | ~2 KB gzipped |
| **XML Only** | ~3 KB gzipped |
| **Init Time** | <50ms |
| **Fix Time** | 10-100ms |
| **Memory** | 1-2 MB |

**Perfect for**: Config editors, API validators, dev tools, form validation, data migration tools
