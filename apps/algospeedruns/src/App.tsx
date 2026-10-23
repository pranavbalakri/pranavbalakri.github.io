import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronDown, History as HistoryIcon, Moon, Pause, Play, Square, Sun } from 'lucide-react';
import Collection from './components/Collection';
import History from './components/History';
import Modal from './components/Modal';
import { formatTime, problemBySlug, problems, runDuration, starterCode, topics } from './lib/problems';
import { judge, stopJudge, subscribeJudge, warmJudge } from './lib/judge';
import { readState, writeState } from './lib/storage';
import { shortcuts } from './lib/shortcuts';
import type { ActiveRun, JudgeResult, Lap, Problem, TestCase } from './lib/types';
const Workspace = lazy(() => import('./components/Workspace'));

export default function App() {
  const [initial] = useState(readState);
  const [history, setHistory] = useState(initial.history);
  const [active, setActive] = useState<ActiveRun | null>(initial.active);
  const [theme, setTheme] = useState(initial.theme);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [topic, setTopic] = useState(topics.includes(initial.topic) ? initial.topic : 'All topics');
  const [modal, setModal] = useState<'collection' | 'history' | null>(null);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null);
  const [custom, setCustom] = useState<TestCase[] | undefined>();
  const [receipt, setReceipt] = useState<Lap | null>(null);
  const [pythonStatus, setPythonStatus] = useState('loading');
  const [storageError, setStorageError] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [showShortcuts, setShowShortcuts] = useState(false);
  const runRef = useRef(active);
  runRef.current = active;
  const operation = useRef(0);
  const busyRef = useRef(false);
  const stateRef = useRef({ history, active, theme, difficulty, topic });
  stateRef.current = { history, active, theme, difficulty, topic };
  const p = active ? problemBySlug.get(active.problemSlug)! : null;
  const eligible = problems.filter(p => (difficulty === 'All difficulties' || p.difficulty === difficulty) && (topic === 'All topics' || p.topic === topic));
  const elapsed = active ? active.elapsed + (active.paused ? 0 : Math.max(0, now-active.startedAt)) : 0;
  const completed = history.filter(l => l.status === 'accepted');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
  }, [theme]);
  useEffect(() => {
    const timer = setTimeout(() => setStorageError(!writeState({ history, active, theme, difficulty, topic })), 200);
    return () => clearTimeout(timer);
  }, [history, active, theme, difficulty, topic]);
  useEffect(() => {
    const save = () => writeState(stateRef.current);
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, []);
  useEffect(() => { const unsub = subscribeJudge(setPythonStatus); warmJudge().catch(() => {}); return unsub; }, []);
  useEffect(() => {
    if (!active || active.paused) return;
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [active?.problemSlug, active?.paused]);
  useEffect(() => {
    document.title = active && p ? `${formatTime(elapsed)} · ${p.title} — Algo Speedruns` : 'Algo Speedruns';
  }, [active, p, Math.floor(elapsed/1000)]);

  const start = useCallback((chosen?: Problem) => {
    if (runRef.current) return;
    let pool = eligible;
    const solved = new Set(completed.map(l => l.problemSlug));
    const unseen = pool.filter(p => !solved.has(p.slug));
    if (unseen.length) pool = unseen;
    const withoutLast = pool.filter(p => p.slug !== history.at(-1)?.problemSlug);
    if (withoutLast.length) pool = withoutLast;
    const chosenProblem = chosen ?? pool[Math.floor(Math.random()*pool.length)];
    if (!chosenProblem) return;
    const run: ActiveRun = { problemSlug: chosenProblem.slug, code: starterCode(chosenProblem), startedAt: Date.now(), elapsed: 0, paused: false, hints: 0, attempts: 0 };
    runRef.current = run; setActive(run); setNow(Date.now()); setReceipt(null); setResult(null); setCustom(undefined); setModal(null);
    warmJudge().catch(() => {});
  }, [eligible, completed, history]);

  const pause = useCallback(() => {
    if (busyRef.current) return;
    setActive(run => run && !run.paused ? { ...run, elapsed: runDuration(run), paused: true } : run);
  }, []);
  const resume = useCallback(() => {
    setNow(Date.now());
    setActive(run => run ? { ...run, startedAt: Date.now(), paused: false } : run);
  }, []);
  function endRun() {
    if (!active) return;
    const lap: Lap = { id: crypto.randomUUID(), problemSlug: active.problemSlug, duration: runDuration(active), hints: active.hints, attempts: active.attempts, completedAt: new Date().toISOString(), status: 'skipped' };
    setHistory(h => [...h,lap]); setActive(null); runRef.current = null; setResult(null); setReceipt(null);
  }
  const execute = useCallback(async (mode: 'run' | 'submit') => {
    const run = runRef.current;
    if (!run || run.paused || busyRef.current) return;
    const problem = problemBySlug.get(run.problemSlug)!;
    busyRef.current = true; setBusy(mode);
    const token = ++operation.current;
    if (mode === 'submit') setActive(current => current ? { ...current, attempts: current.attempts+1 } : null);
    try {
      const response = await judge(problem, run.code, mode, mode === 'run' ? custom : undefined);
      if (token !== operation.current) return;
      setResult(response);
      if (mode === 'submit' && response.passed) {
        const current = runRef.current ?? run;
        const lap: Lap = { id: crypto.randomUUID(), problemSlug: run.problemSlug, duration: runDuration(current), hints: current.hints, attempts: Math.max(current.attempts,run.attempts+1), completedAt: new Date().toISOString(), status: 'accepted' };
        setHistory(h => [...h,lap]); setReceipt(lap); setActive(null); runRef.current = null;
      }
    } catch (error) {
      if (token === operation.current) setResult({ passed: false, total: 0, passedCount: 0, cases: [], duration: 0, mode, error: error instanceof Error ? error.message : 'Something went wrong. Try again.' });
    } finally { if (token === operation.current) { setBusy(null); busyRef.current = false; } }
  }, [custom]);
  function cancelExecution() {
    operation.current++; stopJudge(); setBusy(null); busyRef.current = false;
    setResult({ passed: false, total: 0, passedCount: 0, cases: [], duration: 0, mode: busy ?? 'run', error: 'Execution stopped.' });
    warmJudge().catch(() => {});
  }

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.repeat || event.isComposing) return;
      const el = event.target as HTMLElement;
      const typing = el.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(el.tagName);
      if (document.querySelector('dialog[open]') && !active?.paused) return;
      if (event.code === 'Space' && !typing && !modal && !showShortcuts) {
        if (!active && el.tagName !== 'BUTTON') { event.preventDefault(); start(); }
        else if (active?.paused && el.tagName !== 'BUTTON') { event.preventDefault(); resume(); }
      }
      if (event.key === 'Escape' && active && !modal && !showShortcuts) { event.preventDefault(); active.paused ? resume() : pause(); }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && active && !active.paused) { event.preventDefault(); event.stopPropagation(); execute(event.shiftKey ? 'run' : 'submit'); }
      if (event.key === '?' && !typing && !active) { event.preventDefault(); setShowShortcuts(true); }
    }
    window.addEventListener('keydown',key,true); return () => window.removeEventListener('keydown',key,true);
  }, [active, modal, showShortcuts, start, resume, pause, execute]);

  return <div className={`app ${active ? 'in-run' : 'at-rest'}`}>
    <header className="app-header"><button className="wordmark" onClick={() => active ? pause() : setModal(null)} aria-label={active ? 'Pause and return to start' : 'Algo Speedruns home'}><span>Algo Speedruns</span></button>
      {active ? <><div className="run-timer"><span className={`live-dot ${active.paused ? 'paused' : ''}`}/><span>{formatTime(elapsed)}</span><button className="icon-button" onClick={active.paused ? resume : pause} disabled={!!busy} aria-label={active.paused ? 'Resume timer' : 'Pause timer'} title="Pause (Esc)">{active.paused ? <Play size={13}/> : <Pause size={13}/>}</button></div><div className="run-actions">{busy ? <button className="button" onClick={cancelExecution}><Square size={12}/> Stop</button> : <button className="button run-button" onClick={() => execute('run')} disabled={active.paused} aria-label="Run" aria-keyshortcuts={shortcuts.run.aria} title={`Run test cases (${shortcuts.run.label})`}><Play size={13}/> Run <kbd className="button-shortcut" aria-hidden="true">{shortcuts.run.display}</kbd></button>}<button className="button primary submit-button" onClick={() => execute('submit')} disabled={!!busy || active.paused} aria-label={busy === 'submit' ? 'Checking…' : 'Submit'} aria-keyshortcuts={shortcuts.submit.aria} title={`Submit solution (${shortcuts.submit.label})`}>{busy === 'submit' ? 'Checking…' : 'Submit'}<kbd className="button-shortcut" aria-hidden="true">{shortcuts.submit.display}</kbd></button></div></> : <nav className="home-nav"><button aria-label="Problems" onClick={() => setModal('collection')}><BookOpen size={16}/><span>Problems</span></button><button aria-label="History" onClick={() => setModal('history')}><HistoryIcon size={16}/><span>History</span></button><span className="nav-divider"/><button className="icon-button" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}</button></nav>}
    </header>
    {active && p ? <div className={active.paused ? 'paused-workspace' : ''}><Suspense fallback={<main className="workspace-loading">Preparing your workspace…</main>}><Workspace problem={p} run={active} theme={theme} onCode={code => setActive(r => r ? { ...r,code } : r)} onHint={() => setActive(r => r ? { ...r,hints: Math.min(r.hints+1,p.hints.length) } : r)} result={result} busy={busy} custom={custom} setCustom={setCustom} pythonStatus={pythonStatus}/></Suspense></div> : <main className="home">
      <div className="home-center">
        {receipt ? <div className="accepted-receipt" role="status"><div className="receipt-top"><Check size={15}/><span>Accepted</span><span className="receipt-time">{formatTime(receipt.duration)}</span></div><div className="receipt-problem">{problemBySlug.get(receipt.problemSlug)?.title}</div><div className="receipt-meta">{receipt.hints ? `${receipt.hints} hint${receipt.hints === 1 ? '' : 's'} used` : 'Without hints'}<span>·</span>{receipt.attempts} submission{receipt.attempts === 1 ? '' : 's'}</div></div> : null}
        <h1 className="start-prompt"><span>Press</span><button className="space-key" onClick={() => start()} disabled={!eligible.length} aria-label="Start a speedrun">space</button><span>to start a speedrun</span></h1>
        <div className="run-settings"><label className="select-wrap"><span className="select-value" aria-hidden="true">{difficulty}</span><select aria-label="Speedrun difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option>All difficulties</option>{['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}</select><ChevronDown size={12}/></label><span className="settings-dot" aria-hidden="true">·</span><label className="select-wrap topic-select"><span className="select-value" aria-hidden="true">{topic}</span><select aria-label="Speedrun topic" value={topic} onChange={e => setTopic(e.target.value)}><option>All topics</option>{topics.map(t => <option key={t}>{t}</option>)}</select><ChevronDown size={12}/></label></div>
        {!eligible.length && <p className="rotation-count" role="status">No problems match. Try another filter.</p>}
      </div>
      {completed.length > 0 && !receipt && <button className="home-progress" onClick={() => setModal('history')}><span className="progress-fraction">{new Set(completed.map(l => l.problemSlug)).size}<span> / 90</span></span><span>problems completed</span><ArrowRight size={13}/></button>}
    </main>}
    <footer className="app-footer"><span>{active ? (active.hints ? `${active.hints} hint${active.hints === 1 ? '' : 's'} used` : 'No hints used') : ''}</span><span className="footer-right">{active ? <><span><kbd>esc</kbd> pause</span><span><kbd>{shortcuts.submit.display}</kbd> submit</span><button className="icon-button" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}</button></> : <button className="keyboard-help" aria-label="Keyboard shortcuts" onClick={() => setShowShortcuts(true)}>Keyboard shortcuts <kbd>?</kbd></button>}</span></footer>
    {storageError && <div className="storage-alert" role="alert">Browser storage is full or unavailable. This run will not be saved after closing the page.</div>}
    {modal === 'collection' && <Collection history={history} onClose={() => setModal(null)} onSelect={start}/>}
    {modal === 'history' && <History history={history} onClose={() => setModal(null)} onSelect={start} onClear={() => { setHistory([]); setReceipt(null); }}/>}
    {active?.paused && <Modal title="Paused" className="pause-modal" onClose={resume}><p className="modal-intro">Resume when you’re ready.</p><div className="pause-time">{formatTime(elapsed)}</div><p className="paused-problem">{p?.title}</p><button className="button primary resume-button" onClick={resume}><Play size={14}/> Resume run <kbd>space</kbd></button><button className="end-run-button" onClick={endRun}>End this run <ArrowRight size={13}/></button></Modal>}
    {showShortcuts && <Modal title="Keyboard shortcuts" onClose={() => setShowShortcuts(false)} className="small-modal"><div className="shortcut-list"><div><span>Start a run</span><kbd>space</kbd></div><div><span>Pause / resume</span><kbd>esc</kbd></div><div><span>Run test cases</span><kbd>{shortcuts.run.label}</kbd></div><div><span>Submit solution</span><kbd>{shortcuts.submit.label}</kbd></div><div><span>Indent code</span><kbd>tab</kbd></div></div></Modal>}
  </div>;
}
