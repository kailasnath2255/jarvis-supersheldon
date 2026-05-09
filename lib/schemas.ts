import { z } from "zod";
import { COURSES, CURRENCIES, LEAD_SOURCES, SALE_TYPES } from "./types";

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
  student_name: z.string().trim().min(1, "Student's name is required"),
  parent_name: z.string().trim().min(1, "Parent's name is required"),
  parent_whatsapp: z
    .string()
    .trim()
    .regex(
      phoneRegex,
      "Use international format with country code, e.g. +919876543210",
    ),
  parent_email: z.string().trim().email("Enter a valid email"),
  course: z.enum(COURSES, {
    errorMap: () => ({ message: "Pick a course" }),
  }),
  classes_count: z
    .number({ invalid_type_error: "Enter a number" })
    .int("Whole numbers only")
    .min(1, "At least 1 class"),
  sale_type: z.enum(SALE_TYPES, {
    errorMap: () => ({ message: "Pick sale type" }),
  }),
  amount: z
    .number({ invalid_type_error: "Enter the amount" })
    .min(0, "Amount can't be negative"),
  currency: z.enum(CURRENCIES),
  payment_screenshot: fileSchema,
  sales_agent: z.string().trim().min(1, "Your name is required"),
  lead_source: z.enum(LEAD_SOURCES, {
    errorMap: () => ({ message: "Pick a lead source" }),
  }),
  demo_tutor: z.string().trim().min(1, "Demo tutor is required"),
  preferred_timing: z.string().trim().optional().default(""),
});

export type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;
