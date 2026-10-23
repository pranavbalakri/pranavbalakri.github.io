import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/filters.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { filterProblems, normalizeSelection, pickProblem, readPreferences } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const problems = JSON.parse(await readFile(new URL('../src/data/problems.json', import.meta.url), 'utf8'));
const topics = [...new Set(problems.map(problem => problem.topic))];

test('multi-select matches any selected difficulty and any selected topic', () => {
  const actual = filterProblems(problems, ['Easy', 'Medium'], ['Trees', 'Graphs']);
  assert.ok(actual.some(problem => problem.difficulty === 'Easy'));
  assert.ok(actual.some(problem => problem.difficulty === 'Medium'));
  assert.ok(actual.some(problem => problem.topic === 'Trees'));
  assert.ok(actual.some(problem => problem.topic === 'Graphs'));
  assert.ok(actual.every(problem => problem.difficulty !== 'Hard' && ['Trees', 'Graphs'].includes(problem.topic)));
});

test('empty selections include all problems and incompatible filters give no matches', () => {
  assert.equal(filterProblems(problems, [], []).length, 90);
  assert.equal(filterProblems(problems, ['Impossible'], []).length, 0);
});

test('selections discard invalid entries, deduplicate, and normalize all to empty', () => {
  assert.deepEqual(normalizeSelection(['Medium', 'Easy', 'Easy', 'Invalid'], ['Easy', 'Medium', 'Hard']), ['Easy', 'Medium']);
  assert.deepEqual(normalizeSelection(['Hard', 'Easy', 'Medium'], ['Easy', 'Medium', 'Hard']), []);
});

test('old single-select preferences migrate without losing choices', () => {
  assert.deepEqual(readPreferences({ difficulty: 'Medium', topic: 'Graphs' }, topics), { difficulties: ['Medium'], topics: ['Graphs'], soundEnabled: true });
  assert.deepEqual(readPreferences({ difficulty: 'All difficulties', topic: 'All topics' }, topics), { difficulties: [], topics: [], soundEnabled: true });
});

test('new preferences take precedence, preserve mute, and tolerate malformed data', () => {
  assert.deepEqual(readPreferences({ difficulties: ['Easy', 'Hard'], topics: ['Trees'], difficulty: 'Medium', soundEnabled: false }, topics), { difficulties: ['Easy', 'Hard'], topics: ['Trees'], soundEnabled: false });
  assert.deepEqual(readPreferences({ difficulties: [null, 42], topics: ['Not a topic'] }, topics), { difficulties: [], topics: [], soundEnabled: true });
});

test('skip never returns the active problem, even when it is the only unsolved one', () => {
  const [current, other] = problems;
  const history = [{ problemSlug: other.slug, status: 'accepted' }];
  assert.equal(pickProblem([current, other], history, current.slug), other);
  assert.equal(pickProblem([current], [], current.slug), undefined);
  assert.equal(pickProblem([], []), undefined);
});

test('start avoids the last problem, prefers unsolved alternatives, and supports one-problem pools', () => {
  const [solved, last, unseen] = problems;
  const history = [{ problemSlug: solved.slug, status: 'accepted' }, { problemSlug: last.slug, status: 'skipped' }];
  assert.equal(pickProblem([solved, last, unseen], history), unseen);
  assert.equal(pickProblem([solved, last], history), solved);
  assert.equal(pickProblem([last], history), last);
});
