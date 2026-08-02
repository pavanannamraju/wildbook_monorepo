import { firebaseAuth } from "../lib/firebase";

export class AuthorizationError extends Error {
  constructor(
    public readonly statusCode: number,
    detail?: string,
  ) {
    super(detail?.trim() || `Authorization failed (HTTP ${statusCode}).`);
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

async function readAuthErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const payload: unknown = await response.clone().json();
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "object" &&
      (payload as { error: object }).error !== null &&
      "message" in (payload as { error: Record<string, unknown> }).error
    ) {
      const message = (payload as { error: { message: unknown } }).error.message;
      return typeof message === "string" ? message : undefined;
    }
  } catch {
    // Ignore non-JSON bodies; fall back to generic message.
  }
  return undefined;
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
    throw new AuthorizationError(response.status, await readAuthErrorDetail(response));
  }

  return response;
}
