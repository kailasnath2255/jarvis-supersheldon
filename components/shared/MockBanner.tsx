"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { isMockMode } from "@/lib/api";

export function MockBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isMockMode());
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-ss-warning/30 bg-yellow-50 px-4 py-3 text-sm text-ss-ink-700"
    >
      <AlertTriangle
        className="h-5 w-5 flex-none text-ss-warning"
        aria-hidden="true"
      />
      <p>
        <span className="font-semibold">Running in mock mode</span> — n8n not
        connected yet. Submissions will use sample data.
      </p>
    </div>
  );
}
