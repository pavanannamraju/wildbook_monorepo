import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookmarkSimpleIcon,
  CircleIcon,
  ListIcon,
  ShieldCheckIcon,
  SignOutIcon,
  UserIcon,
  XIcon,
} from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";

import { useAuth } from "../auth/AuthProvider";
import logoWhite from "../assets/Wildbook_nav_white.svg";
import { resolveUserAvatarSrc } from "../data/presetAvatars";
import { UserAvatar } from "./common/UserAvatar";
import { LoginModalContent } from "./auth/LoginModalContent";
import { track } from "../lib/analytics";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Explore Experts", to: "/experts" },
  { label: "Shared Safaris", to: "/safaris" },
  { label: "Homestays", to: "/homestays" },
  // { label: "Safari Booking Directory", to: "/park-guide" },
  { label: "About Us", to: "/about" },
] as const;

/** Kept for call-site compatibility; design nav is self-theming via scroll/route. */
export type NavbarVariant = "light" | "dark";

type ProfileMenuItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
};

const PROFILE_MENU_ITEMS: ReadonlyArray<ProfileMenuItem> = [
  { label: "My Profile", to: "/account#profile", icon: UserIcon },
  { label: "My Bookings", to: "/account#bookings", icon: CircleIcon },
  { label: "Bookmarks", to: "/account#bookmarks", icon: BookmarkSimpleIcon },
];

