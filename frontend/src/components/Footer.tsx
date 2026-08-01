import logoLight from "../assets/Logo Dark.png";
import {
  EnvelopeSimpleIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import footerTop from "../assets/Mask group (1).svg";

export function Footer() {
  return (
    <footer className="mt-20 mx-auto w-full max-w-[1920px] overflow-hidden bg-[#F6F4F0]">
      <img src={footerTop} alt="" aria-hidden="true" className="block w-full h-auto select-none" />
      <div className="page-px-footer bg-[#0e1b15] pt-10 lg:pt-14 pb-6 lg:pb-8">
        {/* Main footer row */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 lg:gap-[80px]">
          {/* Left: Logo + description + copyright */}
          <div className="flex flex-col gap-[40px] lg:gap-[56px] lg:w-[380px] shrink-0">
            <div className="flex flex-col gap-[16px]">
              <Link to="/" className="inline-flex items-center" aria-label="Wildbook home">
                <img src={logoLight} alt="Wildbook" className="h-10 lg:h-[56px] w-auto" />
              </Link>
              <p className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] max-w-[380px]">
                We connect travellers with trusted guides, naturalists, and responsible operators
                so every journey becomes an informed, immersive encounter that sustains places
                and people.
              </p>
            </div>
            <p className="font-['Nunito'] font-normal text-[14px] lg:text-[16px] leading-normal text-[#e2e2e2] tracking-[0.64px]">
              © Copyright 2026&nbsp; |&nbsp; All Rights Reserved
            </p>
          </div>

          {/* Right: nav columns */}
          <div className="flex flex-wrap sm:flex-nowrap gap-6 lg:gap-[40px] xl:gap-[64px]">
            {/* Navigation */}
            <nav aria-label="Footer navigation" className="text-[#fafafa]">
              <p className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#F0C165]">
                Navigation
              </p>
              <ul className="mt-[18px] flex flex-col gap-[10px]">
                <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/">
                    Home
                  </Link>
                </li>
                <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/experts">
                    Explore Experts
                  </Link>
                </li>
                <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/#map">
                    Map
                  </Link>
                </li>
                <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/safaris">
                    Shared Safaris
                  </Link>
                </li>
                <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/homestays">
                    Homestays
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Company */}
            <nav aria-label="Footer company" className="text-[#fafafa]">
              <p className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#F0C165]">
                Company
              </p>
              <ul className="mt-[18px] flex flex-col gap-[10px]">
                <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/about">
                    About Us
                  </Link>
                </li>
                {/* <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/responsible">
                    Responsible<br />Wildlife Code
                  </Link>
                </li> */}
              </ul>
            </nav>

            {/* Other Links */}
            {/* <nav aria-label="Footer other links" className="text-[#fafafa]">
              <p className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#F0C165]">
                Other Links
              </p>
              <ul className="mt-[18px] flex flex-col gap-[10px]">
                <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/faqs">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/privacy">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/terms">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors" to="/feedback">
                    Feedback
                  </Link>
                </li>
              </ul>
            </nav> */}

            {/* Reach us at */}
            <div className="text-[#fafafa]">
              <p className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#F0C165]">
                Reach us at
              </p>
              <div className="mt-[16px] flex items-center gap-[16px]">
                <a href="https://www.instagram.com/wildbook.in" className="text-[#fafafa] hover:text-white transition-colors" aria-label="Instagram" target="_blank">
                  <InstagramLogoIcon size={32} />
                </a>
                {/* <a href="#" className="text-[#fafafa] hover:text-white transition-colors" aria-label="YouTube">
                  <YoutubeLogoIcon size={32} />
                </a>
                <a href="#" className="text-[#fafafa] hover:text-white transition-colors" aria-label="LinkedIn">
                  <LinkedinLogoIcon size={32} />
                </a> */}
                <a href="mailto:hello@wildbook.in" className="text-[#fafafa] hover:text-white transition-colors" aria-label="Email">
                  <EnvelopeSimpleIcon size={32} />
                </a>
              </div>
              <div className="mt-[24px] flex flex-col gap-[10px]">
                <p className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa]">
                  Bengaluru, India
                </p>
                <a
                  className="font-['Nunito'] font-medium text-[15px] lg:text-[18px] leading-[24px] text-[#fafafa] hover:text-white transition-colors"
                  href="tel:+918296567683"
                >
                  +91 74837 35393
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
