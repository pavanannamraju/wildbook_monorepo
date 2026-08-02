import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BinocularsIcon,
  BirdIcon,
  CheckCircleIcon,
  TreeEvergreenIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { subscribeFeatureNotification } from "../api/featureNotifications";
import { StickyTopNavbar } from "../components/common/StickyTopNavbar";

const SIGHTINGS = [
  { label: "Explore Experts", done: true },
  { label: "Expert Enquiry", done: true },
  { label: "Curated Experiences by Experts", done: false },
  { label: "Expert Field Log", done: false },
  { label: "Homestays", done: false },
  { label: "Shared Safaris", done: false },
] as const;

type PageScaffoldProps = {
  title: string;
};

export function PageScaffold({ title }: PageScaffoldProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      await subscribeFeatureNotification({
        email: trimmed,
        feature: title,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your email. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F4F1] font-['Nunito'] text-[#2F2B28] selection:bg-[#0B6E66] selection:text-white">
      <StickyTopNavbar variant="dark" />

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-16">
        <div className="w-full max-w-[1024px]">
          <div className="mb-8 flex justify-center">
            <div className="relative h-24 w-24">
              <div className="absolute -inset-4 rounded-full bg-[#9BCDB2]/20 blur-xl" />
              <div className="relative z-[1] flex h-24 w-24 items-center justify-center rounded-full bg-[#9BCDB2]/30 ring-4 ring-[#9BCDB2]/20">
                <BinocularsIcon size={44} weight="duotone" className="text-[#0B6E66]" />
              </div>
              <div
                className="pointer-events-none absolute inset-[-2px] animate-orbit"
                aria-hidden="true"
              >
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#D2A44A]" />
                <span className="absolute -bottom-1 left-1.5 h-2 w-2 rounded-full bg-[#9BCDB2]" />
              </div>
            </div>
          </div>

          <div className="text-center mb-16">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#9A9691]">
              Stay very still — it&apos;s almost here
            </p>
            <h1
              className="mb-4 text-[28px] font-extrabold tracking-[-0.03em] text-[#3B372F] sm:text-[34px] md:text-[42px] lg:text-[48px]"
              style={{ fontFamily: '"Montserrat", sans-serif' }}
            >
              Something wild is stirring.
            </h1>
            <p className="mx-auto mb-2 max-w-[400px] text-[14px] leading-relaxed text-[#73706C] sm:text-[15px] md:text-[16px]">
            Our trackers have picked up fresh signs. A new feature has been spotted nearby, and it's only a matter of time before it steps into the open.
            </p>
          </div>
    
          {/* <div className="mb-10 rounded-[12px] border border-[#E3DDD8] bg-white p-5">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A9691]">
              <BirdIcon size={14} className="text-[#0B6E66]" />
              What&apos;s in the field log
            </p>
            <div className="flex flex-col gap-3">
              {SIGHTINGS.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      done ? "bg-[#9BCDB2]/50" : "border border-[#D7D2CC]"
                    }`}
                  >
                    {done ? (
                      <CheckCircleIcon size={14} weight="fill" className="text-[#0B6E66]" />
                    ) : null}
                  </div>
                  <span
                    className={`text-sm font-medium ${done ? "text-[#3B372F]" : "text-[#9A9691]"}`}
                  >
                    {label}
                  </span>
                  {!done ? (
                    <span className="ml-auto rounded-[4px] bg-[#E8E2DC] px-2 py-0.5 text-[10px] font-bold text-[#73706C]">
                      Soon
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div> */}

          {!submitted ? (
            <form onSubmit={(event) => void handleSubmit(event)} className="mb-6 max-w-[560px] mx-auto">
              <p className="mb-3 text-center text-sm font-semibold text-[#3B372F]">
                Get notified when {title.toLowerCase()} is spotted
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  disabled={submitting}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-[4px] border border-[#D7D2CC] bg-[#FBF9F6] px-3 py-2.5 text-sm text-[#2F2B28] outline-none transition-colors placeholder:text-[#9A9691] focus:border-[#0B6E66] focus:ring-1 focus:ring-[#0B6E66]/30 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-[4px] bg-[#0B6E66] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#095B54] active:bg-[#074A46] disabled:opacity-60"
                >
                  {submitting ? "Saving…" : "Notify me"} <ArrowRightIcon size={15} />
                </button>
              </div>
              {error ? <p className="mt-2 text-center text-xs text-[#C94A45]">{error}</p> : null}
            </form>
          ) : (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-[8px] bg-[#9BCDB2]/30 px-5 py-4 text-sm font-semibold text-[#0B6E66]">
              <CheckCircleIcon size={18} weight="fill" />
              You&apos;re on the watchlist for {title}. We&apos;ll ping you the moment it&apos;s
              spotted.
            </div>
          )}

          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#73706C] transition-colors hover:text-[#0B6E66]"
            >
              <ArrowLeftIcon size={16} />
              Back to base camp
            </Link>
          </div>

          <div className="mt-14 flex items-end justify-center gap-2 opacity-15">
            <TreeEvergreenIcon size={20} className="text-[#0B6E66]" />
            <TreeEvergreenIcon size={30} className="text-[#0B6E66]" />
            <TreeEvergreenIcon size={44} className="text-[#0B6E66]" />
            <TreeEvergreenIcon size={56} className="text-[#0B6E66]" />
            <TreeEvergreenIcon size={44} className="text-[#0B6E66]" />
            <TreeEvergreenIcon size={30} className="text-[#0B6E66]" />
            <TreeEvergreenIcon size={20} className="text-[#0B6E66]" />
          </div>
        </div>
      </main>
    </div>
  );
}
