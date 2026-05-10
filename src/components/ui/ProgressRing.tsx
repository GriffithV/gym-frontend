import { cn } from "@/lib/cn";

interface ProgressRingProps {
  value: number; // 0..1
  size?: number;
  thickness?: number;
  label?: string;
  tone?: "volt" | "lime" | "amber" | "scarlet";
  className?: string;
}

const toneColors = {
  volt: "#E5FF00",
  lime: "#7CFF6B",
  amber: "#FFB020",
  scarlet: "#FF3D3D",
};

export function ProgressRing({
  value,
  size = 64,
  thickness = 4,
  label,
  tone = "volt",
  className,
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  const color = toneColors[tone];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#2A2A2F"
          strokeWidth={thickness}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.32, 0.72, 0, 1)" }}
        />
      </svg>
      {label && (
        <span className="absolute font-display text-sm tabular text-bone">
          {label}
        </span>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number; // 0..1
  tone?: "volt" | "lime" | "amber" | "scarlet";
  height?: number;
  className?: string;
  showSegments?: boolean;
}

export function ProgressBar({
  value,
  tone = "volt",
  height = 4,
  className,
  showSegments,
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const color = toneColors[tone];
  return (
    <div
      className={cn("relative w-full bg-steel overflow-hidden", className)}
      style={{ height }}
    >
      <div
        className="h-full transition-[width] duration-500"
        style={{
          width: `${clamped * 100}%`,
          background: color,
        }}
      />
      {showSegments && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.6) 0, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 8px)",
          }}
        />
      )}
    </div>
  );
}
