import type {
  ConfirmPayload,
  ConfirmResponse,
  EnrollmentDetails,
  EnrollmentListItem,
  EnrollmentListResponse,
  EnrollmentSubmitResponse,
  Student,
  StudentListResponse,
  Tutor,
} from "./types";

const PLACEHOLDER_PREFIX = "https://your-n8n-url";

function isLive(url: string | undefined): url is string {
  return !!url && url.trim() !== "" && !url.startsWith(PLACEHOLDER_PREFIX);
}

export function isMockMode(): boolean {
  return (
    !isLive(process.env.NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL) ||
    !isLive(process.env.NEXT_PUBLIC_N8N_GET_ENROLLMENT_URL) ||
    !isLive(process.env.NEXT_PUBLIC_N8N_CONFIRM_URL)
  );
}

export async function listEnrollments(): Promise<EnrollmentListResponse> {
  const url = process.env.NEXT_PUBLIC_N8N_LIST_ENROLLMENTS_URL;
  if (!isLive(url)) {
    await wait(500);
    return mockEnrollmentsList();
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to list enrollments (${res.status})`);
  }
  return (await res.json()) as EnrollmentListResponse;
}

export async function listStudents(): Promise<StudentListResponse> {
  const url = process.env.NEXT_PUBLIC_N8N_LIST_STUDENTS_URL;
  if (!isLive(url)) {
    await wait(400);
    return mockStudentsList();
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to list students (${res.status})`);
  }
  return (await res.json()) as StudentListResponse;
}

function mockStudentsList(): StudentListResponse {
  const students: Student[] = [
    {
      record_id: "rec_mock_s1",
      student_id: "AUS-7733-Gawin",
      name: "Gawin",
      country: "AUS",
      age: 12,
      grade: "Grade 7",
      parent_name: "Mr. Walker",
      parent_email: "gawin.parent@example.com.au",
      parent_whatsapp: "+61412345678",
      interested_in: ["Maths", "Coding"],
      demo_completed: true,
      demo_tutor: "Priya Iyer",
      demo_date: "",
      notes: "Loves robotics.",
    },
    {
      record_id: "rec_mock_s2",
      student_id: "IND-1042-Aarav",
      name: "Aarav",
      country: "IND",
      age: 10,
      grade: "Grade 5",
      parent_name: "Mrs. Sharma",
      parent_email: "aarav.parent@example.in",
      parent_whatsapp: "+919876543210",
      interested_in: ["Maths", "Science"],
      demo_completed: true,
      demo_tutor: "Anand Kumar",
      demo_date: "",
      notes: "",
    },
    {
      record_id: "rec_mock_s3",
      student_id: "USA-5621-Brandon",
      name: "Brandon",
      country: "USA",
      age: 14,
      grade: "Grade 9",
      parent_name: "Mr. Johnson",
      parent_email: "brandon.parent@example.com",
      parent_whatsapp: "+14155551234",
      interested_in: ["Public Speaking"],
      demo_completed: false,
      demo_tutor: "",
      demo_date: "",
      notes: "Shy in group settings.",
    },
  ];
  return { students, count: students.length };
}

