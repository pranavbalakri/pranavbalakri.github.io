import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { normalizeSelection } from '../lib/filters';

type Props = {
  label: string;
  allLabel: string;
  plural: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
};

export default function MultiSelect({ label, allLabel, plural, options, values, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 240, maxHeight: 352, transformOrigin: 'top left' });
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const initialFocus = useRef(0);
  const typeahead = useRef({ text: '', time: 0 });
  const id = useId();
  const summary = !values.length ? allLabel : values.length === 1 ? values[0]
    : plural === 'difficulties' ? values.join(', ') : `${values.length} ${plural}`;

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  useLayoutEffect(() => {
    if (!open) return;
    const node = menu.current!;
    node.showPopover();
    return () => { if (node.isConnected) node.hidePopover(); };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      if (!trigger.current || !menu.current) return;
      const rect = trigger.current.getBoundingClientRect();
      const width = Math.min(plural === 'topics' ? 256 : 208, window.innerWidth - 16);
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const height = Math.min(352, menu.current.scrollHeight);
      const useAbove = below < height && above > below;
      const maxHeight = Math.max(40, Math.min(352, useAbove ? above : below));
      setPosition({
        width, maxHeight,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: useAbove ? Math.max(8, rect.top - Math.min(height, maxHeight) - 8) : rect.bottom + 8,
        transformOrigin: useAbove ? 'bottom left' : 'top left',
      });
    }
    function outside(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('pointerdown', outside);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open, summary, plural]);

  useLayoutEffect(() => {
    if (open) menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemcheckbox"]')[initialFocus.current]?.focus();
  }, [open]);

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); close(true); return;
    }
    const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemcheckbox"]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    let next = index;
    if (event.key === 'ArrowDown') next = (index + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key.length === 1 && event.key !== ' ' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const now = Date.now();
      typeahead.current = { text: (now - typeahead.current.time < 500 ? typeahead.current.text : '') + event.key.toLowerCase(), time: now };
      const match = items.findIndex(item => item.textContent?.toLowerCase().startsWith(typeahead.current.text));
      if (match !== -1) next = match;
    } else return;
    event.preventDefault();
    items[next]?.focus();
    items[next]?.scrollIntoView({ block: 'nearest' });
  }

  return <div className="multi-select" ref={wrapper} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  }}>
    <button className="filter-trigger" ref={trigger} aria-label={label} aria-haspopup="menu" aria-expanded={open}
      aria-controls={open ? id : undefined} title={values.length ? values.join(', ') : allLabel}
      onClick={() => { initialFocus.current = 0; setOpen(value => !value); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); initialFocus.current = event.key === 'ArrowUp' ? options.length : 0; setOpen(true);
        }
      }}><span>{summary}</span><ChevronDown size={14}/></button>
    {open && <div id={id} ref={menu} popover="manual" role="menu" aria-label={label} className="filter-menu" style={position} onKeyDown={onMenuKey}>
      <button role="menuitemcheckbox" aria-checked={!values.length} tabIndex={-1} className="filter-option filter-all" onClick={() => onChange([])}>
        <span className="filter-check">{!values.length && <Check size={15}/>}</span>{allLabel}
      </button>
      {options.map(option => <button key={option} role="menuitemcheckbox" aria-checked={values.includes(option)} tabIndex={-1} className="filter-option"
        onClick={() => onChange(normalizeSelection(values.includes(option) ? values.filter(value => value !== option) : [...values, option], options))}>
        <span className="filter-check">{values.includes(option) && <Check size={15}/>}</span>{option}
      </button>)}
    </div>}
  </div>;
}
