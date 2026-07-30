import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Number of animation frames to keep retrying a hash scroll while the target
 * section is still being rendered (e.g. data-driven pages that mount content
 * asynchronously after the route changes).
 */
const HASH_SCROLL_RETRY_FRAMES = 10;

/**
 * Drives scroll position on route changes:
 * - A URL hash scrolls the matching section into view (retrying briefly while
 *   async content mounts), so deep links like `/about#team` land on the section.
 * - Any navigation without a hash resets to the top of the page, including
 *   browser back/forward.
 *
 * Mount once near the layout root so every routed page inherits the behaviour.
 */
export function useScrollToHashOrTop(): void {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      return scrollToHashTarget(hash);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);
}

function scrollToHashTarget(hash: string): (() => void) | void {
  const targetId = decodeURIComponent(hash.slice(1));
  if (!targetId) {
    return;
  }

  let remainingFrames = HASH_SCROLL_RETRY_FRAMES;
  let frameId = 0;

  const attemptScroll = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    if (remainingFrames > 0) {
      remainingFrames -= 1;
      frameId = window.requestAnimationFrame(attemptScroll);
    }
  };

  frameId = window.requestAnimationFrame(attemptScroll);
  return () => window.cancelAnimationFrame(frameId);
}
