"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "destructive" | "info";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextType = {
  toast: (options: Omit<Toast, "id">) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2 p-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border bg-card p-4 text-foreground shadow-premium",
                {
                  "border-border": t.variant === "default",
                  "border-success/30 bg-success/5": t.variant === "success",
                  "border-destructive/30 bg-destructive/5": t.variant === "destructive",
                  "border-primary/30 bg-primary/5": t.variant === "info",
                }
              )}
            >
              <div className="mt-0.5">
                {t.variant === "success" && <CheckCircle className="h-5 w-5 text-success" />}
                {t.variant === "destructive" && <AlertCircle className="h-5 w-5 text-destructive" />}
                {t.variant === "info" && <Info className="h-5 w-5 text-primary" />}
                {t.variant === "default" && <Info className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
