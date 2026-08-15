import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function StepCard({
  step,
  title,
  description,
  complete,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  complete?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`step-${step}`} className="min-w-0 rounded-3xl glass p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs",
            complete ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
          )}
          aria-hidden
        >
          {complete ? <Check className="size-3.5" /> : step}
        </span>
        <div className="min-w-0">
          <h2 id={`step-${step}`} className="text-sm font-semibold tracking-tight">
            {title}
          </h2>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="mt-4 min-w-0">{children}</div>
    </section>
  );
}

export interface Option<T extends string | number> {
  value: T;
  label: string;
  hint?: string;
}

export function OptionRow<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-ring rounded-full px-4 py-2 text-sm transition-all duration-200",
              selected
                ? "bg-primary text-primary-foreground shadow-lift"
                : "bg-secondary/60 text-secondary-foreground hover:bg-secondary",
            )}
          >
            {option.label}
            {option.hint ? <span className="ml-2 text-xs opacity-70">{option.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <span
          className="block h-full rounded-full bg-foreground transition-[width] duration-500"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </span>
      <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
        {Math.round(value * 100)}
      </span>
    </div>
  );
}
