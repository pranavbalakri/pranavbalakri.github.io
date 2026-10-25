import test from 'node:test';
import assert from 'node:assert/strict';
import { TestJudge } from './helpers/run-judge.mjs';
const judge=new TestJudge();
const slug='kth-largest-element-in-an-array';
test.after(()=>judge.close());
const solution=body=>`class Solution:\n    def findKthLargest(self, nums, k):\n${body.split('\n').map(line=>'        '+line).join('\n')}`;

const fullSorts=[
  ['the reported one-liner', 'return sorted(nums)[-k]'],
  ['in-place sort', 'nums.sort()\nreturn nums[-k]'],
  ['sort after list()', 'copy=list(nums)\ncopy.sort()\nreturn copy[-k]'],
  ['a transformed copy and key function', 'return -sorted([-value for value in nums],key=lambda value:value)[k-1]'],
  ['an aliased built-in', 'from builtins import sorted as order\nreturn order(nums)[-k]'],
  ['an aliased bound method', 'copy=nums[:]\norder=copy.sort\norder(reverse=True)\nreturn copy[k-1]'],
  ['the unbound list method', 'list.sort(nums)\nreturn nums[-k]'],
  ['sorting only on large inputs', 'if len(nums)>1000: return sorted(nums)[-k]\nreturn sorted(nums,reverse=True)[k-1]'],
];
for (const [label,body] of fullSorts) test(`selection rejects ${label} by counted work, not elapsed time`,async()=>{
  const r=await judge.run({slug,code:solution(body)});
  assert.equal(r.passed,false,JSON.stringify(r));
  assert.equal(r.correctnessPassed,true,JSON.stringify(r));
  assert.ok(r.performanceError,JSON.stringify(r));
  assert.ok(!r.timedOut,JSON.stringify(r));
  const failure=r.cases.find(c=>c.error);
  assert.match(failure?.error??'',/comparison budget/);
  assert.ok(failure.comparisonsUsed>failure.comparisonLimit);
});

// Hoare partitioning handles equal values without repeatedly peeling one off.
for (const seed of [0,1,7,42,215]) test(`random-pivot Quickselect passes with seed ${seed}`,async()=>{
  const r=await judge.run({slug,code:solution(`from random import Random
rng=Random(${seed})
target=len(nums)-k
left,right=0,len(nums)-1
while left<right:
    pivot=nums[rng.randrange(left,right+1)]
    i,j=left,right
    while i<=j:
        while nums[i]<pivot: i+=1
        while nums[j]>pivot: j-=1
        if i<=j:
            nums[i],nums[j]=nums[j],nums[i]
            i+=1; j-=1
    if target<=j: right=j
    elif target>=i: left=i
    else: break
return nums[target]`)});
  assert.equal(r.passed,true,JSON.stringify(r));
});

test('Quickselect may sort small pivot samples and a small final partition',async()=>{
  const r=await judge.run({slug,code:solution(`target=len(nums)-k
left,right=0,len(nums)-1
while right-left>24:
    pivot=sorted([nums[left],nums[(left+right)//2],nums[right]])[1]
    i,j=left,right
    while i<=j:
        while nums[i]<pivot: i+=1
        while nums[j]>pivot: j-=1
        if i<=j:
            nums[i],nums[j]=nums[j],nums[i]
            i+=1; j-=1
    if target<=j: right=j
    elif target>=i: left=i
    else: return nums[target]
return sorted(nums[left:right+1])[target-left]`)});
  assert.equal(r.passed,true,JSON.stringify(r));
});

test('three-way partitioning with copied arrays remains valid',async()=>{
  const r=await judge.run({slug,code:solution(`from random import Random
rng=Random(42)
while nums:
    pivot=nums[rng.randrange(len(nums))]
    larger=[x for x in nums if x>pivot]
    equal=[x for x in nums if x==pivot]
    smaller=[x for x in nums if x<pivot]
    if k<=len(larger): nums=larger
    elif k<=len(larger)+len(equal): return pivot
    else:
        k-=len(larger)+len(equal)
        nums=smaller`)});
  assert.equal(r.passed,true,JSON.stringify(r));
});

test('sorting remains usable when running examples',async()=>{
  const r=await judge.run({slug,code:solution('return sorted(nums)[-k]'),performance:false});
  assert.equal(r.passed,true);
});

test('comparison exhaustion cannot be swallowed by the solution',async()=>{
  const r=await judge.run({slug,code:solution(`try:
    return sorted(nums)[-k]
except Exception:
    return 9999`)});
  assert.equal(r.correctnessPassed,true);
  assert.ok(r.performanceError);
});

test('frequency counting within the documented integer range remains valid',async()=>{
  const r=await judge.run({slug,code:solution(`counts=[0]*20001
for value in nums: counts[value+10000]+=1
for i in range(20000,-1,-1):
    k-=counts[i]
    if k<=0: return i-10000`)});
  assert.equal(r.passed,true,JSON.stringify(r));
});

for (const [label,body] of [
  ['the corrected user solution', `import heapq
heap=[]
for num in nums:
    heapq.heappush(heap,num)
    if len(heap)>k:
        heapq.heappop(heap)
return heap[0]`],
  ['heappushpop', `heap=[]
for num in nums:
    if len(heap)<k: heappush(heap,num)
    else: heappushpop(heap,num)
return heap[0]`],
  ['nlargest', 'import heapq\nreturn heapq.nlargest(k,nums)[-1]'],
]) test(`selection accepts bounded heaps: ${label}`,async()=>{
  const r=await judge.run({slug,code:solution(body)});
  assert.equal(r.passed,true,JSON.stringify(r));
});
