export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type TestCase = { input: Record<string, unknown>; expected: unknown };
export type ProblemExample = TestCase & { explanation: string };
export type Problem = {
  id: number; slug: string; title: string; topic: string; difficulty: Difficulty;
  method: string; params: {name: string; type: string}[]; returns: string;
  description: string[]; hints: string[]; examples: ProblemExample[]; constraints: string[];
  adapter?: 'cycle' | 'lca' | 'trie'; mutates?: string;
  compare?: 'unordered' | 'nested-set' | 'two-sum' | 'closest' | 'topological' | 'palindrome';
};
export type ActiveRun = {
  problemSlug: string; code: string; startedAt: number; elapsed: number;
  paused: boolean; hints: number; attempts: number;
};
export type Lap = {
  id: string; problemSlug: string; duration: number; hints: number;
  attempts: number; completedAt: string; status: 'accepted' | 'skipped';
};
export type CaseResult = {
  passed: boolean; input?: Record<string, unknown>; expected?: unknown; actual?: unknown;
  error?: string; hidden: boolean; stdout: string;
  stress?: string; workUsed?: number; workLimit?: number;
};
export type JudgeResult = {
  passed: boolean; total: number; passedCount: number; duration: number;
  cases: CaseResult[]; error?: string; mode: 'run' | 'submit';
  correctnessPassed?: boolean; performanceError?: string;
};
