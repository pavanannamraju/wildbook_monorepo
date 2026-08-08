import { apiFetch } from "../api/client";

const ANON_KEY = "wildbook_anonymous_id";
const SESSION_KEY = "wildbook_analytics_session_id";

export type AnalyticsEventName =
  | "page_view"
  | "notify_me_submit"
  | "home_cta_click"
  | "home_section_view"
  | "experts_role_filter"
  | "experts_search"
  | "experts_filter_open"
  | "experts_filter_apply"
  | "experts_filter_clear"
  | "experts_page_change"
  | "expert_card_click"
  | "expert_bookmark_toggle"
  | "expert_share_open"
  | "expert_detail_view"
  | "expert_enquiry_focus"
  | "expert_enquiry_submit"
  | "about_wildlife_open"
  | "about_cta_experts"
  | "auth_modal_open"
  | "auth_google"
  | "auth_email_submit"
  | "auth_logout"
  | "nav_click"
  | "footer_nav_click"
  | "footer_email_copy"
  | "footer_whatsapp"
  | "footer_instagram"
  | "share_copy"
  | "not_found_view";

export type AnalyticsProps = Record<string, string | number | boolean | string[] | null | undefined>;

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `wb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnonymousId(): string {
  try {
    const existing = localStorage.getItem(ANON_KEY)?.trim();
    if (existing) return existing;
    const id = newId();
    localStorage.setItem(ANON_KEY, id);
    return id;
  } catch {
    return newId();
  }
}

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)?.trim();
    if (existing) return existing;
    const id = newId();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return newId();
  }
}

function isAnalyticsEnabled(): boolean {
  const raw = window.__WILDBOOK_CONFIG__?.publicEnv?.BUN_PUBLIC_ANALYTICS_ENABLED?.trim().toLowerCase();
  if (raw === undefined || raw === "") return true;
  return raw !== "0" && raw !== "false" && raw !== "off" && raw !== "no";
}

function cleanProps(props?: AnalyticsProps): Record<string, string | number | boolean | string[] | null> {
  if (!props) return {};
  const out: Record<string, string | number | boolean | string[] | null> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

/** Fire-and-forget; never throws into product UI. */
export function track(event: AnalyticsEventName, props?: AnalyticsProps): void {
  if (!isAnalyticsEnabled()) return;

  const path = typeof window !== "undefined" ? window.location.pathname : undefined;
  void apiFetch("/api/v1/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      anonymous_id: getAnonymousId(),
      session_id: getSessionId(),
      path,
      props: cleanProps(props),
    }),
  }).catch(() => {
    // Analytics must never break the product.
  });
}
