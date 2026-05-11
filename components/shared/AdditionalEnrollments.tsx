"use client";

import {
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { Plus, X } from "lucide-react";

import { FormField } from "@/components/shared/FormField";
import { MultiSelect } from "@/components/shared/MultiSelect";
import {
  ADDITIONAL_TYPES,
  CLASSES_SOLD_MONTHLY_OPTIONS,
  COURSES,
  ENROLLMENT_TYPES,
} from "@/lib/types";
import type { EnrollmentFormValues } from "@/lib/schemas";

const inputClass =
  "w-full px-4 py-3 rounded-[10px] border border-ss-ink-300 bg-white text-ss-ink-900 placeholder-ss-ink-400 focus:border-ss-orange-500 focus:ring-2 focus:ring-ss-orange-200 outline-none transition";
const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path fill=%22none%22 stroke=%22%235B6271%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M1 1.5l5 5 5-5%22/></svg>')] bg-no-repeat bg-[right_1rem_center] pr-10`;
const errorInputClass =
  "border-ss-error focus:border-ss-error focus:ring-ss-error/20";

export function AdditionalEnrollments() {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<EnrollmentFormValues>();

  const hasAdditional = watch("has_additional_enrollments");
  const additionalType = watch("additional_type");
  const additionalSubjects = (watch("additional_subjects") as string[]) || [];

  const showSameStudent =
    additionalType === "Same student, additional subject(s)" ||
    additionalType === "Both";
  const showDifferentStudents =
    additionalType === "Different student(s)" || additionalType === "Both";

  const { fields, append, remove } = useFieldArray({
    control,
    name: "additional_students",
  });

  function addStudent() {
    append({
      student_id: "",
      student_name: "",
      parent_email: "",
      courses: [],
      classes_count: 12,
      type_of_enrollment: "New Sale",
      classes_sold_monthly: 12,
      sale_without_demo: "No",
    });
  }

  return (
    <div className="space-y-5">
      <FormField
        label="Did this payment include enrolments for more than one batch?"
        htmlFor="has_additional_enrollments"
        required
        error={errors.has_additional_enrollments?.message}
      >
        <div className="flex gap-2">
          {(["Yes", "No"] as const).map((opt) => {
            const selected = hasAdditional === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  setValue("has_additional_enrollments", opt, {
                    shouldValidate: true,
                  })
                }
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
        <input
          type="hidden"
          {...register("has_additional_enrollments")}
        />
      </FormField>

      {hasAdditional === "Yes" ? (
        <FormField
          label="What type of additional enrolments are included?"
          htmlFor="additional_type"
          required
          error={errors.additional_type?.message}
        >
          <div className="flex flex-col gap-2">
            {ADDITIONAL_TYPES.map((t) => {
              const selected = additionalType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setValue("additional_type", t, { shouldValidate: true })
                  }
                  className={`text-left px-4 py-3 rounded-xl border-2 font-semibold text-sm transition ${
                    selected
                      ? "border-ss-orange-500 bg-ss-orange-50 text-ss-orange-700"
                      : "bg-white text-ss-ink-700 border-ss-ink-300 hover:border-ss-orange-400"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register("additional_type")} />
        </FormField>
      ) : null}

      {/* Situation 1 / Both: same student additional subjects */}
      {hasAdditional === "Yes" && showSameStudent ? (
        <div className="rounded-2xl border border-ss-ink-200 bg-ss-bg-50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-ss-orange-100 text-ss-orange-700 text-xs font-semibold">
              Same student
            </span>
            <span className="text-sm text-ss-ink-500">Additional subjects</span>
          </div>

          <FormField
            label="Subjects"
            htmlFor="additional_subjects"
            required
            error={
              (errors.additional_subjects as unknown as { message?: string })
                ?.message
            }
          >
            <MultiSelect
              options={[...COURSES]}
              value={additionalSubjects}
              onChange={(next) =>
                setValue("additional_subjects", next as never, {
                  shouldValidate: true,
                })
              }
              placeholder="Pick one or more subjects"
              invalid={!!errors.additional_subjects}
            />
          </FormField>

          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              label="Type of enrolment"
              htmlFor="additional_enrollment_type"
              required
              error={errors.additional_enrollment_type?.message}
            >
              <select
                id="additional_enrollment_type"
                defaultValue=""
                className={`${selectClass} ${errors.additional_enrollment_type ? errorInputClass : ""}`}
                {...register("additional_enrollment_type")}
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
              label="Number of classes in this payment"
              htmlFor="additional_classes_count"
              required
              error={errors.additional_classes_count?.message}
            >
              <input
                id="additional_classes_count"
                type="number"
                inputMode="numeric"
                min={1}
                className={`${inputClass} ${errors.additional_classes_count ? errorInputClass : ""}`}
                {...register("additional_classes_count", {
                  setValueAs: (v) =>
                    v === "" || v === null || v === undefined
                      ? undefined
                      : Number(v),
                })}
              />
            </FormField>

            <FormField
              label="Number of classes sold monthly"
              htmlFor="additional_classes_sold_monthly"
              required
              className="md:col-span-2"
              error={errors.additional_classes_sold_monthly?.message}
            >
              <select
                id="additional_classes_sold_monthly"
                defaultValue=""
                className={`${selectClass} ${errors.additional_classes_sold_monthly ? errorInputClass : ""}`}
                {...register("additional_classes_sold_monthly", {
                  setValueAs: (v) =>
                    v === "" || v === null || v === undefined
                      ? undefined
                      : Number(v),
                })}
              >
                <option value="" disabled>
                  Pick pack size
                </option>
                {CLASSES_SOLD_MONTHLY_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>
      ) : null}

      {/* Situation 2 / Both: different students repeater */}
      {hasAdditional === "Yes" && showDifferentStudents ? (
        <div className="rounded-2xl border border-ss-ink-200 bg-ss-bg-50 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-ss-orange-100 text-ss-orange-700 text-xs font-semibold">
                Different student{fields.length === 1 ? "" : "s"}
              </span>
              <span className="text-sm text-ss-ink-500">
                {fields.length} added
              </span>
            </div>
            <button
              type="button"
              onClick={addStudent}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-ss-orange-500 text-ss-orange-600 font-semibold hover:bg-ss-orange-50 transition text-sm"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add another student
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center text-sm text-ss-ink-500 py-6">
              No students added yet. Click <b>Add another student</b> to start.
            </div>
          ) : null}

          {(
            errors.additional_students as unknown as { message?: string }
          )?.message ? (
            <p className="text-xs font-medium text-ss-error">
              {
                (
                  errors.additional_students as unknown as {
                    message?: string;
                  }
                ).message
              }
            </p>
          ) : null}

          {fields.map((f, i) => {
            const studentErrors = (
              errors.additional_students as unknown as Array<{
                student_name?: { message?: string };
                parent_email?: { message?: string };
                courses?: { message?: string };
                classes_count?: { message?: string };
                type_of_enrollment?: { message?: string };
                classes_sold_monthly?: { message?: string };
                sale_without_demo?: { message?: string };
              }>
            )?.[i];

            return (
              <div
                key={f.id}
                className="bg-white rounded-xl border border-ss-ink-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-ss-ink-900 text-sm">
                    Additional student #{i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label={`Remove student ${i + 1}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ss-error hover:underline"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <FormField
                    label="Student ID"
                    htmlFor={`additional_students.${i}.student_id`}
                    hint="Optional"
                  >
                    <input
                      id={`additional_students.${i}.student_id`}
                      type="text"
                      autoComplete="off"
                      className={inputClass}
                      {...register(
                        `additional_students.${i}.student_id` as const,
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Student name"
                    htmlFor={`additional_students.${i}.student_name`}
                    required
                    error={studentErrors?.student_name?.message}
                  >
                    <input
                      id={`additional_students.${i}.student_name`}
                      type="text"
                      className={`${inputClass} ${studentErrors?.student_name ? errorInputClass : ""}`}
                      {...register(
                        `additional_students.${i}.student_name` as const,
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Email"
                    htmlFor={`additional_students.${i}.parent_email`}
                    required
                    className="md:col-span-2"
                    error={studentErrors?.parent_email?.message}
                  >
                    <input
                      id={`additional_students.${i}.parent_email`}
                      type="email"
                      autoComplete="email"
                      className={`${inputClass} ${studentErrors?.parent_email ? errorInputClass : ""}`}
                      {...register(
                        `additional_students.${i}.parent_email` as const,
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Courses"
                    htmlFor={`additional_students.${i}.courses`}
                    required
                    className="md:col-span-2"
                    error={studentErrors?.courses?.message}
                  >
                    <Controller
                      control={control}
                      name={`additional_students.${i}.courses` as const}
                      render={({ field }) => (
                        <MultiSelect
                          options={[...COURSES]}
                          value={(field.value as string[]) || []}
                          onChange={(next) =>
                            field.onChange(next as never)
                          }
                          placeholder="Pick one or more"
                          invalid={!!studentErrors?.courses}
                        />
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Classes in this payment"
                    htmlFor={`additional_students.${i}.classes_count`}
                    required
                    error={studentErrors?.classes_count?.message}
                  >
                    <input
                      id={`additional_students.${i}.classes_count`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      className={`${inputClass} ${studentErrors?.classes_count ? errorInputClass : ""}`}
                      {...register(
                        `additional_students.${i}.classes_count` as const,
                        { valueAsNumber: true },
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Type of enrolment"
                    htmlFor={`additional_students.${i}.type_of_enrollment`}
                    required
                    error={studentErrors?.type_of_enrollment?.message}
                  >
                    <select
                      id={`additional_students.${i}.type_of_enrollment`}
                      defaultValue=""
                      className={`${selectClass} ${studentErrors?.type_of_enrollment ? errorInputClass : ""}`}
                      {...register(
                        `additional_students.${i}.type_of_enrollment` as const,
                      )}
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
                    label="Classes sold monthly"
                    htmlFor={`additional_students.${i}.classes_sold_monthly`}
                    required
                    error={studentErrors?.classes_sold_monthly?.message}
                  >
                    <select
                      id={`additional_students.${i}.classes_sold_monthly`}
                      className={`${selectClass} ${studentErrors?.classes_sold_monthly ? errorInputClass : ""}`}
                      {...register(
                        `additional_students.${i}.classes_sold_monthly` as const,
                        { valueAsNumber: true },
                      )}
                    >
                      {CLASSES_SOLD_MONTHLY_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Sale without demo"
                    htmlFor={`additional_students.${i}.sale_without_demo`}
                    required
                    error={studentErrors?.sale_without_demo?.message}
                  >
                    <select
                      id={`additional_students.${i}.sale_without_demo`}
                      className={`${selectClass} ${studentErrors?.sale_without_demo ? errorInputClass : ""}`}
                      {...register(
                        `additional_students.${i}.sale_without_demo` as const,
                      )}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </FormField>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
