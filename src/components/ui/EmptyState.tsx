import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className,
      )}
    >
      {icon && <div className="mb-4 text-mute">{icon}</div>}
      <h3 className="font-display text-display-sm uppercase tracking-tight text-bone">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-mute">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function LoadingState({
  label = "Yükleniyor",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-mute">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 bg-volt animate-ping" />
          <span className="relative h-2 w-2 bg-volt" />
        </span>
        {label}
        <span className="animate-blink">_</span>
      </div>
    </div>
  );
}
