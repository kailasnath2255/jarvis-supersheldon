"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  Video,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Logo } from "@/components/shared/Logo";
import { LoadingState } from "@/components/shared/LoadingState";
import { listEnrollments } from "@/lib/api";
import { formatAmount } from "@/lib/format";
import type { EnrollmentListItem } from "@/lib/types";

type Props = { params: { token: string } };

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: EnrollmentListItem }
  | { kind: "not_found" }
  | { kind: "error"; message: string };

const statusStyle: Record<string, { bg: string; text: string }> = {
  Pending: { bg: "bg-ss-ink-100", text: "text-ss-ink-700" },
  Notified: { bg: "bg-ss-orange-50", text: "text-ss-orange-700" },
  Confirmed: { bg: "bg-blue-50", text: "text-ss-info" },
  Booked: { bg: "bg-emerald-50", text: "text-ss-success" },
  Completed: { bg: "bg-purple-50", text: "text-purple-700" },
};

export default function EnrollmentDetailPage({ params }: Props) {
  const { token } = params;
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  function load() {
    setState({ kind: "loading" });
    listEnrollments()
      .then((res) => {
        const match = res.enrollments.find((e) => e.magic_token === token);
        if (!match) {
          setState({ kind: "not_found" });
        } else {
          setState({ kind: "ready", data: match });
        }
      })
      .catch((err: Error) =>
        setState({
          kind: "error",
          message: err.message || "Something broke",
        }),
      );
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main className="min-h-screen bg-ss-bg-50">
      <header className="border-b border-ss-ink-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <Logo size={36} />
          </Link>
          <Link
            href="/enrollments"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ss-ink-500 hover:text-ss-ink-900 transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All enrollments
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {state.kind === "loading" ? <LoadingState rows={5} /> : null}

        {state.kind === "error" ? (
          <ErrorView message={state.message} onRetry={load} />
        ) : null}

        {state.kind === "not_found" ? <NotFoundView /> : null}

        {state.kind === "ready" ? <Detail data={state.data} /> : null}
      </section>
    </main>
  );
}

