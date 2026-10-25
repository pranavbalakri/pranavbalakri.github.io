"""Test-only reference implementations. Never imported into the application bundle."""
def two_sum(nums, target):
    seen = {}
    for i,v in enumerate(nums):
        if target-v in seen: return [seen[target-v],i]
        seen[v]=i

def contains_duplicate(nums): return len(set(nums)) != len(nums)
def valid_anagram(s,t): return Counter(s)==Counter(t)
def group_anagrams(strs):
    groups=defaultdict(list)
    for s in strs: groups[tuple(sorted(s))].append(s)
    return list(groups.values())
def product_of_array_except_self(nums):
    out=[1]*len(nums); value=1
    for i,v in enumerate(nums): out[i]=value; value*=v
    value=1
    for i in range(len(nums)-1,-1,-1): out[i]*=value; value*=nums[i]
    return out

def longest_consecutive_sequence(nums):
    values=set(nums); best=0
    for v in values:
        if v-1 not in values:
            end=v
            while end in values: end+=1
            best=max(best,end-v)
    return best

def subarray_sum_equals_k(nums,k):
    counts=Counter({0:1}); total=answer=0
    for v in nums: total+=v; answer+=counts[total-k]; counts[total]+=1
    return answer

def top_k_frequent_elements(nums,k): return [v for v,n in Counter(nums).most_common(k)]
def rotate_image(matrix): matrix[:]=[list(row) for row in zip(*matrix[::-1])]
def spiral_matrix(matrix):
    result=[]; top=left=0; bottom=len(matrix)-1; right=len(matrix[0])-1
    while top<=bottom and left<=right:
        for c in range(left,right+1): result.append(matrix[top][c])
        top+=1
        for r in range(top,bottom+1): result.append(matrix[r][right])
        right-=1
        if top<=bottom:
            for c in range(right,left-1,-1): result.append(matrix[bottom][c])
            bottom-=1
        if left<=right:
            for r in range(bottom,top-1,-1): result.append(matrix[r][left])
            left+=1
    return result

def set_matrix_zeroes(matrix):
    rows=set(); cols=set()
    for r,row in enumerate(matrix):
        for c,v in enumerate(row):
            if v==0: rows.add(r); cols.add(c)
    for r,row in enumerate(matrix):
        for c in range(len(row)):
            if r in rows or c in cols: matrix[r][c]=0

def valid_palindrome(s):
    s=''.join(c.lower() for c in s if c.isalnum())
    return s==s[::-1]

def three_sum(nums):
    nums.sort(); answer=[]
    for i in range(len(nums)-2):
        if i and nums[i]==nums[i-1]: continue
        l,r=i+1,len(nums)-1
        while l<r:
            total=nums[i]+nums[l]+nums[r]
            if total<0: l+=1
            elif total>0: r-=1
            else:
                answer.append([nums[i],nums[l],nums[r]]); l+=1; r-=1
                while l<r and nums[l]==nums[l-1]: l+=1
    return answer

def container_with_most_water(height):
    l,r=0,len(height)-1; best=0
    while l<r:
        best=max(best,(r-l)*min(height[l],height[r]))
        if height[l]<height[r]: l+=1
        else: r-=1
    return best

def trapping_rain_water(height):
    l,r=0,len(height)-1; a=b=answer=0
    while l<=r:
        if a<=b: a=max(a,height[l]); answer+=a-height[l]; l+=1
        else: b=max(b,height[r]); answer+=b-height[r]; r-=1
    return answer

def move_zeroes(nums):
    write=0
    for v in nums:
        if v: nums[write]=v; write+=1
    for i in range(write,len(nums)): nums[i]=0

def longest_substring_without_repeating_characters(s):
    seen={}; left=best=0
    for right,c in enumerate(s):
        left=max(left,seen.get(c,-1)+1); seen[c]=right; best=max(best,right-left+1)
    return best

def longest_repeating_character_replacement(s,k):
    counts=Counter(); left=best=most=0
    for right,c in enumerate(s):
        counts[c]+=1; most=max(most,counts[c])
        while right-left+1-most>k: counts[s[left]]-=1; left+=1
        best=max(best,right-left+1)
    return best

def minimum_window_substring(s,t):
    need=Counter(t); missing=len(t); left=0; start=end=0
    for right,c in enumerate(s,1):
        if need[c]>0: missing-=1
        need[c]-=1
        if missing==0:
            while need[s[left]]<0: need[s[left]]+=1; left+=1
            if end==0 or right-left<end-start: start,end=left,right
            need[s[left]]+=1; missing+=1; left+=1
    return s[start:end]

