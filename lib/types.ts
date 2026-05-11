export type Slot = {
  id: string;
  datetime: string; // ISO 8601
};

export type Tutor = {
  id: string;
  name: string;
  subjects: string[];
  available_slots: Slot[];
};

export type EnrollmentDetails = {
  student_name: string;
  parent_name: string;
  course: string;
  classes_count: number;
  amount: number;
  currency: string;
  demo_tutor: string;
  available_tutors: Tutor[];
};

export type ConfirmPayload = {
  magic_token: string;
  selected_tutor_id: string;
  selected_slot_id: string;
  agreement_accepted: true;
};

export type EnrollmentSubmitResponse = {
  success: boolean;
  magic_token: string;
  enrollment_id?: string;
};

export type ConfirmResponse = {
  success: boolean;
  meet_link: string;
  slot_datetime: string;
  tutor_name: string;
};

export type EnrollmentListItem = {
  enrollment_id: string;
  magic_token: string;
  student_name: string;
  parent_name: string;
  course: string;
  classes_count: number;
  amount: number;
  currency: string;
  status: string;
  sales_agent: string;
  whatsapp_sent: boolean;
  email_sent: boolean;
  parent_confirmed: boolean;
  meet_created: boolean;
  meet_link: string;
  created_at: string;
};

export type EnrollmentListResponse = {
  enrollments: EnrollmentListItem[];
  count: number;
};

export type Student = {
  record_id: string;
  student_id: string;
  name: string;
  country: string;
  age: number | null;
  grade: string;
  parent_name: string;
  parent_email: string;
  parent_whatsapp: string;
  interested_in: string[];
  demo_completed: boolean;
  demo_tutor: string;
  demo_date: string;
  notes: string;
};

export type StudentListResponse = {
  students: Student[];
  count: number;
};

export const COURSES = [
  "Maths",
  "English",
  "Science",
  "Coding",
  "Public Speaking",
  "Reasoning",
  "Chess",
] as const;

export const CURRENCIES = ["INR", "GBP", "USD", "AUD", "NZD"] as const;

export const LEAD_SOURCES = [
  "Pre sales team",
  "DSA",
  "Performance marketing",
  "Referral",
] as const;

export const SALE_TYPES = ["New sale", "Cross sale"] as const;

export const ENROLLMENT_TYPES = [
  "New Sale",
  "Cross Sale on New enrollment",
  "Cross Sale on existing student",
  "Reactivation",
] as const;

export const PAYMENT_MODES = ["UPI", "Card", "Online", "Others"] as const;

export const ADDITIONAL_TYPES = [
  "Same student, additional subject(s)",
  "Different student(s)",
  "Both",
] as const;

export const CLASSES_SOLD_MONTHLY_OPTIONS = [4, 6, 8, 10, 12] as const;

export type Course = (typeof COURSES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type SaleType = (typeof SALE_TYPES)[number];
export type EnrollmentType = (typeof ENROLLMENT_TYPES)[number];
export type PaymentMode = (typeof PAYMENT_MODES)[number];
export type AdditionalType = (typeof ADDITIONAL_TYPES)[number];
export type ClassesSoldMonthly = (typeof CLASSES_SOLD_MONTHLY_OPTIONS)[number];
