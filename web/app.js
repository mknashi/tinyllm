/**
 * TinyLLM Web Application
 */

import TinyLLM from '../src/index.js';

// Initialize engine
let engine = null;
let engineReady = false;

// DOM elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const formatSelect = document.getElementById('formatSelect');
const useSLMCheckbox = document.getElementById('useSLM');
const useRulesCheckbox = document.getElementById('useRules');
const fixBtn = document.getElementById('fixBtn');
const validateBtn = document.getElementById('validateBtn');
const prettifyBtn = document.getElementById('prettifyBtn');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const inputStatus = document.getElementById('inputStatus');
const outputStatus = document.getElementById('outputStatus');
const fixesPanel = document.getElementById('fixesPanel');
const fixesList = document.getElementById('fixesList');

// Status elements
const engineStatus = document.getElementById('engineStatus');
const aiStatus = document.getElementById('aiStatus');
const modelSize = document.getElementById('modelSize');
const vocabSize = document.getElementById('vocabSize');

// Examples
const examples = {
  'json-broken': `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "hobbies": ['reading', 'coding', 'gaming'],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zip": 10001,
  },
  active: true,
}`,

  'xml-broken': `<?xml version="1.0"?>
<person>
  <name>John Doe</name>
  <age>30
  <email>john@example.com</email>
  <address>
    <street>123 Main St</street>
    <city>New York</city>
  </person>
</address>`,

  'json-valid': `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "hobbies": ["reading", "coding", "gaming"],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zip": 10001
  },
  "active": true
}`,

  'xml-valid': `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
  <age>30</age>
  <email>john@example.com</email>
  <address>
    <street>123 Main St</street>
    <city>New York</city>
    <zip>10001</zip>
  </address>
</person>`
};

// Initialize the engine
async function initEngine() {
  try {
    engineStatus.textContent = 'Initializing...';
    aiStatus.textContent = 'Loading...';

    engine = TinyLLM.create({
      useAI: useSLMCheckbox.checked, // Only load model when SLM is on
      useSLM: useSLMCheckbox.checked,
      slmMaxTokens: 64,
      maxRetries: 1,
      topP: 0.85,
      temperature: 0.7,
    });

    const status = await engine.initialize();

    engineReady = true;
    engineStatus.textContent = 'Ready ✓';
    engineStatus.className = 'status success';

    if (status.aiEnabled) {
      aiStatus.textContent = 'Enabled ✓';
      aiStatus.className = 'status success';
    } else {
      aiStatus.textContent = 'Rule-based mode';
      aiStatus.className = 'status warning';
    }

    modelSize.textContent = status.modelSize > 0
      ? `${(status.modelSize / 1024 / 1024).toFixed(2)} MB`
      : 'N/A';

    vocabSize.textContent = `${status.vocabSize} tokens`;

    enableButtons();
  } catch (error) {
    console.error('Failed to initialize engine:', error);
    engineStatus.textContent = 'Error ✗';
    engineStatus.className = 'status error';
    aiStatus.textContent = 'Failed';
    aiStatus.className = 'status error';
  }
}

// Enable buttons
function enableButtons() {
  fixBtn.disabled = false;
  validateBtn.disabled = false;
  prettifyBtn.disabled = false;
}

// Show loading
function showLoading() {
  loading.classList.add('active');
  fixBtn.disabled = true;
  validateBtn.disabled = true;
  prettifyBtn.disabled = true;
}

// Hide loading
function hideLoading() {
  loading.classList.remove('active');
  enableButtons();
}

// Update status
function updateStatus(element, text, type = '') {
  element.textContent = text;
  element.className = `status ${type}`;
}

