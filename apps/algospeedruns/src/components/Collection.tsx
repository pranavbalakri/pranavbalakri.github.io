import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Search } from 'lucide-react';
import Modal from './Modal';
import MultiSelect from './MultiSelect';
import { difficulties, filterProblems } from '../lib/filters';
import { problems, topics } from '../lib/problems';
import type { Lap, Problem } from '../lib/types';

export default function Collection({ history, onClose, onSelect }: { history: Lap[]; onClose: () => void; onSelect: (p: Problem) => void }) {
  const [query, setQuery] = useState('');
  const [selectedTopics, setTopics] = useState<string[]>([]);
  const [selectedDifficulties, setDifficulties] = useState<string[]>([]);
  const solved = useMemo(() => new Set(history.filter(l => l.status === 'accepted').map(l => l.problemSlug)), [history]);
  const filtered = filterProblems(problems, selectedDifficulties, selectedTopics).filter(p => `${p.title} ${p.topic} ${p.id}`.toLowerCase().includes(query.toLowerCase()));
  return <Modal title="Problems" onClose={onClose} className="collection-modal">
    <p className="modal-intro">90 core interview problems across 15 topics.</p>
    <div className="collection-controls">
      <div className="search-field"><Search size={16}/><input autoFocus placeholder="Find a problem or topic…" aria-label="Search problems" value={query} onChange={e => setQuery(e.target.value)}/><kbd>/</kbd></div>
      <div className="collection-selects">
        <MultiSelect label="Filter collection by topic" allLabel="All topics" plural="topics" options={topics} values={selectedTopics} onChange={setTopics}/>
        <MultiSelect label="Filter collection by difficulty" allLabel="All difficulties" plural="difficulties" options={difficulties} values={selectedDifficulties} onChange={setDifficulties}/>
      </div>
    </div>
    <div className="collection-caption"><span>{filtered.length} problems</span><span>{solved.size} / 90 completed</span></div>
    <div className="collection-list">
      {topics.map(t => {
        const group = filtered.filter(p => p.topic === t);
        if (!group.length) return null;
        return <section key={t} className="problem-group"><h3>{t}<span>{group.length}</span></h3>{group.map(p => <button className="problem-row" key={p.slug} onClick={() => onSelect(p)}>
          <span className={`completion-indicator ${solved.has(p.slug) ? 'complete' : ''}`}>{solved.has(p.slug) ? <Check size={12}/> : null}</span>
          <span className="problem-row-number">{p.id}</span><span className="problem-row-title">{p.title}</span><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><ArrowUpRight size={15} className="row-arrow"/>
        </button>)}</section>;
      })}
      {!filtered.length && <div className="empty-state"><Search size={24}/><h3>No matching problems</h3><p>Try a different title, topic, or difficulty.</p><button className="text-button" onClick={() => { setQuery(''); setTopics([]); setDifficulties([]); }}>Clear filters</button></div>}
    </div>
    <div className="modal-footer"><span>Select a problem to start a timed run.</span><span>Python 3</span></div>
  </Modal>;
}
