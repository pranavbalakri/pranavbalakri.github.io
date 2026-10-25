"""Deterministic large fixtures. Expected answers use constructions, not submitted code."""
from itertools import combinations as _combinations, permutations as _permutations, combinations_with_replacement as _combinations_with_replacement
from math import comb as _comb


def _stress(label, inputs, expected, work=0, complexity=''):
    return {'input': inputs, 'expected': expected, 'hidden': True, 'stress': label,
            'workLimit': work, 'complexity': complexity}


def _bst_values(n):
    # Level-order encoding of a balanced BST containing 0..n-1.
    from collections import deque
    queue, result = deque([(0, n)]), []
    while queue:
        lo, hi = queue.popleft()
        if lo >= hi:
            result.append(None)
        else:
            mid = (lo + hi) // 2
            result.append(mid)
            queue.extend(((lo, mid), (mid + 1, hi)))
    while result and result[-1] is None:
        result.pop()
    return result


def _lap_stress_cases(slug):
    def linear(label, inputs, expected, n):
        return [_stress(label, inputs, expected, 64 * n + 256, 'linear input work')]
    if slug == 'two-sum':
        return linear('10,000 values; the only pair is at the end', {'nums': [1]*9998+[2,3], 'target': 5}, [9998,9999], 10000)
    if slug == 'contains-duplicate':
        return linear('100,000 distinct values', {'nums': [(i*7919)%100000 for i in range(100000)]}, False, 100000)
    if slug == 'valid-anagram':
        return [_stress('50,000-character anagrams', {'s': 'a'*25000+'b'*25000, 't': 'ba'*25000}, True)]
    if slug == 'group-anagrams':
        words = ['a'*(i%20)+'b'*(i//20%20)+'c'*(i//400)+'d' for i in range(10000)]
        return [_stress('10,000 different anagram groups', {'strs': words}, [[word] for word in words])]
    if slug == 'product-of-array-except-self':
        return linear('100,000 values, including two zeros', {'nums': [1]*49999+[0]+[-1]*49999+[0]}, [0]*100000, 100000)
    if slug == 'longest-consecutive-sequence':
        return linear('100,000 values in one consecutive run', {'nums': [(i*7919)%100000 for i in range(100000)]}, 100000, 100000)
    if slug == 'subarray-sum-equals-k':
        return linear('20,000 zeros; every subarray matches', {'nums': [0]*20000, 'k': 0}, 20000*20001//2, 20000)
    if slug == 'top-k-frequent-elements':
        return linear('100,000 values with 50,001 distinct keys', {'nums': [7]*50000+list(range(10000,60000)), 'k': 1}, [7], 100000)
    if slug == 'rotate-image':
        matrix = [[r*20+c for c in range(20)] for r in range(20)]
        return linear('20 by 20 matrix', {'matrix': matrix}, [[(19-c)*20+r for c in range(20)] for r in range(20)], 400)
    if slug == 'spiral-matrix':
        # Label cells by their position along the spiral; the expected output is a range.
        a = [[0]*10 for _ in range(10)]; top, bottom, left, right, v = 0,9,0,9,0
        while top <= bottom and left <= right:
            for c in range(left,right+1): a[top][c]=v; v+=1
            top+=1
            for r in range(top,bottom+1): a[r][right]=v; v+=1
            right-=1
            if top <= bottom:
                for c in range(right,left-1,-1): a[bottom][c]=v; v+=1
                bottom-=1
            if left <= right:
                for r in range(bottom,top-1,-1): a[r][left]=v; v+=1
                left+=1
        return linear('10 by 10 spiral', {'matrix': a}, list(range(100)), 100)
    if slug == 'set-matrix-zeroes':
        a = [[0 if r==c else 1 for c in range(200)] for r in range(200)]
        return linear('200 by 200 matrix with diagonal zeros', {'matrix': a}, [[0]*200 for _ in range(200)], 40000)
    if slug == 'valid-palindrome':
        return [_stress('200,000 characters with punctuation', {'s': 'A!'*100000}, True)]
    if slug == '3sum':
        return [_stress('1,200 positive values; no triplets', {'nums': list(range(1,1201))}, [], 16*1200*1200, 'quadratic input work')]
    if slug == 'container-with-most-water':
        return linear('100,000 equal heights', {'height': [10000]*100000}, 99999*10000, 100000)
    if slug == 'trapping-rain-water':
        return linear('20,000 bars around a deep basin', {'height': [100000]+[0]*19998+[100000]}, 19998*100000, 20000)
    if slug == 'move-zeroes':
        return linear('10,000 alternating zeros and nonzeros', {'nums': [0,1]*5000}, [1]*5000+[0]*5000, 10000)
    if slug == 'longest-substring-without-repeating-characters':
        return [_stress('50,000 characters, a repeated 95-character alphabet', {'s': (''.join(chr(i) for i in range(32,127))*527)[:50000]}, 95)]
    if slug == 'longest-repeating-character-replacement':
        return [_stress('100,000 alternating characters', {'s': 'AB'*50000, 'k': 25000}, 50001)]
    if slug == 'minimum-window-substring':
        return [_stress('The only covering window spans 100,000 characters', {'s': 'A'+'x'*99998+'B', 't': 'AB'}, 'A'+'x'*99998+'B')]
    if slug == 'permutation-in-string':
        return [_stress('10,000-character text; no matching window', {'s1': 'a'*4999+'b', 's2': 'a'*10000}, False)]
    if slug == 'sliding-window-maximum':
        return linear('100,000 decreasing values, window 50,000', {'nums': list(range(100000,0,-1)), 'k': 50000}, list(range(100000,49999,-1)), 100000)
    if slug == 'valid-parentheses':
        return [_stress('10,000 deeply nested brackets', {'s': '('*5000+')'*5000}, True)]
    if slug == 'daily-temperatures':
        return linear('100,000 equal temperatures; no warmer day', {'temperatures': [70]*100000}, [0]*100000, 100000)
    if slug == 'next-greater-element-ii':
        return linear('10,000 decreasing values; wraparound required', {'nums': list(range(10000,0,-1))}, [-1]+[10000]*9999, 10000)
    if slug == 'largest-rectangle-in-histogram':
        return linear('100,000 equal-height bars', {'heights': [10000]*100000}, 1000000000, 100000)
    if slug == 'maximal-rectangle':
        return linear('200 by 200 solid rectangle', {'matrix': [['1']*200 for _ in range(200)]}, 40000, 40000)
    if slug in ('binary-search','search-in-rotated-sorted-array','find-minimum-in-rotated-sorted-array','find-first-and-last-position','search-a-2d-matrix'):
        n = 10000 if slug in ('binary-search','search-a-2d-matrix') else 100000 if slug == 'find-first-and-last-position' else 5000
        budget = 24*n.bit_length()+32
        if slug == 'binary-search':
            return [_stress('10,000 sorted values; target at the end', {'nums': list(range(n)), 'target': n-1}, n-1, budget, 'O(log n)'), _stress('10,000 sorted values; absent target', {'nums': list(range(n)), 'target': n}, -1, budget, 'O(log n)')]
        if slug == 'search-a-2d-matrix':
            return [_stress('100 by 100 sorted matrix; target at the end', {'matrix': [list(range(r*100,r*100+100)) for r in range(100)], 'target': 9999}, True, budget, 'O(log(m × n))')]
        if slug == 'find-first-and-last-position':
            return [_stress('100,000 equal values; both boundaries required', {'nums': [7]*n, 'target': 7}, [0,n-1], budget, 'O(log n)')]
        a = list(range(1731,n))+list(range(1731))
        if slug == 'find-minimum-in-rotated-sorted-array':
            return [_stress('5,000 rotated values', {'nums': a}, 0, budget, 'O(log n)')]
        return [_stress('5,000 rotated values; target at the end', {'nums': a, 'target': 1730}, n-1, budget, 'O(log n)'), _stress('5,000 rotated values; absent target', {'nums': a, 'target': -1}, -1, budget, 'O(log n)')]
    if slug == 'reverse-linked-list':
        return [_stress('5,000 linked nodes', {'head': list(range(5000))}, list(range(4999,-1,-1)))]
    if slug == 'merge-two-sorted-lists':
        return [_stress('Two interleaved 50-node lists', {'list1': list(range(0,100,2)), 'list2': list(range(1,100,2))}, list(range(100)))]
    if slug == 'linked-list-cycle':
        return [_stress('10,000 nodes; cycle returns to the head', {'head': list(range(10000)), 'pos': 0}, True)]
    if slug == 'remove-nth-node-from-end-of-list':
        return [_stress('30 nodes; remove the tail', {'head': list(range(30)), 'n': 1}, list(range(29)))]
    if slug == 'reorder-list':
        return [_stress('50,000 linked nodes', {'head': list(range(50000))}, [v for i in range(25000) for v in (i,49999-i)])]
    if slug == 'add-two-numbers':
        return [_stress('Carry through 100 digits', {'l1': [9]*100, 'l2': [1]}, [0]*100+[1])]
    if slug == 'invert-binary-tree':
        a=list(range(63)); out=[]
        for depth in range(6): out.extend(reversed(a[2**depth-1:2**(depth+1)-1]))
        return [_stress('63-node perfect tree', {'root': a}, out)]
    if slug == 'maximum-depth-of-binary-tree':
        return [_stress('10,000-node complete tree', {'root': [1]*10000}, 14)]
    if slug == 'balanced-binary-tree':
        return [_stress('4,095-node perfect tree', {'root': [1]*4095}, True)]
    if slug == 'diameter-of-binary-tree':
        return [_stress('8,191-node perfect tree', {'root': [1]*8191}, 24),
                _stress('3,000-node spine; repeated height scans are expensive', {'root': [v for i in range(3000) for v in (i,None)][:-1]}, 2999)]
    if slug == 'same-tree':
        return [_stress('100 nodes differing only at the last leaf', {'p': [1]*100, 'q': [1]*99+[2]}, False)]
    if slug == 'subtree-of-another-tree':
        return [_stress('Repeated values, mismatch at a leaf', {'root': [1]*2000, 'subRoot': [1]*999+[2]}, False)]
    if slug == 'binary-tree-level-order-traversal':
        return [_stress('2,000-node complete tree', {'root': list(range(2000))}, [list(range(2**d-1,min(2**(d+1)-1,2000))) for d in range(11)])]
    if slug == 'validate-binary-search-tree':
        return [_stress('10,000-node balanced BST', {'root': _bst_values(10000)}, True)]
    if slug == 'kth-smallest-element-in-a-bst':
        return [_stress('Largest rank in a 10,000-node BST', {'root': _bst_values(10000), 'k': 10000}, 9999)]
    if slug == 'lowest-common-ancestor':
        return [_stress('100,000 nodes; targets in opposite root branches', {'root': list(range(100000)), 'p': 65535, 'q': 98303}, 0)]
    if slug == 'binary-tree-right-side-view':
        return [_stress('100-node complete tree', {'root': list(range(100))}, [0,2,6,14,30,62,99])]
    if slug == 'construct-binary-tree-from-traversals':
        # Leave headroom for recursive solutions while exposing repeated slicing.
        return [_stress('900-node right spine', {'preorder': list(range(900)), 'inorder': list(range(900))}, [v for i in range(900) for v in (i,None)][:-1])]
    if slug == 'kth-largest-element-in-an-array':
        return [_stress('100,000 permuted values; middle rank', {'nums': [(i*7919)%100000 for i in range(100000)], 'k': 50000}, 50000)]
    if slug == 'k-closest-points-to-origin':
        return [_stress('10,000 points; select the closest half', {'points': [[i,0] for i in range(9999,-1,-1)], 'k': 5000}, [[i,0] for i in range(5000)])]
    if slug == 'merge-k-sorted-lists':
        return [_stress('10,000 singleton linked lists', {'lists': [[i] for i in range(9999,-1,-1)]}, list(range(10000)))]
    if slug == 'subsets':
        return [_stress('All 1,024 subsets of ten values', {'nums': list(range(10))}, [list(x) for k in range(11) for x in _combinations(range(10),k)])]
    if slug == 'permutations':
        return [_stress('All 720 permutations of six values', {'nums': list(range(6))}, list(_permutations(range(6))))]
    if slug == 'combination-sum':
        candidates=list(range(25,55))
        expected=[list(x) for k in (2,3) for x in _combinations_with_replacement(candidates,k) if sum(x)==80]
        return [_stress('30 candidates with bounded output', {'candidates': candidates, 'target': 80}, expected)]
    if slug == 'generate-parentheses':
        # Generate Dyck paths from positions of opening brackets.
        expected=[]
        for positions in _combinations(range(16),8):
            positions=set(positions); balance=0; chars=[]
            for i in range(16):
                balance += 1 if i in positions else -1
                if balance < 0: break
                chars.append('(' if i in positions else ')')
            else: expected.append(''.join(chars))
        return [_stress('All 1,430 strings for eight pairs', {'n': 8}, expected)]
    if slug == 'word-search':
        return [_stress('6 by 6 repeated board; no matching path', {'board': [['A']*6 for _ in range(6)], 'word': 'A'*8+'B'}, False)]
    if slug == 'number-of-islands':
        return linear('300 by 300 checkerboard of isolated islands', {'grid': [['1' if (r+c)%2 else '0' for c in range(300)] for r in range(300)]}, 45000, 90000)
    if slug == 'max-area-of-island':
        return linear('50 by 50 connected island', {'grid': [[1]*50 for _ in range(50)]}, 2500, 2500)
    if slug in ('course-schedule','course-schedule-ii'):
        edges=[[i,i-1] for i in range(1,2000)]
        expected=True if slug=='course-schedule' else list(range(2000))
        cycle=False if slug=='course-schedule' else []
        return [_stress('2,000-course reverse dependency chain', {'numCourses':2000,'prerequisites':edges[::-1]}, expected), _stress('2,000-course cycle', {'numCourses':2000,'prerequisites':edges+[[0,1999]]}, cycle)]
    if slug == 'number-of-provinces':
        return linear('200-node complete graph', {'isConnected': [[1]*200 for _ in range(200)]}, 1, 40000)
    if slug == 'redundant-connection':
        return [_stress('1,000-node chain closed by its final edge', {'edges': [[i,i+1] for i in range(1,1000)]+[[1,1000]]}, [1,1000])]
    if slug == 'shortest-path-in-binary-matrix':
        return linear('100 by 100 open grid', {'grid': [[0]*100 for _ in range(100)]}, 100, 10000)
    if slug == 'climbing-stairs':
        return [_stress('45 steps', {'n':45}, 1836311903)]
    if slug == 'house-robber':
        return linear('100 equal-value houses', {'nums':[400]*100}, 20000, 100)
    if slug == 'house-robber-ii':
        return linear('99 equal-value houses in a circle', {'nums':[1000]*99}, 49000, 99)
    if slug == 'coin-change':
        return [_stress('Amount 9,999, unreachable using even coins', {'coins':[2,4,6,8,10,12,14,16,18,20,22,24],'amount':9999}, -1), _stress('Amount 10,000 with twelve denominations', {'coins':list(range(1,13)),'amount':10000}, 834)]
    if slug == 'coin-change-ii':
        return [_stress('5,000 units with denominations one and two', {'amount':5000,'coins':[1,2]}, 2501)]
    if slug == 'longest-increasing-subsequence':
        return [_stress('2,500 strictly increasing values', {'nums':list(range(2500))}, 2500, 32*2500*(2500).bit_length(), 'O(n log n) input work')]
    if slug == 'longest-common-subsequence':
        return [_stress('Two 1,000-character strings with no common character', {'text1':'a'*1000,'text2':'b'*1000}, 0)]
    if slug == 'word-break':
        return [_stress('300-character overlapping prefixes ending in a mismatch', {'s':'a'*299+'b','wordDict':['a'*i for i in range(1,21)]}, False)]
    if slug == 'unique-paths':
        return [_stress('17 by 17 grid', {'m':17,'n':17}, _comb(32,16))]
    if slug == 'decode-ways':
        a,b=1,1
        for _ in range(100): a,b=b,a+b
        return [_stress('100 digits, every adjacent pair decodable', {'s':'1'*100}, a)]
    if slug == 'edit-distance':
        return [_stress('Two different 500-character strings', {'word1':'a'*500,'word2':'b'*500}, 500)]
    if slug == 'maximum-product-subarray':
        return linear('20,000 alternating signs', {'nums':[-1,1]*10000}, 1, 20000)
    if slug == 'longest-palindromic-substring':
        return [_stress('1,000 equal characters', {'s':'a'*1000}, 'a'*1000)]
    if slug == 'palindromic-substrings':
        return [_stress('1,000 equal characters', {'s':'a'*1000}, 500500)]
    if slug == 'partition-equal-subset-sum':
        return [_stress('200 even values with an odd half-sum', {'nums':[100]*199+[98]}, False)]
    if slug == 'maximum-subarray':
        return linear('100,000 alternating losses and gains', {'nums':[-1,2]*50000}, 50001, 100000)
    if slug == 'jump-game':
        return linear('10,000 positions; every early jump ends before a barrier', {'nums':list(range(9998,0,-1))+[0,0]}, False, 10000)
    if slug == 'jump-game-ii':
        return linear('10,000 positions, each jump bounded by 1,000', {'nums':[1000]*10000}, 10, 10000)
    if slug == 'merge-intervals':
        return [_stress('10,000 nested intervals in reverse order', {'intervals':[[i,20000-i] for i in range(9999,-1,-1)]}, [[0,20000]])]
    if slug == 'insert-interval':
        return linear('10,000 disjoint intervals covered by one insertion', {'intervals':[[3*i,3*i+1] for i in range(10000)],'newInterval':[0,30000]}, [[0,30000]], 10000)
    if slug == 'non-overlapping-intervals':
        return [_stress('100,000 intervals sharing a common point', {'intervals':[[i,200000-i] for i in range(100000)]}, 99999)]
    if slug == 'single-number':
        return linear('29,999 entries with the unique value last', {'nums':list(range(14999))*2+[20000]}, 20000, 30000)
    if slug == 'counting-bits':
        return [_stress('All bit counts through 100,000', {'n':100000}, [i.bit_count() for i in range(100001)])]
    if slug == 'number-of-1-bits':
        return [_stress('All 32 bits set', {'n':2**32-1}, 32)]
    if slug == 'missing-number':
        return linear('10,000 values; the largest value is missing', {'nums':list(range(9999,-1,-1))}, 10000, 10000)
    if slug == 'implement-trie':
        words=['a'+''.join(chr(97+(i//26**j)%26) for j in range(4)) for i in range(15000)]
        prefixes=['z'+word[1:] for word in words]
        return [_stress('15,000 inserts followed by 15,000 missing-prefix queries', {'operations':['insert']*15000+['startsWith']*15000,'arguments':[[word] for word in words+prefixes]}, [None]*15000+[False]*15000)]
    raise ValueError(f'Missing performance fixtures for {slug}')


def _stress_work_spec(slug, case):
    if case['workLimit']:
        return case['workLimit'], case['complexity']
    x = case['input']
    def size(value):
        if isinstance(value, (list, tuple)):
            return 1 + sum(size(v) for v in value)
        if isinstance(value, str): return len(value)
        return 1
    n = sum(size(v) for v in x.values())
    target = 'work proportional to the input and output size'
    if slug in ('coin-change','coin-change-ii'):
        n = (x['amount']+1)*len(x['coins']); target = 'O(amount × number of coins) work'
    elif slug == 'longest-common-subsequence':
        n = len(x['text1'])*len(x['text2']); target = 'O(m × n) work'
    elif slug == 'edit-distance':
        n = (len(x['word1'])+1)*(len(x['word2'])+1); target = 'O(m × n) work'
    elif slug in ('longest-palindromic-substring','palindromic-substrings'):
        n = len(x['s'])**2; target = 'O(n²) work'
    elif slug == 'partition-equal-subset-sum':
        n = len(x['nums'])*sum(x['nums'])//2; target = 'O(n × target sum) work'
    elif slug == 'word-break':
        n = len(x['s'])*max(map(len,x['wordDict'])); target = 'O(n × maximum word length) states'
    elif slug == 'unique-paths':
        n = x['m']*x['n']; target = 'O(m × n) work'
    elif slug == 'climbing-stairs':
        n = x['n']; target = 'O(n) work'
    elif slug == 'counting-bits':
        n = x['n']+1; target = 'O(n) word-sized work'
    elif slug == 'number-of-1-bits':
        n = 32; target = 'at most 32 bit positions'
    elif slug == 'subtree-of-another-tree':
        n = len(x['root'])*len(x['subRoot']); target = 'O(m × n) work or better'
    elif slug == 'word-search':
        n = 36*3**8; target = 'backtracking with visited-cell pruning'
    elif slug in ('subsets','permutations','combination-sum','generate-parentheses'):
        n += size(case['expected']); target = 'output-sensitive backtracking'
    elif slug in ('kth-largest-element-in-an-array','k-closest-points-to-origin','merge-k-sorted-lists','merge-intervals','non-overlapping-intervals'):
        n *= max(1,n.bit_length()); target = 'O(n log n) work or better'
    return 64*n+256, target
