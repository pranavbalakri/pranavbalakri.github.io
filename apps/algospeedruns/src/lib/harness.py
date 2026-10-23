"""JSON adapter and judge. Contains no problem solutions."""
import json as _json
import time as _time
import traceback as _traceback
import contextlib as _contextlib
import io as _io
from collections import deque as _deque, Counter as _Counter


class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right


def _list_node(values):
    dummy = tail = ListNode()
    nodes = []
    for value in values:
        tail.next = ListNode(value)
        tail = tail.next
        nodes.append(tail)
    return dummy.next, nodes


def _tree_node(values):
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = _deque([root])
    i = 1
    while queue and i < len(values):
        node = queue.popleft()
        for attr in ('left', 'right'):
            if i < len(values) and values[i] is not None:
                child = TreeNode(values[i])
                setattr(node, attr, child)
                queue.append(child)
            i += 1
    return root


def _find_node(root, val):
    queue = _deque([root])
    while queue:
        node = queue.popleft()
        if not node:
            continue
        if node.val == val:
            return node
        queue.extend((node.left, node.right))
    raise ValueError('Target node does not exist in the tree.')


def _serialize(value, kind=''):
    if 'ListNode' in kind:
        result, seen = [], set()
        while value is not None:
            if not isinstance(value, ListNode):
                raise TypeError('Return a ListNode or None, not a Python list.')
            if id(value) in seen:
                raise ValueError('The returned linked list contains a cycle.')
            seen.add(id(value))
            result.append(value.val)
            value = value.next
        return result
    if 'TreeNode' in kind:
        if value is not None and not isinstance(value, TreeNode):
            raise TypeError('Return a TreeNode or None, not a Python list.')
        result, seen = [], set()
        queue = _deque([value])
        while queue:
            node = queue.popleft()
            if node is None:
                result.append(None)
                continue
            if id(node) in seen:
                raise ValueError('The returned tree contains a cycle or shared node.')
            seen.add(id(node))
            result.append(node.val)
            queue.extend((node.left, node.right))
        while result and result[-1] is None:
            result.pop()
        return result
    # Tuple/generator answers are accepted like ordinary iterable answers.
    if isinstance(value, (list, tuple)):
        return [_serialize(x) for x in value]
    if value is not None and not isinstance(value, (str, int, float, bool, dict)):
        try:
            return [_serialize(x) for x in value]
        except TypeError:
            pass
    return value


def _canonical(v):
    return _json.dumps(v, sort_keys=True, separators=(',', ':'))


def _matches(actual, expected, problem, raw):
    mode = problem.get('compare', 'exact')
    if mode == 'two-sum':
        return isinstance(actual, list) and len(actual) == 2 and all(type(i) is int and 0 <= i < len(raw['nums']) for i in actual) and actual[0] != actual[1] and sum(raw['nums'][i] for i in actual) == raw['target']
    if mode == 'palindrome':
        return isinstance(actual, str) and len(actual) == len(expected) and actual in raw['s'] and actual == actual[::-1]
    if mode == 'topological':
        if not isinstance(actual, list):
            return False
        if expected == []:
            return actual == []
        n = raw['numCourses']
        if len(actual) != n or any(type(i) is not int for i in actual) or set(actual) != set(range(n)):
            return False
        order = {node: i for i, node in enumerate(actual)}
        return all(order[b] < order[a] for a, b in raw['prerequisites'])
    if mode == 'closest':
        if not isinstance(actual, list) or len(actual) != raw['k'] or any(not isinstance(p, list) or len(p) != 2 for p in actual):
            return False
        if _Counter(map(_canonical, actual)) - _Counter(map(_canonical, raw['points'])):
            return False
        return sorted(x*x+y*y for x,y in actual) == sorted(x*x+y*y for x,y in raw['points'])[:raw['k']]
    if mode in ('unordered', 'nested-set'):
        if not isinstance(actual, list):
            return False
        if mode == 'nested-set':
            if any(not isinstance(x, list) for x in actual):
                return False
            actual = [sorted(x, key=_canonical) for x in actual]
            expected = [sorted(x, key=_canonical) for x in expected]
        return sorted(map(_canonical, actual)) == sorted(map(_canonical, expected))
    return actual == expected


