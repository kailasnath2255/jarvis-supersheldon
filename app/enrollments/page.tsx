"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Mail,
  MessageSquare,
  RefreshCw,
  Users,
  Video,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Logo } from "@/components/shared/Logo";
import { MockBanner } from "@/components/shared/MockBanner";
import { LoadingState } from "@/components/shared/LoadingState";
import { listEnrollments } from "@/lib/api";
import { formatAmount } from "@/lib/format";
import type { EnrollmentListItem } from "@/lib/types";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: EnrollmentListItem[] }
  | { kind: "error"; message: string };

const statusStyle: Record<string, { bg: string; text: string }> = {
  Pending: { bg: "bg-ss-ink-100", text: "text-ss-ink-700" },
  Notified: { bg: "bg-ss-orange-50", text: "text-ss-orange-700" },
  Confirmed: { bg: "bg-blue-50", text: "text-ss-info" },
  Booked: { bg: "bg-emerald-50", text: "text-ss-success" },
  Completed: { bg: "bg-purple-50", text: "text-purple-700" },
};

export default function EnrollmentsPage() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  function load() {
    setState({ kind: "loading" });
    listEnrollments()
      .then((res) =>
        setState({ kind: "ready", data: res.enrollments }),
      )
      .catch((err: Error) =>
        setState({
          kind: "error",
          message: err.message || "Something broke",
        }),
      );
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-ss-bg-50">
      <header className="border-b border-ss-ink-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <Logo size={36} />
          </Link>
          <Link
            href="/sales-form"
            className="text-sm font-semibold text-ss-orange-600 hover:text-ss-orange-700 transition"
          >
            New enrollment →
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-6">
        <MockBanner />

        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-ss-orange-600 uppercase">
              Sales / Ops view
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-ss-ink-900 mt-2">
              Enrollments
            </h1>
            <p className="text-ss-ink-500 mt-1">
              Click any student to open the parent confirmation flow.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-ss-orange-500 text-ss-orange-600 font-semibold hover:bg-ss-orange-50 transition text-sm"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>

        {state.kind === "loading" ? <LoadingView /> : null}

        {state.kind === "error" ? (
          <ErrorView message={state.message} onRetry={load} />
        ) : null}

        {state.kind === "ready" && state.data.length === 0 ? (
          <EmptyView />
        ) : null}

        {state.kind === "ready" && state.data.length > 0 ? (
          <EnrollmentList data={state.data} />
        ) : null}
      </section>
    </main>
  );
}

function LoadingView() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-ss border border-ss-ink-200 p-5 space-y-3"
        >
          <LoadingState rows={3} />
        </div>
      ))}
    </div>
  );
}

function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-ss border-l-4 border-ss-error p-6 space-y-3">
      <div className="flex items-center gap-2 text-ss-error font-semibold">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
        Something broke — try again.
      </div>
      <p className="text-sm text-ss-ink-500 break-words">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-3 rounded-full border-2 border-ss-orange-500 text-ss-orange-600 font-semibold hover:bg-ss-orange-50 transition"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyView() {
  return (
    <div className="bg-white rounded-2xl shadow-ss border border-dashed border-ss-ink-300 p-10 text-center space-y-3">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-ss-orange-50 text-ss-orange-600">
        <Users className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-ss-ink-700">Nothing here yet — add one.</p>
      <Link
        href="/sales-form"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ss-orange-500 text-white font-semibold hover:bg-ss-orange-600 hover:shadow-ss-brand transition"
      >
        Create first enrollment
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function EnrollmentList({ data }: { data: EnrollmentListItem[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-ss-ink-500">
        {data.length} enrollment{data.length === 1 ? "" : "s"}, newest first
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((e) => (
          <EnrollmentCard key={e.enrollment_id} e={e} />
        ))}
      </div>
    </div>
  );
}

function EnrollmentCard({ e }: { e: EnrollmentListItem }) {
  const status = statusStyle[e.status] ?? {
    bg: "bg-ss-ink-100",
    text: "text-ss-ink-700",
  };
  const since =
    e.created_at && Number.isFinite(new Date(e.created_at).getTime())
      ? formatDistanceToNow(new Date(e.created_at), { addSuffix: true })
      : null;

  return (
    <Link
      href={`/enrollments/${e.magic_token}`}
      className="block bg-white rounded-2xl shadow-ss border border-ss-ink-200 p-5 hover:border-ss-orange-400 hover:shadow-ss-brand/40 transition group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-ss-ink-900 truncate text-base">
            {e.student_name || "Unnamed student"}
          </p>
          <p className="text-xs text-ss-ink-500 truncate mt-0.5">
            Parent: {e.parent_name || "—"}
          </p>
        </div>
        <span
          className={`flex-none px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}
        >
          {e.status}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs mb-4">
        <div>
          <dt className="text-ss-ink-500 uppercase tracking-wide font-semibold">
            Course
          </dt>
          <dd className="text-ss-ink-900 font-semibold mt-0.5 truncate">
            {e.course || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ss-ink-500 uppercase tracking-wide font-semibold">
            Sessions
          </dt>
          <dd className="text-ss-ink-900 font-semibold mt-0.5">
            {e.classes_count}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ss-ink-500 uppercase tracking-wide font-semibold">
            Amount
          </dt>
          <dd className="text-ss-ink-900 font-semibold mt-0.5">
            {formatAmount(e.amount, e.currency)}
          </dd>
        </div>
      </dl>

      <div className="flex items-center gap-3 pt-3 border-t border-ss-ink-200">
        <Indicator on={e.whatsapp_sent} icon={MessageSquare} label="WA" />
        <Indicator on={e.email_sent} icon={Mail} label="Email" />
        <Indicator on={e.parent_confirmed} icon={Check} label="Confirmed" />
        <Indicator on={e.meet_created} icon={Video} label="Meet" />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-ss-ink-500">
        {since ? <span className="truncate">{since}</span> : <span>—</span>}
        <span className="ml-auto inline-flex items-center gap-1 text-ss-orange-600 font-semibold group-hover:translate-x-0.5 transition">
          Open
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>

      {e.meet_link ? (
        <a
          href={e.meet_link}
          onClick={(ev) => ev.stopPropagation()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block truncate text-xs font-mono text-ss-info hover:underline"
        >
          {e.meet_link}
        </a>
      ) : null}
    </Link>
  );
}

function Indicator({
  on,
  icon: Icon,
  label,
}: {
  on: boolean;
  icon: typeof MessageSquare;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${
        on ? "text-ss-success" : "text-ss-ink-400"
      }`}
      title={`${label}: ${on ? "sent" : "not sent"}`}
    >
      {on ? (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {label}
    </div>
  );
}
