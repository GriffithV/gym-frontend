import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "active"
  | "warn"
  | "danger"
  | "volt"
  | "muted";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-steel text-bone",
  active: "bg-lime-soft text-lime",
  warn: "bg-amber-soft text-amber",
  danger: "bg-scarlet-soft text-scarlet",
  volt: "bg-volt text-ink",
  muted: "bg-transparent text-mute shadow-edge",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5",
            tone === "active" && "bg-lime animate-pulse-soft",
            tone === "warn" && "bg-amber animate-pulse-soft",
            tone === "danger" && "bg-scarlet animate-pulse-soft",
            tone === "volt" && "bg-ink",
            (tone === "neutral" || tone === "muted") && "bg-mute",
          )}
        />
      )}
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, BadgeTone> = {
  ACTIVE: "active",
  PENDING: "warn",
  EXPIRED: "danger",
  SUSPENDED: "warn",
  CANCELLED: "muted",
  NONE: "muted",
  UPLOADED: "warn",
  VERIFIED: "active",
  MISSING: "muted",
  OPERATIONAL: "active",
  MAINTENANCE_DUE: "warn",
  UNDER_REPAIR: "danger",
  RETIRED: "muted",
};

const ROLE_TONES: Record<string, BadgeTone> = {
  ADMIN: "volt",
  CLERK: "neutral",
  REPAIRMAN: "neutral",
};

import { statusLabel, roleLabel } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"} dot>
      {statusLabel(status)}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone={ROLE_TONES[role] ?? "neutral"}>{roleLabel(role)}</Badge>;
}
