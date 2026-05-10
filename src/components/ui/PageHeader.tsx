import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex items-end justify-between gap-6 mb-6", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-volt">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-display-xl uppercase leading-[0.92] tracking-tight text-bone">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-prose text-mute leading-snug">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
