# Performance checks

Submit runs two stages. Run still executes only examples or custom cases.

1. Check the original examples and hidden correctness fixtures. Wrong answers, exceptions, and timeouts remain failures here; the app never claims correctness if this stage did not finish.
2. Only after correctness passes, run generated adversarial inputs with deterministic work budgets and a separate five-second watchdog. Exceeding either limit produces **Correct, but too slow**. An incorrect large-input answer still produces **Wrong answer**, with a bounded input/output preview.

Every one of the 90 problems has at least one performance fixture. The generators in `src/lib/stress.py` stay within the published constraints and construct their expected answers independently. Most fixtures reach the size limit; smaller cases are intentional when valid quadratic or output-sensitive algorithms need more headroom (3Sum, tree recursion, and backtracking). Inputs are generated in the Python worker instead of downloading megabytes of fixture JSON.

## Deterministic work

The performance compiler counts loop iterations, comprehension iterations, and calls to user-defined functions, including recursion and helpers. It preserves original source line numbers and function docstrings. Input lists additionally count element access, traversal, slicing, copying, searching, and common mutations, including operations performed by built-ins. Budgets reset for each performance fixture. Catching a budget exception does not turn a rejected solution into acceptance.

Budgets follow the expected interview algorithm, with generous constants for implementation differences:

| Pattern | Expected work |
| --- | --- |
| Five binary-search problems | Logarithmic in the array length or matrix cell count |
| Two pointers, prefix sums, sliding windows, monotonic stacks/queues | Linear |
| Longest increasing subsequence | O(n log n), also stated in its description |
| LCS and edit distance | O(m × n) |
| Coin change | O(amount × number of coins) |
| Partition equal subset sum | O(n × target sum) |
| Palindromic substrings and longest palindrome | O(n²); Manacher's algorithm is not required |
| 3Sum | O(n²) |
| Heap and interval problems | O(n log n) or better |
| Subsets, permutations, parentheses, combination sum | Output-sensitive backtracking |
| Word search | Backtracking with visited-cell pruning |

The five-second watchdog is independent of cooperative work counting. It terminates the worker if Python hangs or spends too long in native-library code, then starts a fresh worker. The two stages each get five seconds; adding stress tests does not take time away from correctness checks.

## What this does and does not establish

This is a practical complexity check, not a proof of asymptotic optimality. A finite suite cannot establish Big-O behavior for all possible inputs. Work counters do not model every native-library operation, integer bit operation, allocation, or memory cost. Some faster nonoptimal approaches may still fit the budget. The watchdog is hardware-dependent, which is why deterministic limits and generous timing headroom are both used. Inputs remain compatible with normal Python list operations, but performance-stage lists are instrumented subclasses; code that requires `type(nums) is list` is not supported.

The app remains a personal practice tool, not a tamper-proof contest judge. It does not attempt to prevent malicious code from inspecting or bypassing the instrumentation. It also does not enforce space complexity or non-complexity instructions such as “do not use division.”

## Validation

`npm test` checks all 90 independent efficient implementations against both stages using the actual pinned Pyodide runtime. Test-only reference implementations are under `tests/helpers/`; they are not shipped in the app. Deliberately slow implementations cover nested loops, repeated scans, window recomputation, linear searches, and uncached recursion. Further regressions distinguish performance failures from wrong answers, check bounded previews, and ensure Run is unaffected.
