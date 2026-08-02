import { BellSimpleIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { NavLink, Outlet } from "react-router-dom";
import { StickyTopNavbar } from "../../components/common/StickyTopNavbar";

const ADMIN_SECTIONS = [
  {
    to: "/admin/inquiries",
    label: "Inquiries",
    description: "Expert enquiry submissions",
    icon: EnvelopeSimpleIcon,
  },
  {
    to: "/admin/coming-soon",
    label: "Coming soon",
    description: "Notify-me email signups",
    icon: BellSimpleIcon,
  },
] as const;

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#F6F4F1] font-['Nunito'] text-[#2F2B28] selection:bg-[#0B6E66] selection:text-white">
      <StickyTopNavbar variant="dark" />

      <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-5 pb-16 pt-8 lg:flex-row lg:px-8">
        <aside className="w-full shrink-0 lg:w-56">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-(--color-wildbook-muted)">
            Admin
          </p>
          <h1
            className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-(--color-wildbook-text) sm:text-[24px] md:text-[28px]"
            style={{ fontFamily: '"Montserrat", sans-serif' }}
          >
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-(--color-wildbook-muted)">
            Choose what you want to review.
          </p>

          <nav className="mt-6 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Admin sections">
            {ADMIN_SECTIONS.map((section) => (
              <NavLink
                key={section.to}
                to={section.to}
                className={({ isActive }) =>
                  `flex min-w-[160px] items-start gap-3 rounded-[8px] border px-3 py-3 transition-colors lg:min-w-0 ${
                    isActive
                      ? "border-(--color-wildbook-teal) bg-white text-(--color-wildbook-text)"
                      : "border-transparent bg-transparent text-(--color-wildbook-muted) hover:border-black/10 hover:bg-white/70 hover:text-(--color-wildbook-text)"
                  }`
                }
              >
                <section.icon size={20} className="mt-0.5 shrink-0 text-(--color-wildbook-teal)" />
                <span>
                  <span className="block text-sm font-semibold">{section.label}</span>
                  <span className="mt-0.5 block text-xs text-(--color-wildbook-muted)">
                    {section.description}
                  </span>
                </span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
