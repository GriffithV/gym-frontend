import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info" | "warn";

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
}

interface ToastState {
  items: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: number) => void;
}

let counter = 1;

export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (t) => {
    const id = counter++;
    set((s) => ({ items: [...s.items, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    }, 4500);
  },
  dismiss: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export function toast(t: Omit<ToastItem, "id">) {
  useToast.getState().push(t);
}

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 text-lime" />,
  error: <AlertCircle className="h-4 w-4 text-scarlet" />,
  warn: <AlertTriangle className="h-4 w-4 text-amber" />,
  info: <Info className="h-4 w-4 text-volt" />,
};

const STRIPS = {
  success: "bg-lime",
  error: "bg-scarlet",
  warn: "bg-amber",
  info: "bg-volt",
};

export function Toaster() {
  const { items, dismiss } = useToast();
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[90vw] pointer-events-none">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto relative bg-carbon shadow-edge pl-4 pr-3 py-3 flex items-start gap-3"
          >
            <span className={cn("absolute left-0 top-0 bottom-0 w-[2px]", STRIPS[t.tone])} />
            <div className="mt-0.5">{ICONS[t.tone]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-display uppercase tracking-wide text-xs text-bone">
                {t.title}
              </div>
              {t.message && (
                <div className="mt-0.5 text-xs text-mute">{t.message}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-mute hover:text-bone shrink-0"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
