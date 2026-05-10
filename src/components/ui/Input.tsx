import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  block?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, prefix, suffix, className, id, block = true, ...rest },
    ref,
  ) => {
    const inputId = id ?? rest.name;
    return (
      <label htmlFor={inputId} className={cn("block", block && "w-full")}>
        {label && (
          <span className="mb-1.5 flex items-center justify-between">
            <span className="font-display text-[11px] tracking-[0.2em] uppercase text-mute">
              {label}
            </span>
            {error && (
              <span className="font-mono text-[10px] uppercase text-scarlet">
                {error}
              </span>
            )}
          </span>
        )}
        <span
          className={cn(
            "flex items-center bg-carbon shadow-edge transition-all",
            "focus-within:shadow-edge-volt",
            error && "shadow-[inset_0_0_0_1px_#FF3D3D]",
          )}
        >
          {prefix && (
            <span className="pl-3 pr-1 text-mute font-mono text-xs">
              {prefix}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "h-10 flex-1 bg-transparent px-3 outline-none placeholder:text-mute/60 text-bone",
              "tabular caret-volt",
              prefix && "pl-1",
              suffix && "pr-1",
              className,
            )}
            {...rest}
          />
          {suffix && (
            <span className="pl-1 pr-3 text-mute font-mono text-xs">
              {suffix}
            </span>
          )}
        </span>
        {hint && !error && (
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-wide text-mute">
            {hint}
          </span>
        )}
      </label>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <label htmlFor={inputId} className="block w-full">
        {label && (
          <span className="mb-1.5 flex items-center justify-between">
            <span className="font-display text-[11px] tracking-[0.2em] uppercase text-mute">
              {label}
            </span>
            {error && (
              <span className="font-mono text-[10px] uppercase text-scarlet">
                {error}
              </span>
            )}
          </span>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={4}
          className={cn(
            "block w-full bg-carbon shadow-edge px-3 py-2 outline-none placeholder:text-mute/60 text-bone",
            "focus:shadow-edge-volt resize-y",
            error && "shadow-[inset_0_0_0_1px_#FF3D3D]",
            className,
          )}
          {...rest}
        />
        {hint && !error && (
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-wide text-mute">
            {hint}
          </span>
        )}
      </label>
    );
  },
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, children, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <label htmlFor={inputId} className="block w-full">
        {label && (
          <span className="mb-1.5 flex items-center justify-between">
            <span className="font-display text-[11px] tracking-[0.2em] uppercase text-mute">
              {label}
            </span>
            {error && (
              <span className="font-mono text-[10px] uppercase text-scarlet">
                {error}
              </span>
            )}
          </span>
        )}
        <select
          id={inputId}
          ref={ref}
          className={cn(
            "block w-full h-10 bg-carbon shadow-edge px-3 outline-none text-bone",
            "focus:shadow-edge-volt appearance-none",
            "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 fill=%22%236E6E76%22><path d=%22M0 0L6 7L12 0Z%22/></svg>')] bg-no-repeat bg-[right_12px_center]",
            "pr-9",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        {hint && !error && (
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-wide text-mute">
            {hint}
          </span>
        )}
      </label>
    );
  },
);
Select.displayName = "Select";