function NotFoundView() {
  return (
    <div className="bg-white rounded-2xl shadow-ss border-l-4 border-ss-error p-6 space-y-2">
      <div className="flex items-center gap-2 text-ss-error font-semibold">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
        Enrollment not found.
      </div>
      <p className="text-sm text-ss-ink-700">
        The token <code className="font-mono">link doesn&apos;t match any row</code>.
      </p>
      <Link
        href="/enrollments"
        className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-full border-2 border-ss-orange-500 text-ss-orange-600 font-semibold hover:bg-ss-orange-50 transition text-sm"
      >
        Back to enrollments
      </Link>
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

function Detail({ data: e }: { data: EnrollmentListItem }) {
  const status = statusStyle[e.status] ?? statusStyle.Pending;
  const fmtDate = (v: string) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? format(d, "PPp") : v;
  };
  const fmtDay = (v: string) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? format(d, "PP") : v;
  };

  let additional: {
    type?: string;
    same_student?: {
      subjects?: string[];
      type_of_enrollment?: string;
      classes_count?: number;
      classes_sold_monthly?: number;
    };
    different_students?: Array<{
      student_id?: string;
      student_name?: string;
      parent_email?: string;
      courses?: string[];
      classes_count?: number;
      type_of_enrollment?: string;
      classes_sold_monthly?: number;
      sale_without_demo?: boolean;
    }>;
  } | null = null;
  if (e.additional_enrollments_json) {
    try {
      additional = JSON.parse(e.additional_enrollments_json);
    } catch {
      additional = null;
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-white rounded-2xl shadow-ss border border-ss-ink-200 p-6 md:p-7">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-ss-orange-600 uppercase">
              Enrollment record
            </p>
            <h1 className="font-display text-3xl font-bold text-ss-ink-900 mt-1">
              {e.student_name || "Unnamed student"}
            </h1>
            <p className="text-ss-ink-500 mt-1">
              Parent: {e.parent_name || "—"}
              {e.created_at
                ? ` · Created ${fmtDate(e.created_at)}`
                : ""}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}
          >
            {e.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
          <Indicator
            on={e.whatsapp_sent}
            icon={MessageSquare}
            label="WhatsApp sent"
          />
          <Indicator on={e.email_sent} icon={Mail} label="Email sent" />
          <Indicator
            on={e.parent_confirmed}
            icon={Check}
            label="Parent confirmed"
          />
          <Indicator on={e.meet_created} icon={Video} label="Meet created" />
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-ss-ink-200">
          <span className="text-xs text-ss-ink-500">Token:</span>
          <code className="text-xs font-mono text-ss-ink-900 break-all">
            {e.magic_token}
          </code>
          <Link
            href={`/confirm/${e.magic_token}`}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-ss-orange-600 hover:text-ss-orange-700"
          >
            Open parent confirm flow
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Student */}
      <Card title="Student information">
        <DetailGrid>
          <Field label="Student ID" value={e.student_id} mono />
          <Field
            label="Sale without demo"
            value={e.sale_without_demo ? "Yes" : "No"}
          />
          <Field label="Student name" value={e.student_name} />
          <Field label="Parent name" value={e.parent_name} />
          <Field
            label="Parent WhatsApp"
            value={e.parent_whatsapp}
            icon={Phone}
          />
          <Field label="Parent email" value={e.parent_email} icon={Mail} />
          <Field
            label="Is referral lead"
            value={e.is_referral_lead ? "Yes" : "No"}
          />
          <Field
            label="Specific requirement"
            value={e.specific_requirement}
            full
          />
        </DetailGrid>
      </Card>

      {/* Enrollment */}
      <Card title="Enrollment details">
        <DetailGrid>
          <Field
            label="Date of enrollment"
            value={fmtDay(e.date_of_enrollment)}
          />
          <Field label="Type of enrolment" value={e.type_of_enrollment} />
          <Field label="Course" value={e.course} />
          <Field
            label="Classes in this payment"
            value={String(e.classes_count)}
          />
          <Field
            label="Classes sold monthly"
            value={String(e.classes_sold_monthly)}
          />
          <Field label="Sale type" value={e.sale_type} />
          <Field label="Lead source" value={e.lead_source} />
          <Field label="Sales agent" value={e.sales_agent} />
          <Field label="Demo tutor" value={e.demo_tutor} />
          <Field
            label="Preferred class timing"
            value={e.preferred_timing}
            full
          />
        </DetailGrid>
      </Card>

      {/* Payment */}
      <Card title="Payment details">
        <DetailGrid>
          <Field
            label="Collection (customer currency)"
            value={formatAmount(e.amount, e.currency)}
          />
          <Field
            label="Collection in INR"
            value={formatAmount(e.amount_inr, "INR")}
          />
          <Field label="Currency" value={e.currency} />
          <Field label="Mode of payment" value={e.payment_mode} />
          <Field label="Payment ID" value={e.payment_id} mono full />
        </DetailGrid>
      </Card>

      {/* Multi-batch */}
      {e.has_additional_enrollments ? (
        <Card title="Additional batch enrollments">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-full bg-ss-orange-100 text-ss-orange-700 text-xs font-semibold">
              {e.additional_type || "Additional"}
            </span>
          </div>

          {additional ? (
            <>
              {additional.same_student &&
              additional.same_student.subjects &&
              additional.same_student.subjects.length > 0 ? (
                <div className="rounded-xl bg-ss-bg-50 border border-ss-ink-200 p-4 mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ss-ink-500 mb-2">
                    Same student · Additional subjects
                  </p>
                  <DetailGrid>
                    <Field
                      label="Subjects"
                      value={additional.same_student.subjects.join(", ")}
                      full
                    />
                    <Field
                      label="Type of enrolment"
                      value={additional.same_student.type_of_enrollment || ""}
                    />
                    <Field
                      label="Classes in payment"
                      value={String(
                        additional.same_student.classes_count || 0,
                      )}
                    />
                    <Field
                      label="Classes sold monthly"
                      value={String(
                        additional.same_student.classes_sold_monthly || 0,
                      )}
                    />
                  </DetailGrid>
                </div>
              ) : null}

              {additional.different_students &&
              additional.different_students.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ss-ink-500">
                    Different students ({additional.different_students.length})
                  </p>
                  {additional.different_students.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-ss-bg-50 border border-ss-ink-200 p-4"
                    >
                      <p className="font-display font-bold text-ss-ink-900 text-sm mb-2">
                        #{i + 1} {s.student_name || "Unnamed"}
                      </p>
                      <DetailGrid>
                        <Field
                          label="Student ID"
                          value={s.student_id || ""}
                          mono
                        />
                        <Field
                          label="Email"
                          value={s.parent_email || ""}
                          icon={Mail}
                        />
                        <Field
                          label="Courses"
                          value={(s.courses || []).join(", ")}
                          full
                        />
                        <Field
                          label="Classes in payment"
                          value={String(s.classes_count || 0)}
                        />
                        <Field
                          label="Type of enrolment"
                          value={s.type_of_enrollment || ""}
                        />
                        <Field
                          label="Classes sold monthly"
                          value={String(s.classes_sold_monthly || 0)}
                        />
                        <Field
                          label="Sale without demo"
                          value={s.sale_without_demo ? "Yes" : "No"}
                        />
                      </DetailGrid>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-ss-ink-500">
              Couldn&apos;t parse the additional enrolments JSON. Raw:
              <code className="block mt-2 text-xs font-mono whitespace-pre-wrap break-all">
                {e.additional_enrollments_json}
              </code>
            </p>
          )}
        </Card>
      ) : null}

      {/* Confirmation */}
      {e.parent_confirmed || e.meet_link ? (
        <Card title="Confirmation">
          <DetailGrid>
            <Field
              label="Slot booked"
              value={fmtDate(e.selected_slot_datetime)}
            />
            <Field label="Meet link" value={e.meet_link} full mono />
          </DetailGrid>
          {e.meet_link ? (
            <div className="mt-4 flex gap-2 flex-wrap">
              <a
                href={e.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ss-orange-500 text-white font-semibold hover:bg-ss-orange-600 hover:shadow-ss-brand transition text-sm"
              >
                <Video className="h-4 w-4" aria-hidden="true" />
                Open Google Meet
              </a>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(e.meet_link);
                    toast.success("Copied!");
                  } catch {
                    toast.error("Couldn't copy.");
                  }
                }}
                className="px-4 py-2 rounded-full border-2 border-ss-ink-300 text-ss-ink-700 font-semibold hover:bg-ss-ink-100 transition text-sm"
              >
                Copy link
              </button>
            </div>
          ) : null}
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

function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
      {children}
    </dl>
  );
}

function Field({
  label,
  value,
  mono = false,
  full = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
  icon?: typeof Mail;
}) {
  const display = value && value.trim() ? value : "—";
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide font-semibold text-ss-ink-500">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-ss-ink-900 ${mono ? "font-mono break-all text-xs" : "font-semibold"} ${display === "—" ? "text-ss-ink-400 font-normal" : ""}`}
      >
        {Icon ? (
          <span className="inline-flex items-center gap-1.5">
            <Icon
              className="h-3.5 w-3.5 text-ss-ink-400"
              aria-hidden="true"
            />
            {display}
          </span>
        ) : (
          display
        )}
      </dd>
    </div>
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
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        on
          ? "bg-emerald-50 text-ss-success"
          : "bg-ss-ink-100 text-ss-ink-500"
      }`}
    >
      {on ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}
