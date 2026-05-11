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

export const COURSES = [
  "Maths",
  "English",
  "Science",
  "Coding",
  "Public Speaking",
  "Reasoning",
  "Chess",
] as const;

export const CURRENCIES = ["INR", "GBP", "USD", "CAD"] as const;

export const LEAD_SOURCES = [
  "Instagram",
  "Facebook",
  "Google Ads",
  "Referral",
  "Website",
  "Other",
] as const;

export const SALE_TYPES = ["New sale", "Cross sale"] as const;

export const ENROLLMENT_TYPES = [
  "Monthly",
  "Quarterly",
  "Annual",
  "Custom",
] as const;

export const CLASSES_SOLD_MONTHLY_OPTIONS = [4, 6, 8, 10, 12] as const;

export type Course = (typeof COURSES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type SaleType = (typeof SALE_TYPES)[number];
export type EnrollmentType = (typeof ENROLLMENT_TYPES)[number];
export type ClassesSoldMonthly = (typeof CLASSES_SOLD_MONTHLY_OPTIONS)[number];
