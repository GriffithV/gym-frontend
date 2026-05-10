import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  flush?: boolean;
  bare?: boolean;
}

export function Card({ className, flush, bare, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "relative bg-carbon shadow-edge",
        !flush && "p-5",
        bare && "shadow-none bg-transparent",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  marker,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  marker?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start justify-between gap-4 pb-3 border-b border-rule",
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {marker}
          <h3 className="font-display uppercase tracking-wide text-sm text-bone">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-mute">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function CardCorner({ label }: { label: string }) {
  return (
    <span className="absolute -top-px right-3 px-1.5 py-0.5 bg-ink font-mono text-[9px] uppercase tracking-widest text-volt">
      {label}
    </span>
  );
}
