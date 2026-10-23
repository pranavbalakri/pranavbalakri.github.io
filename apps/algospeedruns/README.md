# Algo Speedruns

Python interview practice: press Space, solve a core algorithm problem against the clock, submit, and return to the start screen after acceptance.

## Develop

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/algospeedruns/.

```sh
npm test
npm run build
npm run preview
```

## Behavior

- 90 runnable problems across 15 topics. Core patterns, including dynamic programming, monotonic stacks and queues, topological sorting, linked lists, trees, heaps, tries, and binary search. Alien Dictionary is excluded.
- Original, self-contained problem statements covering input/output contracts, definitions, edge cases, and runtime data representations. Two explained examples per problem and 512 additional submission fixtures. No editorials or solutions in the interface.
- CodeMirror Python editor with indentation, syntax highlighting, undo, bracket matching, and completion.
- Drag the question divider or the divider above the test window to resize the panes. Sizes are remembered locally; narrow screens use a separate question-height preference. Focus a divider and use arrow keys (Shift for larger steps), Home, or End. Double-click a divider to reset its size.
- Run executes examples and optional custom cases. Submit uses the original examples and the additional fixtures. A failed hidden test is revealed after submission for debugging.
- Linked list, cyclic list, binary tree, LCA, in-place mutation, and Trie adapters. Order-insensitive answers and valid alternate answers are handled where applicable.
- A paused timer conceals the workspace. Reloading preserves code, elapsed time, hints, and attempts. Time continues across a reload unless explicitly paused.
- Completed and skipped runs are saved in this browser. Revealing a hint is recorded immediately. Random selection prefers unsolved problems and avoids an immediate repeat when alternatives exist.
- Space starts; Escape pauses/resumes; Cmd/Ctrl+Enter submits; Cmd/Ctrl+Shift+Enter runs examples. Platform-specific shortcut labels appear on the Run and Submit buttons, their tooltips, and in keyboard help. Both shortcuts work with the editor focused.

## Runtime and limits

Python 3.12 runs using a pinned, locally hosted Pyodide 0.27.7 runtime in a Web Worker. There is no code execution on the host server. A five-second wall-clock timeout terminates the worker, then initializes a fresh one. Standard-library imports are available; arbitrary third-party package installation is not part of the app.

This is a personal practice app, not a secure contest judge. Additional fixtures are hidden from the practice UI but are shipped in the worker bundle, so a determined user can inspect them. Timing, history, and scores are browser-local and are not authoritative. There are no accounts, cloud sync, analytics, or leaderboards. The fixtures test correctness; they do not certify an algorithm's asymptotic complexity.

The Python assets are copied from the npm package on installation. They total roughly 15 MB and are served from the app's own origin. The deployment does not depend on a third-party Python CDN.

## Website integration

The Vite base path is `/algospeedruns/`. Build output can be copied into the personal website's `public/algospeedruns/` directory. The existing homepage and blog routes need no changes. The source belongs in `apps/algospeedruns/` when integrated into the website repository.

Changes are local until reviewed. Do not push or deploy without the owner's go-ahead.

## References

The split description/editor/test workflow follows [LeetCode's test-case documentation](https://support.leetcode.com/hc/en-us/articles/32442719377939-How-to-create-test-cases-on-LeetCode). The execution architecture follows [Pyodide's worker documentation](https://pyodide.org/en/stable/usage/webworker.html). Problem numbers identify the corresponding LeetCode algorithms; this is an independent practice tool and is not affiliated with LeetCode.

The statement audit checked specific definitions against the official descriptions for [rotated-array search](https://leetcode.com/problems/search-in-rotated-sorted-array/description/), [matrix search](https://leetcode.com/problems/search-a-2d-matrix/description/), [linked-list cycles](https://leetcode.com/problems/linked-list-cycle/description/), and [binary-matrix paths](https://leetcode.com/problems/shortest-path-in-binary-matrix/description/). Runtime notes describe this app's adapters. Explanations describe the example outcomes without giving solution algorithms.
