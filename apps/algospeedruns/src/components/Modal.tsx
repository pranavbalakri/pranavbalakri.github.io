import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const node = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    const onCancel = (event: Event) => { event.preventDefault(); close.current(); };
    node.addEventListener('cancel', onCancel);
    return () => { node.removeEventListener('cancel', onCancel); node.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className={`modal ${className}`} aria-label={title} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18}/></button></div>
    {children}
  </dialog>;
}
