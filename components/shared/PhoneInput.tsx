"use client";

import { useMemo } from "react";

type Country = { code: string; flag: string; name: string };

const COUNTRIES: Country[] = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
];

// Longest codes first so prefix-matching picks the most specific one.
const SORTED = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);

function splitNumber(full: string): { code: string; rest: string } {
  const v = (full || "").trim();
  if (!v) return { code: "+91", rest: "" };
  if (!v.startsWith("+")) return { code: "+91", rest: v.replace(/\D/g, "") };
  for (const c of SORTED) {
    if (v.startsWith(c.code)) {
      return {
        code: c.code,
        rest: v.slice(c.code.length).replace(/\D/g, ""),
      };
    }
  }
  return { code: "+91", rest: v.slice(1).replace(/\D/g, "") };
}

type Props = {
  value: string;
  onChange: (full: string) => void;
  invalid?: boolean;
  id?: string;
  placeholder?: string;
};

export function PhoneInput({
  value,
  onChange,
  invalid = false,
  id = "parent_whatsapp",
  placeholder = "98XXXXXXXX",
}: Props) {
  const { code, rest } = useMemo(() => splitNumber(value), [value]);

  function setCode(newCode: string) {
    onChange(`${newCode}${rest}`);
  }

  function setRest(newRest: string) {
    const digitsOnly = newRest.replace(/\D/g, "");
    onChange(`${code}${digitsOnly}`);
  }

  return (
    <div
      className={`flex items-stretch rounded-[10px] border bg-white transition focus-within:border-ss-orange-500 focus-within:ring-2 focus-within:ring-ss-orange-200 ${
        invalid ? "border-ss-error" : "border-ss-ink-300"
      }`}
    >
      <select
        aria-label="Country code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="appearance-none bg-transparent pl-3 pr-8 py-3 text-sm font-semibold text-ss-ink-900 outline-none cursor-pointer border-r border-ss-ink-200 rounded-l-[10px] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 12 8%22><path fill=%22none%22 stroke=%22%235B6271%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M1 1.5l5 5 5-5%22/></svg>')] bg-no-repeat bg-[right_0.75rem_center]"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code} {c.name}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={rest}
        onChange={(e) => setRest(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 bg-transparent text-ss-ink-900 placeholder-ss-ink-400 outline-none rounded-r-[10px]"
      />
    </div>
  );
}
