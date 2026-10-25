import type { JudgeResult, Problem, TestCase } from './types';
import { timeoutMs } from '../data/judge-config.json';
type Status = 'loading' | 'ready' | 'error';
let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let status: Status = 'loading';
const listeners = new Set<(s: Status) => void>();
let counter = 0;
let pending: { reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> } | null = null;
function setStatus(s: Status) { status = s; listeners.forEach(fn => fn(s)); }
export function subscribeJudge(fn: (s: Status) => void) { listeners.add(fn); fn(status); return () => { listeners.delete(fn); }; }
export function warmJudge() {
  if (ready) return ready;
  setStatus('loading');
  const instance = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' });
  worker = instance;
  ready = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => fail(new Error('Python could not start. Check your connection and retry.')), 45000);
    function fail(error: Error) {
      clearTimeout(timer); instance.terminate();
      if (worker === instance) { worker = null; ready = null; setStatus('error'); }
      reject(error);
    }
    instance.onerror = () => fail(new Error('Python could not start. Please retry.'));
    instance.onmessage = (event) => {
      if (event.data.type === 'ready') { clearTimeout(timer); setStatus('ready'); resolve(); }
      if (event.data.type === 'init-error') fail(new Error(event.data.error));
    };
  });
  return ready;
}
export function stopJudge() {
  worker?.terminate(); worker = null; ready = null; setStatus('loading');
  if (pending) { clearTimeout(pending.timer); pending.reject(new Error('Execution stopped.')); pending = null; }
}
export async function judge(problem: Problem, code: string, mode: 'run' | 'submit', custom?: TestCase[]): Promise<JudgeResult> {
  await warmJudge();
  if (!worker) throw new Error('Python is unavailable. Please retry.');
  const instance = worker;
  const id = ++counter;
  return new Promise((resolve, reject) => {
    let performance: { label: string; total: number; passedCount: number } | null = null;
    const clean = () => { clearTimeout(timer); instance.removeEventListener('message', onMessage); pending = null; };
    const timeout = () => {
      clean(); instance.terminate(); worker = null; ready = null; setStatus('loading');
      if (performance) resolve({ passed: false, correctnessPassed: true, performanceError: `Your solution passed the correctness tests, but exceeded the ${timeoutMs / 1000}-second performance limit on: ${performance.label}.`, total: performance.total, passedCount: performance.passedCount, cases: [], duration: timeoutMs, mode });
      else reject(new Error(`Time limit exceeded (${timeoutMs / 1000} seconds). Check for an infinite loop or an inefficient algorithm.`));
      warmJudge().catch(() => {});
    };
    let timer = setTimeout(timeout, timeoutMs);
    const onMessage = (event: MessageEvent) => {
      if (event.data.id !== id) return;
      if (event.data.type === 'performance') {
        if (!performance) {
          clearTimeout(timer);
          timer = setTimeout(timeout, timeoutMs);
          if (pending) pending.timer = timer;
        }
        performance = event.data;
        return;
      }
      clean();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve({ ...event.data.result, mode });
    };
    pending = { reject, timer };
    instance.addEventListener('message', onMessage);
    instance.postMessage({ id, problem, code, mode, custom });
  });
}