// Fix button handler
fixBtn.addEventListener('click', async () => {
  if (!engineReady) return;

  const input = inputText.value.trim();
  if (!input) {
    alert('Please enter some JSON or XML to fix');
    return;
  }

  showLoading();
  fixesPanel.style.display = 'none';

  try {
    const format = formatSelect.value;
    engine.config.useSLM = useSLMCheckbox.checked;

    // SLM path requires the model to be loaded
    engine.config.useAI = useSLMCheckbox.checked;
    engine.config.slmMaxTokens = 64;
    engine.config.maxRetries = 1;
    engine.config.topP = 0.85;
    engine.config.temperature = 0.7;
    const allowRules = useRulesCheckbox.checked;
    const needsModel = engine.config.useAI || engine.config.useSLM;

    if (needsModel && (!engine.model || !engine.tokenizer)) {
      await engine.initialize();
    }

    let result;
    const runSLMOnly = engine.config.useSLM && !allowRules;

    if (runSLMOnly) {
      const targetFormat = format === 'auto'
        ? (input.trim().startsWith('<') ? 'xml' : 'json')
        : format;
      result = await engine._slmFix(input, targetFormat);
    } else {
      if (format === 'auto') {
        const autoResult = await engine.autoFix(input, useAI);
        result = autoResult.result;
      } else if (format === 'json') {
        result = await engine.fixJSON(input, useAI);
      } else {
        result = await engine.fixXML(input, useAI);
      }
    }

    if (result.success) {
      outputText.value = result.fixed;
      updateStatus(outputStatus, 'Fixed ✓', 'success');
      updateStatus(inputStatus, 'Contains errors', 'error');

      if (result.fixes && result.fixes.length > 0) {
        fixesPanel.style.display = 'block';
        fixesList.innerHTML = result.fixes.map(fix => `<li>${fix}</li>`).join('');
      }
    } else {
      outputText.value = 'Unable to fix. See errors below:\n\n' +
        JSON.stringify(result.errors, null, 2);
      updateStatus(outputStatus, 'Unable to fix ✗', 'error');
    }
  } catch (error) {
    console.error('Fix error:', error);
    outputText.value = `Error: ${error.message}`;
    updateStatus(outputStatus, 'Error ✗', 'error');
  } finally {
    hideLoading();
  }
});

// Validate button handler
validateBtn.addEventListener('click', async () => {
  if (!engineReady) return;

  const input = inputText.value.trim();
  if (!input) {
    alert('Please enter some JSON or XML to validate');
    return;
  }

  showLoading();
  fixesPanel.style.display = 'none';

  try {
    const format = formatSelect.value;
    let result;

    if (format === 'json' || (format === 'auto' && input.trim().startsWith('{'))) {
      result = engine.validateJSON(input);
    } else {
      result = engine.validateXML(input);
    }

    if (result.valid) {
      outputText.value = 'Valid! ✓\n\n' + input;
      updateStatus(inputStatus, 'Valid ✓', 'success');
      updateStatus(outputStatus, 'Valid ✓', 'success');
    } else {
      outputText.value = 'Invalid. Issues found:\n\n' +
        JSON.stringify(result.issues, null, 2);
      updateStatus(inputStatus, `${result.issues.length} issue(s)`, 'error');
      updateStatus(outputStatus, 'Validation failed', 'error');
    }
  } catch (error) {
    console.error('Validation error:', error);
    outputText.value = `Error: ${error.message}`;
    updateStatus(outputStatus, 'Error ✗', 'error');
  } finally {
    hideLoading();
  }
});

// Prettify button handler
prettifyBtn.addEventListener('click', async () => {
  if (!engineReady) return;

  const input = inputText.value.trim();
  if (!input) {
    alert('Please enter some JSON or XML to prettify');
    return;
  }

  showLoading();

  try {
    const format = formatSelect.value;
    let prettified;

    if (format === 'json' || (format === 'auto' && input.trim().startsWith('{'))) {
      prettified = engine.prettifyJSON(input);
    } else {
      prettified = engine.prettifyXML(input);
    }

    outputText.value = prettified;
    updateStatus(outputStatus, 'Prettified ✓', 'success');
  } catch (error) {
    console.error('Prettify error:', error);
    outputText.value = `Error: ${error.message}`;
    updateStatus(outputStatus, 'Error ✗', 'error');
  } finally {
    hideLoading();
  }
});

// Clear button handler
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  outputText.value = '';
  updateStatus(inputStatus, '');
  updateStatus(outputStatus, '');
  fixesPanel.style.display = 'none';
});

// Example buttons
document.querySelectorAll('.example-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const example = btn.dataset.example;
    inputText.value = examples[example];
    outputText.value = '';
    updateStatus(inputStatus, '');
    updateStatus(outputStatus, '');
    fixesPanel.style.display = 'none';
  });
});

// Initialize on load
initEngine();