function mockEnrollmentsList(): EnrollmentListResponse {
  const base = (
    overrides: Partial<EnrollmentListItem>,
  ): EnrollmentListItem => ({
    enrollment_id: "",
    magic_token: "",
    student_id: "",
    sale_without_demo: false,
    student_name: "",
    parent_name: "",
    parent_whatsapp: "",
    parent_email: "",
    specific_requirement: "",
    is_referral_lead: false,
    date_of_enrollment: new Date().toISOString().slice(0, 10),
    type_of_enrollment: "New Sale",
    course: "",
    classes_count: 0,
    classes_sold_monthly: 0,
    currency: "INR",
    amount: 0,
    payment_id: "",
    amount_inr: 0,
    payment_mode: "",
    sales_agent: "Demo Agent",
    sale_type: "New sale",
    lead_source: "Pre sales team",
    demo_tutor: "",
    preferred_timing: "",
    has_additional_enrollments: false,
    additional_type: "",
    additional_enrollments_json: "",
    status: "Pending",
    whatsapp_sent: false,
    email_sent: false,
    parent_confirmed: false,
    meet_created: false,
    selected_slot_datetime: "",
    meet_link: "",
    created_at: new Date().toISOString(),
    ...overrides,
  });
  const items: EnrollmentListItem[] = [
    base({
      enrollment_id: "rec_mock_1",
      magic_token: "mock_demo_token_1",
      student_id: "AUS-7733-Gawin",
      student_name: "Aarav Sharma",
      parent_name: "Rohit Sharma",
      parent_email: "rohit@example.com",
      parent_whatsapp: "+919876543210",
      course: "Maths",
      classes_count: 12,
      classes_sold_monthly: 12,
      amount: 5400,
      amount_inr: 5400,
      payment_id: "pay_mock_1",
      payment_mode: "UPI",
      status: "Booked",
      whatsapp_sent: true,
      email_sent: true,
      parent_confirmed: true,
      meet_created: true,
      meet_link: "https://meet.google.com/mock-abc-defg",
      demo_tutor: "Priya Iyer",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    }),
    base({
      enrollment_id: "rec_mock_2",
      magic_token: "mock_demo_token_2",
      student_name: "Saanvi Mehra",
      parent_name: "Pooja Mehra",
      parent_email: "pooja@example.com",
      parent_whatsapp: "+919900112233",
      course: "Coding",
      classes_count: 24,
      classes_sold_monthly: 12,
      amount: 9600,
      amount_inr: 9600,
      payment_mode: "Card",
      payment_id: "pay_mock_2",
      status: "Notified",
      whatsapp_sent: true,
      email_sent: true,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    }),
    base({
      enrollment_id: "rec_mock_3",
      magic_token: "mock_demo_token_3",
      student_name: "Ishaan Iyer",
      parent_name: "Anita Iyer",
      parent_email: "anita@example.com",
      course: "Public Speaking",
      classes_count: 8,
      classes_sold_monthly: 8,
      amount: 3200,
      amount_inr: 3200,
      payment_id: "pay_mock_3",
      payment_mode: "Online",
      status: "Pending",
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    }),
  ];
  return { enrollments: items, count: items.length };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function submitEnrollment(
  formData: FormData,
): Promise<EnrollmentSubmitResponse> {
  const url = process.env.NEXT_PUBLIC_N8N_NEW_ENROLLMENT_URL;
  if (!isLive(url)) {
    await wait(1500);
    return {
      success: true,
      magic_token: "mock_" + Date.now().toString(36),
      enrollment_id: "rec_mock_" + Date.now().toString(36),
    };
  }
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    throw new Error(`Enrollment submit failed (${res.status})`);
  }
  return (await res.json()) as EnrollmentSubmitResponse;
}

export async function getEnrollmentByToken(
  token: string,
): Promise<EnrollmentDetails> {
  const url = process.env.NEXT_PUBLIC_N8N_GET_ENROLLMENT_URL;
  if (!isLive(url)) {
    await wait(800);
    if (token === "invalid") {
      const err = new Error("not_found");
      (err as Error & { status?: number }).status = 404;
      throw err;
    }
    return mockEnrollment(token);
  }
  const res = await fetch(`${url}?token=${encodeURIComponent(token)}`);
  if (res.status === 404) {
    const err = new Error("not_found");
    (err as Error & { status?: number }).status = 404;
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch enrollment (${res.status})`);
  }
  return (await res.json()) as EnrollmentDetails;
}

export async function submitConfirmation(
  payload: ConfirmPayload,
): Promise<ConfirmResponse> {
  const url = process.env.NEXT_PUBLIC_N8N_CONFIRM_URL;
  if (!isLive(url)) {
    await wait(1500);
    const slot = mockEnrollment(payload.magic_token).available_tutors
      .find((t) => t.id === payload.selected_tutor_id)
      ?.available_slots.find((s) => s.id === payload.selected_slot_id);
    const tutor = mockEnrollment(payload.magic_token).available_tutors.find(
      (t) => t.id === payload.selected_tutor_id,
    );
    return {
      success: true,
      meet_link: "https://meet.google.com/mock-abc-defg",
      slot_datetime: slot?.datetime ?? new Date().toISOString(),
      tutor_name: tutor?.name ?? "Priya Iyer",
    };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Confirmation failed (${res.status})`);
  }
  return (await res.json()) as ConfirmResponse;
}

function mockEnrollment(token: string): EnrollmentDetails {
  const baseDate = new Date();
  baseDate.setHours(16, 0, 0, 0);
  const makeSlots = (offset: number, count: number): Tutor["available_slots"] =>
    Array.from({ length: count }).map((_, i) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + offset + i);
      return {
        id: `mock_slot_${offset}_${i}`,
        datetime: d.toISOString(),
      };
    });

  return {
    student_name: "Aarav Sharma",
    parent_name: "Rohit Sharma",
    course: "Maths",
    classes_count: 12,
    amount: 5400,
    currency: "INR",
    demo_tutor: "Sannya Gupta",
    available_tutors: [
      {
        id: "mock_tutor_1",
        name: "Priya Iyer",
        subjects: ["Maths", "Science"],
        available_slots: makeSlots(2, 5),
      },
      {
        id: "mock_tutor_2",
        name: "Anand Kumar",
        subjects: ["Maths", "Reasoning"],
        available_slots: makeSlots(3, 5),
      },
      {
        id: "mock_tutor_3",
        name: "Meera Nair",
        subjects: ["English", "Public Speaking"],
        available_slots: makeSlots(1, 5),
      },
    ],
  };
}
