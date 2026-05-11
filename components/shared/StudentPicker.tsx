"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { listStudents } from "@/lib/api";
import type { Student } from "@/lib/types";

type Props = {
  /** Currently selected student_id, or free-form text the user typed. */
  value: string;
  /** Called when the user types (free-form) — no student selected. */
  onChangeText: (text: string) => void;
  /** Called when the user picks an existing student from the dropdown. */
  onPickStudent: (s: Student) => void;
  /** Visual style overrides for the input wrapper. */
  invalid?: boolean;
  id?: string;
  placeholder?: string;
};

export function StudentPicker({
  value,
  onChangeText,
  onPickStudent,
  invalid = false,
  id = "student_id",
  placeholder = "Search by ID, name, or parent",
}: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listStudents()
      .then((res) => {
        if (cancelled) return;
        setStudents(res.students);
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || "Could not load students");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const query = value.trim().toLowerCase();
  const matched = useMemo(() => {
    if (!query) return students.slice(0, 20);
    return students
      .filter((s) => {
        const hay =
          `${s.student_id} ${s.name} ${s.parent_name} ${s.country}`.toLowerCase();
        return hay.includes(query);
      })
      .slice(0, 30);
  }, [students, query]);

  const selected = useMemo(
    () => students.find((s) => s.student_id === value),
    [students, value],
  );

  function pick(s: Student) {
    onPickStudent(s);
    setOpen(false);
  }

  function clear() {
    onChangeText("");
    setOpen(true);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`relative flex items-center rounded-[10px] border bg-white transition focus-within:border-ss-orange-500 focus-within:ring-2 focus-within:ring-ss-orange-200 ${
          invalid ? "border-ss-error" : "border-ss-ink-300"
        }`}
      >
        <Search
          className="absolute left-3 h-4 w-4 text-ss-ink-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChangeText(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-20 py-3 bg-transparent text-ss-ink-900 placeholder-ss-ink-400 outline-none"
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear"
            className="absolute right-10 p-1 text-ss-ink-400 hover:text-ss-ink-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle list"
          className="absolute right-2 p-2 text-ss-ink-500 hover:text-ss-ink-900"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ChevronDown
              className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {/* Selected student summary */}
      {selected ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-ss-ink-500">
          <Check
            className="h-3.5 w-3.5 text-ss-success"
            aria-hidden="true"
          />
          <span className="truncate">
            <span className="font-semibold text-ss-ink-700">
              {selected.name}
            </span>
            {selected.grade ? ` · ${selected.grade}` : ""}
            {selected.demo_tutor ? ` · Demo by ${selected.demo_tutor}` : ""}
            {selected.demo_completed ? "" : " · Demo pending"}
          </span>
        </div>
      ) : null}

      {/* Dropdown */}
      {open ? (
        <div
          className="absolute z-30 mt-2 w-full max-h-80 overflow-y-auto rounded-xl border border-ss-ink-200 bg-white shadow-ss"
          role="listbox"
        >
          {error ? (
            <div className="p-4 text-sm text-ss-error">
              Couldn&apos;t load students — try again. ({error})
            </div>
          ) : loading && students.length === 0 ? (
            <div className="p-4 text-sm text-ss-ink-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Getting things ready…
            </div>
          ) : matched.length === 0 ? (
            <div className="p-4 text-sm text-ss-ink-500">
              No matches. You can still type a new student ID.
            </div>
          ) : (
            <ul className="py-1">
              {matched.map((s) => {
                const isSelected = s.student_id === value;
                return (
                  <li key={s.record_id}>
                    <button
                      type="button"
                      onClick={() => pick(s)}
                      className={`w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-ss-orange-50 transition ${
                        isSelected ? "bg-ss-orange-50/60" : ""
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="flex-none inline-flex items-center justify-center h-8 w-8 rounded-full bg-ss-orange-500 text-white font-bold text-xs"
                      >
                        {s.country || s.name.charAt(0)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-mono text-xs text-ss-ink-500">
                          {s.student_id}
                        </span>
                        <span className="block font-semibold text-ss-ink-900 text-sm truncate">
                          {s.name}
                          {s.grade ? (
                            <span className="text-ss-ink-500 font-normal">
                              {" "}
                              · {s.grade}
                            </span>
                          ) : null}
                        </span>
                        <span className="block text-xs text-ss-ink-500 truncate">
                          Parent: {s.parent_name || "—"}
                          {s.demo_completed && s.demo_tutor
                            ? ` · Demo by ${s.demo_tutor}`
                            : s.demo_completed
                              ? ""
                              : " · Demo pending"}
                        </span>
                      </span>
                      {isSelected ? (
                        <Check
                          className="h-4 w-4 text-ss-success flex-none mt-1"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
