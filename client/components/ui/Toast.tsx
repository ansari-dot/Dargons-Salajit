'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

interface ToastOptions {
  type?: ToastType;
  title?: string;
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed */
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => number;
  success: (message: string, title?: string) => number;
  error: (message: string, title?: string) => number;
  warning: (message: string, title?: string) => number;
  info: (message: string, title?: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 4;
const EXIT_MS = 320; // must match the .toast-exit transition in globals.css

const TYPE_META: Record<ToastType, { icon: React.ReactNode; accent: string }> = {
  success: {
    icon: <CheckCircle2 className="toast-icon" />,
    accent: '#10b981',
  },
  error: {
    icon: <AlertCircle className="toast-icon" />,
    accent: '#f43f5e',
  },
  warning: {
    icon: <AlertTriangle className="toast-icon" />,
    accent: '#f59e0b',
  },
  info: {
    icon: <Info className="toast-icon" />,
    accent: '#636830',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [exiting, setExiting] = useState<Set<number>>(new Set());
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setExiting((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setExiting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, EXIT_MS);
  }, []);

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = ++idRef.current;
      const item: ToastItem = {
        id,
        type: options.type ?? 'info',
        title: options.title,
        message,
        duration: options.duration ?? (options.type === 'error' ? 6000 : 4000),
      };
      setToasts((prev) => {
        const next = [...prev, item];
        // Keep the stack bounded: drop the oldest beyond MAX_VISIBLE
        return next.slice(-MAX_VISIBLE);
      });
      return id;
    },
    []
  );

  const success = useCallback((m: string, t?: string) => toast(m, { type: 'success', title: t }), [toast]);
  const fail = useCallback((m: string, t?: string) => toast(m, { type: 'error', title: t }), [toast]);
  const warn = useCallback((m: string, t?: string) => toast(m, { type: 'warning', title: t }), [toast]);
  const info = useCallback((m: string, t?: string) => toast(m, { type: 'info', title: t }), [toast]);

  const value = useMemo(
    () => ({ toast, success, error: fail, warning: warn, info, dismiss }),
    [toast, success, fail, warn, info, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            item={t}
            exiting={exiting.has(t.id)}
            onDismiss={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  exiting,
  onDismiss,
}: {
  item: ToastItem;
  exiting: boolean;
  onDismiss: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const meta = TYPE_META[item.type];

  // Trigger the enter transition on the next frame after mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss (skipped entirely when duration is 0)
  useEffect(() => {
    if (item.duration <= 0 || paused) return;
    const timer = setTimeout(onDismiss, item.duration);
    return () => clearTimeout(timer);
  }, [item.duration, item.id, paused, onDismiss]);

  return (
    <div
      className={`toast-card ${mounted && !exiting ? 'toast-visible' : ''} ${exiting ? 'toast-exit' : ''}`}
      style={{ ['--toast-accent' as string]: meta.accent }}
      role={item.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={onDismiss}
    >
      <span className="toast-icon-wrap" aria-hidden="true">
        {meta.icon}
      </span>

      <div className="toast-body">
        {item.title && <p className="toast-title">{item.title}</p>}
        <p className="toast-message">{item.message}</p>
      </div>

      <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={onDismiss}>
        <X className="w-3.5 h-3.5" />
      </button>

      {item.duration > 0 && (
        <span
          className={`toast-progress ${mounted && !paused ? '' : 'toast-progress-paused'}`}
          style={{ animationDuration: `${item.duration}ms` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}