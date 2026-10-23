import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadPyodide } from 'pyodide';

const problems = JSON.parse(await readFile(new URL('../src/data/problems.json', import.meta.url)));
const hidden = JSON.parse(await readFile(new URL('../src/data/hidden-tests.json', import.meta.url)));
const runtime = await loadPyodide();
runtime.runPython(await readFile(new URL('../src/lib/harness.py', import.meta.url), 'utf8'));
function run(slug, code, cases) {
  const problem = problems.find(p => p.slug === slug);
  const fixtures = cases ?? [...problem.examples.map(c => ({ ...c, hidden: false })), ...hidden[slug].map(c => ({ ...c, hidden: true }))];
  runtime.globals.set('_test_payload', JSON.stringify({ problem, code, cases: fixtures }));
  return JSON.parse(runtime.runPython('_lap_judge(_test_payload)'));
}

test('all 90 problems have runnable contracts, two examples, and at least three hidden fixtures', () => {
  assert.equal(problems.length, 90);
  assert.equal(new Set(problems.map(p => p.slug)).size, 90);
  assert.equal(new Set(problems.map(p => p.topic)).size, 15);
  assert.equal(problems.some(p => p.id === 269), false);
  for (const p of problems) {
    assert.equal(p.examples.length, 2);
    assert.ok(hidden[p.slug].length >= 3, p.slug);
    assert.equal(p.hints.length, 2);
    for (const c of [...p.examples, ...hidden[p.slug]]) assert.deepEqual(Object.keys(c.input), p.params.map(x => x.name));
    if (p.adapter !== 'trie') {
      const params = p.params.filter(x => !(p.adapter === 'cycle' && x.name === 'pos'));
      const code = `class Solution:\n    def ${p.method}(self, ${params.map(x => `${x.name}: ${x.type}`).join(', ')}) -> ${p.returns}:\n        raise NotImplementedError('test')`;
      const result = run(p.slug, code);
      assert.equal(result.passed, false);
      assert.match(result.cases[0].error, /NotImplementedError/, p.slug);
    }
  }
});

