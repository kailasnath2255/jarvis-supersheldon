"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

type Props = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
};

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Pick options",
  invalid = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggle(opt: string) {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  }

  function removeAt(opt: string) {
    onChange(value.filter((v) => v !== opt));
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full min-h-[48px] flex items-center gap-2 px-3 py-2 rounded-[10px] border bg-white text-left transition focus:outline-none focus:ring-2 focus:ring-ss-orange-200 ${
          invalid
            ? "border-ss-error"
            : open
              ? "border-ss-orange-500"
              : "border-ss-ink-300"
        }`}
      >
        <div className="flex-1 flex flex-wrap gap-1.5 min-h-[28px] items-center">
          {value.length === 0 ? (
            <span className="text-ss-ink-400 text-sm pl-1">{placeholder}</span>
          ) : (
            value.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ss-orange-50 text-ss-orange-700 text-xs font-semibold"
              >
                {v}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(v);
                  }}
                  className="hover:bg-ss-orange-100 rounded-full p-0.5 cursor-pointer"
                  aria-label={`Remove ${v}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-ss-ink-500 flex-none transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 w-full max-h-72 overflow-y-auto rounded-xl border border-ss-ink-200 bg-white shadow-ss py-1"
        >
          {options.map((opt) => {
            const selected = value.includes(opt);
            return (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => toggle(opt)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-ss-orange-50 transition ${
                    selected ? "text-ss-orange-700 font-semibold" : ""
                  }`}
                >
                  <span
                    className={`flex-none h-4 w-4 rounded border-2 flex items-center justify-center ${
                      selected
                        ? "bg-ss-orange-500 border-ss-orange-500"
                        : "border-ss-ink-300"
                    }`}
                  >
                    {selected ? (
                      <Check className="h-3 w-3 text-white" aria-hidden="true" />
                    ) : null}
                  </span>
                  <span>{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
