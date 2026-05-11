"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { Logo } from "@/components/shared/Logo";
import { MockBanner } from "@/components/shared/MockBanner";
import { SkeletonCard } from "@/components/shared/LoadingState";
import { getEnrollmentByToken, submitConfirmation } from "@/lib/api";
import { formatLongSlot, formatSlot } from "@/lib/format";
import type { ConfirmResponse, EnrollmentDetails } from "@/lib/types";

type FlatSlot = {
  slot_id: string;
  tutor_id: string;
  tutor_name: string;
  datetime: string;
};

type PageProps = { params: { token: string } };

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: EnrollmentDetails }
  | { kind: "not_found" }
  | { kind: "error"; message: string };

export default function ConfirmPage({ params }: PageProps) {
  const { token } = params;

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    getEnrollmentByToken(token)
      .then((data) => {
        if (!cancelled) setState({ kind: "ready", data });
      })
      .catch((err: Error & { status?: number }) => {
        if (cancelled) return;
        if (err.status === 404 || err.message === "not_found") {
          setState({ kind: "not_found" });
        } else {
          setState({
            kind: "error",
            message: err.message || "Something broke",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const flatSlots: FlatSlot[] = useMemo(() => {
    if (state.kind !== "ready") return [];
    const all: FlatSlot[] = [];
    for (const tutor of state.data.available_tutors) {
      for (const slot of tutor.available_slots) {
        all.push({
          slot_id: slot.id,
          tutor_id: tutor.id,
          tutor_name: tutor.name,
          datetime: slot.datetime,
        });
      }
    }
    return all.sort(
      (a, b) =>
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
    );
  }, [state]);

  const selectedSlot = useMemo(
    () => flatSlots.find((s) => s.slot_id === selectedSlotId),
    [flatSlots, selectedSlotId],
  );

  async function lockItIn() {
    if (!selectedSlot || !agreed) return;
    setSubmitting(true);
    try {
      const res = await submitConfirmation({
        magic_token: token,
        selected_tutor_id: selectedSlot.tutor_id,
        selected_slot_id: selectedSlot.slot_id,
        agreement_accepted: true,
      });
      if (!res.success) throw new Error("Server returned success=false");
      setConfirmed(res);
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.4 },
          colors: ["#FF6B1F", "#FFA14B", "#16A34A", "#2563EB"],
        });
      }, 100);
    } catch (err) {
      console.error(err);
      toast.error("Something broke — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-ss-bg-50">
      <header className="border-b border-ss-ink-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Logo size={32} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <MockBanner />

        {state.kind === "loading" ? <LoadingView /> : null}

        {state.kind === "not_found" ? <NotFoundView /> : null}

        {state.kind === "error" ? (
          <ErrorView
            message={state.message}
            onRetry={() => {
              setState({ kind: "loading" });
              getEnrollmentByToken(token)
                .then((data) => setState({ kind: "ready", data }))
                .catch((err: Error & { status?: number }) => {
                  if (err.status === 404 || err.message === "not_found") {
                    setState({ kind: "not_found" });
                  } else {
                    setState({
                      kind: "error",
                      message: err.message || "Something broke",
                    });
                  }
                });
            }}
          />
        ) : null}

        {state.kind === "ready" && !confirmed ? (
          <ReadyView
            data={state.data}
            flatSlots={flatSlots}
            selectedSlot={selectedSlot}
            selectedSlotId={selectedSlotId}
            agreed={agreed}
            submitting={submitting}
            onPickSlot={setSelectedSlotId}
            onAgreeChange={setAgreed}
            onSubmit={lockItIn}
          />
        ) : null}

        {confirmed ? (
          <CelebrationCard
            meetLink={confirmed.meet_link}
            slotIso={confirmed.slot_datetime}
            tutorName={confirmed.tutor_name}
          />
        ) : null}
      </div>
    </main>
  );
}

function LoadingView() {
  return (
    <div className="space-y-4" aria-busy="true">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="bg-white rounded-2xl shadow-ss border-l-4 border-ss-error p-6 space-y-2">
      <div className="flex items-center gap-2 text-ss-error font-semibold">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
        This link is invalid or expired.
      </div>
      <p className="text-sm text-ss-ink-700">
        Ask your sales agent for a fresh confirmation link, or reply to the
        WhatsApp message we sent.
      </p>
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

function ReadyView(props: {
  data: EnrollmentDetails;
  flatSlots: FlatSlot[];
  selectedSlot: FlatSlot | undefined;
  selectedSlotId: string | null;
  agreed: boolean;
  submitting: boolean;
  onPickSlot: (id: string) => void;
  onAgreeChange: (v: boolean) => void;
  onSubmit: () => void;
}) {
  const {
    data,
    flatSlots,
    selectedSlot,
    selectedSlotId,
    agreed,
    submitting,
    onPickSlot,
    onAgreeChange,
    onSubmit,
  } = props;

  const canSubmit = !!selectedSlotId && agreed && !submitting;

  return (
    <>
      {/* Hero */}
      <section className="bg-white rounded-2xl shadow-ss border border-ss-ink-200 p-6 md:p-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-ss-orange-600 uppercase">
          Welcome aboard
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ss-ink-900 mt-2">
          Welcome, {data.parent_name}! 👋
        </h1>
        <p className="text-ss-ink-700 mt-2 text-base md:text-lg">
          Let&apos;s get {data.student_name} started in {data.course}.
        </p>
      </section>

      {/* What happens next */}
      <Card title="What happens next">
        <ol className="space-y-3 text-sm">
          {[
            "Pick a starting time that works for you.",
            "We'll match you with the right tutor for that slot.",
            "You'll get a Google Meet link by WhatsApp + email.",
            "Class begins.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-none inline-flex items-center justify-center h-7 w-7 rounded-full bg-ss-orange-50 text-ss-orange-700 font-bold text-xs">
                {i + 1}
              </span>
              <span className="text-ss-ink-700 pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* Pick a starting time — flat slot grid (tutor auto-assigned by slot) */}
      <Card title="Pick a starting time">
        {flatSlots.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-6 w-6" aria-hidden="true" />}
            label="Nothing here yet — add one."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {flatSlots.map((slot) => {
              const selected = selectedSlotId === slot.slot_id;
              return (
                <button
                  key={slot.slot_id}
                  type="button"
                  onClick={() => onPickSlot(slot.slot_id)}
                  aria-pressed={selected}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition min-h-[44px] ${
                    selected
                      ? "bg-ss-orange-500 text-white border-ss-orange-500"
                      : "bg-white text-ss-ink-700 border-ss-ink-300 hover:border-ss-orange-400"
                  }`}
                >
                  {formatSlot(slot.datetime)}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Final: agreement + submit */}
      {selectedSlot ? (
        <Card title="One last thing">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => onAgreeChange(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-ss-ink-300 text-ss-orange-500 focus:ring-2 focus:ring-ss-orange-200"
            />
            <span className="text-sm text-ss-ink-700">
              I agree to Sheldon Labs&apos; tutoring terms and class schedule.
            </span>
          </label>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ss-orange-500 text-white font-semibold hover:bg-ss-orange-600 hover:shadow-ss-brand active:bg-ss-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition w-full md:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting up your class…
              </>
            ) : (
              "Lock it in"
            )}
          </button>
        </Card>
      ) : null}
    </>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-ss border border-ss-ink-200 p-6 md:p-7">
      <h2 className="font-display text-lg font-bold text-ss-ink-900 mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function EmptyState({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-ss-ink-300 bg-ss-bg-50 px-4 py-8 text-center text-sm text-ss-ink-500">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white text-ss-ink-500 mb-2">
        {icon}
      </div>
      <p>{label}</p>
    </div>
  );
}

function CelebrationCard({
  meetLink,
  slotIso,
  tutorName,
}: {
  meetLink: string;
  slotIso: string;
  tutorName: string;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(meetLink);
      toast.success("Copied!");
    } catch {
      toast.error("Couldn't copy — long-press to copy manually.");
    }
  }
  return (
    <div className="bg-white rounded-2xl shadow-ss border border-ss-ink-200 p-8 text-center space-y-5">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-ss-success">
        <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-bold text-ss-ink-900">
          You&apos;re all set! 🎉
        </h2>
        <p className="text-ss-ink-700">
          Your Google Meet link has been sent to your WhatsApp and email.
        </p>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left bg-ss-bg-50 rounded-xl border border-ss-ink-200 p-4">
        <div>
          <dt className="text-xs uppercase tracking-wide font-semibold text-ss-ink-500">
            When
          </dt>
          <dd className="text-ss-ink-900 font-semibold mt-0.5">
            {formatLongSlot(slotIso)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide font-semibold text-ss-ink-500">
            Tutor
          </dt>
          <dd className="text-ss-ink-900 font-semibold mt-0.5">{tutorName}</dd>
        </div>
      </dl>

      <div className="rounded-xl border border-ss-ink-200 bg-white p-3 text-left flex items-center gap-2">
        <code className="flex-1 font-mono text-sm break-all text-ss-ink-900">
          {meetLink}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy meet link"
          className="flex-none p-2 rounded-full border-2 border-ss-orange-500 text-ss-orange-600 hover:bg-ss-orange-50 transition"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <a
        href={meetLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ss-orange-500 text-white font-semibold hover:bg-ss-orange-600 hover:shadow-ss-brand active:bg-ss-orange-700 transition"
      >
        Open Google Meet
      </a>

      <p className="text-xs text-ss-ink-500 pt-1">
        We&apos;ll see you in class. Reply to your WhatsApp if you need to reschedule.
      </p>
    </div>
  );
}
