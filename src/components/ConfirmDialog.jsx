import { useEffect, useRef } from 'react';

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    confirmBtnRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmation dialog"
      onClick={onCancel}
    >
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            ref={confirmBtnRef}
            aria-label="Confirm delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
