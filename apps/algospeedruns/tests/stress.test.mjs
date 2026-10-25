import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TestJudge } from './helpers/run-judge.mjs';
const problems=JSON.parse(await readFile(new URL('../src/data/problems.json',import.meta.url)));
const judge=new TestJudge();
test.after(()=>judge.close());

test('all 90 problems have deterministic stress fixtures, work budgets, and independent reference implementations', async()=>{
  const audit=await judge.run({inspect:true});
  assert.equal(audit.length,90);
  for (const p of audit) {
    assert.ok(p.cases>0,p.slug);assert.ok(p.reference,p.slug);assert.ok(p.work.every(n=>Number.isSafeInteger(n)&&n>0),p.slug);
  }
});
for (const problem of problems) test(`efficient solution passes correctness and performance: ${problem.slug}`,async()=>{
  const result=await judge.run({slug:problem.slug});
  assert.equal(result.passed,true,JSON.stringify(result));
  assert.equal(result.correctnessPassed,true);
});

const {default:slow}=await import('./helpers/slow-solutions.mjs');
for (const [slug,body] of slow) test(`rejects slow solution: ${slug}`,async()=>{
  const p=problems.find(p=>p.slug===slug);
  const code=`class Solution:\n    def ${p.method}(self, ${p.params.map(x=>x.name).join(', ')}):\n${body.split('\n').map(line=>'        '+line).join('\n')}`;
  const result=await judge.run({slug,code});
  assert.equal(result.passed,false,slug);
  if (slug==='house-robber' && result.timedOut && !result.correctnessPassed) {
    assert.match(result.error,/Correctness time limit/);
  } else {
    assert.equal(result.correctnessPassed,true,JSON.stringify(result));
    assert.ok(result.performanceError,JSON.stringify(result));
  }
});

test('wrong answers remain correctness failures and do not become performance failures',async()=>{
  const result=await judge.run({slug:'two-sum',code:'class Solution:\n    def twoSum(self, nums, target): return [0,1]'});
  assert.equal(result.passed,false);assert.equal(result.correctnessPassed,false);assert.equal(result.performanceError,null);
  assert.ok(result.cases.some(c=>!c.passed));
});

test('work limits apply only on Submit; examples still run normally',async()=>{
  const result=await judge.run({slug:'binary-search',code:'class Solution:\n    def search(self, nums, target): return nums.index(target) if target in nums else -1',performance:false});
  assert.equal(result.passed,true);assert.equal(result.performanceError,null);
});

test('performance failures return bounded previews instead of enormous arrays',async()=>{
  const result=await judge.run({slug:'sliding-window-maximum',code:'class Solution:\n    def maxSlidingWindow(self, nums, k): return [max(nums[i:i+k]) for i in range(len(nums)-k+1)]'});
  assert.ok(result.performanceError);assert.ok(JSON.stringify(result).length<10000);
  assert.ok(result.cases.find(c=>c.stress)?.input.nums.at(-1).includes('more items'));
});

test('large-input wrong answers remain wrong answers, not slow-solution messages',async()=>{
  const result=await judge.run({slug:'binary-search',code:'class Solution:\n    def search(self, nums, target):\n        if len(nums)>1000: return -1\n        i=bisect_left(nums,target)\n        return i if i<len(nums) and nums[i]==target else -1'});
  assert.equal(result.passed,false);assert.equal(result.correctnessPassed,true);assert.equal(result.performanceError,null);
  assert.ok(result.cases.find(c=>c.stress&&!c.passed));
});

test('work exhaustion remains a failure if a solution catches its exception',async()=>{
  const result=await judge.run({slug:'binary-search',code:'class Solution:\n    def search(self, nums, target):\n        try:\n            for i,v in enumerate(nums):\n                if v==target: return i\n        except Exception:\n            return len(nums)-1\n        return -1'});
  assert.ok(result.performanceError);
});

test('memoized recursion and handwritten binary search pass the deterministic budgets',async()=>{
  const recursive=await judge.run({slug:'climbing-stairs',code:'class Solution:\n    def climbStairs(self, n):\n        @cache\n        def climb(k):\n            return 1 if k<2 else climb(k-1)+climb(k-2)\n        return climb(n)'});
  assert.equal(recursive.passed,true,JSON.stringify(recursive));
  const binary=await judge.run({slug:'binary-search',code:'class Solution:\n    def search(self, nums, target):\n        lo,hi=0,len(nums)-1\n        while lo<=hi:\n            mid=(lo+hi)//2\n            if nums[mid]==target: return mid\n            if nums[mid]<target: lo=mid+1\n            else: hi=mid-1\n        return -1'});
  assert.equal(binary.passed,true,JSON.stringify(binary));
});