test('runs genuine Python and accepts valid reversed Two Sum indices', () => {
  const result = run('two-sum', `class Solution:
    def twoSum(self, nums, target):
        for i in range(len(nums)):
            for j in range(i+1, len(nums)):
                if nums[i] + nums[j] == target: return [j, i]
`);
  assert.equal(result.passed, true);
  assert.equal(result.cases.length, 2, 'successful hidden fixtures are not returned');
  assert.equal(result.total, 7);
});
test('a hardcoded sample cannot pass submission', () => {
  const r = run('two-sum', 'class Solution:\n    def twoSum(self, nums, target): return [0, 1]');
  assert.equal(r.passed, false);
  assert.equal(r.cases.filter(c => c.hidden).length, 1);
});
test('linked list input and output adapters', () => {
  const r = run('reverse-linked-list', `class Solution:
    def reverseList(self, head):
        prev = None
        while head:
            nxt = head.next
            head.next = prev
            prev, head = head, nxt
        return prev
`);
  assert.equal(r.passed, true);
});
test('tree serialization handles sparse level order, not heap indices', () => {
  const r = run('invert-binary-tree', `class Solution:
    def invertTree(self, root):
        if root:
            root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root
`);
  assert.equal(r.passed, true);
});
test('cycle fixtures pass head only and build actual pointer cycles', () => {
  assert.equal(run('linked-list-cycle', `class Solution:
    def hasCycle(self, head):
        visited = set()
        while head:
            if head in visited: return True
            visited.add(head)
            head = head.next
        return False
`).passed, true);
});
test('in-place mutation is checked instead of the None return', () => {
  assert.equal(run('move-zeroes', `class Solution:
    def moveZeroes(self, nums):
        nums[:] = [x for x in nums if x] + [0]*nums.count(0)
`).passed, true);
});
test('cyclic output is diagnosed rather than hanging serialization', () => {
  const r = run('reverse-linked-list', 'class Solution:\n    def reverseList(self, head):\n        if head: head.next = head\n        return head');
  assert.match(r.cases[0].error, /cycle/);
});
test('all valid topological orderings are accepted', () => {
  const r = run('course-schedule-ii', `class Solution:
    def findOrder(self, numCourses, prerequisites):
        from itertools import permutations
        for order in permutations(range(numCourses)):
            order = list(reversed(order))
            if all(order.index(b) < order.index(a) for a,b in prerequisites): return order
        return []
`);
  assert.equal(r.passed, true);
});
test('equal-length alternate palindrome answers are accepted', () => {
  assert.equal(run('longest-palindromic-substring', `class Solution:
    def longestPalindrome(self, s):
        return max([s[i:j] for i in range(len(s)) for j in range(i+1,len(s)+1) if s[i:j] == s[i:j][::-1]][::-1], key=len)
`).passed, true);
});
test('unordered output preserves multiplicity and inner permutation order', () => {
  assert.equal(run('permutations', 'class Solution:\n    def permute(self, nums): return list(itertools.permutations(nums))[::-1]').passed, true);
  assert.equal(run('permutations', 'class Solution:\n    def permute(self, nums): return [sorted(nums)]').passed, false);
});
test('distance ties accept any valid k closest points', () => {
  assert.equal(run('k-closest-points-to-origin', 'class Solution:\n    def kClosest(self, points, k): return sorted(points[::-1], key=lambda p:p[0]**2+p[1]**2)[:k]').passed, true);
});
test('errors retain user-code line numbers', () => {
  const r = run('two-sum', 'class Solution:\n    def twoSum(self, nums, target):\n        return 1/0');
  assert.match(r.cases[0].error, /Line 3/);
  assert.match(r.cases[0].error, /ZeroDivisionError/);
  assert.ok(run('two-sum', 'def broken(').error.includes('SyntaxError'));
});
test('stdout is captured and capped', () => {
  const r = run('two-sum', 'class Solution:\n    def twoSum(self, nums, target):\n        print("x"*100000)\n        return []');
  assert.equal(r.cases[0].stdout.length, 8000);
});
test('fresh namespaces prevent state leaking between executions', () => {
  run('two-sum', 'old_variable = 9\nclass Solution:\n    def twoSum(self, nums, target): return []');
  const r = run('two-sum', 'class Solution:\n    def twoSum(self, nums, target): return old_variable');
  assert.match(r.cases[0].error, /NameError/);
});
test('maximal rectangle fixtures independently validate the histogram composition', () => {
  assert.equal(run('maximal-rectangle', `class Solution:
    def maximalRectangle(self, matrix):
        best = 0
        for a in range(len(matrix)):
            for b in range(a,len(matrix)):
                for l in range(len(matrix[0])):
                    for r in range(l,len(matrix[0])):
                        if all(matrix[i][j]=='1' for i in range(a,b+1) for j in range(l,r+1)):
                            best=max(best,(b-a+1)*(r-l+1))
        return best
`).passed, true);
});
test('Trie fixture operations are executed against a real class instance', () => {
  assert.equal(run('implement-trie', `class Trie:
    def __init__(self): self.words = set()
    def insert(self, word): self.words.add(word)
    def search(self, word): return word in self.words
    def startsWith(self, prefix): return any(w.startswith(prefix) for w in self.words)
`).passed, true);
});
test('LCA receives object references and returns a node', () => {
  assert.equal(run('lowest-common-ancestor', `class Solution:
    def lowestCommonAncestor(self, root, p, q):
        if root is None or root is p or root is q: return root
        a = self.lowestCommonAncestor(root.left, p, q)
        b = self.lowestCommonAncestor(root.right, p, q)
        return root if a and b else a or b
`).passed, true);
});
