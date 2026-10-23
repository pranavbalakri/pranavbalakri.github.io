import { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightActiveLine, keymap, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, syntaxHighlighting, HighlightStyle, indentUnit } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { python } from '@codemirror/lang-python';
import { tags } from '@lezer/highlight';

type Props = { value: string; onChange: (s: string) => void; theme: 'light' | 'dark'; onPosition: (s: string) => void };
const colors = (dark: boolean) => HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier], color: dark ? '#c586c0' : '#af00db' },
  { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: dark ? '#dcdcaa' : '#795e26' },
  { tag: [tags.string, tags.special(tags.string)], color: dark ? '#ce9178' : '#a31515' },
  { tag: tags.number, color: dark ? '#b5cea8' : '#098658' },
  { tag: tags.comment, color: '#808080' },
  { tag: [tags.typeName, tags.className], color: dark ? '#4ec9b0' : '#267f99' },
]);
const editorTheme = (dark: boolean) => EditorView.theme({
  '&': { height: '100%', fontSize: 'var(--text-reading)', color: 'var(--text)', backgroundColor: 'var(--editor)' },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: 'var(--line-reading)', overflow: 'auto' },
  '.cm-content': { padding: 'var(--space-4) 0', caretColor: 'var(--text)' },
  '.cm-line': { padding: '0 var(--content-inset) 0 var(--space-3)' },
  '.cm-gutters': { background: 'transparent', color: 'var(--muted)', border: 'none', minWidth: '48px', padding: '0 var(--space-1) 0 var(--space-4)' },
  '.cm-activeLine, .cm-activeLineGutter': { background: 'var(--active-line)' },
  '.cm-cursor': { borderLeftColor: 'var(--text)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: 'var(--selection-bg) !important' },
  '.cm-content ::selection, .cm-content::selection': { color: 'var(--selection-text)' },
  '.cm-tooltip': { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { background: 'var(--subtle)', color: 'var(--text)' },
  '&.cm-focused': { outline: 'none' },
}, { dark });

export default function Editor({ value, onChange, theme, onPosition }: Props) {
  const parent = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onPosition });
  callbacks.current = { onChange, onPosition };
  const themeSlot = useRef(new Compartment());
  useEffect(() => {
    if (!parent.current) return;
    const view = new EditorView({
      parent: parent.current,
      state: EditorState.create({ doc: value, extensions: [
        lineNumbers(), highlightActiveLineGutter(), history(), drawSelection(), dropCursor(),
        indentOnInput(), bracketMatching(), closeBrackets(), autocompletion(), rectangularSelection(), crosshairCursor(),
        highlightActiveLine(), python(), indentUnit.of('    '),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap, indentWithTab]),
        themeSlot.current.of([editorTheme(theme === 'dark'), syntaxHighlighting(colors(theme === 'dark'))]),
        EditorView.contentAttributes.of({ 'aria-label': 'Python code editor', spellcheck: 'false' }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
          if (update.selectionSet || update.docChanged) {
            const position = update.state.selection.main.head;
            const line = update.state.doc.lineAt(position);
            callbacks.current.onPosition(`Ln ${line.number}, Col ${position - line.from + 1}`);
          }
        }),
      ] }),
    });
    editor.current = view;
    return () => { view.destroy(); editor.current = null; };
    // This editor belongs to one problem; the parent keys it by problem slug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { editor.current?.dispatch({ effects: themeSlot.current.reconfigure([editorTheme(theme === 'dark'), syntaxHighlighting(colors(theme === 'dark'))]) }); }, [theme]);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== value) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);
  return <div className="code-editor" ref={parent} />;
}
