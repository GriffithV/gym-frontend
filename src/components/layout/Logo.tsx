import { cn } from "@/lib/cn";

export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <div className="relative h-8 w-8 bg-volt flex items-center justify-center shrink-0 overflow-hidden">
        <span className="font-display text-ink text-lg font-black leading-none">
          G
        </span>
        <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-ink" />
      </div>
      {!collapsed && (
        <div className="leading-none">
          <div className="font-display text-bone text-base tracking-[0.2em]">
            GYM
          </div>
          <div className="font-mono text-[9px] text-mute uppercase tracking-[0.3em] mt-0.5">
            // ops panel
          </div>
        </div>
      )}
    </div>
  );
}
