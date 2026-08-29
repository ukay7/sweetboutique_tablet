import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

type Props = { open: boolean; onClose: () => void; title?: string; eyebrow?: string; children: ReactNode; className?: string };

export default function Modal({ open, onClose, title, eyebrow, children, className = '' }: Props) {
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.classList.add('modal-open');
        return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); };
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section className={`modal-card ${className}`} role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
                {(title || eyebrow) && <header className="modal-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}{title && <h2>{title}</h2>}</div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></header>}
                {children}
            </section>
        </div>
    );
}
