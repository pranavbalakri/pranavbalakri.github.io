import data from '../data/problems.json';
import type { Problem } from './types';
export const problems = data as Problem[];
export const topics = [...new Set(problems.map(p => p.topic))];
export const problemBySlug = new Map(problems.map(p => [p.slug, p]));

export function starterCode(p: Problem) {
  if (p.adapter === 'trie') return 'class Trie:\n    def __init__(self):\n        pass\n\n    def insert(self, word: str) -> None:\n        pass\n\n    def search(self, word: str) -> bool:\n        pass\n\n    def startsWith(self, prefix: str) -> bool:\n        pass\n';
  const args = p.params.filter(x => !(p.adapter === 'cycle' && x.name === 'pos'));
  return `class Solution:\n    def ${p.method}(self, ${args.map(x => `${x.name}: ${x.type}`).join(', ')}) -> ${p.returns}:\n        pass\n`;
}

export function formatTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  return `${h ? `${String(h).padStart(2, '0')}:` : ''}${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
export function runDuration(run: { elapsed: number; startedAt: number; paused: boolean }) {
  return run.elapsed + (run.paused ? 0 : Math.max(0, Date.now() - run.startedAt));
}
export function displayValue(value: unknown) { return JSON.stringify(value) ?? 'None'; }
