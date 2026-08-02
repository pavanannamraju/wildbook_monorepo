import { useEffect, useMemo, useRef, useState } from "react";
import { GlassCard } from "react-glass-ui";
import {
  ArrowRightIcon,
  BookmarkSimpleIcon,
  CircleIcon,
  GearIcon,
  ImageSquareIcon,
  QuestionIcon,
  ShieldCheckIcon,
  SignOutIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import logoDark from "../assets/Logo Dark.png";
import logoLight from "../assets/Wildbook_light.svg";
import { resolveUserAvatarSrc } from "../data/presetAvatars";
import { UserAvatar } from "./common/UserAvatar";
import { LoginModalContent } from "./auth/LoginModalContent";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Explore Experts", to: "/experts" },
  { label: "Shared Safaris", to: "/safaris" },
  { label: "Homestays", to: "/homestays" },
] as const;

export type NavbarVariant = "light" | "dark";

interface NavbarProps {
  variant?: NavbarVariant;
}

type ProfileMenuItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
};

const PROFILE_MENU_ITEMS: ReadonlyArray<ProfileMenuItem> = [
  { label: "My Profile", to: "/account#profile", icon: UserIcon },
  { label: "My Bookings", to: "/account#bookings", icon: CircleIcon },
  { label: "Bookmarks", to: "/account#bookmarks", icon: BookmarkSimpleIcon },
  // { label: "My Gallery", to: "/account#gallery", icon: ImageSquareIcon },
  // { label: "Settings", to: "/account#settings", icon: GearIcon },
  // { label: "FAQs", to: "/account#faqs", icon: QuestionIcon },
];

export default function Navbar({ variant = "light" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState({ top: 0, left: 0 });
  const { user, loading: authLoading, logout, profile, profileLoading } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const isLight = variant === "light";
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
  const avatarInitials = userInitial;

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    const updateMenuPosition = () => {
      const triggerRect = profileTriggerRef.current?.getBoundingClientRect();
      if (!triggerRect) {
        return;
      }

      const menuWidth = 300;
      const menuTop = triggerRect.bottom + 12;
      const menuLeft = Math.max(16, Math.min(window.innerWidth - menuWidth - 16, triggerRect.right - menuWidth));
      setProfileMenuPosition({ top: menuTop, left: menuLeft });
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      const clickInsideMenu = profileMenuRef.current?.contains(target);
      const clickOnTrigger = profileTriggerRef.current?.contains(target);
      if (!clickInsideMenu && !clickOnTrigger) {
        setProfileMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
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
  
  const linkClasses = (active: boolean) =>
    `block px-5 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-(--color-wildbook-teal) text-(--color-wildbook-cream)"
        : isLight
          ? "text-(--color-wildbook-cream) hover:bg-white/10"
          : "text-black hover:bg-black/10"
    }`;

  return (
    <>
      <nav>
      <GlassCard
        id="site-navbar-glass"
        className={`w-full! overflow-visible! ${isLight ? "" : "bg-transparent!"}`}
        borderRadius={0}
        blur={isLight ? 10 : 10}
        brightness={isLight ? 60 : 90}
        borderColor="transparent"
        backgroundOpacity={isLight ? 0 : 0.4}
        backgroundColor={isLight ? "#00000000" : "#f3eee9"}
        distortion={0}
      >
        <div className="flex w-full items-center justify-between gap-3 page-px sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center" aria-label="Wildbook home">
            <img
              src={isLight ? logoDark : logoLight}
              alt="Wildbook"
              className="h-4 w-auto min-[1000px]:h-6"
            />
          </Link>

          {/* Navigation links - desktop at 1000px+ */}
          <ul className="hidden items-center justify-center gap-1 min-[1000px]:flex min-[1000px]:gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `rounded px-5 py-2 text-sm font-medium transition-colors min-[1000px]:px-6 min-[1000px]:py-2 ${
                      isActive
                        ? "bg-(--color-wildbook-teal) text-(--color-wildbook-cream)"
                        : isLight
                          ? "text-(--color-wildbook-cream) hover:bg-white/10"
                          : "text-black hover:bg-black/10"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop auth - visible at 1000px+. Hold a neutral slot while Firebase hydrates
              so Login does not flash before a restored session paints the profile chip. */}
          {authLoading ? (
            <div
              className="hidden h-10 w-24 shrink-0 min-[1000px]:block"
              aria-hidden="true"
            />
          ) : user ? (
            <div className="hidden shrink-0 min-[1000px]:block">
              <button
                ref={profileTriggerRef}
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isLight
                    ? "text-(--color-wildbook-cream) hover:bg-white/10"
                    : "bg-(--color-wildbook-teal) text-(--color-wildbook-cream) hover:brightness-95"
                }`}
                aria-label="Open account menu"
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
              >
                <span className="inline-flex overflow-visible">
                  <UserAvatar
                    initials={avatarInitials}
                    imageUrl={profileAvatarSrc}
                    size="xs"
                    overflowTop={avatarOverflowTop}
                    loading={profileLoading}
                    alt=""
                  />
                </span>
                <span className="max-w-32 truncate">{userDisplayName.split(" ")[0]}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`hidden shrink-0 rounded px-6 py-2 text-sm font-medium min-[1000px]:inline-flex min-[1000px]:items-center min-[1000px]:gap-2 ${
                isLight ? "text-(--color-wildbook-cream) hover:bg-white/10" : "text-black hover:bg-black/10"
              }`}
              onClick={() => setLoginModalOpen(true)}
            >
              <UserIcon size={20} aria-hidden="true" />
              Login
            </button>
          )}

          {/* Hamburger button - below 1000px */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex min-[1000px]:hidden shrink-0 flex-col justify-center gap-1.5 rounded p-2 -mr-2"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span
              className={`h-0.5 w-5 rounded-full transition-transform ${
                isLight ? "bg-white" : "bg-black"
              } ${mobileMenuOpen ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`h-0.5 w-5 rounded-full transition-opacity ${
                isLight ? "bg-white" : "bg-black"
              } ${mobileMenuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`h-0.5 w-5 rounded-full transition-transform ${
                isLight ? "bg-white" : "bg-black"
              } ${mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </button>
        </div>

        {/* Mobile menu - below 1000px */}
        <div
          className={`min-[1000px]:hidden overflow-hidden transition-[max-height,opacity] duration-200 ${
            mobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1 border-t border-black/10 py-4 page-px">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) => linkClasses(isActive)}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {authLoading ? null : user ? (
              <button
                type="button"
                className={`mt-2 rounded px-6 py-2.5 text-center text-sm font-medium ${
                  isLight
                    ? "text-(--color-wildbook-cream) hover:bg-white/10"
                    : "text-black hover:bg-black/10"
                }`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  void logout();
                }}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <ArrowRightIcon size={16} aria-hidden="true" />
                  Logout
                </span>
              </button>
            ) : (
              <button
                type="button"
                className={`mt-2 rounded px-6 py-2.5 text-center text-sm font-medium ${
                  isLight ? "text-(--color-wildbook-cream) hover:bg-white/10" : "text-black hover:bg-black/10"
                }`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLoginModalOpen(true);
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </GlassCard>
      </nav>
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
                    initials={avatarInitials}
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
      {loginModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-1200 flex items-center justify-center bg-black/50 p-4">
              <div className="absolute inset-0" onClick={() => setLoginModalOpen(false)} />
              <div className="relative z-1 w-full max-w-[1120px]">
                <LoginModalContent
                  onClose={() => setLoginModalOpen(false)}
                  onSuccess={() => setLoginModalOpen(false)}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
