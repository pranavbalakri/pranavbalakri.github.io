import type { ActiveRun, Lap } from './types';
import { problemBySlug, topics } from './problems';
import { readPreferences } from './filters';
const key = 'algo-speedruns:v1';
export type SavedState = { history: Lap[]; active: ActiveRun | null; theme: 'light' | 'dark'; difficulties: string[]; topics: string[]; soundEnabled: boolean };
export function readState(): SavedState {
  const initial: SavedState = { history: [], active: null, theme: 'dark', difficulties: [], topics: [], soundEnabled: true };
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (!value || typeof value !== 'object') return initial;
    const history = Array.isArray(value.history) ? value.history.filter((x: Lap) => problemBySlug.has(x?.problemSlug) && Number.isFinite(x.duration) && x.duration >= 0 && ['accepted', 'skipped'].includes(x.status)) : [];
    const a = value.active;
    const active = a && problemBySlug.has(a.problemSlug) && typeof a.code === 'string' && Number.isFinite(a.startedAt) && Number.isFinite(a.elapsed) && typeof a.paused === 'boolean' && Number.isFinite(a.hints) && Number.isFinite(a.attempts) ? a : null;
    return { history, active, theme: value.theme === 'light' ? 'light' : 'dark', ...readPreferences(value, topics) };
  } catch { return initial; }
}
export function writeState(value: SavedState) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
