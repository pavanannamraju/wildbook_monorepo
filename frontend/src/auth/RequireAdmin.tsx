import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { PageLoader } from "../components/PageLoader";

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

export function RedirectAuthenticatedUser() {
  const { loading, user } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to="/" replace />;
  }
  return null;
}
