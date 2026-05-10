import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface StatHeroProps {
  label: string;
  value: number;
  unit?: string;
  delta?: number;
  deltaSuffix?: string;
  hint?: string;
  tone?: "default" | "volt" | "lime" | "amber" | "scarlet";
  format?: (n: number) => string;
  index?: number;
  icon?: ReactNode;
  className?: string;
}

const toneText: Record<NonNullable<StatHeroProps["tone"]>, string> = {
  default: "text-bone",
  volt: "text-volt",
  lime: "text-lime",
  amber: "text-amber",
  scarlet: "text-scarlet",
};

export function StatHero({
  label,
  value,
  unit,
  delta,
  deltaSuffix = "bu hafta",
  hint,
  tone = "default",
  format,
  index = 0,
  icon,
  className,
}: StatHeroProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 720;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(value * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const display = format
    ? format(value > 0 ? Math.floor(shown) : 0)
    : Math.floor(shown).toLocaleString("tr-TR");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "relative bg-carbon shadow-edge p-5 group/stat overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 bg-grid-faint opacity-30 pointer-events-none" />
      <div className="relative flex items-start justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">
          {label}
        </span>
        {icon && <span className="text-mute group-hover/stat:text-volt transition-colors">{icon}</span>}
      </div>
      <div className="relative flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display text-display-2xl leading-none tabular tracking-tight",
            toneText[tone],
          )}
        >
          {display}
        </span>
        {unit && (
          <span className="font-display text-display-sm text-mute mb-1">{unit}</span>
        )}
      </div>
      <div className="relative mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wide">
        {delta != null ? (
          <span
            className={cn(
              "flex items-center gap-1",
              delta > 0 ? "text-lime" : delta < 0 ? "text-scarlet" : "text-mute",
            )}
          >
            <span>{delta > 0 ? "▲" : delta < 0 ? "▼" : "◆"}</span>
            <span className="tabular">{Math.abs(delta).toLocaleString("tr-TR")}</span>
            <span className="text-mute">{deltaSuffix}</span>
          </span>
        ) : (
          <span className="text-mute">{hint ?? "—"}</span>
        )}
        <span className="text-mute opacity-60 group-hover/stat:opacity-100 transition-opacity">
          //
        </span>
      </div>
    </motion.div>
  );
}
