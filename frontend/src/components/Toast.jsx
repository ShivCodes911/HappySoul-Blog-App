import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const lastToastRef = useRef({ message: '', time: 0 });

  const addToast = useCallback((message, type = 'success') => {
    const now = Date.now();
    if (lastToastRef.current.message === message && (now - lastToastRef.current.time) < 500) {
      return;
    }
    lastToastRef.current = { message, time: now };

    const id = now + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div style={vts.container}>
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              style={{
                ...vts.toast,
                ...(isError ? vts.error : isWarning ? vts.warning : vts.success),
              }}
            >
              <div style={vts.iconCol}>
                {isError ? (
                  <AlertCircle size={15} color="var(--clr-secondary)" />
                ) : isWarning ? (
                  <AlertTriangle size={15} color="var(--clr-warning)" />
                ) : (
                  <CheckCircle2 size={15} color="var(--clr-success)" />
                )}
              </div>
              <div style={vts.msg}>{t.message}</div>
              <button
                style={vts.closeBtn}
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

const vts = {
  container: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 99999,
    pointerEvents: 'none',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    border: '2px solid var(--clr-border-strong)',
    borderRadius: '0px',
    boxShadow: 'none',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    maxWidth: 380,
    minWidth: 260,
    pointerEvents: 'auto',
  },
  iconCol: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  msg: {
    flex: 1,
    lineHeight: 1.4,
    letterSpacing: '0.01em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    flexShrink: 0,
  },
  success: {
    backgroundColor: 'var(--clr-success-bg)',
    color: 'var(--clr-success)',
    borderColor: 'var(--clr-success)',
  },
  error: {
    backgroundColor: 'var(--clr-danger-bg)',
    color: 'var(--clr-secondary)',
    borderColor: 'var(--clr-secondary)',
  },
  warning: {
    backgroundColor: 'var(--clr-warning-bg)',
    color: 'var(--clr-warning)',
    borderColor: 'var(--clr-warning)',
  },
};
