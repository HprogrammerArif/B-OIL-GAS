import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'default' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const MAX_WIDTH: Record<NonNullable<ModalProps['size']>, number> = { sm: 440, md: 620, lg: 860 };

/** Accessible dialog on the shared `.modal-bg/.modal` styles; closes on Escape/backdrop. */
export default function Modal({ open, onClose, title, icon, tone = 'default', size = 'md', footer, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-bg" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: MAX_WIDTH[size] }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal-hd${tone === 'danger' ? ' danger' : ''}`}>
          <h3>
            {icon}
            {title}
          </h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body ui-modal-body">{children}</div>
        {footer && <div className="modal-ft ui-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
