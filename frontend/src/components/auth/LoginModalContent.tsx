import { XIcon } from "@phosphor-icons/react";
import { FirebaseError } from "firebase/app";
import { useMemo, useState } from "react";
// import { Link } from "react-router-dom";
import { upsertEmailSignupProfile } from "../../api/auth";
import logoDark from "../../assets/Logo Dark.png";
import { useAuth } from "../../auth/AuthProvider";
import heroImage from "../../assets/Login_Modal_Image.png";
import googleIcon from "../../assets/gmail.svg";
import emailIcon from "../../assets/Email.svg";
type ExploreTab = "login" | "signup";
type EmailAuthMode = "login" | "signup";

type LoginModalContentProps = {
  onClose?: () => void;
  onSuccess?: () => void;
};

type ExploreAuthViewProps = {
  onSuccess?: () => void;
};

const HERO_IMAGE_URL = heroImage;

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

function EmailAuthForm({
  mode,
  onBack,
  onSuccess,
}: {
  mode: EmailAuthMode;
  onBack: () => void;
  onSuccess?: () => void;
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
          setError("Password must be at least 8 characters with uppercase, lowercase, number, and special character.");
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
      onSuccess?.();
    } catch (err: unknown) {
      setError(mapEmailAuthError(err, mode));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-7 space-y-4" onSubmit={onSubmit}>
      {mode === "signup" ? (
        <>
          <input
            type="text"
            className="h-14 w-full rounded border border-black/8 bg-white px-4 text-[15px] text-[#2f2b28]"
            placeholder="Enter Full Name"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            minLength={2}
            required
          />
          <input
            type="tel"
            className="h-14 w-full rounded border border-black/8 bg-white px-4 text-[15px] text-[#2f2b28]"
            placeholder="Phone Number (optional)"
            value={form.phoneNumber}
            onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
          />
        </>
      ) : null}
      <input
        type="email"
        className="h-14 w-full rounded border border-black/8 bg-white px-4 text-[15px] text-[#2f2b28]"
        placeholder="Enter Email"
        value={form.email}
        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        required
      />
      <input
        type="password"
        className="h-14 w-full rounded border border-black/8 bg-white px-4 text-[15px] text-[#2f2b28]"
        placeholder="Enter Password"
        value={form.password}
        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        minLength={8}
        required
      />
      {mode === "signup" ? (
        <input
          type="password"
          className="h-14 w-full rounded border border-black/8 bg-white px-4 text-[15px] text-[#2f2b28]"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
          minLength={8}
          required
        />
      ) : null}
      <button
        type="submit"
        className="h-14 w-full rounded bg-(--color-wildbook-teal) text-[18px] leading-none font-semibold text-white disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? "Please wait..." : mode === "login" ? "Login with Email" : "Create account"}
      </button>
      <button
        type="button"
        className="h-12 w-full rounded border border-black/10 bg-white text-[16px] text-[#2f2b28]"
        onClick={onBack}
      >
        Back
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

function ExploreAuthView({ onSuccess }: ExploreAuthViewProps) {
  const { loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<ExploreTab>("login");
  const [emailMode, setEmailMode] = useState<EmailAuthMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setError(null);
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch {
      setError("Google sign-in failed. Please try again.");
    }
  }

  if (emailMode) {
    return <EmailAuthForm mode={emailMode} onBack={() => setEmailMode(null)} onSuccess={onSuccess} />;
  }

  const isSignup = tab === "signup";

  return (
    <div className="mt-7 space-y-4">
      <div className="grid h-13 grid-cols-2 gap-2 rounded bg-[#ecebe7] p-1">
        <button
          type="button"
          className={`rounded text-[18px] leading-none font-medium ${
            tab === "login" ? "bg-[#cbe6dc] text-[#0b6e66]" : "text-[#777]"
          }`}
          onClick={() => setTab("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={`rounded text-[18px] leading-none font-medium ${
            tab === "signup" ? "bg-[#cbe6dc] text-[#0b6e66]" : "text-[#777]"
          }`}
          onClick={() => setTab("signup")}
        >
          Sign Up
        </button>
      </div>

      <div className="space-y-1 pt-1">
        <p className="text-[18px] font-semibold text-[#121212]">
          {isSignup ? "Create your wildbook account" : "Welcome back"}
        </p>
        <p className="text-[14px] leading-snug text-[#6b6b6b]">
          {isSignup
            ? "Join the community to bookmark guides, book stays, and plan your next trip."
            : "Sign in to pick up where you left off."}
        </p>
      </div>

      <button
        type="button"
        className={`flex h-16 w-full items-center justify-start gap-3 rounded px-6 text-[20px] leading-none font-medium ${
          isSignup
            ? "bg-(--color-wildbook-teal) text-white"
            : "border border-black/8 bg-white text-[#2f2b28]"
        }`}
        onClick={handleGoogleLogin}
      >
        <img
          src={googleIcon}
          alt=""
          className={`h-7 w-7 shrink-0 ${isSignup ? "rounded-sm bg-white p-0.5" : ""}`}
        />
        {isSignup ? "Sign up with Google" : "Sign in with Google"}
      </button>
      <button
        type="button"
        className={`flex h-16 w-full items-center justify-start gap-3 rounded px-6 text-[20px] leading-none font-medium ${
          isSignup
            ? "border border-(--color-wildbook-teal) bg-white text-(--color-wildbook-teal)"
            : "border border-black/8 bg-white text-[#2f2b28]"
        }`}
        onClick={() => setEmailMode(isSignup ? "signup" : "login")}
      >
        <img src={emailIcon} alt="" className="h-7 w-7 shrink-0" />
        {isSignup ? "Sign up with Email" : "Sign in with Email"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function LoginModalContent({ onClose, onSuccess }: LoginModalContentProps) {
  const title = useMemo(() => "Login or sign up", []);
  // const tabButton = (active: boolean) =>
  //   `h-12 rounded px-3 text-[15px] leading-tight font-semibold transition-colors ${
  //     active ? "bg-(--color-wildbook-teal) text-white" : "bg-transparent text-[#767676]"
  //   }`;

  return (
    <section className="flex h-[90vh] w-full max-w-[1120px] overflow-hidden bg-transparent shadow-2xl">
      <aside className="relative hidden w-[47%] self-stretch lg:block">
        <img src={HERO_IMAGE_URL} alt="Wild landscape" className="absolute inset-0 h-full w-full object-cover object-bottom" />
        <div className="absolute inset-0 p-12 text-white">
          <img src={logoDark} alt="wildbook" className="mb-10 w-auto" />
          <h3 className="max-w-[420px] text-[48px]" style={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 300, lineHeight: '1.1' }}>
            Your Gateway to the Wild
          </h3>
          <p className="mt-2 max-w-[430px] leading-tight text-white/90" style={{fontSize: "20px"}}>
            Sign in to explore, connect, and be part of a growing wildlife community.
          </p>
        </div>
      </aside>

      <div className="w-full overflow-y-auto bg-[#f7f6f2] px-9 py-9 lg:w-[53%]">
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-[24px] leading-[0.95] font-bold text-[#121212]">{title}</h2>
          {onClose ? (
            <button type="button" onClick={onClose} aria-label="Close login popup" className="text-[#4a4a4a]">
              <XIcon size={34} />
            </button>
          ) : null}
        </header>

        {/* Temporarily hidden — explorer vs guide entry
        <div className="grid h-16 grid-cols-2 gap-2 rounded bg-[#ecebe7] p-2">
          <button type="button" className={tabButton(true)}>
            I want to Explore
          </button>
          <Link to="/create-guide" onClick={onClose} className={`${tabButton(false)} flex items-center justify-center`}>
            Create Naturalist/Guide Profile
          </Link>
        </div>
        */}

        <ExploreAuthView key="explore-view" onSuccess={onSuccess} />
      </div>
    </section>
  );
}
