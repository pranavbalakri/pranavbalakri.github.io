import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronDown, Code2, Lightbulb, RotateCcw } from 'lucide-react';
import Editor from './Editor';
import TestPanel from './TestPanel';
import Modal from './Modal';
import StatementText from './StatementText';
import { displayValue, starterCode } from '../lib/problems';
import { usePaneResize } from '../lib/usePaneResize';
import type { ActiveRun, JudgeResult, Problem, TestCase } from '../lib/types';

type Props = { problem: Problem; run: ActiveRun; theme: 'light' | 'dark'; onCode: (code: string) => void; onHint: () => void; result: JudgeResult | null; busy: string | null; custom: TestCase[] | undefined; setCustom: (v: TestCase[] | undefined) => void; pythonStatus: string };
export default function Workspace({ problem: p, run, theme, onCode, onHint, result, busy, custom, setCustom, pythonStatus }: Props) {
  const [position, setPosition] = useState('Ln 3, Col 9');
  const [reset, setReset] = useState(false);
  const [details, setDetails] = useState(false);
  const [stacked, setStacked] = useState(() => window.matchMedia('(max-width: 720px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 720px)');
    const update = () => setStacked(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const question = usePaneResize({ axis: stacked ? 'rows' : 'columns', name: 'question', defaultRatio: stacked ? .35 : .4, minFirst: stacked ? 200 : 240, minSecond: stacked ? 440 : 320 });
  const answer = usePaneResize({ axis: 'rows', name: 'answer', defaultRatio: .66, minFirst: 180, minSecond: 140 });
  return <main ref={question.container} className={`workspace ${question.resizing || answer.resizing ? 'resizing-panes' : ''}`} style={{ ...question.style, cursor: question.resizing ? question.cursor : answer.resizing ? answer.cursor : undefined }}>
    <section id="problem-pane" className="description-panel" aria-label="Problem description">
      <div className="panel-bar"><span className="panel-label">Problem</span><button className={`hint-button ${run.hints ? 'used' : ''}`} onClick={onHint} disabled={run.hints >= p.hints.length} title="Revealing a hint is recorded for this run"><Lightbulb size={14}/>{run.hints ? `${run.hints}/${p.hints.length} hints used` : 'Get a hint'}</button></div>
      <div className="problem-content"><div className="problem-eyebrow"><span>{String(p.id).padStart(3,'0')}</span><span>{p.topic}</span></div><h1>{p.title}</h1><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
        <div className="problem-prose">{p.description.map((text,i) => <p key={i}><StatementText>{text}</StatementText></p>)}</div>
        {p.examples.map((ex,i) => <div className="example" key={i}><h3>Example {i+1}</h3><div className="example-body"><div><span>Input</span><code>{Object.entries(ex.input).map(([k,v]) => `${k} = ${displayValue(v)}`).join('\n')}</code></div><div><span>{p.mutates ? 'After' : 'Output'}</span><code>{displayValue(ex.expected)}</code></div><p className="example-explanation"><StatementText>{ex.explanation}</StatementText></p></div></div>)}
        <div className="constraints"><h3>Constraints</h3><ul>{p.constraints.map((c,i) => <li key={i}>{c}</li>)}</ul></div>
        {run.hints > 0 && <div className="hints"><div className="hints-title"><Lightbulb size={14}/><span>Hints</span><span className="hint-recorded">Recorded for this run</span></div>{p.hints.slice(0,run.hints).map((h,i) => <div className="hint" key={i}><span>0{i+1}</span><p>{h}</p></div>)}{run.hints < p.hints.length && <button className="text-button" onClick={onHint}>Reveal next hint <ArrowRight size={13}/></button>}</div>}
        <div className="environment-note"><button onClick={() => setDetails(!details)} aria-expanded={details}>Python environment <ChevronDown size={13} style={{transform: details ? 'rotate(180deg)' : undefined}}/></button>{details && <p>Python 3.12 with the standard library. Typing names, Counter, defaultdict, deque, heap operations, and bisect helpers are pre-imported. ListNode and TreeNode are provided. Code has a 5-second execution limit.</p>}</div>
      </div>
    </section>
    <div {...question.divider} aria-label="Problem description" aria-controls="problem-pane"/>
    <div ref={answer.container} className="answer-panel" style={answer.style}><section id="editor-pane" className="editor-panel" aria-label="Answer space"><div className="panel-bar"><span className="panel-label"><Code2 size={15}/> Python 3</span><div className="editor-tools"><span><Check size={12}/> Saved locally</span><button className="icon-button" onClick={() => setReset(true)} aria-label="Reset code" title="Reset code"><RotateCcw size={14}/></button></div></div><Editor key={p.slug} value={run.code} onChange={onCode} theme={theme} onPosition={setPosition}/><div className="editor-status"><span>{pythonStatus === 'ready' ? 'Python ready' : pythonStatus === 'error' ? 'Python unavailable. Retry Run.' : 'Preparing Python…'}</span><span>{position}<span className="status-space">Spaces: 4</span></span></div></section><div {...answer.divider} aria-label="Answer space" aria-controls="editor-pane"/><TestPanel key={p.slug} problem={p} result={result} busy={busy} custom={custom} setCustom={setCustom}/></div>
    {reset && <Modal title="Reset your code?" onClose={() => setReset(false)} className="small-modal"><p className="modal-intro">This restores the starting function. Your timer and hint count will continue.</p><div className="modal-actions"><button className="button" onClick={() => setReset(false)}>Keep editing</button><button className="button primary" onClick={() => { onCode(starterCode(p)); setReset(false); }}>Reset code</button></div></Modal>}
  </main>;
}
