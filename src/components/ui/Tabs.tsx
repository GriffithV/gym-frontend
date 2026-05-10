import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: ReactNode;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  value?: string;
  onChange?: (v: string) => void;
  defaultValue?: string;
  className?: string;
}

export function Tabs({
  items,
  value,
  onChange,
  defaultValue,
  className,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const current = value ?? internal;

  return (
    <div className={cn("flex border-b border-rule", className)}>
      {items.map((it) => {
        const active = it.value === current;
        return (
          <button
            key={it.value}
            onClick={() => {
              setInternal(it.value);
              onChange?.(it.value);
            }}
            className={cn(
              "relative px-4 py-3 font-display uppercase tracking-wide text-xs transition-colors",
              active ? "text-volt" : "text-mute hover:text-bone",
            )}
          >
            <span className="flex items-center gap-2">
              {it.label}
              {it.count != null && (
                <span className="font-mono text-[10px] tabular bg-steel px-1.5 py-0.5">
                  {it.count}
                </span>
              )}
            </span>
            {active && (
              <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-volt animate-voltage-flicker" />
            )}
          </button>
        );
      })}
    </div>
  );
}
