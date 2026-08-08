import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track } from "../lib/analytics";

/** Sends page_view on every route change. */
export function usePageViewAnalytics() {
  const location = useLocation();

  useEffect(() => {
    track("page_view", {
      path: location.pathname,
      search: location.search || null,
    });
  }, [location.pathname, location.search]);
}
