import { useEffect, useState } from 'react';
import { Check, Circle, LoaderCircle, Plus, Terminal, X } from 'lucide-react';
import { displayValue } from '../lib/problems';
import { shortcuts } from '../lib/shortcuts';
import type { JudgeResult, Problem, TestCase } from '../lib/types';

export default function TestPanel({ problem, result, busy, custom, setCustom }: { problem: Problem; result: JudgeResult | null; busy: string | null; custom: TestCase[] | undefined; setCustom: (v: TestCase[] | undefined) => void }) {
  const [tab, setTab] = useState<'cases' | 'result'>('cases');
  const [selected, setSelected] = useState(0);
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState(JSON.stringify(problem.examples[0].input));
  const [customExpected, setCustomExpected] = useState(displayValue(problem.examples[0].expected));
  const [customError, setCustomError] = useState('');
  useEffect(() => { if (busy || result) setTab('result'); }, [busy, result]);
  const cases = custom ?? problem.examples;
  const sample = cases[Math.min(selected, cases.length-1)];
  const resultCase = result?.cases.find(c => !c.passed) ?? result?.cases[Math.min(selected, result.cases.length-1)];
  function addCustom() {
    try {
      const input = JSON.parse(customInput);
      const expected = JSON.parse(customExpected);
      if (!input || Array.isArray(input) || typeof input !== 'object' || problem.params.some(p => !(p.name in input))) throw new Error(`Provide all parameters: ${problem.params.map(p => p.name).join(', ')}.`);
      setCustom([...problem.examples, { input, expected }]); setSelected(problem.examples.length); setShowCustom(false); setCustomError('');
    } catch (e) { setCustomError(e instanceof Error ? e.message : 'Enter valid JSON.'); }
  }
  return <section className="test-panel" aria-label="Test window">
    <div className="panel-bar test-panel-bar"><div className="panel-tabs"><button className={tab === 'cases' ? 'selected' : ''} onClick={() => setTab('cases')}><Terminal size={14}/> Test cases</button><button className={tab === 'result' ? 'selected' : ''} onClick={() => setTab('result')}>Result {result && <span className={`result-dot ${result.passed ? 'pass' : 'fail'}`}/>}</button></div><span className="panel-aside">{busy ? 'Running Python…' : 'Examples + hidden tests'}</span></div>
    <div className="test-content" aria-live="polite">
      {tab === 'cases' ? <>
        <div className="case-tabs">{cases.map((_,i) => <button key={i} className={selected === i && !showCustom ? 'selected' : ''} onClick={() => { setSelected(i); setShowCustom(false); }}><Circle size={7} fill="currentColor"/>{i < problem.examples.length ? `Case ${i+1}` : 'Custom'}</button>)}<button className="add-case" aria-label="Add a custom test case" onClick={() => setShowCustom(!showCustom)}><Plus size={14}/></button>{custom && <button className="text-button remove-custom" onClick={() => { setCustom(undefined); setSelected(0); }}>Reset cases</button>}</div>
        {showCustom ? <div className="custom-case"><label>Input · JSON object<textarea aria-label="Custom input" value={customInput} onChange={e => setCustomInput(e.target.value)}/></label><label>Expected output · JSON<input aria-label="Custom expected output" value={customExpected} onChange={e => setCustomExpected(e.target.value)}/></label>{customError && <p className="error-text">{customError}</p>}<button className="button small" onClick={addCustom}>Use custom case</button></div> : <div className="test-fields">{Object.entries(sample.input).map(([name,value]) => <div className="test-field" key={name}><label>{name} =</label><pre>{displayValue(value)}</pre></div>)}</div>}
      </> : busy ? <div className="test-empty"><LoaderCircle size={19} className="spinner"/><p>{busy === 'submit' ? 'Checking examples and hidden tests…' : 'Running test cases…'}</p></div> : !result ? <div className="test-empty"><Terminal size={22}/><p>Run your code to see the results.</p><span><kbd>{shortcuts.submit.display}</kbd> to submit</span></div> : <>
        <div className={`test-verdict ${result.passed ? 'pass-text' : 'error-text'}`}><span>{result.passed ? <Check size={17}/> : <X size={17}/>} {result.passed ? (result.mode === 'run' ? 'Tests passed' : 'Accepted') : result.error ? 'Execution error' : result.cases.some(c => c.error) ? 'Runtime error' : 'Wrong answer'}</span><small>{result.passedCount} / {result.total} passed {result.duration > 0 && `· ${Math.round(result.duration)} ms`}</small></div>
        {result.error ? <pre className="error-output">{result.error}</pre> : resultCase && <>
          {resultCase.hidden && <div className="hidden-case-label">First failing hidden test</div>}
          <div className="result-details"><div><label>Input</label><pre>{Object.entries(resultCase.input ?? {}).map(([k,v]) => `${k} = ${displayValue(v)}`).join('\n')}</pre></div>{resultCase.error ? <pre className="error-output">{resultCase.error}</pre> : <><div><label>Your output</label><pre className={!resultCase.passed ? 'wrong-output' : ''}>{displayValue(resultCase.actual)}</pre></div><div><label>Expected</label><pre>{displayValue(resultCase.expected)}</pre></div></>}{resultCase.stdout && <div><label>Stdout</label><pre>{resultCase.stdout}</pre></div>}</div>
        </>}
        {result.passed && result.mode === 'run' && <p className="result-note">Examples passed. Submit to check the hidden tests.</p>}
      </>}
    </div>
  </section>;
}
