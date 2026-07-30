import { useState, useEffect, type RefObject } from "react";

/**
 * Returns `true` once the user has scrolled past the bottom edge of the
 * referenced element. Listens to both scroll and resize events.
 */
export function useScrollPastRef(ref: RefObject<HTMLElement | null>): boolean {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      setIsPast(window.scrollY >= el.offsetHeight);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref]);

  return isPast;
}
