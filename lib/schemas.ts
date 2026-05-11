import { z } from "zod";
import {
  CLASSES_SOLD_MONTHLY_OPTIONS,
  COURSES,
  CURRENCIES,
  ENROLLMENT_TYPES,
  LEAD_SOURCES,
  PAYMENT_MODES,
  SALE_TYPES,
} from "./types";

const phoneRegex = /^\+\d{8,15}$/;

const fileSchema =
  typeof window === "undefined"
    ? z.any()
    : z
        .instanceof(File, { message: "Payment screenshot is required" })
        .refine((f) => f.size > 0, "Payment screenshot is required")
        .refine((f) => f.size <= 10 * 1024 * 1024, "File must be under 10 MB")
        .refine(
          (f) => /^(image\/.*|application\/pdf)$/.test(f.type),
          "Use an image or PDF",
        );

export const enrollmentSchema = z.object({
  // Section 1: Student Information
  student_id: z.string().trim().optional().default(""),
  sale_without_demo: z.enum(["Yes", "No"], {
    errorMap: () => ({ message: "Pick Yes or No" }),
  }),
  student_name: z.string().trim().min(1, "Student's name is required"),
  parent_name: z.string().trim().optional().default(""),
  parent_whatsapp: z
    .string()
    .trim()
    .regex(
      phoneRegex,
      "Use international format with country code, e.g. +919876543210",
    ),
  parent_email: z.string().trim().email("Enter a valid email"),
  specific_requirement: z
    .string()
    .trim()
    .min(1, "Specific requirement is required"),
  is_referral_lead: z.enum(["Yes", "No"], {
    errorMap: () => ({ message: "Pick Yes or No" }),
  }),

  // Section 2: Enrollment Details
  date_of_enrollment: z
    .string()
    .trim()
    .min(1, "Date of enrollment is required"),
  type_of_enrollment: z.enum(ENROLLMENT_TYPES, {
    errorMap: () => ({ message: "Pick enrollment type" }),
  }),
  course: z.enum(COURSES, { errorMap: () => ({ message: "Pick a course" }) }),
  classes_count: z
    .number({ invalid_type_error: "Enter a number" })
    .int("Whole numbers only")
    .min(1, "At least 1 class"),
  classes_sold_monthly: z
    .number({ invalid_type_error: "Pick monthly pack size" })
    .refine(
      (n) =>
        (CLASSES_SOLD_MONTHLY_OPTIONS as readonly number[]).includes(n),
      { message: "Choose 4, 6, 8, 10, or 12" },
    ),

  // Section 3: Payment Details
  currency: z.enum(CURRENCIES, {
    errorMap: () => ({ message: "Pick currency" }),
  }),
  amount: z
    .number({ invalid_type_error: "Enter customer-currency amount" })
    .min(0, "Amount can't be negative"),
  payment_id: z.string().trim().min(1, "Payment ID is required"),
  amount_inr: z
    .number({ invalid_type_error: "Enter INR equivalent" })
    .min(0, "Amount can't be negative"),
  payment_mode: z.enum(PAYMENT_MODES, {
    errorMap: () => ({ message: "Pick payment mode" }),
  }),
  payment_screenshot: fileSchema,

  // Section 4: Internal (still needed for ops + meet)
  sales_agent: z.string().trim().min(1, "Your name is required"),
  sale_type: z.enum(SALE_TYPES, {
    errorMap: () => ({ message: "Pick sale type" }),
  }),
  demo_tutor: z.string().trim().optional().default(""),
  lead_source: z.enum(LEAD_SOURCES, {
    errorMap: () => ({ message: "Pick a lead source" }),
  }),
  preferred_timing: z.string().trim().optional().default(""),
});

export type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;
