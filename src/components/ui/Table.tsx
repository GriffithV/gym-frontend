import type { HTMLAttributes, ReactNode, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Table({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-rule">
      <tr>{children}</tr>
    </thead>
  );
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right" | "center";
}
export function Th({ children, className, align = "left", ...rest }: ThProps) {
  return (
    <th
      {...rest}
      className={cn(
        "px-4 py-2.5 font-display uppercase tracking-[0.18em] text-[10px] text-mute select-none",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  highlighted?: boolean;
}

export function Tr({ children, className, highlighted, ...rest }: TrProps) {
  return (
    <tr
      {...rest}
      className={cn(
        "group/row relative transition-colors",
        "border-b border-rule/70 hover:bg-steel/70 cursor-pointer",
        highlighted && "bg-volt/5",
        className,
      )}
    >
      {children}
    </tr>
  );
}

interface TdProps extends HTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right" | "center";
  mono?: boolean;
}
export function Td({
  children,
  className,
  align = "left",
  mono,
  ...rest
}: TdProps) {
  return (
    <td
      {...rest}
      className={cn(
        "px-4 py-3 text-bone/90",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        mono && "font-mono tabular text-xs",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function EmptyRow({
  cols,
  children,
}: {
  cols: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={cols}
        className="px-4 py-12 text-center font-mono text-xs uppercase tracking-widest text-mute"
      >
        {children}
      </td>
    </tr>
  );
}
