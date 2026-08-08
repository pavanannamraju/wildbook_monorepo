import { EnvelopeSimpleIcon, XIcon } from "@phosphor-icons/react";
import { FirebaseError } from "firebase/app";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { upsertEmailSignupProfile } from "../../api/auth";
import { useAuth } from "../../auth/AuthProvider";
import heroImage from "../../assets/Login_Modal_Image.jpg";
import googleIcon from "../../assets/gmail.svg";
import { track } from "../../lib/analytics";

type AuthTab = "login" | "signup";
type EmailAuthMode = "login" | "signup";
// type RoleTab = "explore" | "guide";

type LoginModalContentProps = {
  onClose?: () => void;
  onSuccess?: () => void;
  /** Preferred email auth mode when opening Continue with Email. */
  defaultTab?: AuthTab;
  /** Where the modal was opened from (navbar, explore_gate, login_page, bookmark). */
  analyticsSource?: string;
};

function isStrongPassword(password: string): boolean {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial;
}

function mapEmailAuthError(error: unknown, mode: EmailAuthMode): string {
  if (!(error instanceof FirebaseError)) {
    return "Email authentication failed. Please verify your credentials.";
  }
  switch (error.code) {
    case "auth/operation-not-allowed":
      return "Email/password sign-in is disabled for this Firebase project. Ask admin to enable it in Firebase Authentication.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please log in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 8 characters.";
    case "auth/user-not-found":
      return "No account found with this email. Please sign up first.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return mode === "login" ? "Incorrect email or password." : "Signup failed due to invalid credentials.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      return mode === "signup" ? "Signup failed. Please try again." : "Login failed. Please try again.";
  }
}

const fieldClass =
  "h-12 w-full rounded-lg border border-[#E3DDD8] bg-white px-4 font-['Nunito'] text-[15px] text-[#2F2B28] outline-none transition-colors placeholder:text-[#9A9691] focus:border-[#0B6E66]";

const primaryBtnClass =
  "w-full h-12 rounded-sm bg-[#0B6E66] font-['Nunito'] text-base font-semibold text-white transition-opacity disabled:pointer-events-none disabled:opacity-50";

const outlineBtnClass =
  "flex h-11 w-full items-center justify-center gap-2.5 rounded-sm border border-black/10 bg-transparent font-['Nunito'] text-sm font-semibold text-[#2F2B28] transition-colors hover:bg-black/[0.03]";

