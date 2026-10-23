/// <reference lib="webworker" />
import harness from './harness.py?raw';
import hidden from '../data/hidden-tests.json';
import type { Problem, TestCase } from './types';
const workerScope = self as unknown as DedicatedWorkerGlobalScope;
// The runtime is copied locally by postinstall, then served as static assets.
const base = new URL(`${import.meta.env.BASE_URL}python/`, self.location.origin).href;
let py: any;
async function init() {
  const { loadPyodide } = await import(/* @vite-ignore */ `${base}pyodide.mjs`);
  py = await loadPyodide({ indexURL: base });
  py.runPython(harness);
  workerScope.postMessage({ type: 'ready' });
}
const boot = init().catch((e) => { workerScope.postMessage({ type: 'init-error', error: `Python failed to load: ${String(e)}` }); throw e; });
workerScope.onmessage = async (event: MessageEvent<{id: number; problem: Problem; code: string; mode: string; custom?: TestCase[]}>) => {
  const { id, problem, code, mode, custom } = event.data;
  try {
    await boot;
    const examples = (custom ?? problem.examples).map(c => ({ ...c, hidden: false }));
    const secret = mode === 'submit' ? (hidden as Record<string, TestCase[]>)[problem.slug].map(c => ({ ...c, hidden: true })) : [];
    py.globals.set('_lap_payload', JSON.stringify({ problem, code, cases: [...examples, ...secret] }));
    const result = JSON.parse(py.runPython('_lap_judge(_lap_payload)'));
    py.globals.delete('_lap_payload');
    workerScope.postMessage({ id, result });
  } catch (e) { workerScope.postMessage({ id, error: String(e) }); }
};
