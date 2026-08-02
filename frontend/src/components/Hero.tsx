import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@phosphor-icons/react";

import homeDesktop from "../assets/heroes/home-desktop.png";
import homeMobile from "../assets/heroes/home-mobile.png";
import homeTablet from "../assets/heroes/home-tablet.png";
import bannerImage from "../assets/Banner Image_V2.jpg";
import { ResponsiveHeroImage } from "./common/ResponsiveHeroImage";
import Navbar from "./Navbar";

export const Hero = forwardRef<HTMLElement>(function Hero(_, ref) {
  const navigate = useNavigate();

  return (
    <section
      ref={ref}
      className="relative mx-auto max-w-[1920px] min-h-[560px] h-[min(100svh,820px)] overflow-hidden sm:min-h-[620px] md:min-h-[680px] md:h-[min(100svh,860px)] lg:h-[min(100svh,900px)]"
    >
      <ResponsiveHeroImage
        mobileSrc={homeMobile}
        tabletSrc={homeTablet}
        desktopSrc={homeDesktop}
        largeSrc={bannerImage}
        alt=""
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(47,43,40,0.55)_0%,rgba(47,43,40,0.25)_42%,rgba(47,43,40,0)_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,rgba(47,43,40,0)_0%,rgba(47,43,40,0.45)_100%)]" />

      <div className="relative z-10 flex h-full flex-col">
        <Navbar variant="light" />

        <div className="flex flex-1 flex-col items-center justify-center page-px py-8 text-center sm:py-10 md:items-start md:py-11 md:text-left lg:py-12">
          <p className="font-['Nunito'] font-bold text-[14px] leading-snug text-[#AB863F] sm:text-[18px] sm:leading-7 md:text-[20px] lg:text-[24px] lg:leading-8">
            Bringing India’s wildlife ecosystem together
          </p>

          <h1 className="mb-5 mt-3 flex flex-col items-center gap-1 font-['Montserrat'] font-medium leading-[0.95] text-[#EDE8E2]/90 sm:mb-6 sm:mt-4 sm:gap-2 md:mb-7 md:items-start md:gap-3 lg:mb-8">
            {["connect", "conserve", "coexist"].map((word) => (
              <span
                key={word}
                className="text-[42px] drop-shadow-[0_0_8px_black] sm:text-[52px] md:text-[62px] lg:text-[70px]"
                style={{ textShadow: "0px 1px 1px #264e4566" }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p className="mb-5 max-w-[600px] font-['Nunito'] font-light text-[16px] leading-snug text-[#7FCDB2] sm:mb-6 sm:text-[20px] md:mb-6 md:text-[24px] lg:text-[28px]">
            India is home to exceptional naturalists and guides, who know the wild better than any
            guidebook. You&apos;ve just never been able to find them. Wildbook brings them within
            your reach!
          </p>

          <button
            type="button"
            onClick={() => navigate("/experts")}
            className="inline-flex h-10 w-fit items-center justify-center rounded-[4px] border-[0.8px] border-[#E3DDD8] px-5 font-['Nunito'] font-medium text-[14px] text-[#F6F4F1] transition-colors hover:bg-[#F6F4F1]/5 sm:h-12 sm:px-6 md:text-[16px] lg:text-[18px]"
          >
            Meet the Experts
            <ArrowRightIcon className="ml-3 h-5 w-5 sm:ml-4 sm:h-6 sm:w-6" />
          </button>
        </div>
      </div>
    </section>
  );
});
