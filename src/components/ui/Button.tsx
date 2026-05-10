import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "volt" | "solid" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  volt:
    "bg-volt text-ink hover:bg-volt-200 active:bg-volt-600 disabled:opacity-40 disabled:cursor-not-allowed font-bold",
  solid:
    "bg-bone text-ink hover:bg-white active:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed font-semibold",
  outline:
    "bg-transparent text-bone shadow-edge hover:shadow-edge-volt hover:text-volt disabled:opacity-40 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-bone hover:bg-steel disabled:opacity-40 disabled:cursor-not-allowed",
  danger:
    "bg-scarlet text-ink hover:bg-scarlet/85 active:bg-scarlet/70 disabled:opacity-40 disabled:cursor-not-allowed font-bold",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs uppercase tracking-wide",
  md: "h-10 px-4 text-sm uppercase tracking-wide",
  lg: "h-12 px-6 text-sm uppercase tracking-widest",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "outline",
      size = "md",
      loading,
      block,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-none transition-all duration-150 select-none",
          "font-display",
          variants[variant],
          sizes[size],
          block && "w-full",
          className,
        )}
        {...rest}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>İşleniyor</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";
