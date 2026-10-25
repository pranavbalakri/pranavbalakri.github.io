// Known-correct small-input implementations that should fail the performance stage.
export default [
['two-sum', `for i in range(len(nums)):
    for j in range(i+1,len(nums)):
        if nums[i]+nums[j]==target: return [i,j]`],
['contains-duplicate', `seen=[]
for v in nums:
    if v in seen: return True
    seen.append(v)
return False`],
['subarray-sum-equals-k', `answer=0
for i in range(len(nums)):
    total=0
    for j in range(i,len(nums)):
        total+=nums[j]
        if total==k: answer+=1
return answer`],
['container-with-most-water', `return max((j-i)*min(height[i],height[j]) for i in range(len(height)) for j in range(i+1,len(height)))`],
['trapping-rain-water', `return sum(min(max(height[:i+1]),max(height[i:]))-height[i] for i in range(len(height)))`],
['sliding-window-maximum', `return [max(nums[i:i+k]) for i in range(len(nums)-k+1)]`],
['daily-temperatures', `answer=[0]*len(temperatures)
for i in range(len(temperatures)):
    for j in range(i+1,len(temperatures)):
        if temperatures[j]>temperatures[i]: answer[i]=j-i; break
return answer`],
['largest-rectangle-in-histogram', `answer=0
for i in range(len(heights)):
    minimum=heights[i]
    for j in range(i,len(heights)):
        minimum=min(minimum,heights[j]); answer=max(answer,minimum*(j-i+1))
return answer`],
['binary-search', `return nums.index(target) if target in nums else -1`],
['search-a-2d-matrix', `return any(target in row for row in matrix)`],
['search-in-rotated-sorted-array', `for i,v in enumerate(nums):
    if v==target: return i
return -1`],
['find-minimum-in-rotated-sorted-array', `return min(nums)`],
['find-first-and-last-position', `positions=[i for i,v in enumerate(nums) if v==target]
return [positions[0],positions[-1]] if positions else [-1,-1]`],
['climbing-stairs', `def climb(k):
    if k<2: return 1
    return climb(k-1)+climb(k-2)
return climb(n)`],
['house-robber', `def rob(i):
    if i>=len(nums): return 0
    return max(rob(i+1),nums[i]+rob(i+2))
return rob(0)`],
['house-robber-ii', `def rob(a,i,end):
    if i>=end: return 0
    return max(rob(a,i+1,end),a[i]+rob(a,i+2,end))
return nums[0] if len(nums)==1 else max(rob(nums,0,len(nums)-1),rob(nums,1,len(nums)))`],
['longest-increasing-subsequence', `dp=[1]*len(nums)
for i in range(len(nums)):
    for j in range(i):
        if nums[j]<nums[i]: dp[i]=max(dp[i],dp[j]+1)
return max(dp)`],
['longest-common-subsequence', `def solve(i,j):
    if i==len(text1) or j==len(text2): return 0
    if text1[i]==text2[j]: return 1+solve(i+1,j+1)
    return max(solve(i+1,j),solve(i,j+1))
return solve(0,0)`],
['word-break', `words=set(wordDict)
def solve(i):
    if i==len(s): return True
    return any(s[i:j] in words and solve(j) for j in range(i+1,len(s)+1))
return solve(0)`],
['unique-paths', `def paths(a,b):
    if a==1 or b==1: return 1
    return paths(a-1,b)+paths(a,b-1)
return paths(m,n)`],
['decode-ways', `def ways(i):
    if i==len(s): return 1
    if s[i]=='0': return 0
    answer=ways(i+1)
    if i+1<len(s) and 10<=int(s[i:i+2])<=26: answer+=ways(i+2)
    return answer
return ways(0)`],
['maximum-subarray', `best=nums[0]
for i in range(len(nums)):
    total=0
    for j in range(i,len(nums)): total+=nums[j]; best=max(best,total)
return best`],
['jump-game-ii', `dp=[float('inf')]*len(nums); dp[0]=0
for i in range(len(nums)):
    for j in range(i+1,min(len(nums),i+nums[i]+1)): dp[j]=min(dp[j],dp[i]+1)
return dp[-1]`],
['diameter-of-binary-tree', `def height(node):
    return 0 if node is None else 1+max(height(node.left),height(node.right))
def diameter(node):
    if node is None: return 0
    return max(height(node.left)+height(node.right),diameter(node.left),diameter(node.right))
return diameter(root)`],
['construct-binary-tree-from-traversals', `def build(pre,ino):
    if not pre: return None
    root=TreeNode(pre[0]); mid=ino.index(pre[0])
    root.left=build(pre[1:mid+1],ino[:mid])
    root.right=build(pre[mid+1:],ino[mid+1:])
    return root
return build(preorder,inorder)`],
];
