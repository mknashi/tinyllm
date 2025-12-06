/**
 * React Integration Example for TinyLLM
 * Shows how to use TinyLLM in a React application
 */

import React, { useState, useEffect } from 'react';
import TinyLLM from '../src/index.js';

export function JsonFixer() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [fixes, setFixes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [engine, setEngine] = useState(null);

  // Initialize TinyLLM once on component mount
  useEffect(() => {
    const initEngine = async () => {
      const engineInstance = TinyLLM.create({ useAI: false });
      await engineInstance.initialize();
      setEngine(engineInstance);
    };

    initEngine();
  }, []);

  const handleFix = async () => {
    if (!engine || !input.trim()) return;

    setLoading(true);
    try {
      const result = await engine.autoFix(input);

      if (result.result.success) {
        setOutput(result.result.fixed);
        setFixes(result.result.fixes || []);
      } else {
        setOutput('Unable to fix: ' + JSON.stringify(result.result.errors));
        setFixes([]);
      }
    } catch (error) {
      setOutput('Error: ' + error.message);
      setFixes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="json-fixer">
      <h2>TinyLLM - JSON/XML Fixer</h2>

      <div className="editor-section">
        <label>Input (Broken JSON/XML):</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Paste broken JSON or XML here...'
          rows={10}
        />
      </div>

      <button
        onClick={handleFix}
        disabled={loading || !engine}
      >
        {loading ? 'Fixing...' : 'Fix'}
      </button>

      {fixes.length > 0 && (
        <div className="fixes-applied">
          <h3>Fixes Applied:</h3>
          <ul>
            {fixes.map((fix, i) => (
              <li key={i}>{fix}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="editor-section">
        <label>Output (Fixed):</label>
        <textarea
          value={output}
          readOnly
          placeholder='Fixed output will appear here...'
          rows={10}
        />
      </div>
    </div>
  );
}

// Lightweight hook for using TinyLLM in any component
export function useTinyLLM() {
  const [engine, setEngine] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const engineInstance = TinyLLM.create({ useAI: false });
      await engineInstance.initialize();

      if (mounted) {
        setEngine(engineInstance);
        setReady(true);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const fixJSON = async (jsonString) => {
    if (!engine) throw new Error('Engine not initialized');
    return await engine.fixJSON(jsonString);
  };

  const fixXML = async (xmlString) => {
    if (!engine) throw new Error('Engine not initialized');
    return await engine.fixXML(xmlString);
  };

  const validate = (input) => {
    if (!engine) throw new Error('Engine not initialized');

    const trimmed = input.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return engine.validateJSON(input);
    } else {
      return engine.validateXML(input);
    }
  };

  return {
    ready,
    fixJSON,
    fixXML,
    validate,
    engine,
  };
}

// Usage example in a component
export function QuickFixButton({ brokenData }) {
  const { ready, fixJSON, fixXML } = useTinyLLM();
  const [fixed, setFixed] = useState(null);

  const handleQuickFix = async () => {
    try {
      // Auto-detect and fix
      const result = brokenData.startsWith('{')
        ? await fixJSON(brokenData)
        : await fixXML(brokenData);

      setFixed(result.fixed);
    } catch (error) {
      console.error('Fix failed:', error);
    }
  };

  if (!ready) return <button disabled>Loading...</button>;

  return (
    <div>
      <button onClick={handleQuickFix}>Quick Fix</button>
      {fixed && (
        <pre>
          <code>{fixed}</code>
        </pre>
      )}
    </div>
  );
}

// Performance optimized: Load only what you need
export function JsonOnlyFixer() {
  const [parser, setParser] = useState(null);

  useEffect(() => {
    // Only load JSON parser (even smaller bundle!)
    import('../src/parsers/json-parser.js').then(module => {
      setParser(new module.JSONParser());
    });
  }, []);

  const fix = (jsonString) => {
    if (!parser) return null;
    return parser.fix(jsonString);
  };

  return { fix, ready: !!parser };
}
