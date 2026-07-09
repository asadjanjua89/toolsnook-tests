const fs = require('fs');
const { JSDOM } = require('jsdom');

const DIR = '/mnt/user-data/outputs/';

function loadTool(file) {
  const html = fs.readFileSync(DIR + file, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://www.toolsnook.com/tools/' + file,
  });
  const { window } = dom;
  // stub network + things jsdom lacks
  window.fetch = () => Promise.reject(new Error('network blocked in test'));
  window.alert = () => {};
  if (!window.navigator.clipboard) window.navigator.clipboard = { writeText: () => Promise.resolve() };
  return window;
}

function setVal(w, id, v) {
  const el = w.document.getElementById(id);
  if (!el) throw new Error(`input #${id} not found`);
  el.value = String(v);
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
}

const norm = (s) => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');

function runCase(tc) {
  let w;
  try {
    w = loadTool(tc.file);
  } catch (e) {
    return { name: tc.name, ok: false, why: 'page failed to load: ' + e.message };
  }
  try {
    if (tc.setup) tc.setup(w);
    for (const [id, v] of Object.entries(tc.inputs || {})) setVal(w, id, v);
    if (typeof w[tc.fn] !== 'function') {
      return { name: tc.name, ok: false, why: `window.${tc.fn} is not a function` };
    }
    w[tc.fn]();
  } catch (e) {
    return { name: tc.name, ok: false, why: 'threw: ' + e.message };
  }
  // element-level assertions
  if (tc.ids) {
    const bad = [];
    for (const [id, re_] of Object.entries(tc.ids)) {
      const el = w.document.getElementById(id);
      if (!el) { bad.push(`#${id} missing`); continue; }
      const got = norm(el.textContent || '');
      if (!re_.test(got)) bad.push(`#${id} = "${got}" !~ ${re_}`);
    }
    if (bad.length) return { name: tc.name, ok: false, why: bad.join(' ; ') };
  }
  if (!tc.expect) return { name: tc.name, ok: true };
  const text = norm(w.document.body.textContent || '');
  const missing = tc.expect.filter((x) =>
    x instanceof RegExp ? !x.test(text) : !text.includes(x)
  );
  if (missing.length) {
    // surface a window of text so failures are diagnosable
    const probe = tc.expect[0] instanceof RegExp ? '' : tc.expect[0].slice(0, 4);
    const i = probe ? text.indexOf(probe) : -1;
    const snip = i >= 0 ? text.slice(Math.max(0, i - 90), i + 90) : text.slice(0, 220);
    return {
      name: tc.name,
      ok: false,
      why: `missing ${missing.map(String).join(' | ')}`,
      snip,
    };
  }
  return { name: tc.name, ok: true };
}

module.exports = { runCase, loadTool, setVal, norm };
