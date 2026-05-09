"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { SectionHeader } from "@/components/shared/SectionHeader";
import { FormField } from "@/components/shared/FormField";
import { Logo } from "@/components/shared/Logo";
import { MockBanner } from "@/components/shared/MockBanner";
import {
  COURSES,
  CURRENCIES,
  LEAD_SOURCES,
  SALE_TYPES,
} from "@/lib/types";
import { enrollmentSchema, type EnrollmentFormValues } from "@/lib/schemas";
import { submitEnrollment } from "@/lib/api";

const inputClass =
  "w-full px-4 py-3 rounded-[10px] border border-ss-ink-300 bg-white text-ss-ink-900 placeholder-ss-ink-400 focus:border-ss-orange-500 focus:ring-2 focus:ring-ss-orange-200 outline-none transition";

const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path fill=%22none%22 stroke=%22%235B6271%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M1 1.5l5 5 5-5%22/></svg>')] bg-no-repeat bg-[right_1rem_center] pr-10`;

const errorInputClass =
  "border-ss-error focus:border-ss-error focus:ring-ss-error/20";

type SuccessState = {
  parentName: string;
  magicToken: string;
};

export default function SalesFormPage() {
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      currency: "INR",
      classes_count: 12,
      preferred_timing: "",
    },
    mode: "onBlur",
  });

  const saleType = watch("sale_type");
  const screenshot = watch("payment_screenshot") as File | undefined;

  async function onSubmit(values: EnrollmentFormValues) {
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val instanceof File) {
          fd.append(key, val);
        } else if (val !== undefined && val !== null) {
          fd.append(key, String(val));
        }
      });
      const res = await submitEnrollment(fd);
      if (!res.success) throw new Error("Server returned success=false");
      setSuccess({
        parentName: values.parent_name,
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
      preferred_timing: "",
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
          <Link
            href="/"
            className="text-sm font-semibold text-ss-ink-500 hover:text-ss-ink-900 transition"
          >
            ← Home
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <MockBanner />

        {success ? (
          <SuccessCard
            parentName={success.parentName}
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

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="bg-white rounded-2xl shadow-ss border border-ss-ink-200 p-6 md:p-8 space-y-8"
            >
              {/* Sub-section 1 */}
              <Subsection
                title="Student & parent"
                description="Who is the class for, and how do we reach them?"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    label="Student's name"
                    htmlFor="student_name"
                    required
                    error={errors.student_name?.message}
                  >
                    <input
                      id="student_name"
                      type="text"
                      autoComplete="off"
                      className={`${inputClass} ${errors.student_name ? errorInputClass : ""}`}
                      {...register("student_name")}
                    />
                  </FormField>

                  <FormField
                    label="Parent's name"
                    htmlFor="parent_name"
                    required
                    error={errors.parent_name?.message}
                  >
                    <input
                      id="parent_name"
                      type="text"
                      autoComplete="off"
                      className={`${inputClass} ${errors.parent_name ? errorInputClass : ""}`}
                      {...register("parent_name")}
                    />
                  </FormField>

                  <FormField
                    label="Parent's WhatsApp number"
                    htmlFor="parent_whatsapp"
                    required
                    hint="Include country code"
                    error={errors.parent_whatsapp?.message}
                  >
                    <input
                      id="parent_whatsapp"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98XXXXXXXX"
                      className={`${inputClass} ${errors.parent_whatsapp ? errorInputClass : ""}`}
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
                      autoComplete="email"
                      className={`${inputClass} ${errors.parent_email ? errorInputClass : ""}`}
                      {...register("parent_email")}
                    />
                  </FormField>
                </div>
              </Subsection>

              {/* Sub-section 2 */}
              <Subsection
                title="Course"
                description="What did the parent buy?"
              >
                <div className="grid md:grid-cols-2 gap-4">
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
                    label="Number of classes purchased"
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
                </div>

                <FormField
                  label="Sale type"
                  htmlFor="sale_type"
                  required
                  error={errors.sale_type?.message}
                >
                  <div
                    role="radiogroup"
                    aria-labelledby="sale_type"
                    className="flex flex-wrap gap-2"
                  >
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
              </Subsection>

              {/* Sub-section 3 */}
              <Subsection
                title="Payment"
                description="What did they pay, and where's the proof?"
              >
                <div className="grid md:grid-cols-[1fr_140px] gap-4">
                  <FormField
                    label="Amount received"
                    htmlFor="amount"
                    required
                    error={errors.amount?.message}
                  >
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ss-ink-500 font-semibold">
                        ₹
                      </span>
                      <input
                        id="amount"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        className={`${inputClass} pl-8 ${errors.amount ? errorInputClass : ""}`}
                        {...register("amount", { valueAsNumber: true })}
                      />
                    </div>
                  </FormField>

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

              {/* Sub-section 4 */}
              <Subsection
                title="Internal"
                description="For our records and the assignment flow."
              >
                <div className="grid md:grid-cols-2 gap-4">
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
                    required
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
  magicToken,
  onReset,
}: {
  parentName: string;
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
          {parentName} will get a WhatsApp + email in a few seconds.
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
      </div>
    </div>
  );
}
