"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { FormField } from "@/components/shared/FormField";
import { Logo } from "@/components/shared/Logo";
import { MockBanner } from "@/components/shared/MockBanner";
import { StudentPicker } from "@/components/shared/StudentPicker";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { AdditionalEnrollments } from "@/components/shared/AdditionalEnrollments";
import type { Student } from "@/lib/types";
import {
  CLASSES_SOLD_MONTHLY_OPTIONS,
  COURSES,
  CURRENCIES,
  ENROLLMENT_TYPES,
  LEAD_SOURCES,
  PAYMENT_MODES,
  SALE_TYPES,
} from "@/lib/types";
import { enrollmentSchema, type EnrollmentFormValues } from "@/lib/schemas";
import { submitEnrollment } from "@/lib/api";

const inputClass =
  "w-full px-4 py-3 rounded-[10px] border border-ss-ink-300 bg-white text-ss-ink-900 placeholder-ss-ink-400 focus:border-ss-orange-500 focus:ring-2 focus:ring-ss-orange-200 outline-none transition";

const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path fill=%22none%22 stroke=%22%235B6271%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M1 1.5l5 5 5-5%22/></svg>')] bg-no-repeat bg-[right_1rem_center] pr-10`;

const errorInputClass =
  "border-ss-error focus:border-ss-error focus:ring-ss-error/20";

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

type SuccessState = {
  parentName: string;
  studentName: string;
  magicToken: string;
};

