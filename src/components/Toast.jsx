import { useEffect, useRef } from 'react';

export default function Toast({ message, onUndo, onDismiss, duration = 3500 }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss, duration]);

  return (
    <div className="toast" role="alert" aria-live="polite">
      <span className="toast-message">{message}</span>
      {onUndo && (
        <button
          className="toast-undo"
          onClick={() => {
            clearTimeout(timerRef.current);
            onUndo();
          }}
          aria-label="Undo last action"
        >
          Undo
        </button>
      )}
      <button
        className="toast-close"
        onClick={() => {
          clearTimeout(timerRef.current);
          onDismiss();
        }}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}