export default function Navbar(_props: { variant?: NavbarVariant } = {}) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState({ top: 0, left: 0 });
  const { user, loading: authLoading, logout, profile, profileLoading } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Match zip: transparent over hero pages only
  const isTransparentInitial = location.pathname === "/" || location.pathname === "/about";
  const isGlass = !(isTransparentInitial && !scrolled && !isOpen);

  const userInitial = useMemo(
    () => user?.displayName?.trim().charAt(0).toUpperCase() || "U",
    [user?.displayName],
  );
  const userDisplayName = user?.displayName?.trim() || "Wildbook User";
  const userEmail = user?.email?.trim() || "";
  const profileAvatarSrc = useMemo(
    () =>
      resolveUserAvatarSrc({
        avatarType: profile?.avatar_type,
        avatarKey: profile?.avatar_key,
        avatarUrl: profile?.avatar_url,
      }),
    [profile?.avatar_type, profile?.avatar_key, profile?.avatar_url],
  );
  const userRole = profile?.role ?? null;
  const avatarOverflowTop = profile?.avatar_type === "preset";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide-on-scroll only below md (768px), matching zip
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (current) => {
    if (window.innerWidth >= 768) {
      setNavHidden(false);
      return;
    }
    if (isOpen) {
      setNavHidden(false);
      return;
    }
    const previous = scrollY.getPrevious() ?? 0;
    const diff = current - previous;
    if (diff > 0 && current > 64) {
      setNavHidden(true);
    } else {
      setNavHidden(false);
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const updateMenuPosition = () => {
      const triggerRect = profileTriggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;
      const menuWidth = 300;
      const menuTop = triggerRect.bottom + 12;
      const menuLeft = Math.max(
        16,
        Math.min(window.innerWidth - menuWidth - 16, triggerRect.right - menuWidth),
      );
      setProfileMenuPosition({ top: menuTop, left: menuLeft });
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        !profileMenuRef.current?.contains(target) &&
        !profileTriggerRef.current?.contains(target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };

    updateMenuPosition();
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [profileMenuOpen]);

  const bgStyle =
    isTransparentInitial && !scrolled && !isOpen
      ? "bg-transparent text-white"
      : "text-white border-b border-white/10";

  return (
    <>
      <motion.nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${bgStyle}`}
        style={
          isGlass
            ? {
                backgroundColor: "rgba(10, 28, 20, 0.62)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
              }
            : undefined
        }
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" },
        }}
        animate={navHidden ? "hidden" : "visible"}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center" aria-label="Wildbook home">
            <img src={logoWhite} alt="Wildbook" className="h-8 w-auto" />
          </Link>

          {/* Desktop Nav — zip layout: inline links, not centered flex-1 */}
          <div className="hidden items-center gap-4 font-['Nunito'] text-sm font-semibold md:flex lg:gap-7 xl:gap-8">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => track("nav_click", { to, label, device: "desktop" })}
                className="transition-all duration-200 hover:text-white"
                style={({ isActive }) => ({
                  color: isActive ? "#F0C165" : "rgba(255,255,255,0.62)",
                  fontWeight: isActive ? 700 : undefined,
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {authLoading ? (
              <div className="h-8 w-20" aria-hidden="true" />
            ) : user ? (
              <button
                ref={profileTriggerRef}
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 font-['Nunito'] text-sm font-semibold text-white transition-colors duration-200 hover:text-[#F0C165]"
                aria-label="Open account menu"
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
              >
                <UserAvatar
                  initials={userInitial}
                  imageUrl={profileAvatarSrc}
                  size="xs"
                  overflowTop={avatarOverflowTop}
                  loading={profileLoading}
                  alt=""
                />
                <span className="max-w-32 truncate">{userDisplayName.split(" ")[0]}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  track("auth_modal_open", { source: "navbar" });
                  setLoginModalOpen(true);
                }}
                className="inline-flex items-center gap-2 font-['Nunito'] text-sm font-semibold text-white transition-colors duration-200 hover:text-[#F0C165]"
              >
                <UserIcon size={16} />
                Login
              </button>
            )}
          </div>

          {/* Mobile Nav Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="p-2"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <XIcon size={24} /> : <ListIcon size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden"
              style={{
                backgroundColor: "rgba(5, 15, 10, 0.96)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="container mx-auto flex flex-col gap-1 px-4 py-5 font-['Nunito'] text-sm font-semibold">
                {NAV_LINKS.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    onClick={() => {
                      track("nav_click", { to, label, device: "mobile" });
                      setIsOpen(false);
                    }}
                    className="border-b py-3 transition-colors duration-150"
                    style={({ isActive }) => ({
                      color: isActive ? "#F0C165" : "rgba(255,255,255,0.78)",
                      fontWeight: isActive ? 700 : undefined,
                      borderColor: "rgba(255,255,255,0.07)",
                    })}
                  >
                    {label}
                  </NavLink>
                ))}

                {authLoading ? null : user ? (
                  <>
                    {PROFILE_MENU_ITEMS.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 border-b py-3"
                        style={{
                          color: "rgba(255,255,255,0.78)",
                          borderColor: "rgba(255,255,255,0.07)",
                        }}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </Link>
                    ))}
                    {userRole === "ADMIN" ? (
                      <Link
                        to="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 border-b py-3"
                        style={{
                          color: "rgba(255,255,255,0.78)",
                          borderColor: "rgba(255,255,255,0.07)",
                        }}
                      >
                        <ShieldCheckIcon size={16} />
                        Admin
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        void logout();
                      }}
                      className="mt-3 flex items-center gap-2 py-3 text-sm font-semibold text-[#FFB4AE]"
                    >
                      <SignOutIcon size={16} />
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      track("auth_modal_open", { source: "navbar_mobile" });
                      setLoginModalOpen(true);
                    }}
                    className="mt-3 flex items-center gap-2 py-3 text-sm font-semibold"
                    style={{ color: "rgba(255,255,255,0.78)" }}
                  >
                    <UserIcon size={16} />
                    Login
                  </button>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.nav>

      {profileMenuOpen && user
        ? createPortal(
            <div
              ref={profileMenuRef}
              className="fixed z-1000 w-[300px] rounded-3xl border border-black/10 bg-[#F7F6F2] p-5 text-[#1f1f1f] shadow-xl"
              style={{
                top: profileMenuPosition.top,
                left: profileMenuPosition.left,
              }}
            >
              <div className="flex items-start gap-3 border-b border-black/20 pb-3">
                <span className="mt-0.5 inline-flex shrink-0 overflow-visible">
                  <UserAvatar
                    initials={userInitial}
                    imageUrl={profileAvatarSrc}
                    size="md"
                    overflowTop={avatarOverflowTop}
                    loading={profileLoading}
                    alt=""
                  />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm leading-tight font-semibold">{userDisplayName}</p>
                  {userEmail ? (
                    <p className="truncate pt-1 text-sm leading-tight text-[#0f7c79]">{userEmail}</p>
                  ) : null}
                </div>
              </div>

              <ul className="space-y-1 py-4" role="menu" aria-label="Account menu options">
                {PROFILE_MENU_ITEMS.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-[#2c2c2c] transition-colors hover:bg-black/5"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <item.icon size={24} className="text-[#0f7c79]" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
                {userRole === "ADMIN" ? (
                  <li>
                    <Link
                      to="/admin"
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-[#2c2c2c] transition-colors hover:bg-black/5"
                      role="menuitem"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <ShieldCheckIcon size={24} className="text-[#0f7c79]" />
                      <span>Admin</span>
                    </Link>
                  </li>
                ) : null}
              </ul>

              <div className="border-t border-black/20 pt-3">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-[#D83A31] transition-colors hover:bg-[#D83A31]/10"
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    void logout();
                  }}
                >
                  <SignOutIcon size={24} />
                  <span>Logout</span>
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {createPortal(
        <AnimatePresence>
          {loginModalOpen ? (
            <>
              <motion.div
                key="login-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-1200 bg-black/80"
                onClick={() => setLoginModalOpen(false)}
              />
              <motion.div
                key="login-modal"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none fixed inset-0 z-1201 flex items-center justify-center p-4"
              >
                <div className="pointer-events-auto w-full max-w-[1120px]">
                  <LoginModalContent
                    analyticsSource="navbar"
                    onClose={() => setLoginModalOpen(false)}
                    onSuccess={() => setLoginModalOpen(false)}
                  />
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
