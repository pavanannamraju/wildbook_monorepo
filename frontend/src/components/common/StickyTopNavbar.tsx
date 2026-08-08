import type { NavbarVariant } from "../Navbar";

type StickyTopNavbarProps = {
  variant?: NavbarVariant;
};

/** Navbar is fixed in RootLayout; this only reserves the 64px nav height. */
export function StickyTopNavbar(_props: StickyTopNavbarProps = {}) {
  return <div className="h-16 shrink-0" aria-hidden="true" />;
}
