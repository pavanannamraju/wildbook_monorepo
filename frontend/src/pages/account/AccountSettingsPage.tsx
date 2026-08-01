import { useEffect, useState } from "react";
import { fetchCurrentUser, type CurrentUser } from "../../api/auth";
import { useAuth } from "../../auth/AuthProvider";
import { PageErrorState } from "../../components/common/PageErrorState";

const AUTH_PROVIDER_LABELS: Record<CurrentUser["auth_provider"], string> = {
  EMAIL: "Email & password",
  GOOGLE: "Google",
};

export function AccountSettingsPage() {
  const { logout } = useAuth();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentUser(controller.signal)
      .then(setUser)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load account settings.");
      });
    return () => controller.abort();
  }, []);

  if (error) {
    return <PageErrorState message={error} />;
  }

  return (
    <div>
      <h1 className="text-[22px] font-semibold text-(--color-wildbook-text)">Settings</h1>
      <p className="mt-1 text-sm text-(--color-wildbook-muted)">Manage how you sign in and your account status.</p>

      {user ? (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-(--color-wildbook-muted)">Sign-in method</dt>
            <dd className="mt-1 text-sm font-medium text-(--color-wildbook-text)">
              {AUTH_PROVIDER_LABELS[user.auth_provider]}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-(--color-wildbook-muted)">Account status</dt>
            <dd className="mt-1 text-sm font-medium text-(--color-wildbook-text)">
              {user.is_active ? "Active" : "Inactive"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-8 text-sm text-(--color-wildbook-muted)">Loading…</p>
      )}

      <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-medium text-red-800">Sign out of Wildbook</p>
        <p className="mt-1 text-sm text-red-700">Sign out of your account on this device.</p>
        <button
          type="button"
          className="mt-3 inline-flex h-10 items-center justify-center rounded bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          onClick={() => void logout()}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
