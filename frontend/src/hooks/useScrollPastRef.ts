import { useState, useEffect, type RefObject } from "react";

/**
 * Returns `true` once the user has scrolled past the bottom edge of the
 * referenced element. Uses ResizeObserver so delayed layout (e.g. hero
 * images finishing load) cannot leave the sticky header stuck visible.
 */
export function useScrollPastRef(ref: RefObject<HTMLElement | null>): boolean {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      // Before intrinsic media loads, height can be 0. Treat that as "not past"
      // so `scrollY >= 0` never falsely reveals the sticky header on first paint.
      const height = el.offsetHeight;
      if (height <= 0) {
        setIsPast(false);
        return;
      }
      setIsPast(window.scrollY >= height);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver.disconnect();
    };
  }, [ref]);

  return isPast;
}