def permutation_in_string(s1,s2):
    need=Counter(s1); window=Counter(); n=len(s1)
    for i,c in enumerate(s2):
        window[c]+=1
        if i>=n: window[s2[i-n]]-=1
        if i>=n-1 and window==need: return True
    return False

def sliding_window_maximum(nums,k):
    q=deque(); out=[]
    for i,v in enumerate(nums):
        while q and q[0]<=i-k: q.popleft()
        while q and nums[q[-1]]<=v: q.pop()
        q.append(i)
        if i>=k-1: out.append(nums[q[0]])
    return out

def valid_parentheses(s):
    stack=[]; pairs={')':'(',']':'[','}':'{'}
    for c in s:
        if c in pairs:
            if not stack or stack.pop()!=pairs[c]: return False
        else: stack.append(c)
    return not stack

def daily_temperatures(temperatures):
    stack=[]; out=[0]*len(temperatures)
    for i,v in enumerate(temperatures):
        while stack and temperatures[stack[-1]]<v:
            j=stack.pop(); out[j]=i-j
        stack.append(i)
    return out

def next_greater_element_ii(nums):
    stack=[]; n=len(nums); out=[-1]*n
    for i in range(2*n):
        while stack and nums[stack[-1]]<nums[i%n]: out[stack.pop()]=nums[i%n]
        if i<n: stack.append(i)
    return out

def largest_rectangle_in_histogram(heights):
    stack=[]; best=0
    for i,h in enumerate(list(heights)+[0]):
        start=i
        while stack and stack[-1][1]>h:
            start,v=stack.pop(); best=max(best,v*(i-start))
        stack.append((start,h))
    return best

def maximal_rectangle(matrix):
    heights=[0]*len(matrix[0]); best=0
    for row in matrix:
        for i,c in enumerate(row): heights[i]=heights[i]+1 if c=='1' else 0
        stack=[]
        for i,h in enumerate(heights+[0]):
            start=i
            while stack and stack[-1][1]>h:
                start,v=stack.pop(); best=max(best,v*(i-start))
            stack.append((start,h))
    return best

def binary_search(nums,target):
    i=bisect_left(nums,target)
    return i if i<len(nums) and nums[i]==target else -1

