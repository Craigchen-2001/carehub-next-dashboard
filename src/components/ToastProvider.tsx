"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = {
  id: string;
  title: string;
  body?: string;
};

type ToastContextValue = {
  push: (t: { title: string; body?: string }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: { title: string; body?: string }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const next: Toast = { id, title: t.title, body: t.body };
    setToasts((prev) => [next, ...prev].slice(0, 5));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 2500);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[320px] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="rounded-lg border bg-white p-3 text-sm shadow">
            <div className="font-medium">{t.title}</div>
            {t.body ? <div className="mt-1 text-gray-600">{t.body}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}