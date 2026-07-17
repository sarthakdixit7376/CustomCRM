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
    <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-backdrop-fade-in max-sm:items-end max-sm:p-0" ref={backdropRef} onClick={handleBackdropClick}>
      <div className="w-full max-w-[440px] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-modal-slide-up max-sm:max-w-full max-sm:rounded-t-2xl max-sm:rounded-b-none">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div className="flex items-center gap-3.5">
            <div className="w-[42px] h-[42px] rounded-xl bg-red-900/10 border border-red-900/20 flex items-center justify-center text-xl">
              🗑️
            </div>
            <div>
              <h2 className="m-0 text-xl font-bold text-white tracking-tight">Delete Customer</h2>
            </div>
          </div>
          <button className="w-9 h-9 rounded-lg bg-transparent border border-transparent text-neutral-500 text-lg cursor-pointer flex items-center justify-center transition-all hover:bg-neutral-800 hover:border-neutral-700 hover:text-white" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-white mb-2">Are you sure?</h3>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-[320px]">
              This will permanently delete the customer{' '}
              <span className="text-white font-semibold">"{customerName}"</span> and
              all associated records. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-neutral-800 bg-neutral-900">
          <button className="px-5 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all border border-neutral-700 bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-white" onClick={onClose}>
            Cancel
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all bg-red-600 text-white border-none hover:bg-red-700" onClick={onConfirm}>
            🗑️ Delete Customer
          </button>
        </div>

      </div>
    </div>
  );
}
