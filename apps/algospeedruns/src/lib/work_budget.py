"""Deterministic work guard for performance fixtures, not a formal Big-O proof."""
import ast as _ast
import operator as _operator
import builtins as _builtins
import types as _types


class ComplexityLimitExceeded(Exception):
    pass


class _WorkBudget:
    def __init__(self, limit, target, comparison_limit=None):
        self.limit, self.target, self.used = limit, target, 0
        self.exceeded = False
        self.comparison_limit, self.comparisons = comparison_limit, 0
        self.reason = ''

    def fail(self, reason):
        self.exceeded, self.reason = True, reason
        raise ComplexityLimitExceeded(reason)

    def tick(self, amount=1):
        if self.exceeded:
            raise ComplexityLimitExceeded(self.reason)
        self.used += amount
        if self.used > self.limit:
            self.fail(f'Exceeded the deterministic work budget ({self.limit:,} units). Expected {self.target}.')
        return True

    def compare(self):
        if self.exceeded:
            raise ComplexityLimitExceeded(self.reason)
        self.comparisons += 1
        if self.comparison_limit is not None and self.comparisons > self.comparison_limit:
            self.fail(f'Exceeded the comparison budget ({self.comparison_limit:,} comparisons). Expected {self.target}.')

    def guard_call(self, function):
        # Return other callables unchanged: globals(), locals(), super(), etc.
        # must still execute in the original solution frame.
        is_list_sort = (
            isinstance(function, _types.BuiltinMethodType)
            and isinstance(function.__self__, list) and function.__name__ == 'sort'
        ) or getattr(function, '__func__', None) is _WorkList.sort
        if function is not _builtins.sorted and function is not list.sort and not is_list_sort:
            return function
        def sort(*args, **kwargs):
            key = kwargs.get('key')
            kwargs['key'] = lambda value: _SortKey(value if key is None else key(value), self)
            return function(*args, **kwargs)
        return sort


class _ComparisonInt(int):
    """Count ordering work even inside native heaps and copied input lists."""
    def __new__(cls, value, budget):
        result = int.__new__(cls, value)
        result._budget = budget
        return result

    def __lt__(self, other):
        self._budget.compare()
        return int.__lt__(self, other)

    def __le__(self, other):
        self._budget.compare()
        return int.__le__(self, other)

    def __gt__(self, other):
        self._budget.compare()
        return int.__gt__(self, other)

    def __ge__(self, other):
        self._budget.compare()
        return int.__ge__(self, other)


def _plain_sort_key(value):
    # Sort keys have their own probe; do not double-count tagged input integers.
    if isinstance(value, _ComparisonInt): return int(value)
    if isinstance(value, tuple): return tuple(_plain_sort_key(v) for v in value)
    if isinstance(value, list): return [_plain_sort_key(v) for v in value]
    return value


class _SortKey:
    def __init__(self, value, budget):
        self.value, self.budget = _plain_sort_key(value), budget

    def __lt__(self, other):
        self.budget.compare()
        return self.value < other.value


