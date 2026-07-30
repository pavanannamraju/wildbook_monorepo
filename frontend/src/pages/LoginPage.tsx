import { useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { LoginModalContent } from "../components/auth/LoginModalContent";
import { PageLoader } from "../components/PageLoader";

export function LoginPage() {
  const { loading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const next = useMemo(() => {
    const search = new URLSearchParams(location.search);
    const value = search.get("next");
    return value && value.startsWith("/") ? value : "/";
  }, [location.search]);

  if (loading) {
    return <PageLoader />;
  }

  if (!loading && user) {
    return <Navigate to={next} replace />;
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-black/30 p-4">
      <LoginModalContent onSuccess={() => navigate(next, { replace: true })} />
    </main>
  );
}

