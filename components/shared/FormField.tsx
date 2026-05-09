import type { ReactNode } from "react";

type Props = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className = "",
}: Props) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-ss-ink-700"
      >
        {label}
        {required ? (
          <span className="ml-1 text-ss-orange-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p
          className="text-xs font-medium text-ss-error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ss-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
