import { useEffect, useState } from "react";
import logoLight from "../assets/Logo Dark.png";
import {
  EnvelopeSimpleIcon,
  InstagramLogoIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import footerTop from "../assets/footer-grass.png";
import { track } from "../lib/analytics";

const CONTACT_EMAIL = "hello@wildbook.in";

export function Footer() {
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    if (!emailCopied) return;
    const timer = window.setTimeout(() => setEmailCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [emailCopied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setEmailCopied(true);
      track("footer_email_copy", { ok: true });
    } catch {
      setEmailCopied(false);
      track("footer_email_copy", { ok: false });
    }
  };

  return (
    <footer className="mt-12 w-full overflow-hidden bg-[#F6F4F0] sm:mt-16 lg:mt-20">
      <img src={footerTop} alt="" aria-hidden="true" className="block h-auto w-full select-none" />
      <div className="bg-[#0e1b15]">
        <div className="page-px-footer mx-auto max-w-[1920px] pt-8 pb-5 sm:pt-10 sm:pb-6 md:pt-12 lg:pt-14 lg:pb-8">
        {/* Main footer row */}
        <div className="flex flex-col gap-8 sm:gap-10 md:flex-row md:items-start md:justify-between md:gap-12 lg:gap-20">
          {/* Left: Logo + description + copyright */}
          <div className="flex shrink-0 flex-col gap-8 sm:gap-10 md:w-[280px] lg:w-[380px] lg:gap-14">
            <div className="flex flex-col gap-3 sm:gap-4">
              <Link to="/" className="inline-flex items-center" aria-label="Wildbook home">
                <img
                  src={logoLight}
                  alt="Wildbook"
                  className="h-8 w-auto sm:h-10 lg:h-14"
                />
              </Link>
              <p className="max-w-[380px] font-['Nunito'] text-[14px] leading-6 font-medium text-[#fafafa] sm:text-[15px] md:text-[16px] lg:text-[18px] lg:leading-6">
                We connect travellers with trusted guides, naturalists, and wildlife experts so
                every journey becomes an informed, immersive encounter that sustains places and
                people.
              </p>
            </div>
            <p className="font-['Nunito'] text-[13px] leading-normal font-normal tracking-[0.64px] text-[#e2e2e2] sm:text-[14px] lg:text-[16px]">
              © Copyright 2026&nbsp; |&nbsp; All Rights Reserved
            </p>
          </div>

          {/* Right: nav columns */}
          <div className="flex flex-wrap gap-6 sm:flex-nowrap sm:gap-8 md:gap-8 lg:gap-10 xl:gap-16">
            {/* Navigation */}
            <nav aria-label="Footer navigation" className="text-[#fafafa]">
              <p className="font-['Nunito'] text-[14px] leading-6 font-medium text-[#F0C165] sm:text-[15px] lg:text-[18px]">
                Navigation
              </p>
              <ul className="mt-4 flex flex-col gap-2 sm:mt-[18px] sm:gap-2.5">
                <li>
                  <Link
                    className="font-['Nunito'] text-[14px] leading-6 font-medium text-[#fafafa] transition-colors hover:text-white sm:text-[15px] lg:text-[18px]"
                    to="/"
                    onClick={() => track("footer_nav_click", { to: "/", label: "Home" })}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-['Nunito'] text-[14px] leading-6 font-medium text-[#fafafa] transition-colors hover:text-white sm:text-[15px] lg:text-[18px]"
                    to="/experts"
                    onClick={() => track("footer_nav_click", { to: "/experts", label: "Explore Experts" })}
                  >
                    Explore Experts
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-['Nunito'] text-[14px] leading-6 font-medium text-[#fafafa] transition-colors hover:text-white sm:text-[15px] lg:text-[18px]"
                    to="/safaris"
                    onClick={() => track("footer_nav_click", { to: "/safaris", label: "Shared Safaris" })}
                  >
                    Shared Safaris
                  </Link>
                </li>
                <li>
                  <Link
                    className="font-['Nunito'] text-[14px] leading-6 font-medium text-[#fafafa] transition-colors hover:text-white sm:text-[15px] lg:text-[18px]"
                    to="/homestays"
                    onClick={() => track("footer_nav_click", { to: "/homestays", label: "Homestays" })}
                  >
                    Homestays
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Company */}
            <nav aria-label="Footer company" className="text-[#fafafa]">
              <p className="font-['Nunito'] text-[14px] leading-6 font-medium text-[#F0C165] sm:text-[15px] lg:text-[18px]">
                Company
              </p>
              <ul className="mt-4 flex flex-col gap-2 sm:mt-[18px] sm:gap-2.5">
                <li>
                  <Link
                    className="font-['Nunito'] text-[14px] leading-6 font-medium text-[#fafafa] transition-colors hover:text-white sm:text-[15px] lg:text-[18px]"
                    to="/about"
                    onClick={() => track("footer_nav_click", { to: "/about", label: "About Us" })}
                  >
                    About Us
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Reach us at */}
            <div className="text-[#fafafa]">
              <p className="font-['Nunito'] text-[14px] leading-6 font-medium text-[#F0C165] sm:text-[15px] lg:text-[18px]">
                Reach us at
              </p>
              <div className="mt-3.5 flex items-center gap-3 sm:mt-4 sm:gap-4">
                <a
                  href="https://www.instagram.com/wildbook.in"
                  className="text-[#fafafa] transition-colors hover:text-white"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track("footer_instagram")}
                >
                  <InstagramLogoIcon size={28} className="sm:size-8" />
                </a>
                <button
                  type="button"
                  onClick={() => void copyEmail()}
                  className="relative text-[#fafafa] transition-colors hover:text-white"
                  aria-label={emailCopied ? "Email copied" : `Copy ${CONTACT_EMAIL}`}
                >
                  <EnvelopeSimpleIcon size={28} className="sm:size-8" />
                  {emailCopied ? (
                    <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 font-['Nunito'] text-[12px] whitespace-nowrap text-[#F0C165]">
                      Copied
                    </span>
                  ) : null}
                </button>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:mt-6 sm:gap-2.5">
                <p className="font-['Nunito'] text-[14px] leading-6 font-medium text-[#fafafa] sm:text-[15px] lg:text-[18px]">
                  Bengaluru, India
                </p>
                <a
                  className="font-['Nunito'] text-[14px] leading-6 font-medium text-[#fafafa] transition-colors hover:text-white sm:text-[15px] lg:text-[18px]"
                  href="https://wa.me/917483735393"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("footer_whatsapp")}
                >
                  +91 7483 73 53 93
                </a>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
}
