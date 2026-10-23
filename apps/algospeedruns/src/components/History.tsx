import { useState } from 'react';
import { Check, History as HistoryIcon, ArrowUpRight } from 'lucide-react';
import Modal from './Modal';
import { formatTime, problemBySlug } from '../lib/problems';
import type { Lap, Problem } from '../lib/types';

export default function History({ history, onClose, onSelect, onClear }: { history: Lap[]; onClose: () => void; onSelect: (p: Problem) => void; onClear: () => void }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const accepted = history.filter(l => l.status === 'accepted');
  const clean = accepted.filter(l => !l.hints);
  return <Modal title="History" onClose={onClose} className="history-modal">
    <p className="modal-intro">Your completed and skipped runs.</p>
    <div className="history-stats"><div><strong>{accepted.length}</strong><span>Completed</span></div><div><strong>{clean.length}</strong><span>Without hints</span></div><div><strong>{accepted.length ? formatTime(accepted.reduce((s,l) => s+l.duration, 0)/accepted.length) : '—'}</strong><span>Average time</span></div></div>
    <div className="history-list">
      {history.length ? [...history].reverse().map(l => {
        const p = problemBySlug.get(l.problemSlug)!;
        return <button key={l.id} className="history-row" onClick={() => onSelect(p)}>
          <span className={`history-status ${l.status}`} aria-label={l.status}>{l.status === 'accepted' ? <Check size={15}/> : <span>—</span>}</span>
          <div className="history-detail"><strong>{p.title}</strong><span className="history-meta"><span>{new Date(l.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><span>{l.status === 'skipped' ? 'Skipped' : `${l.attempts} submission${l.attempts === 1 ? '' : 's'}`}</span><span>{l.hints ? `${l.hints} hint${l.hints === 1 ? '' : 's'}` : 'No hints'}</span></span></div>
          <span className="history-duration">{formatTime(l.duration)}</span><ArrowUpRight size={15}/>
        </button>;
      }) : <div className="empty-state"><HistoryIcon size={28}/><h3>No runs yet.</h3><p>Completed runs and hint usage will appear here.</p><button className="button primary" onClick={onClose}>Back to practice</button></div>}
    </div>
    <div className="modal-footer"><span>Saved in this browser.</span>{history.length > 0 ? <button className="text-button" onClick={() => setConfirmClear(true)}>Clear history</button> : <span>No account needed.</span>}</div>
    {confirmClear && <Modal title="Clear your run history?" className="small-modal" onClose={() => setConfirmClear(false)}><p className="modal-intro">This removes all {history.length} saved runs and resets your completed-problem count in this browser. This cannot be undone.</p><div className="modal-actions"><button className="button" onClick={() => setConfirmClear(false)}>Keep history</button><button className="button primary" onClick={() => { onClear(); setConfirmClear(false); }}>Clear all runs</button></div></Modal>}
  </Modal>;
}
