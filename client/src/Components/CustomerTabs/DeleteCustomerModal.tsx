import { useEffect, useRef } from 'react';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  customerName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteCustomerModal({
  isOpen,
  customerName,
  onClose,
  onConfirm,
}: DeleteCustomerModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  /* Close on Escape */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  /* Prevent body scroll */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div className="modal-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <div className="modal-container" style={{ maxWidth: 440 }}>

        {/* ── Header ── */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon" style={{ background: 'rgba(220,38,38,0.1)', borderColor: 'rgba(220,38,38,0.2)' }}>
              🗑️
            </div>
            <div>
              <h2>Delete Customer</h2>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body">
          <div className="delete-modal-content">
            <div className="delete-modal-icon">⚠️</div>
            <h3>Are you sure?</h3>
            <p>
              This will permanently delete the customer{' '}
              <span className="customer-name-highlight">"{customerName}"</span> and
              all associated records. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <button className="modal-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn danger" onClick={onConfirm}>
            🗑️ Delete Customer
          </button>
        </div>

      </div>
    </div>
  );
}