function EmailAuthForm({
  mode,
  onModeChange,
  onBack,
  onSuccess,
  analyticsSource,
}: {
  mode: EmailAuthMode;
  onModeChange: (mode: EmailAuthMode) => void;
  onBack: () => void;
  onSuccess?: () => void;
  analyticsSource?: string;
}) {
  const { loginWithEmailPassword, signupWithEmailPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await loginWithEmailPassword(form.email.trim(), form.password);
      } else {
        const fullName = form.fullName.trim();
        if (fullName.length < 2) {
          setError("Please enter your full name.");
          return;
        }
        if (!isStrongPassword(form.password)) {
          setError(
            "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
          );
          return;
        }
        if (form.password !== form.confirmPassword) {
          setError("Password and confirm password must match.");
          return;
        }
        await signupWithEmailPassword(form.email.trim(), form.password, fullName);
        await upsertEmailSignupProfile({
          full_name: fullName,
          phone_number: form.phoneNumber.trim() || undefined,
        });
      }
      track("auth_email_submit", {
        mode,
        ok: true,
        source: analyticsSource ?? null,
      });
      onSuccess?.();
    } catch (err: unknown) {
      setError(mapEmailAuthError(err, mode));
      track("auth_email_submit", {
        mode,
        ok: false,
        source: analyticsSource ?? null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      key={`email-${mode}`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.18 }}
      className="mb-1 flex flex-col gap-3"
      onSubmit={onSubmit}
    >
      {/* Both Sign in and Sign up always available */}
      <div className="mb-1 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onModeChange("login")}
          className={`rounded-lg border py-2.5 font-['Nunito'] text-sm font-semibold transition-colors ${
            mode === "login"
              ? "border-[#2F2B28] bg-[#2F2B28] text-white"
              : "border-[#E3DDD8] text-[#73706C] hover:border-[#2F2B28] hover:text-[#2F2B28]"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => onModeChange("signup")}
          className={`rounded-lg border py-2.5 font-['Nunito'] text-sm font-semibold transition-colors ${
            mode === "signup"
              ? "border-[#0B6E66] bg-[#0B6E66] text-white"
              : "border-[#0B6E66]/40 text-[#0B6E66] hover:bg-[#0B6E66]/8"
          }`}
        >
          Sign up
        </button>
      </div>

      {mode === "signup" ? (
        <>
          <input
            type="text"
            className={fieldClass}
            placeholder="Full name"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            minLength={2}
            required
            autoFocus
          />
          <input
            type="tel"
            className={fieldClass}
            placeholder="Phone number (optional)"
            value={form.phoneNumber}
            onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
          />
        </>
      ) : null}
      <input
        type="email"
        className={fieldClass}
        placeholder="Email"
        value={form.email}
        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        required
        autoFocus={mode === "login"}
      />
      <input
        type="password"
        className={fieldClass}
        placeholder="Password"
        value={form.password}
        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        minLength={8}
        required
      />
      {mode === "signup" ? (
        <input
          type="password"
          className={fieldClass}
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
          minLength={8}
          required
        />
      ) : null}
      <button type="submit" className={`${primaryBtnClass} mt-1`} disabled={submitting}>
        {submitting ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}
      </button>
      <button type="button" className={outlineBtnClass} onClick={onBack}>
        Back
      </button>
      {error ? <p className="font-['Nunito'] text-sm text-red-700">{error}</p> : null}
    </motion.form>
  );
}

export function LoginModalContent({
  onClose,
  onSuccess,
  defaultTab = "login",
  analyticsSource,
}: LoginModalContentProps) {
  const { loginWithGoogle } = useAuth();
  // const [roleTab, setRoleTab] = useState<RoleTab>("explore");
  const [emailMode, setEmailMode] = useState<EmailAuthMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // setRoleTab("explore");
    setEmailMode(null);
    setError(null);
  }, [defaultTab]);

  async function handleGoogleLogin() {
    setError(null);
    try {
      await loginWithGoogle();
      track("auth_google", { ok: true, source: analyticsSource ?? null });
      onSuccess?.();
    } catch {
      setError("Google sign-in failed. Please try again.");
      track("auth_google", { ok: false, source: analyticsSource ?? null });
    }
  }

  return (
    <section className="relative flex h-[90vh] max-h-[900px] w-full max-w-[1120px] overflow-hidden rounded-2xl bg-[#F8F6F3] shadow-2xl">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/30 md:bg-black/20"
          aria-label="Close login modal"
        >
          <XIcon size={16} weight="bold" />
        </button>
      ) : null}

      {/* Left panel — Wildlife Image */}
      <div className="relative hidden w-[47%] shrink-0 self-stretch md:block">
        <img src={heroImage} alt="Wildlife" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute right-7 bottom-8 left-7 text-white md:right-10 md:bottom-10 md:left-10">
          <h3 className="mb-1 font-['Montserrat'] text-2xl leading-snug font-bold md:text-3xl lg:text-4xl">
            Step into the wild.
          </h3>
          <p className="font-['Nunito'] text-sm text-white/80 md:text-base">
            Connect with India&apos;s finest naturalists.
          </p>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex flex-1 flex-col overflow-y-auto p-7 sm:p-9 lg:w-[53%] lg:px-12 lg:py-12">
        <div className="mb-6 pr-8 md:mb-8">
          <h2 className="mb-1 font-['Montserrat'] text-2xl font-bold text-[#2F2B28] md:text-3xl">
            Login or sign up
          </h2>
          <p className="font-['Nunito'] text-sm text-[#73706C] md:text-base">
            Welcome to Wildbook — India&apos;s wildlife community.
          </p>
        </div>

        {/* Explore / Guide toggle — hidden for now
        <div className="mb-6 flex gap-1 rounded-xl bg-[#ECEBE7] p-1">
          {(["explore", "guide"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                // if (t === "guide") { navigate("/create-guide"); onClose?.(); return; }
                setRoleTab(t);
              }}
              className={`flex-1 rounded-sm py-2.5 font-['Nunito'] text-sm font-semibold transition-all duration-200 ${
                roleTab === t
                  ? "bg-[#F8F6F3] text-[#2F2B28] shadow-sm"
                  : "text-[#73706C] hover:text-[#2F2B28]"
              }`}
            >
              I want to {t === "explore" ? "Explore" : "Guide"}
            </button>
          ))}
        </div>
        */}

        <AnimatePresence mode="wait">
          {emailMode ? (
            <EmailAuthForm
              key="email"
              mode={emailMode}
              onModeChange={setEmailMode}
              onBack={() => setEmailMode(null)}
              onSuccess={onSuccess}
              analyticsSource={analyticsSource}
            />
          ) : (
            <motion.div
              key="methods"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-2.5"
            >
              <button type="button" className={outlineBtnClass} onClick={() => void handleGoogleLogin()}>
                <img src={googleIcon} alt="" className="h-[17px] w-[17px]" />
                Continue with Google
              </button>
              <button
                type="button"
                className={outlineBtnClass}
                onClick={() => {
                  setEmailMode(defaultTab);
                  setError(null);
                }}
              >
                <EnvelopeSimpleIcon size={18} weight="bold" />
                Continue with Email
              </button>
              {error ? <p className="font-['Nunito'] text-sm text-red-700">{error}</p> : null}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-5 text-center font-['Nunito'] text-[11px] leading-snug text-[#73706C]">
          By continuing, you agree to Wildbook&apos;s{" "}
          <span className="cursor-pointer text-[#0B6E66] hover:underline">Terms of Service</span>
          {" and "}
          <span className="cursor-pointer text-[#0B6E66] hover:underline">Privacy Policy</span>.
        </p>
      </div>
    </section>
  );
}
