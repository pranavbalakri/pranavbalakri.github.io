import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const node = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    const onCancel = (event: Event) => { event.preventDefault(); close.current(); };
    node.addEventListener('cancel', onCancel);
    return () => { clearTimeout(exitTimer.current); node.removeEventListener('cancel', onCancel); node.close(); previous?.focus(); };
  }, []);
  function dismiss(animate: boolean) {
    if (exitTimer.current) return;
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { close.current(); return; }
    setClosing(true);
    exitTimer.current = setTimeout(() => close.current(), 120);
  }
  return <dialog ref={dialog} className={`modal ${className}`} data-closing={closing || undefined} aria-label={title} onClick={event => { if (event.target === event.currentTarget) dismiss(event.detail !== 0); }}>
    <div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={event => dismiss(event.detail !== 0)} aria-label="Close dialog"><X size={18}/></button></div>
    {children}
  </dialog>;
}
