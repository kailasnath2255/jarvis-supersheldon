import Link from "next/link";
import { ArrowRight, MessageSquare, Calendar, Zap } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { MockBanner } from "@/components/shared/MockBanner";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ss-bg-50">
      <header className="border-b border-ss-ink-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Logo size={36} />
          <Link
            href="/sales-form"
            className="text-sm font-semibold text-ss-orange-600 hover:text-ss-orange-700 transition hidden sm:inline"
          >
            Sales team — start here →
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-16 md:py-24 space-y-8">
        <div className="space-y-4">
          <MockBanner />
        </div>

        <div className="text-center space-y-4">
          <p className="text-xs font-semibold tracking-[0.18em] text-ss-orange-600 uppercase">
            Sales-to-onboarding automation
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-ss-ink-900 leading-tight">
            Two-minute enrollment.
            <br />
            <span className="text-ss-orange-500">Everything else automated.</span>
          </h1>
          <p className="text-ss-ink-700 text-lg md:text-xl max-w-2xl mx-auto">
            Sales agents fill one form. Parents pick a tutor + slot from the
            magic link. Google Meet shows up. Airtable stays in sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sales-form"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ss-orange-500 text-white font-semibold hover:bg-ss-orange-600 hover:shadow-ss-brand active:bg-ss-orange-700 transition"
          >
            Sales team — start here
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/enrollments"
            className="px-5 py-3 rounded-full border-2 border-ss-orange-500 text-ss-orange-600 font-semibold hover:bg-ss-orange-50 transition"
          >
            View enrollments
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-12">
          <FeatureCard
            icon={<Zap className="h-5 w-5" aria-hidden="true" />}
            title="2 min, not 15"
            body="One master form replaces post-payment manual work."
          />
          <FeatureCard
            icon={<MessageSquare className="h-5 w-5" aria-hidden="true" />}
            title="WhatsApp + email"
            body="Parents get a magic link to confirm — no logins."
          />
          <FeatureCard
            icon={<Calendar className="h-5 w-5" aria-hidden="true" />}
            title="Meet auto-scheduled"
            body="Google Calendar event with Meet link, sent to all."
          />
        </div>
      </section>

      <footer className="border-t border-ss-ink-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 text-xs text-ss-ink-500 flex flex-wrap items-center justify-between gap-2">
          <span>© Sheldon Labs · Super Sheldon</span>
          <span>v1.0 · Built for the hackathon</span>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-ss p-6 border border-ss-ink-200">
      <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-ss-orange-50 text-ss-orange-600 mb-3">
        {icon}
      </div>
      <h3 className="font-display font-bold text-ss-ink-900 text-base">
        {title}
      </h3>
      <p className="text-sm text-ss-ink-500 mt-1">{body}</p>
    </div>
  );
}
