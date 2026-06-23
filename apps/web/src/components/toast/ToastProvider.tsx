"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastStatus = "pending" | "success" | "error";

export type ToastItem = {
  id: string;
  status: ToastStatus;
  title: string;
  detail?: string;
  href?: string;
};

export type ToastInput = Omit<ToastItem, "id">;

export type ToastApi = {
  push: (input: ToastInput) => string;
  update: (id: string, input: Partial<ToastInput>) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS: Record<ToastStatus, number> = {
  pending: 0,
  success: 9000,
  error: 12000,
};

function ToastIcon({ status }: { status: ToastStatus }) {
  if (status === "success") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral/20 text-coral">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3.5 8.5l3 3 6-7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral-dark/30 text-coral-soft">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M5 5l6 6M11 5l-6 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper/10 text-kraft">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="4" y="7" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M6 7V5a2 2 0 014 0v2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <motion.span
        className="absolute inset-0 rounded-full border border-kraft/40"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-paper/10 bg-slate shadow-lift"
    >
      <div className="flex gap-3 p-4">
        <ToastIcon status={toast.status} />
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base font-medium tracking-tight text-paper">
            {toast.title}
          </p>
          {toast.detail && (
            <p className="mt-1 text-xs leading-relaxed text-paper/65">{toast.detail}</p>
          )}
          {toast.href && toast.status === "success" && (
            <a
              href={toast.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-xs font-medium text-kraft transition-colors hover:text-paper"
            >
              View on Etherscan →
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-paper/40 transition-colors hover:text-paper"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      {toast.status === "pending" && (
        <motion.div
          className="h-0.5 bg-coral"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev.slice(-4), { ...input, id }]);

      const ms = AUTO_DISMISS_MS[input.status];
      if (ms > 0) {
        window.setTimeout(() => dismiss(id), ms);
      }

      return id;
    },
    [dismiss],
  );

  const update = useCallback(
    (id: string, input: Partial<ToastInput>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...input } : t)),
      );

      const status = input.status;
      if (status && status !== "pending") {
        const ms = AUTO_DISMISS_MS[status];
        window.setTimeout(() => dismiss(id), ms);
      }
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ push, update, dismiss }),
    [push, update, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[min(100vw-3rem,24rem)] flex-col gap-3"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              onDismiss={() => dismiss(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
