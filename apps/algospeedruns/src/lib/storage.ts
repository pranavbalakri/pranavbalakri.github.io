import type { ActiveRun, Lap } from './types';
import { problemBySlug } from './problems';
const key = 'algo-speedruns:v1';
export type SavedState = { history: Lap[]; active: ActiveRun | null; theme: 'light' | 'dark'; difficulty: string; topic: string };
export function readState(): SavedState {
  const initial: SavedState = { history: [], active: null, theme: 'dark', difficulty: 'All difficulties', topic: 'All topics' };
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (!value || typeof value !== 'object') return initial;
    const history = Array.isArray(value.history) ? value.history.filter((x: Lap) => problemBySlug.has(x?.problemSlug) && Number.isFinite(x.duration) && x.duration >= 0 && ['accepted', 'skipped'].includes(x.status)) : [];
    const a = value.active;
    const active = a && problemBySlug.has(a.problemSlug) && typeof a.code === 'string' && Number.isFinite(a.startedAt) && Number.isFinite(a.elapsed) && typeof a.paused === 'boolean' && Number.isFinite(a.hints) && Number.isFinite(a.attempts) ? a : null;
    return { ...initial, history, active, theme: value.theme === 'light' ? 'light' : 'dark', difficulty: ['All difficulties', 'Easy', 'Medium', 'Hard'].includes(value.difficulty) ? value.difficulty : initial.difficulty, topic: value.topic || initial.topic };
  } catch { return initial; }
}
export function writeState(value: SavedState) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
