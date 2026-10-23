import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';

type Axis = 'columns' | 'rows';
type Sizes = Partial<Record<Axis, number>>;
type Options = { axis: Axis; name: string; defaultRatio: number; minFirst: number; minSecond: number };

function readSizes(key: string): Sizes {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    const sizes: Sizes = {};
    for (const axis of ['columns', 'rows'] as const) {
      if (typeof value?.[axis] === 'number' && value[axis] > 0 && value[axis] < 1) sizes[axis] = value[axis];
    }
    return sizes;
  } catch { return {}; }
}

export function usePaneResize({ axis, name, defaultRatio, minFirst, minSecond }: Options) {
  const storageKey = `algo-speedruns:panes:${name}`;
  const container = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; start: number; size: number } | null>(null);
  const [sizes, setSizes] = useState(() => readSizes(storageKey));
  const savedSizes = useRef(sizes);
  savedSizes.current = sizes;
  const [length, setLength] = useState(0);
  const [resizing, setResizing] = useState(false);
  const ratio = sizes[axis] ?? defaultRatio;
  const available = Math.max(0, length - 1);
  const minimum = Math.min(minFirst, available * minFirst / (minFirst + minSecond));
  const maximum = Math.max(minimum, available - minSecond);
  const clamp = (value: number) => Math.min(maximum, Math.max(minimum, value));
  const firstSize = clamp(available * ratio);

  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => setLength(axis === 'columns' ? element.clientWidth : element.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    drag.current = null;
    setResizing(false);
    return () => observer.disconnect();
  }, [axis]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(sizes)); } catch { /* Resizing still works without storage. */ }
    }, 150);
    return () => clearTimeout(timeout);
  }, [sizes, storageKey]);

  useEffect(() => {
    const save = () => {
      try { localStorage.setItem(storageKey, JSON.stringify(savedSizes.current)); } catch { /* Storage is optional. */ }
    };
    window.addEventListener('pagehide', save);
    return () => { window.removeEventListener('pagehide', save); save(); };
  }, [storageKey]);

  useEffect(() => {
    if (!resizing) return;
    const cancel = () => { drag.current = null; setResizing(false); };
    window.addEventListener('blur', cancel);
    return () => window.removeEventListener('blur', cancel);
  }, [resizing]);

  function resize(pixels: number) {
    if (available > 0) setSizes(previous => ({ ...previous, [axis]: clamp(pixels) / available }));
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0 || drag.current) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, start: axis === 'columns' ? event.clientX : event.clientY, size: firstSize };
    setResizing(true);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    resize(drag.current.size + (axis === 'columns' ? event.clientX : event.clientY) - drag.current.start);
  }

  function pointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    setResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    const previous = axis === 'columns' ? 'ArrowLeft' : 'ArrowUp';
    const next = axis === 'columns' ? 'ArrowRight' : 'ArrowDown';
    const step = event.shiftKey ? 64 : 24;
    if (event.key === previous) resize(firstSize - step);
    else if (event.key === next) resize(firstSize + step);
    else if (event.key === 'Home') resize(minimum);
    else if (event.key === 'End') resize(maximum);
    else return;
    event.preventDefault();
    event.stopPropagation();
  }

  const tracks = length ? `${firstSize}px 1px minmax(0, 1fr)` : `${ratio}fr 1px ${1 - ratio}fr`;
  const style: CSSProperties = {
    gridTemplateColumns: axis === 'columns' ? tracks : 'minmax(0, 1fr)',
    gridTemplateRows: axis === 'rows' ? tracks : 'minmax(0, 1fr)',
  };
  const percent = (value: number) => available ? Math.round(value / available * 100) : 0;

  return {
    container, style, resizing,
    cursor: axis === 'columns' ? 'col-resize' : 'row-resize',
    divider: {
      role: 'separator',
      tabIndex: 0,
      className: 'pane-divider',
      title: 'Drag to resize. Double-click to reset. Arrow keys also resize.',
      'aria-orientation': axis === 'columns' ? 'vertical' as const : 'horizontal' as const,
      'aria-valuemin': percent(minimum),
      'aria-valuemax': percent(maximum),
      'aria-valuenow': percent(firstSize),
      'aria-valuetext': `${percent(firstSize)}% of available ${axis === 'columns' ? 'width' : 'height'}`,
      'data-resizing': resizing,
      onPointerDown: pointerDown,
      onPointerMove: pointerMove,
      onPointerUp: pointerEnd,
      onPointerCancel: pointerEnd,
      onLostPointerCapture: pointerEnd,
      onKeyDown: keyDown,
      onDoubleClick: () => setSizes(previous => ({ ...previous, [axis]: defaultRatio })),
    },
  };
}