def search_a_2d_matrix(matrix,target):
    n=len(matrix[0]); lo,hi=0,len(matrix)*n
    while lo<hi:
        mid=(lo+hi)//2
        if matrix[mid//n][mid%n]<target: lo=mid+1
        else: hi=mid
    return lo<len(matrix)*n and matrix[lo//n][lo%n]==target

def search_in_rotated_sorted_array(nums,target):
    lo,hi=0,len(nums)-1
    while lo<=hi:
        mid=(lo+hi)//2
        if nums[mid]==target: return mid
        if nums[lo]<=nums[mid]:
            if nums[lo]<=target<nums[mid]: hi=mid-1
            else: lo=mid+1
        else:
            if nums[mid]<target<=nums[hi]: lo=mid+1
            else: hi=mid-1
    return -1

def find_minimum_in_rotated_sorted_array(nums):
    lo,hi=0,len(nums)-1
    while lo<hi:
        mid=(lo+hi)//2
        if nums[mid]>nums[hi]: lo=mid+1
        else: hi=mid
    return nums[lo]

def find_first_and_last_position(nums,target):
    a,b=bisect_left(nums,target),bisect_right(nums,target)
    return [a,b-1] if a<b else [-1,-1]

def reverse_linked_list(head):
    prev=None
    while head: nxt=head.next; head.next=prev; prev,head=head,nxt
    return prev

def merge_two_sorted_lists(list1,list2):
    dummy=tail=ListNode()
    while list1 and list2:
        if list1.val<=list2.val: tail.next=list1; list1=list1.next
        else: tail.next=list2; list2=list2.next
        tail=tail.next
    tail.next=list1 or list2
    return dummy.next

def linked_list_cycle(head):
    slow=fast=head
    while fast and fast.next:
        slow=slow.next; fast=fast.next.next
        if slow is fast: return True
    return False

def remove_nth_node_from_end_of_list(head,n):
    dummy=ListNode(0,head); slow=fast=dummy
    for _ in range(n): fast=fast.next
    while fast.next: slow=slow.next; fast=fast.next
    slow.next=slow.next.next
    return dummy.next

def reorder_list(head):
    if not head: return
    slow=fast=head
    while fast.next and fast.next.next: slow=slow.next; fast=fast.next.next
    tail=slow.next; slow.next=None; prev=None
    while tail: nxt=tail.next; tail.next=prev; prev,tail=tail,nxt
    while prev: a,b=head.next,prev.next; head.next=prev; prev.next=a; head,prev=a,b

def add_two_numbers(l1,l2):
    dummy=tail=ListNode(); carry=0
    while l1 or l2 or carry:
        total=carry+(l1.val if l1 else 0)+(l2.val if l2 else 0); carry,digit=divmod(total,10)
        tail.next=ListNode(digit); tail=tail.next
        l1=l1.next if l1 else None; l2=l2.next if l2 else None
    return dummy.next

def invert_binary_tree(root):
    def walk(node):
        if node: node.left,node.right=walk(node.right),walk(node.left)
        return node
    return walk(root)

def maximum_depth_of_binary_tree(root):
    def depth(node): return 1+max(depth(node.left),depth(node.right)) if node else 0
    return depth(root)

def balanced_binary_tree(root):
    def height(node):
        if not node: return 0
        a,b=height(node.left),height(node.right)
        return -1 if a<0 or b<0 or abs(a-b)>1 else max(a,b)+1
    return height(root)>=0

def diameter_of_binary_tree(root):
    best=0
    def depth(node):
        nonlocal best
        if not node: return 0
        a,b=depth(node.left),depth(node.right); best=max(best,a+b)
        return max(a,b)+1
    depth(root); return best

def same_tree(p,q):
    def same(a,b): return a is b if not a or not b else a.val==b.val and same(a.left,b.left) and same(a.right,b.right)
    return same(p,q)

def subtree_of_another_tree(root,subRoot):
    def same(a,b): return a is b if not a or not b else a.val==b.val and same(a.left,b.left) and same(a.right,b.right)
    def walk(node): return bool(node) and (same(node,subRoot) or walk(node.left) or walk(node.right))
    return walk(root)

def binary_tree_level_order_traversal(root):
    q=deque([root] if root else []); result=[]
    while q:
        row=[]
        for _ in range(len(q)):
            node=q.popleft(); row.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        result.append(row)
    return result

def validate_binary_search_tree(root):
    def valid(node,lo,hi): return not node or lo<node.val<hi and valid(node.left,lo,node.val) and valid(node.right,node.val,hi)
    return valid(root,-inf,inf)

def kth_smallest_element_in_a_bst(root,k):
    stack=[]
    while root or stack:
        while root: stack.append(root); root=root.left
        root=stack.pop(); k-=1
        if k==0: return root.val
        root=root.right

def lowest_common_ancestor(root,p,q):
    def walk(node):
        if node is None or node is p or node is q: return node
        a,b=walk(node.left),walk(node.right)
        return node if a and b else a or b
    return walk(root)

def binary_tree_right_side_view(root):
    q=deque([root] if root else []); result=[]
    while q:
        for _ in range(len(q)):
            node=q.popleft()
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        result.append(node.val)
    return result

def construct_binary_tree_from_traversals(preorder,inorder):
    positions={v:i for i,v in enumerate(inorder)}; index=0
    def build(lo,hi):
        nonlocal index
        if lo>=hi: return None
        value=preorder[index]; index+=1; mid=positions[value]
        return TreeNode(value,build(lo,mid),build(mid+1,hi))
    return build(0,len(inorder))

def kth_largest_element_in_an_array(nums,k): return sorted(nums,reverse=True)[k-1]
def k_closest_points_to_origin(points,k): return sorted(points,key=lambda p:p[0]**2+p[1]**2)[:k]
def merge_k_sorted_lists(lists):
    heap=[]; sequence=0
    for node in lists:
        if node: heappush(heap,(node.val,sequence,node)); sequence+=1
    dummy=tail=ListNode()
    while heap:
        _,_,node=heappop(heap); tail.next=node; tail=node
        if node.next: heappush(heap,(node.next.val,sequence,node.next)); sequence+=1
    return dummy.next

def subsets(nums):
    result=[[]]
    for v in nums: result += [row+[v] for row in result]
    return result

def permutations(nums): return list(itertools.permutations(nums))
def combination_sum(candidates,target):
    candidates.sort(); result=[]
    def dfs(start,left,path):
        if left==0: result.append(path[:]); return
        for i in range(start,len(candidates)):
            if candidates[i]>left: break
            path.append(candidates[i]); dfs(i,left-candidates[i],path); path.pop()
    dfs(0,target,[]); return result

def generate_parentheses(n):
    result=[]
    def dfs(text,a,b):
        if b==n: result.append(text); return
        if a<n: dfs(text+'(',a+1,b)
        if b<a: dfs(text+')',a,b+1)
    dfs('',0,0); return result

def word_search(board,word):
    counts=Counter(c for row in board for c in row)
    if Counter(word)-counts: return False
    rows,cols=len(board),len(board[0])
    def dfs(r,c,i):
        if i==len(word): return True
        if not (0<=r<rows and 0<=c<cols) or board[r][c]!=word[i]: return False
        old=board[r][c]; board[r][c]='#'
        found=any(dfs(r+dr,c+dc,i+1) for dr,dc in ((1,0),(-1,0),(0,1),(0,-1)))
        board[r][c]=old; return found
    return any(dfs(r,c,0) for r in range(rows) for c in range(cols))

def number_of_islands(grid):
    rows,cols=len(grid),len(grid[0]); answer=0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c]!='1': continue
            answer+=1; grid[r][c]='0'; stack=[(r,c)]
            while stack:
                a,b=stack.pop()
                for x,y in ((a-1,b),(a+1,b),(a,b-1),(a,b+1)):
                    if 0<=x<rows and 0<=y<cols and grid[x][y]=='1': grid[x][y]='0'; stack.append((x,y))
    return answer

def max_area_of_island(grid):
    rows,cols=len(grid),len(grid[0]); answer=0
    for r in range(rows):
        for c in range(cols):
            if not grid[r][c]: continue
            grid[r][c]=0; stack=[(r,c)]; area=0
            while stack:
                a,b=stack.pop(); area+=1
                for x,y in ((a-1,b),(a+1,b),(a,b-1),(a,b+1)):
                    if 0<=x<rows and 0<=y<cols and grid[x][y]: grid[x][y]=0; stack.append((x,y))
            answer=max(answer,area)
    return answer

def course_schedule(numCourses,prerequisites):
    adj=[[] for _ in range(numCourses)]; degree=[0]*numCourses
    for a,b in prerequisites: adj[b].append(a); degree[a]+=1
    q=deque(i for i in range(numCourses) if not degree[i]); count=0
    while q:
        node=q.popleft(); count+=1
        for nxt in adj[node]:
            degree[nxt]-=1
            if degree[nxt]==0: q.append(nxt)
    return count==numCourses

def course_schedule_ii(numCourses,prerequisites):
    adj=[[] for _ in range(numCourses)]; degree=[0]*numCourses
    for a,b in prerequisites: adj[b].append(a); degree[a]+=1
    q=deque(i for i in range(numCourses) if not degree[i]); order=[]
    while q:
        node=q.popleft(); order.append(node)
        for nxt in adj[node]:
            degree[nxt]-=1
            if degree[nxt]==0: q.append(nxt)
    return order if len(order)==numCourses else []

def number_of_provinces(isConnected):
    seen=set(); answer=0
    for i in range(len(isConnected)):
        if i in seen: continue
        answer+=1; seen.add(i); stack=[i]
        while stack:
            node=stack.pop()
            for j,edge in enumerate(isConnected[node]):
                if edge and j not in seen: seen.add(j); stack.append(j)
    return answer

def redundant_connection(edges):
    parent=list(range(len(edges)+1)); size=[1]*len(parent)
    def find(x):
        while parent[x]!=x: parent[x]=parent[parent[x]]; x=parent[x]
        return x
    for a,b in edges:
        x,y=find(a),find(b)
        if x==y: return [a,b]
        if size[x]<size[y]: x,y=y,x
        parent[y]=x; size[x]+=size[y]

def shortest_path_in_binary_matrix(grid):
    n=len(grid)
    if grid[0][0] or grid[-1][-1]: return -1
    q=deque([(0,0,1)]); grid[0][0]=1
    while q:
        r,c,d=q.popleft()
        if r==c==n-1: return d
        for dr in (-1,0,1):
            for dc in (-1,0,1):
                a,b=r+dr,c+dc
                if 0<=a<n and 0<=b<n and grid[a][b]==0: grid[a][b]=1; q.append((a,b,d+1))
    return -1

def climbing_stairs(n):
    a,b=1,1
    for _ in range(n): a,b=b,a+b
    return a

def house_robber(nums):
    a=b=0
    for v in nums: a,b=b,max(b,a+v)
    return b

def house_robber_ii(nums):
    def rob(values):
        a=b=0
        for v in values: a,b=b,max(b,a+v)
        return b
    return nums[0] if len(nums)==1 else max(rob(nums[:-1]),rob(nums[1:]))

def coin_change(coins,amount):
    dp=[amount+1]*(amount+1); dp[0]=0
    for total in range(1,amount+1):
        for coin in coins:
            if coin<=total: dp[total]=min(dp[total],dp[total-coin]+1)
    return dp[amount] if dp[amount]<=amount else -1

def coin_change_ii(amount,coins):
    dp=[0]*(amount+1); dp[0]=1
    for coin in coins:
        for total in range(coin,amount+1): dp[total]+=dp[total-coin]
    return dp[amount]

def longest_increasing_subsequence(nums):
    tails=[]
    for v in nums:
        i=bisect_left(tails,v)
        if i==len(tails): tails.append(v)
        else: tails[i]=v
    return len(tails)

def longest_common_subsequence(text1,text2):
    dp=[0]*(len(text2)+1)
    for a in text1:
        previous=0
        for j,b in enumerate(text2,1):
            old=dp[j]; dp[j]=previous+1 if a==b else max(dp[j],dp[j-1]); previous=old
    return dp[-1]

def word_break(s,wordDict):
    words=set(wordDict); length=max(map(len,words)); dp=[True]+[False]*len(s)
    for i in range(1,len(s)+1): dp[i]=any(dp[j] and s[j:i] in words for j in range(max(0,i-length),i))
    return dp[-1]

def unique_paths(m,n):
    row=[1]*n
    for _ in range(m-1):
        for j in range(1,n): row[j]+=row[j-1]
    return row[-1]

def decode_ways(s):
    a,b=1,int(s[0]!='0')
    for i in range(1,len(s)): a,b=b,(b if s[i]!='0' else 0)+(a if 10<=int(s[i-1:i+1])<=26 else 0)
    return b

def edit_distance(word1,word2):
    dp=list(range(len(word2)+1))
    for i,a in enumerate(word1,1):
        row=[i]
        for j,b in enumerate(word2,1): row.append(dp[j-1] if a==b else 1+min(dp[j],row[-1],dp[j-1]))
        dp=row
    return dp[-1]

def maximum_product_subarray(nums):
    hi=lo=answer=nums[0]
    for v in nums[1:]: hi,lo=max(v,v*hi,v*lo),min(v,v*hi,v*lo); answer=max(answer,hi)
    return answer

def longest_palindromic_substring(s):
    best=''
    for center in range(2*len(s)-1):
        l,r=center//2,(center+1)//2
        while l>=0 and r<len(s) and s[l]==s[r]:
            if r-l+1>len(best): best=s[l:r+1]
            l-=1; r+=1
    return best

def palindromic_substrings(s):
    answer=0
    for center in range(2*len(s)-1):
        l,r=center//2,(center+1)//2
        while l>=0 and r<len(s) and s[l]==s[r]: answer+=1; l-=1; r+=1
    return answer

def partition_equal_subset_sum(nums):
    total=sum(nums)
    if total%2: return False
    reachable=1
    for v in nums: reachable|=reachable<<v
    return bool(reachable&(1<<(total//2)))

def maximum_subarray(nums):
    best=running=nums[0]
    for v in nums[1:]: running=max(v,running+v); best=max(best,running)
    return best

def jump_game(nums):
    reach=0
    for i,v in enumerate(nums):
        if i>reach: return False
        reach=max(reach,i+v)
    return True

def jump_game_ii(nums):
    end=far=answer=0
    for i in range(len(nums)-1):
        far=max(far,i+nums[i])
        if i==end: answer+=1; end=far
    return answer

def merge_intervals(intervals):
    result=[]
    for start,end in sorted(intervals):
        if result and start<=result[-1][1]: result[-1][1]=max(result[-1][1],end)
        else: result.append([start,end])
    return result

def insert_interval(intervals,newInterval):
    left=[]; right=[]; a,b=newInterval
    for start,end in intervals:
        if end<a: left.append([start,end])
        elif start>b: right.append([start,end])
        else: a=min(a,start); b=max(b,end)
    return left+[[a,b]]+right

def non_overlapping_intervals(intervals):
    end=-inf; removed=0
    for a,b in sorted(intervals,key=lambda p:p[1]):
        if a<end: removed+=1
        else: end=b
    return removed

def single_number(nums):
    answer=0
    for v in nums: answer^=v
    return answer

def counting_bits(n):
    out=[0]*(n+1)
    for i in range(1,n+1): out[i]=out[i>>1]+(i&1)
    return out

def number_of_1_bits(n):
    answer=0
    while n: n&=n-1; answer+=1
    return answer

def missing_number(nums): return len(nums)*(len(nums)+1)//2-sum(nums)

class Trie:
    def __init__(self): self.root={}
    def insert(self,word):
        node=self.root
        for c in word: node=node.setdefault(c,{})
        node['']=True
    def search(self,word):
        node=self.root
        for c in word:
            if c not in node: return False
            node=node[c]
        return '' in node
    def startsWith(self,prefix):
        node=self.root
        for c in prefix:
            if c not in node: return False
            node=node[c]
        return True
