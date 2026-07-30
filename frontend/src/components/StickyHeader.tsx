import Navbar from "./Navbar";

export function StickyHeader({ visible }: { visible: boolean }) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-20 transition-opacity ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <div className="mx-auto max-w-[1920px]">
        <Navbar variant="dark" />
      </div>
    </header>
  );
}