class _Output(_io.StringIO):
    def write(self, s):
        if self.tell() < 8000:
            super().write(s[:8000-self.tell()])
        return len(s)


_PRELUDE = '''from typing import *
from collections import Counter, defaultdict, deque
from functools import cache, lru_cache
from heapq import heappush, heappop, heapify, heappushpop, heapreplace
from bisect import bisect_left, bisect_right
import collections, functools, heapq, bisect, math, itertools
inf = float("inf")
'''


def _lap_judge(payload):
    data = _json.loads(payload)
    problem, cases = data['problem'], data['cases']
    started = _time.perf_counter()
    results, passed_count = [], 0
    try:
        compiled = compile(data['code'], '<solution>', 'exec')
    except BaseException as error:
        return _json.dumps({'passed': False, 'total': len(cases), 'passedCount': 0, 'duration': 0, 'cases': [], 'error': ''.join(_traceback.format_exception_only(type(error), error))})
    first_hidden_failure = False
    for case in cases:
        output = _Output()
        actual, error = None, None
        try:
            namespace = {'ListNode': ListNode, 'TreeNode': TreeNode, '__name__': '__solution__'}
            exec(_PRELUDE, namespace)
            raw = case['input']
            inputs = _json.loads(_json.dumps(raw))
            with _contextlib.redirect_stdout(output), _contextlib.redirect_stderr(output):
                exec(compiled, namespace)
                if problem.get('adapter') == 'trie':
                    trie = namespace['Trie']()
                    actual = [getattr(trie, op)(*args) for op, args in zip(inputs['operations'], inputs['arguments'])]
                else:
                    for param in problem['params']:
                        name, kind = param['name'], param['type']
                        if kind == 'List[Optional[ListNode]]':
                            inputs[name] = [_list_node(a)[0] for a in inputs[name]]
                        elif 'ListNode' in kind:
                            inputs[name], nodes = _list_node(inputs[name])
                            if problem.get('adapter') == 'cycle' and nodes and inputs['pos'] >= 0:
                                nodes[-1].next = nodes[inputs['pos']]
                        elif 'TreeNode' in kind and not (problem.get('adapter') == 'lca' and name in ('p', 'q')):
                            inputs[name] = _tree_node(inputs[name])
                    if problem.get('adapter') == 'lca':
                        inputs['p'] = _find_node(inputs['root'], inputs['p'])
                        inputs['q'] = _find_node(inputs['root'], inputs['q'])
                    args = [inputs[p['name']] for p in problem['params'] if not (problem.get('adapter') == 'cycle' and p['name'] == 'pos')]
                    result = getattr(namespace['Solution'](), problem['method'])(*args)
                    if problem.get('mutates'):
                        name = problem['mutates']
                        kind = next(p['type'] for p in problem['params'] if p['name'] == name)
                        actual = _serialize(inputs[name], kind)
                    elif problem.get('adapter') == 'lca':
                        if not isinstance(result, TreeNode):
                            raise TypeError('Return the ancestor TreeNode, not its value.')
                        actual = result.val
                    else:
                        actual = _serialize(result, problem['returns'])
                passed = _matches(actual, case['expected'], problem, raw)
        except BaseException as exc:
            frames = [f'Line {frame.lineno}, in {frame.name}' for frame in _traceback.extract_tb(exc.__traceback__) if frame.filename == '<solution>']
            error = '\n'.join(frames + [f'{type(exc).__name__}: {exc}'])
            passed = False
        if passed:
            passed_count += 1
        # Successful private fixtures never appear in the response; reveal just
        # the first failing fixture to make a rejected submission debuggable.
        if not case['hidden'] or (not passed and not first_hidden_failure):
            row = {'passed': passed, 'input': raw, 'expected': case['expected'], 'actual': actual, 'error': error, 'hidden': case['hidden'], 'stdout': output.getvalue()}
            results.append(row)
            if case['hidden']:
                first_hidden_failure = True
    return _json.dumps({'passed': passed_count == len(cases), 'total': len(cases), 'passedCount': passed_count, 'duration': round((_time.perf_counter()-started)*1000, 2), 'cases': results}, default=str)
