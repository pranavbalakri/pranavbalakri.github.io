import type { Lap, Problem } from './types';

export const difficulties = ['Easy', 'Medium', 'Hard'];

// An empty selection means all options, including after selecting every option.
export function normalizeSelection(value: unknown, options: string[]): string[] {
  const selected = Array.isArray(value) ? options.filter(option => value.includes(option)) : [];
  return selected.length === options.length ? [] : selected;
}

export function readPreferences(value: Record<string, unknown>, availableTopics: string[]) {
  return {
    difficulties: normalizeSelection(Array.isArray(value.difficulties) ? value.difficulties : [value.difficulty], difficulties),
    topics: normalizeSelection(Array.isArray(value.topics) ? value.topics : [value.topic], availableTopics),
    soundEnabled: value.soundEnabled !== false,
  };
}

export function filterProblems(pool: Problem[], selectedDifficulties: string[], selectedTopics: string[]) {
  return pool.filter(problem => (!selectedDifficulties.length || selectedDifficulties.includes(problem.difficulty))
    && (!selectedTopics.length || selectedTopics.includes(problem.topic)));
}

export function pickProblem(eligible: Problem[], history: Lap[], excludeSlug?: string) {
  let pool = eligible.filter(problem => problem.slug !== excludeSlug);
  const withoutLast = pool.filter(problem => problem.slug !== history.at(-1)?.problemSlug);
  if (withoutLast.length) pool = withoutLast;
  const solved = new Set(history.filter(lap => lap.status === 'accepted').map(lap => lap.problemSlug));
  const unseen = pool.filter(problem => !solved.has(problem.slug));
  if (unseen.length) pool = unseen;
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : undefined;
}