class _WorkList(list):
    """Charge reads/copies that built-ins could otherwise hide from loop counting."""
    def __init__(self, values, budget):
        super().__init__(values)
        self._budget = budget

    def __getitem__(self, key):
        self._budget.tick(len(range(*key.indices(len(self)))) if isinstance(key, slice) else 1)
        value = super().__getitem__(key)
        return _WorkList(value, self._budget) if isinstance(key, slice) else value

    def __iter__(self):
        i = 0
        while i < len(self):
            self._budget.tick()
            yield list.__getitem__(self, i)
            i += 1

    def __reversed__(self):
        start = len(self)-1
        def values():
            i = start
            while 0 <= i < len(self):
                self._budget.tick()
                yield list.__getitem__(self, i)
                i -= 1
        return values()

    def __contains__(self, value):
        return any(item == value for item in self)

    def index(self, value, start=0, stop=None):
        lo, hi, _ = slice(start, len(self) if stop is None else stop).indices(len(self))
        for i in range(lo,hi):
            if self[i] == value: return i
        raise ValueError(f'{value!r} is not in list')

    def count(self, value):
        return sum(item == value for item in self)

    def copy(self):
        self._budget.tick(len(self))
        return _WorkList(list.copy(self), self._budget)

    def __add__(self, other):
        self._budget.tick(len(self)+len(other))
        return _WorkList(list.__add__(self,other), self._budget)

    def __mul__(self, other):
        self._budget.tick(len(self)*max(0,_operator.index(other)))
        return _WorkList(list.__mul__(self,other), self._budget)

    __rmul__ = __mul__

    def __setitem__(self, key, value):
        self._budget.tick(len(range(*key.indices(len(self)))) if isinstance(key,slice) else 1)
        return super().__setitem__(key,value)

    def __delitem__(self, key):
        if isinstance(key, slice):
            lo, hi, step = key.indices(len(self))
            cost = len(self)-lo if step == 1 and hi>lo else len(self) if len(range(lo,hi,step)) else 0
        else:
            index = _operator.index(key)
            cost = len(self)-(index if index>=0 else len(self)+index)
        self._budget.tick(max(1,cost))
        return super().__delitem__(key)

    def insert(self, index, value):
        index = _operator.index(index)
        position = min(len(self), max(0,index if index>=0 else len(self)+index))
        self._budget.tick(len(self)-position+1)
        return super().insert(index,value)

    def pop(self, index=-1):
        index = _operator.index(index)
        normalized = index if index >= 0 else len(self)+index
        self._budget.tick(max(1,len(self)-normalized))
        return super().pop(index)

    def sort(self, *args, **kwargs):
        self._budget.tick(len(self))
        return super().sort(*args,**kwargs)

    def reverse(self):
        self._budget.tick(len(self))
        return super().reverse()


def _track_input(value, budget):
    if isinstance(value,list):
        return _WorkList([_track_input(v,budget) for v in value],budget)
    if type(value) is int and budget.comparison_limit is not None:
        return _ComparisonInt(value,budget)
    return value


class _CountWork(_ast.NodeTransformer):
    # Loop iterations and calls are stable across whitespace / one-line formatting.
    def __init__(self, count_ordering=False):
        self.count_ordering = count_ordering

    def visit_Call(self, node):
        self.generic_visit(node)
        if self.count_ordering:
            node.func = _ast.copy_location(_ast.Call(func=_ast.Name(id='__algo_speedruns_guard_call__',ctx=_ast.Load()),args=[node.func],keywords=[]),node.func)
        return node

    def _call(self, node):
        return _ast.copy_location(_ast.Call(func=_ast.Name(id='__algo_speedruns_tick__',ctx=_ast.Load()),args=[],keywords=[]),node)

    def _body(self,node):
        self.generic_visit(node)
        index = 1 if node.body and isinstance(node.body[0],_ast.Expr) and isinstance(node.body[0].value,_ast.Constant) and isinstance(node.body[0].value.value,str) else 0
        node.body.insert(index,_ast.copy_location(_ast.Expr(value=self._call(node)),node))
        return node

    visit_For = _body
    visit_While = _body
    visit_AsyncFor = _body
    visit_FunctionDef = _body
    visit_AsyncFunctionDef = _body

    def visit_comprehension(self,node):
        self.generic_visit(node)
        node.ifs.insert(0,self._call(node.iter))
        return node

    def visit_Lambda(self,node):
        self.generic_visit(node)
        node.body = _ast.copy_location(_ast.Subscript(value=_ast.Tuple(elts=[self._call(node),node.body],ctx=_ast.Load()),slice=_ast.Constant(value=1),ctx=_ast.Load()),node.body)
        return node


def _compile_counted(code, count_ordering=False):
    tree = _CountWork(count_ordering).visit(_ast.parse(code,filename='<solution>',mode='exec'))
    return compile(_ast.fix_missing_locations(tree),'<solution>','exec')
