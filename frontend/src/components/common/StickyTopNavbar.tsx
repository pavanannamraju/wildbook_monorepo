import Navbar, { type NavbarVariant } from "../Navbar";

type StickyTopNavbarProps = {
  variant?: NavbarVariant;
};

export function StickyTopNavbar({ variant = "dark" }: StickyTopNavbarProps) {
  return (
    <div className="sticky top-0 z-40">
      <Navbar variant={variant} />
    </div>
  );
}