export default function SalesFormPage() {
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const methods = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      currency: "INR",
      classes_count: 12,
      classes_sold_monthly: 12,
      preferred_timing: "",
      date_of_enrollment: todayISO(),
      sale_without_demo: "No",
      is_referral_lead: "No",
      student_id: "",
      parent_name: "",
      demo_tutor: "",
      has_additional_enrollments: "No",
      additional_subjects: [],
      additional_students: [],
    },
    mode: "onBlur",
  });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  const saleType = watch("sale_type");
  const saleWithoutDemo = watch("sale_without_demo");
  const isReferralLead = watch("is_referral_lead");
  const studentIdValue = watch("student_id") || "";
  const parentWhatsapp = watch("parent_whatsapp") || "";
  const screenshot = watch("payment_screenshot") as File | undefined;

  function applyStudent(s: Student) {
    setValue("student_id", s.student_id, { shouldValidate: true });
    if (s.name) setValue("student_name", s.name, { shouldValidate: true });
    if (s.parent_name)
      setValue("parent_name", s.parent_name, { shouldValidate: true });
    if (s.parent_email)
      setValue("parent_email", s.parent_email, { shouldValidate: true });
    if (s.parent_whatsapp)
      setValue("parent_whatsapp", s.parent_whatsapp, {
        shouldValidate: true,
      });
    if (s.demo_tutor)
      setValue("demo_tutor", s.demo_tutor, { shouldValidate: true });
    if (s.demo_completed === false) {
      setValue("sale_without_demo", "Yes", { shouldValidate: true });
    } else if (s.demo_completed === true) {
      setValue("sale_without_demo", "No", { shouldValidate: true });
    }
    if (s.interested_in && s.interested_in.length > 0) {
      const firstSubject = s.interested_in[0];
      const COURSES_AS_STR = [
        "Maths",
        "English",
        "Science",
        "Coding",
        "Public Speaking",
        "Reasoning",
        "Chess",
      ];
      if (COURSES_AS_STR.includes(firstSubject)) {
        setValue("course", firstSubject as never, { shouldValidate: true });
      }
    }
  }

  async function onSubmit(values: EnrollmentFormValues) {
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val instanceof File) {
          fd.append(key, val);
        } else if (Array.isArray(val) || (val !== null && typeof val === "object")) {
          fd.append(key, JSON.stringify(val));
        } else if (val !== undefined && val !== null) {
          fd.append(key, String(val));
        }
      });
      const res = await submitEnrollment(fd);
      if (!res.success) throw new Error("Server returned success=false");
      setSuccess({
        parentName: values.parent_name || values.student_name,
        studentName: values.student_name,
        magicToken: res.magic_token,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      toast.error("Something broke — try again.");
    }
  }

  function startOver() {
    reset({
      currency: "INR",
      classes_count: 12,
      classes_sold_monthly: 12,
      preferred_timing: "",
      date_of_enrollment: todayISO(),
      sale_without_demo: "No",
      is_referral_lead: "No",
      student_id: "",
      parent_name: "",
      demo_tutor: "",
    });
    setSuccess(null);
  }

  return (
    <main className="min-h-screen bg-ss-bg-50">
      <header className="border-b border-ss-ink-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <Logo size={36} />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/enrollments"
              className="text-sm font-semibold text-ss-ink-500 hover:text-ss-ink-900 transition"
            >
              All enrollments
            </Link>
            <Link
              href="/"
              className="text-sm font-semibold text-ss-ink-500 hover:text-ss-ink-900 transition"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <MockBanner />

        {success ? (
          <SuccessCard
            parentName={success.parentName}
            studentName={success.studentName}
            magicToken={success.magicToken}
            onReset={startOver}
          />
        ) : (
          <>
            <SectionHeader
              eyebrow="After sales"
              title="New enrollment"
              subtitle="Fills in 2 minutes. Everything else is automated."
            />

            <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="bg-white rounded-2xl shadow-ss border border-ss-ink-200 p-6 md:p-8 space-y-8"
            >
              {/* Section 1: Student Information */}
              <Subsection
                title="1. Student information"
                description="Once the Demo Form is filled, fields auto-populate from the Student ID."
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    label="Student ID"
                    htmlFor="student_id"
                    error={errors.student_id?.message}
                    className="md:col-span-2"
                  >
                    <StudentPicker
                      id="student_id"
                      value={studentIdValue}
                      invalid={!!errors.student_id}
                      onChangeText={(t) =>
                        setValue("student_id", t, { shouldValidate: false })
                      }
                      onPickStudent={applyStudent}
                    />
                    <input type="hidden" {...register("student_id")} />
                  </FormField>

                  <FormField
                    label="Sale Without Demo"
                    htmlFor="sale_without_demo"
                    required
                    error={errors.sale_without_demo?.message}
                  >
                    <YesNoPills
                      value={saleWithoutDemo}
                      onPick={(v) =>
                        setValue("sale_without_demo", v, {
                          shouldValidate: true,
                        })
                      }
                    />
                    <input type="hidden" {...register("sale_without_demo")} />
                  </FormField>

                  <FormField
                    label="Student's name"
                    htmlFor="student_name"
                    required
                    error={errors.student_name?.message}
                  >
                    <input
                      id="student_name"
                      type="text"
                      className={`${inputClass} ${errors.student_name ? errorInputClass : ""}`}
                      {...register("student_name")}
                    />
                  </FormField>

                  <FormField
                    label="Parent's name"
                    htmlFor="parent_name"
                    hint="Optional"
                    error={errors.parent_name?.message}
                  >
                    <input
                      id="parent_name"
                      type="text"
                      className={`${inputClass} ${errors.parent_name ? errorInputClass : ""}`}
                      {...register("parent_name")}
                    />
                  </FormField>

                  <FormField
                    label="Parent's WhatsApp number"
                    htmlFor="parent_whatsapp"
                    required
                    error={errors.parent_whatsapp?.message}
                  >
                    <PhoneInput
                      id="parent_whatsapp"
                      value={parentWhatsapp}
                      invalid={!!errors.parent_whatsapp}
                      onChange={(v) =>
                        setValue("parent_whatsapp", v, {
                          shouldValidate: true,
                        })
                      }
                    />
                    <input
                      type="hidden"
                      {...register("parent_whatsapp")}
                    />
                  </FormField>

                  <FormField
                    label="Parent's email"
                    htmlFor="parent_email"
                    required
                    error={errors.parent_email?.message}
                  >
                    <input
                      id="parent_email"
                      type="email"
                      className={`${inputClass} ${errors.parent_email ? errorInputClass : ""}`}
                      {...register("parent_email")}
                    />
                  </FormField>

                  <FormField
                    label="Any specific requirement for course classes"
                    htmlFor="specific_requirement"
                    required
                    className="md:col-span-2"
                    error={errors.specific_requirement?.message}
                  >
                    <textarea
                      id="specific_requirement"
                      rows={3}
                      placeholder="Note any learning needs, schedule preferences, or special requests"
                      className={`${inputClass} resize-y min-h-[88px] ${errors.specific_requirement ? errorInputClass : ""}`}
                      {...register("specific_requirement")}
                    />
                  </FormField>

                  <FormField
                    label="Is this a referral lead?"
                    htmlFor="is_referral_lead"
                    required
                    error={errors.is_referral_lead?.message}
                  >
                    <YesNoPills
                      value={isReferralLead}
                      onPick={(v) =>
                        setValue("is_referral_lead", v, {
                          shouldValidate: true,
                        })
                      }
                    />
                    <input type="hidden" {...register("is_referral_lead")} />
                  </FormField>
                </div>
              </Subsection>

              {/* Section 2: Enrollment Details */}
              <Subsection
                title="2. Enrollment details"
                description="What did the parent enroll in and for how long?"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    label="Date of enrollment"
                    htmlFor="date_of_enrollment"
                    required
                    error={errors.date_of_enrollment?.message}
                  >
                    <input
                      id="date_of_enrollment"
                      type="date"
                      className={`${inputClass} ${errors.date_of_enrollment ? errorInputClass : ""}`}
                      {...register("date_of_enrollment")}
                    />
                  </FormField>

                  <FormField
                    label="Type of enrollment"
                    htmlFor="type_of_enrollment"
                    required
                    error={errors.type_of_enrollment?.message}
                  >
                    <select
                      id="type_of_enrollment"
                      defaultValue=""
                      className={`${selectClass} ${errors.type_of_enrollment ? errorInputClass : ""}`}
                      {...register("type_of_enrollment")}
                    >
                      <option value="" disabled>
                        Pick type
                      </option>
                      {ENROLLMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Course"
                    htmlFor="course"
                    required
                    error={errors.course?.message}
                  >
                    <select
                      id="course"
                      defaultValue=""
                      className={`${selectClass} ${errors.course ? errorInputClass : ""}`}
                      {...register("course")}
                    >
                      <option value="" disabled>
                        Pick a course
                      </option>
                      {COURSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Number of classes in this payment"
                    htmlFor="classes_count"
                    required
                    error={errors.classes_count?.message}
                  >
                    <input
                      id="classes_count"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      className={`${inputClass} ${errors.classes_count ? errorInputClass : ""}`}
                      {...register("classes_count", { valueAsNumber: true })}
                    />
                  </FormField>

                  <FormField
                    label="Number of classes sold monthly"
                    htmlFor="classes_sold_monthly"
                    required
                    error={errors.classes_sold_monthly?.message}
                  >
                    <select
                      id="classes_sold_monthly"
                      className={`${selectClass} ${errors.classes_sold_monthly ? errorInputClass : ""}`}
                      {...register("classes_sold_monthly", {
                        valueAsNumber: true,
                      })}
                    >
                      {CLASSES_SOLD_MONTHLY_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Your name"
                    htmlFor="sales_agent"
                    required
                    error={errors.sales_agent?.message}
                  >
                    <input
                      id="sales_agent"
                      type="text"
                      className={`${inputClass} ${errors.sales_agent ? errorInputClass : ""}`}
                      {...register("sales_agent")}
                    />
                  </FormField>

                  <FormField
                    label="Sale type"
                    htmlFor="sale_type"
                    required
                    error={errors.sale_type?.message}
                  >
                    <div role="radiogroup" className="flex flex-wrap gap-2">
                      {SALE_TYPES.map((opt) => {
                        const selected = saleType === opt;
                        return (
                          <label
                            key={opt}
                            className={`cursor-pointer px-4 py-2 rounded-full border-2 font-semibold text-sm transition ${
                              selected
                                ? "bg-ss-orange-500 text-white border-ss-orange-500"
                                : "bg-white text-ss-ink-700 border-ss-ink-300 hover:border-ss-orange-400"
                            }`}
                          >
                            <input
                              type="radio"
                              value={opt}
                              className="sr-only"
                              {...register("sale_type")}
                            />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  </FormField>

                  <FormField
                    label="Lead source"
                    htmlFor="lead_source"
                    required
                    error={errors.lead_source?.message}
                  >
                    <select
                      id="lead_source"
                      defaultValue=""
                      className={`${selectClass} ${errors.lead_source ? errorInputClass : ""}`}
                      {...register("lead_source")}
                    >
                      <option value="" disabled>
                        Pick a source
                      </option>
                      {LEAD_SOURCES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Demo session tutor"
                    htmlFor="demo_tutor"
                    hint={
                      saleWithoutDemo === "Yes"
                        ? "Optional — sale was without a demo"
                        : "Optional"
                    }
                    error={errors.demo_tutor?.message}
                  >
                    <input
                      id="demo_tutor"
                      type="text"
                      className={`${inputClass} ${errors.demo_tutor ? errorInputClass : ""}`}
                      {...register("demo_tutor")}
                    />
                  </FormField>

                  <FormField
                    label="Preferred class timing (parent's note)"
                    htmlFor="preferred_timing"
                    className="md:col-span-2"
                    error={errors.preferred_timing?.message}
                  >
                    <input
                      id="preferred_timing"
                      type="text"
                      placeholder="e.g. weekdays 5–7 PM"
                      className={inputClass}
                      {...register("preferred_timing")}
                    />
                  </FormField>
                </div>

                <div className="pt-2">
                  <AdditionalEnrollments />
                </div>
              </Subsection>

              {/* Section 3: Payment Details */}
              <Subsection
                title="3. Payment details"
                description="Both customer-currency and INR equivalent, plus payment ID and proof."
              >
                <div className="grid md:grid-cols-[140px_1fr] gap-4">
                  <FormField
                    label="Currency"
                    htmlFor="currency"
                    required
                    error={errors.currency?.message}
                  >
                    <select
                      id="currency"
                      className={`${selectClass} ${errors.currency ? errorInputClass : ""}`}
                      {...register("currency")}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Collection in customer's currency"
                    htmlFor="amount"
                    required
                    error={errors.amount?.message}
                  >
                    <input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      className={`${inputClass} ${errors.amount ? errorInputClass : ""}`}
                      {...register("amount", { valueAsNumber: true })}
                    />
                  </FormField>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    label="Mode of payment"
                    htmlFor="payment_mode"
                    required
                    error={errors.payment_mode?.message}
                  >
                    <select
                      id="payment_mode"
                      defaultValue=""
                      className={`${selectClass} ${errors.payment_mode ? errorInputClass : ""}`}
                      {...register("payment_mode")}
                    >
                      <option value="" disabled>
                        Pick payment mode
                      </option>
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Payment ID"
                    htmlFor="payment_id"
                    required
                    hint="Transaction reference (Razorpay, Stripe, UPI, etc.)"
                    error={errors.payment_id?.message}
                  >
                    <input
                      id="payment_id"
                      type="text"
                      autoComplete="off"
                      className={`${inputClass} ${errors.payment_id ? errorInputClass : ""}`}
                      {...register("payment_id")}
                    />
                  </FormField>

                  <FormField
                    label="Collection in INR"
                    htmlFor="amount_inr"
                    required
                    hint="Converted amount in ₹"
                    className="md:col-span-2"
                    error={errors.amount_inr?.message}
                  >
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ss-ink-500 font-semibold">
                        ₹
                      </span>
                      <input
                        id="amount_inr"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        className={`${inputClass} pl-8 ${errors.amount_inr ? errorInputClass : ""}`}
                        {...register("amount_inr", { valueAsNumber: true })}
                      />
                    </div>
                  </FormField>
                </div>

                <FormField
                  label="Payment screenshot"
                  htmlFor="payment_screenshot"
                  required
                  hint="Image or PDF, up to 10 MB"
                  error={
                    errors.payment_screenshot?.message as string | undefined
                  }
                >
                  <FilePicker
                    file={screenshot}
                    error={!!errors.payment_screenshot}
                    onPick={(f) =>
                      setValue("payment_screenshot", f, {
                        shouldValidate: true,
                      })
                    }
                  />
                </FormField>
              </Subsection>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ss-orange-500 text-white font-semibold hover:bg-ss-orange-600 hover:shadow-ss-brand active:bg-ss-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send to parent"
                  )}
                </button>
              </div>
            </form>
            </FormProvider>
          </>
        )}
      </div>
    </main>
  );
}

function Subsection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 first:pt-0 [&:not(:first-child)]:pt-8 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-ss-ink-200">
      <div>
        <h2 className="font-display text-lg font-bold text-ss-ink-900">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-ss-ink-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function YesNoPills({
  value,
  onPick,
}: {
  value: "Yes" | "No" | undefined;
  onPick: (v: "Yes" | "No") => void;
}) {
  return (
    <div className="flex gap-2">
      {(["Yes", "No"] as const).map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(opt)}
            aria-pressed={selected}
            className={`px-5 py-2 rounded-full border-2 font-semibold text-sm transition min-w-[72px] ${
              selected
                ? "bg-ss-orange-500 text-white border-ss-orange-500"
                : "bg-white text-ss-ink-700 border-ss-ink-300 hover:border-ss-orange-400"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function FilePicker({
  file,
  error,
  onPick,
}: {
  file: File | undefined;
  error: boolean;
  onPick: (f: File) => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer rounded-[10px] border-2 border-dashed bg-ss-bg-50 px-4 py-4 text-sm transition ${
        error
          ? "border-ss-error/60 bg-red-50"
          : "border-ss-ink-300 hover:border-ss-orange-400"
      }`}
    >
      <Upload
        className="h-5 w-5 flex-none text-ss-ink-500"
        aria-hidden="true"
      />
      <span className="flex-1 truncate">
        {file && file.size > 0 ? (
          <span className="font-semibold text-ss-ink-900">{file.name}</span>
        ) : (
          <span className="text-ss-ink-500">
            Drop a screenshot here or tap to choose
          </span>
        )}
      </span>
      <input
        id="payment_screenshot"
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <span className="px-3 py-1 rounded-full border border-ss-orange-500 text-ss-orange-600 text-xs font-semibold">
        Choose
      </span>
    </label>
  );
}

function SuccessCard({
  parentName,
  studentName,
  magicToken,
  onReset,
}: {
  parentName: string;
  studentName: string;
  magicToken: string;
  onReset: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-ss border border-ss-ink-200 p-8 text-center space-y-5">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 text-ss-success">
        <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-ss-ink-900">
          Sent! 👏
        </h2>
        <p className="text-ss-ink-700 text-base">
          {parentName} will get a WhatsApp + email for {studentName} in a few
          seconds.
        </p>
      </div>
      <div className="rounded-xl bg-ss-bg-50 border border-ss-ink-200 px-4 py-3 text-sm text-ss-ink-500">
        <p>Track this enrollment with token:</p>
        <code className="block mt-1 font-mono text-ss-ink-900 break-all">
          {magicToken}
        </code>
      </div>
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ss-orange-500 text-white font-semibold hover:bg-ss-orange-600 hover:shadow-ss-brand active:bg-ss-orange-700 transition"
        >
          New enrollment
        </button>
        <Link
          href={`/confirm/${magicToken}`}
          className="px-5 py-3 rounded-full border-2 border-ss-orange-500 text-ss-orange-600 font-semibold hover:bg-ss-orange-50 transition"
        >
          Preview parent page
        </Link>
        <Link
          href="/enrollments"
          className="px-5 py-3 rounded-full border-2 border-ss-ink-300 text-ss-ink-700 font-semibold hover:bg-ss-ink-100 transition"
        >
          All enrollments
        </Link>
      </div>
    </div>
  );
}
