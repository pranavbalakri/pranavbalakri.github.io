"""Deterministic work guard for performance fixtures, not a formal Big-O proof."""
import ast as _ast
import operator as _operator


class ComplexityLimitExceeded(Exception):
    pass


class _WorkBudget:
    def __init__(self, limit, target):
        self.limit, self.target, self.used = limit, target, 0
        self.exceeded = False

    def tick(self, amount=1):
        self.used += amount
        if self.used > self.limit:
            self.exceeded = True
            raise ComplexityLimitExceeded(f'Exceeded the deterministic work budget ({self.limit:,} units). Expected {self.target}.')
        return True


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
    return value


class _CountWork(_ast.NodeTransformer):
    # Loop iterations and calls are stable across whitespace / one-line formatting.
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


def _compile_counted(code):
    tree = _CountWork().visit(_ast.parse(code,filename='<solution>',mode='exec'))
    return compile(_ast.fix_missing_locations(tree),'<solution>','exec')
