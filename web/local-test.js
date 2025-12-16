import TinyLLM from '../src/index.js';

const inputArea = document.getElementById('inputArea');
const outputArea = document.getElementById('outputArea');
const formatSelect = document.getElementById('formatSelect');
const useSLMCheckbox = document.getElementById('useSLM');
const useAICheckbox = document.getElementById('useAI');
const ruleAssistCheckbox = document.getElementById('ruleAssist');
const runFixBtn = document.getElementById('runFix');
const runValidateBtn = document.getElementById('runValidate');
const runPrettifyBtn = document.getElementById('runPrettify');
const clearBtn = document.getElementById('clear');
const statusBadge = document.getElementById('statusBadge');
const modelBadge = document.getElementById('modelBadge');
const vocabBadge = document.getElementById('vocabBadge');
const latencyPill = document.getElementById('latencyPill');
const outputStatus = document.getElementById('outputStatus');
const methodPill = document.getElementById('methodPill');
const fixList = document.getElementById('fixList');
const errorList = document.getElementById('errorList');

const examples = {
  'json-broken': `{
  "user": "Ada",
  "age": 42,
  trailing: true,
  "skills": ["math", "logic",],
}`,
  'xml-broken': `<book>
  <title>On Computable Numbers<title>
  <author>Alan Turing</author>
  <chapter id=1>Intro
</book>`,
  'json-valid': `{"hello":"world","list":[1,2,3],"active":true}`,
  'xml-valid': `<root><node id="1">ok</node></root>`
};

let engine;
let engineReady = false;

initEngine();
wireExamples();
wireActions();

async function initEngine() {
  const start = performance.now();
  updateBadge(statusBadge, 'Status: initializing...', 'neutral');
  try {
    engine = TinyLLM.create({
      useAI: true,
      useSLM: true,
    });
    const status = await engine.initialize();
    engineReady = true;
    const ms = (performance.now() - start).toFixed(0);
    updateBadge(statusBadge, `Status: ready (${ms} ms)`, 'success');
    updateBadge(modelBadge, `Model: ${status.modelSize ? (status.modelSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`, 'neutral');
    updateBadge(vocabBadge, `Vocab: ${status.vocabSize}`, 'neutral');
  } catch (err) {
    console.error(err);
    updateBadge(statusBadge, 'Status: failed', 'error');
  }
}

function wireExamples() {
  document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      inputArea.value = examples[btn.dataset.example] || '';
      outputArea.value = '';
      resetStatus();
    });
  });
}

function wireActions() {
  runFixBtn.addEventListener('click', async () => {
    if (!engineReady) return;
    resetStatus();
    const input = inputArea.value.trim();
    if (!input) return;

    engine.config.useSLM = useSLMCheckbox.checked;
    const allowAI = useAICheckbox.checked;
    const allowRule = ruleAssistCheckbox.checked;
    const start = performance.now();

    let result;
    const format = formatSelect.value;
    const runSLMOnly = engine.config.useSLM && !allowRule;

    if (runSLMOnly) {
      const targetFormat = format === 'auto' ? (input.trim().startsWith('<') ? 'xml' : 'json') : format;
      result = await engine._slmFix(input, targetFormat);
    } else {
      if (format === 'json') {
        result = await engine.fixJSON(input, allowAI);
      } else if (format === 'xml') {
        result = await engine.fixXML(input, allowAI);
      } else {
        const auto = await engine.autoFix(input, allowAI);
        result = auto.result;
      }
    }

    const ms = (performance.now() - start).toFixed(0);
    latencyPill.textContent = `Latency: ${ms} ms`;

    if (result.success) {
      outputArea.value = result.fixed;
      setOutputStatus('Fixed', 'success');
      methodPill.textContent = `Method: ${result.method || (engine.config.useSLM ? 'slm' : 'rules')}`;
      fixList.textContent = (result.fixes && result.fixes.length) ? result.fixes.join(' • ') : 'None';
      errorList.textContent = 'None';
    } else {
      outputArea.value = JSON.stringify(result.errors || ['Unknown error'], null, 2);
      setOutputStatus('Failed', 'error');
      methodPill.textContent = `Method: ${result.method || 'unknown'}`;
      fixList.textContent = 'None';
      errorList.textContent = (result.errors && result.errors.length) ? result.errors.join(' • ') : 'Unknown';
    }
  });

  runValidateBtn.addEventListener('click', () => {
    if (!engineReady) return;
    resetStatus();
    const input = inputArea.value.trim();
    if (!input) return;
    const format = formatSelect.value === 'xml' || (formatSelect.value === 'auto' && input.startsWith('<')) ? 'xml' : 'json';
    const result = format === 'json' ? engine.validateJSON(input) : engine.validateXML(input);
    if (result.valid) {
      setOutputStatus('Valid', 'success');
      outputArea.value = 'Valid ✓';
      fixList.textContent = 'N/A';
      errorList.textContent = 'None';
    } else {
      setOutputStatus('Invalid', 'error');
      outputArea.value = JSON.stringify(result.issues || [], null, 2);
      errorList.textContent = `${(result.issues || []).length} issue(s)`;
    }
  });

  runPrettifyBtn.addEventListener('click', () => {
    if (!engineReady) return;
    resetStatus();
    const input = inputArea.value.trim();
    if (!input) return;
    try {
      const format = formatSelect.value === 'xml' || (formatSelect.value === 'auto' && input.startsWith('<')) ? 'xml' : 'json';
      const pretty = format === 'json' ? engine.prettifyJSON(input) : engine.prettifyXML(input);
      outputArea.value = pretty;
      setOutputStatus('Prettified', 'success');
    } catch (err) {
      setOutputStatus('Prettify error', 'error');
      outputArea.value = err.message;
    }
  });

  clearBtn.addEventListener('click', resetAll);
}

function updateBadge(el, text, kind = 'neutral') {
  el.textContent = text;
  el.style.color = kind === 'success' ? '#22c55e' : kind === 'error' ? '#f87171' : '#94a3b8';
}

function setOutputStatus(text, kind) {
  outputStatus.textContent = text;
  outputStatus.classList.remove('success', 'error', 'neutral');
  if (kind) {
    outputStatus.classList.add(kind);
  }
}

function resetStatus() {
  setOutputStatus('Awaiting input', 'neutral');
  methodPill.textContent = 'Method: -';
  fixList.textContent = '-';
  errorList.textContent = '-';
  latencyPill.textContent = 'Latency: -';
}

function resetAll() {
  inputArea.value = '';
  outputArea.value = '';
  resetStatus();
}
