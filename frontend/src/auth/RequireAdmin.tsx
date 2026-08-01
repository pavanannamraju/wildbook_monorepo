import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { fetchCurrentUser, type CurrentUser } from "../api/auth";
import { StickyTopNavbar } from "../components/common/StickyTopNavbar";
import { PageLoader } from "../components/PageLoader";
import { useAuth } from "./AuthProvider";

export function RequireAuthenticated({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, user, token } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<CurrentUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) {
      setProfile(null);
      setProfileLoading(false);
      setProfileError(null);
      return;
    }

    const controller = new AbortController();
    setProfileLoading(true);
    setProfileError(null);
    fetchCurrentUser(controller.signal)
      .then((current) => {
        setProfile(current);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setProfile(null);
        setProfileError(err instanceof Error ? err.message : "Failed to verify admin access.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setProfileLoading(false);
        }
      });

    return () => controller.abort();
  }, [loading, token, user]);

  if (loading || profileLoading) {
    return <PageLoader />;
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-[#F6F4F1]">
        <StickyTopNavbar variant="dark" />
        <main className="mx-auto flex min-h-[60vh] w-full max-w-[760px] items-center justify-center px-5 py-12">
          <section className="w-full rounded-xl border border-black/10 bg-white p-8 text-center">
            <h1 className="text-[22px] font-semibold text-(--color-wildbook-text)">Couldn’t verify access</h1>
            <p className="mt-3 text-sm text-(--color-wildbook-muted)">{profileError}</p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded bg-(--color-wildbook-teal) px-5 py-2 text-sm font-semibold text-white"
            >
              Back home
            </Link>
          </section>
        </main>
      </div>
    );
  }

  if (profile?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#F6F4F1]">
        <StickyTopNavbar variant="dark" />
        <main className="mx-auto flex min-h-[60vh] w-full max-w-[760px] items-center justify-center px-5 py-12">
          <section className="w-full rounded-xl border border-black/10 bg-white p-8 text-center">
            <h1 className="text-[22px] font-semibold text-(--color-wildbook-text)">Admin only</h1>
            <p className="mt-3 text-sm text-(--color-wildbook-muted)">
              This area is restricted to Wildbook admins.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded bg-(--color-wildbook-teal) px-5 py-2 text-sm font-semibold text-white"
            >
              Back home
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}

export function RedirectAuthenticatedUser() {
  const { loading, user } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to="/" replace />;
  }
  return null;
}
