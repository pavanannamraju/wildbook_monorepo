import { firebaseAuth } from "../lib/firebase";

export class AuthorizationError extends Error {
  constructor(public readonly statusCode: number) {
    super(`Authorization failed (HTTP ${statusCode}).`);
  }
}

type ApiFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

function resolveApiUrl(path: string): string {
  const backendOrigin = window.__WILDBOOK_CONFIG__?.publicEnv?.BUN_PUBLIC_BACKEND_ORIGIN?.trim();
  if (!backendOrigin) {
    return path;
  }

  const normalizedOrigin = backendOrigin.endsWith("/")
    ? backendOrigin.slice(0, -1)
    : backendOrigin;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const headers = new Headers(options.headers ?? {});
  const currentUser = firebaseAuth.currentUser;

  if (currentUser) {
    const idToken = await currentUser.getIdToken();
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  const response = await fetch(resolveApiUrl(path), {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    if (!currentUser) {
      const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
      const destination = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign(destination);
      }
    }
    throw new AuthorizationError(response.status);
  }

  return response;
}
