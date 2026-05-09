"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  GraduationCap,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { Logo } from "@/components/shared/Logo";
import { MockBanner } from "@/components/shared/MockBanner";
import { SkeletonCard } from "@/components/shared/LoadingState";
import { getEnrollmentByToken, submitConfirmation } from "@/lib/api";
import { formatAmount, formatLongSlot, formatSlot } from "@/lib/format";
import type { ConfirmResponse, EnrollmentDetails, Tutor } from "@/lib/types";

type PageProps = { params: { token: string } };

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: EnrollmentDetails }
  | { kind: "not_found" }
  | { kind: "error"; message: string };

export default function ConfirmPage({ params }: PageProps) {
  const { token } = params;

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
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

  const selectedTutor: Tutor | undefined = useMemo(() => {
    if (state.kind !== "ready") return undefined;
    return state.data.available_tutors.find((t) => t.id === selectedTutorId);
  }, [state, selectedTutorId]);

  function pickTutor(id: string) {
    setSelectedTutorId(id);
    setSelectedSlotId(null);
  }

  async function lockItIn() {
    if (!selectedTutorId || !selectedSlotId || !agreed) return;
    setSubmitting(true);
    try {
      const res = await submitConfirmation({
        magic_token: token,
        selected_tutor_id: selectedTutorId,
        selected_slot_id: selectedSlotId,
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
            selectedTutorId={selectedTutorId}
            selectedSlotId={selectedSlotId}
            agreed={agreed}
            submitting={submitting}
            selectedTutor={selectedTutor}
            onPickTutor={pickTutor}
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
  selectedTutorId: string | null;
  selectedSlotId: string | null;
  agreed: boolean;
  submitting: boolean;
  selectedTutor: Tutor | undefined;
  onPickTutor: (id: string) => void;
  onPickSlot: (id: string) => void;
  onAgreeChange: (v: boolean) => void;
  onSubmit: () => void;
}) {
  const {
    data,
    selectedTutorId,
    selectedSlotId,
    agreed,
    submitting,
    selectedTutor,
    onPickTutor,
    onPickSlot,
    onAgreeChange,
    onSubmit,
  } = props;

  const canSubmit =
    !!selectedTutorId && !!selectedSlotId && agreed && !submitting;

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

      {/* Section 1: Your purchase */}
      <Card title="Your purchase">
        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <Detail label="Course" value={data.course} />
          <Detail label="Classes" value={`${data.classes_count} sessions`} />
          <Detail
            label="Amount paid"
            value={formatAmount(data.amount, data.currency)}
          />
          <Detail label="Demo tutor" value={data.demo_tutor} />
        </dl>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-ss-success text-xs font-semibold mt-4">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Payment confirmed
        </span>
      </Card>

      {/* Section 2: What happens next */}
      <Card title="What happens next">
        <ol className="space-y-3 text-sm">
          {[
            "You'll be assigned a tutor.",
            "You'll pick a starting time.",
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

      {/* Section 3: Pick your tutor */}
      <Card title="Pick your tutor">
        {data.available_tutors.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-6 w-6" aria-hidden="true" />}
            label="Nothing here yet — add one."
          />
        ) : (
          <ul className="space-y-3">
            {data.available_tutors.map((tutor) => {
              const selected = selectedTutorId === tutor.id;
              return (
                <li key={tutor.id}>
                  <button
                    type="button"
                    onClick={() => onPickTutor(tutor.id)}
                    aria-pressed={selected}
                    className={`w-full text-left rounded-xl border-2 p-4 flex items-center gap-4 transition ${
                      selected
                        ? "border-ss-success bg-emerald-50/60"
                        : "border-ss-ink-200 bg-white hover:border-ss-orange-400"
                    }`}
                  >
                    <span
                      className="flex-none inline-flex items-center justify-center h-12 w-12 rounded-full bg-ss-orange-500 text-white font-display font-extrabold text-lg"
                      aria-hidden="true"
                    >
                      {tutor.name.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-ss-ink-900">
                        {tutor.name}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {tutor.subjects.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-0.5 rounded-full bg-ss-orange-50 text-ss-orange-700 text-xs font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className={`flex-none inline-flex items-center justify-center h-9 px-3 rounded-full text-sm font-semibold transition ${
                        selected
                          ? "bg-ss-success text-white"
                          : "border-2 border-ss-orange-500 text-ss-orange-600"
                      }`}
                    >
                      {selected ? (
                        <>
                          <Check
                            className="h-4 w-4 mr-1"
                            aria-hidden="true"
                          />
                          Chosen
                        </>
                      ) : (
                        "Choose"
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Section 4: Pick a starting time */}
      {selectedTutor ? (
        <Card title="Pick a starting time">
          {selectedTutor.available_slots.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-6 w-6" aria-hidden="true" />}
              label="Nothing here yet — add one."
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedTutor.available_slots.map((slot) => {
                const selected = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onPickSlot(slot.id)}
                    aria-pressed={selected}
                    className={`px-3 py-2.5 rounded-full text-sm font-semibold border-2 transition min-h-[44px] ${
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
      ) : null}

      {/* Final: agreement + submit */}
      {selectedTutor && selectedSlotId ? (
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide font-semibold text-ss-ink-500">
        {label}
      </dt>
      <dd className="text-ss-ink-900 font-semibold mt-0.5">{value}</dd>
    </div>
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
        <Link href="/" className="underline hover:text-ss-ink-700">
          Back to home
        </Link>
      </p>
    </div>
  );
}
